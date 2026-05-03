import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'
import { Equality } from './equality'
import { Derivation } from './derivation'

/**
 * The core reactive data structure of `sema`.
 *
 * A `Signal<T>` is an idion container that holds three value snapshots
 * (`initialValue`, `valueRef`, `oldValueRef`), a frozen flag, and the set
 * of active listeners. All reactive operations (reading, writing, observing)
 * are performed by the companion modules — `SignalQuery`, `SignalMutation`,
 * and `SignalObserver` — which accept a `Signal` as their first argument.
 *
 * Prefer creating signals through `SignalQuery` / `SignalMutation` pairs rather
 * than interacting with the raw refs directly.
 *
 * @example
 * const signal = Signal.create(0)
 * const query = SignalQuery.create(signal)
 * const mutation = SignalMutation.create(signal)
 *
 * mutation.write(1)
 * query.read() // 1
 */
export type Signal<T> = Agora<T> &
  Idion<
    Signal.Identifier,
    {
      /**
       * Snapshot of the value at creation time — used by `SignalMutation.reset`.
       */
      readonly initialValue: T

      /**
       * The current value of the signal.
       */
      valueRef: Rheon<T>

      /**
       * The value the signal held before the last write — used by listeners.
       */
      oldValueRef: Rheon<T>

      /**
       * When `true`, writes still update `valueRef` but listeners are not
       * notified and `oldValueRef` is not updated until unfrozen.
       */
      frozenRef: Rheon<boolean>
    }
  >

export namespace Signal {
  /**
   * Unique symbol used to brand `Signal` objects.
   */
  export const identifier: unique symbol = Symbol.for(
    '@herodot-app/sema/signal',
  )

  /**
   * Type of the `Signal` brand.
   */
  export type Identifier = typeof identifier

  /**
   * Creates a new `Signal<T>` with `value` as both the initial and current value.
   *
   * All three value refs (`initialValueRef`, `valueRef`, `oldValueRef`) start
   * equal to `value`. The listeners set is empty and the signal is unfrozen.
   *
   * @example
   * const signal = Signal.create('hello')
   * // signal.valueRef holds 'hello'
   * // signal.frozenRef holds false
   * // signal.listeners is empty
   */
  export function create<T>(value: T): Signal<T> {
    const initialValue = value
    const agora = Agora.create<T>()
    const valueRef = Rheon.create(value)
    const oldValueRef = Rheon.create(value)
    const frozenRef = Rheon.create(false)

    return Idion.create({
      id: identifier,
      value: {
        ...agora,
        initialValue,
        valueRef,
        oldValueRef,
        frozenRef,
      },
    })
  }

  /**
   * Type guard that returns `true` when `value` is a {@link Signal}.
   *
   * Delegates to {@link Idion.is} with the {@link identifier} so the check is
   * symbol-based and works across module boundaries.
   *
   * @typeParam T - Narrows the contained value type on a positive match.
   *   Defaults to `unknown` when you only care about the container shape.
   * @param value - Any value to test.
   * @returns `true` if `value` is a `Signal<T>`, `false` otherwise.
   *
   * @example
   * ```ts
   * const signal = Signal.create(42)
   * Signal.is(signal)  // true
   * Signal.is({})      // false
   * ```
   */
  export function is<T = unknown>(value: unknown): value is Signal<T> {
    // biome-ignore lint: we cast it as an object to satisfy the is signature
    return Idion.is(value as {}, identifier)
  }

  /**
   * A function that projects the signal's value `T` to a derived value `R`.
   *
   * Used by `read(selector)` for one-shot projections and by `selector(…)` for
   * creating reactive `Derivation` instances.
   */
  export type Selector<T, R> = (value: T) => R

  /**
   * A point-in-time snapshot of a signal's observable internals.
   *
   * All fields are `readonly` — mutating the snapshot has no effect on the
   * signal.
   */
  export type Snapshot<T> = Agora.Snapshot & {
    /**
     * The signal's current value.
     */
    readonly value: T

    /**
     * The value the signal held before the last write.
     */
    readonly oldValue: T
  }

  /**
   * Reads the signal's current value, optionally projecting it through a selector.
   *
   * When called without a selector, returns the raw value `T`. When a selector is
   * provided, applies it to the current value and returns the derived result `R` —
   * useful for extracting a slice of the signal without creating an intermediate
   * reactive derivation.
   *
   * @typeParam T - The signal's value type.
   * @typeParam R - The derived return type (defaults to `T`).
   *
   * @param signal - The signal to read from.
   * @param selector - An optional projection function `(value: T) => R`.
   *
   * @returns The current value `T`, or the projected result `R`.
   *
   * @example
   * ```ts
   * const signal = Signal.create({ count: 0, name: 'Alice' })
   *
   * Signal.read(signal)            // { count: 0, name: 'Alice' }
   * Signal.read(signal, s => s.count) // 0
   * ```
   */
  export function read<T>(signal: Signal<T>): T
  export function read<T, R = T>(signal: Signal<T>, selector: Selector<T, R>): R
  export function read(
    signal: Signal<unknown>,
    selector?: Selector<unknown, unknown>,
  ) {
    if (!selector) {
      return Rheon.read(signal.valueRef)
    }

    return selector(Rheon.read(signal.valueRef))
  }

  /**
   * Returns a point-in-time snapshot of the signal's observable internals.
   *
   * The snapshot includes the current and previous values, plus the underlying
   * {@link Agora.Snapshot} (citizen count, registry queue size, frozen state).
   * All fields are `readonly` — mutating the snapshot has no effect on the signal.
   *
   * @typeParam T - The signal's value type.
   * @param signal - The signal to inspect.
   * @returns A {@link Snapshot} with the signal's current state.
   *
   * @example
   * ```ts
   * const snap = Signal.inspect(signal)
   * console.log(snap.value, snap.oldValue, snap.frozen)
   * ```
   */
  export function inspect<T>(signal: Signal<T>): Snapshot<T> {
    return {
      ...Agora.inspect(signal),
      value: Rheon.read(signal.valueRef),
      oldValue: Rheon.read(signal.oldValueRef),
    }
  }

  /**
   * Updates the signal's value and notifies listeners if the value has changed.
   *
   * Accepts either a direct value or a writer function `(value: T) => T` for
   * atomic updates. Before notifying listeners, the new value is compared against
   * the old one using the provided `equality` predicate (defaults to
   * {@link Equality.check}). If they are equal, the signal is short-circuited and
   * no listeners are invoked.
   *
   * When the signal is frozen, `oldValueRef` is not updated and listeners are not
   * notified — but `valueRef` is still mutated.
   *
   * @typeParam T - The signal's value type.
   * @param signal - The signal to update.
   * @param writerOrValue - The new value or a writer function that derives it.
   * @param equality - An equality predicate for comparing old and new values.
   *   Defaults to {@link Equality.check}.
   * @returns A {@link Agora.PublishZygon} — success when all listeners accepted
   *   the update, failure when one or more threw.
   *
   * @example
   * ```ts
   * // Direct value
   * Signal.write(signal, 42)
   *
   * // Writer function
   * Signal.write(signal, (n) => n + 1)
   *
   * // Custom equality
   * Signal.write(signal, newObj, (a, b) => a.id === b.id)
   * ```
   */
  export function write<T>(
    signal: Signal<T>,
    writerOrValue: Rheon.WriterOrValue<T>,
    equality: Equality<T, T> = Equality.check,
  ): Agora.PublishZygon {
    const oldValue = Rheon.read(signal.valueRef)

    Rheon.write(signal.valueRef, writerOrValue)

    const newValue = Rheon.read(signal.valueRef)

    if (equality(oldValue, newValue))
      return Zygon.left(true) as Agora.PublishZygon

    if (!Rheon.read(signal.frozenRef)) {
      Rheon.write(signal.oldValueRef, oldValue)
    }

    return Agora.publish<string>(
      signal as unknown as Signal<string>,
      newValue as string,
    )
  }

  /**
   * Resets the signal back to its initial value — the snapshot taken at creation
   * time via {@link Signal.create}.
   *
   * This is equivalent to calling `write(signal, signal.initialValue)`, so the
   * same equality check and listener notification logic applies. If the signal
   * is already at its initial value, no listeners are notified.
   *
   * @typeParam T - The signal's value type.
   * @param signal - The signal to reset.
   * @returns A {@link Agora.PublishZygon} reflecting whether listeners accepted
   *   the reset without error.
   *
   * @example
   * ```ts
   * const signal = Signal.create({ count: 0 })
   * Signal.write(signal, { count: 5 })
   * Signal.reset(signal) // back to { count: 0 }
   * ```
   */
  export function reset<T>(signal: Signal<T>): Agora.PublishZygon {
    return write(signal, signal.initialValue)
  }

  /**
   * A parameterless callback executed while the signal is temporarily frozen.
   *
   * Used by {@link Signal.batch} to bundle multiple mutations into a single
   * notification. While the batcher runs, listeners are silenced and
   * `oldValueRef` is preserved. After the batcher completes, the signal is
   * unfrozen and a single announcement is published with the final value.
   */
  export type Batcher = () => void

  /**
   * Executes `batcher` while the signal is frozen, then publishes a single
   * announcement with the final value.
   *
   * This is useful when multiple mutations need to happen atomically — instead
   * of notifying listeners after each write, the signal stays frozen until all
   * mutations are complete, then emits once with the resulting state.
   *
   * If the signal is already frozen, this call will temporarily unfreeze it
   * after the batcher runs, which means any pre-existing freeze state is
   * cleared. For explicit freeze management, use {@link Agora.freeze} and
   * {@link Agora.unfreeze} directly.
   *
   * @typeParam T - The signal's value type.
   * @param signal - The signal to batch mutations for.
   * @param batcher - A callback that performs one or more mutations.
   * @returns A {@link Agora.PublishZygon} reflecting whether the final
   *   announcement was delivered cleanly.
   *
   * @example
   * ```ts
   * Signal.batch(signal, () => {
   *   Signal.write(signal, { ...Signal.read(signal), a: 1 })
   *   Signal.write(signal, { ...Signal.read(signal), b: 2 })
   *   // Listeners only see the final { a: 1, b: 2 } state
   * })
   * ```
   */
  export function batch<T>(
    signal: Signal<T>,
    batcher: Batcher,
  ): Agora.PublishZygon {
    Agora.freeze(signal)

    batcher()

    Agora.unfreeze(signal)

    return Agora.publish<string>(
      signal as unknown as Signal<string>,
      Rheon.read(signal.valueRef) as string,
    )
  }

  /**
   * Creates a derived signal that projects `signal` through `selector`.
   *
   * This is a convenience wrapper around {@link Derivation.create} — it returns
   * a `Derivation<T, R>` (which is itself a `Signal<R>`) that stays in sync with
   * the source. Every time the source changes, the selector is re-evaluated and
   * the derivation propagates the new result only when it differs under the
   * configured equality predicate.
   *
   * @typeParam T - The source signal's value type.
   * @typeParam R - The derived value type produced by the selector.
   * @param signal - The source signal to derive from.
   * @param selector - A projection function `(value: T) => R`.
   * @param equality - An equality predicate for suppressing redundant downstream
   *   notifications. Defaults to {@link Equality.check}.
   * @returns A `Derivation<T, R>` that tracks the selected slice of the source.
   *
   * @example
   * ```ts
   * const user = Signal.create({ name: 'Alice', age: 30 })
   * const nameOnly = Signal.select(user, u => u.name)
   *
   * Signal.read(nameOnly) // 'Alice'
   *
   * Signal.write(user, { name: 'Alice', age: 31 })
   * // nameOnly does NOT update — the selected value 'Alice' is unchanged
   * ```
   */
  export function select<T, R>(
    signal: Signal<T>,
    selector: Selector<T, R>,
    equality: Equality<R, R> = Equality.check,
  ): Derivation<T, R> {
    return Derivation.create({
      signal,
      selector,
      equality,
    })
  }
}
