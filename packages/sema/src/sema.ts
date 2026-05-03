import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'
import { Derivation } from './derivation'
import { Equality } from './equality'

/**
 * The core reactive data structure of `sema`.
 *
 * A `Sema<T>` is an idion container that holds three value snapshots
 * (`initialValue`, `valueRef`, `oldValueRef`), a frozen flag, and the set
 * of active listeners. All reactive operations (reading, writing, observing)
 * are performed by the companion modules — `SemaQuery`, `SemaMutation`,
 * and `SemaObserver` — which accept a `Sema` as their first argument.
 *
 * Prefer creating semas through `SemaQuery` / `SemaMutation` pairs rather
 * than interacting with the raw refs directly.
 *
 * @example
 * const sema = Sema.create(0)
 * const query = SemaQuery.create(sema)
 * const mutation = SemaMutation.create(sema)
 *
 * mutation.write(1)
 * query.read() // 1
 */
export type Sema<T> = Agora<T> &
  Idion<
    Sema.Identifier,
    {
      /**
       * Snapshot of the value at creation time — used by `SemaMutation.reset`.
       */
      readonly initialValue: T

      /**
       * The current value of the sema.
       */
      valueRef: Rheon<T>

      /**
       * The value the sema held before the last write — used by listeners.
       */
      oldValueRef: Rheon<T>

      /**
       * When `true`, writes still update `valueRef` but listeners are not
       * notified and `oldValueRef` is not updated until unfrozen.
       */
      frozenRef: Rheon<boolean>
    }
  >

export namespace Sema {
  /**
   * Unique symbol used to brand `Sema` objects.
   */
  export const identifier: unique symbol = Symbol.for('@herodot-app/sema')

  /**
   * Type of the `Sema` brand.
   */
  export type Identifier = typeof identifier

  /**
   * Creates a new `Sema<T>` with `value` as both the initial and current value.
   *
   * All three value refs (`initialValueRef`, `valueRef`, `oldValueRef`) start
   * equal to `value`. The listeners set is empty and the sema is unfrozen.
   *
   * @example
   * const sema = Sema.create('hello')
   * // sema.valueRef holds 'hello'
   * // sema.frozenRef holds false
   * // sema.listeners is empty
   */
  export function create<T>(value: T): Sema<T> {
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
   * Type guard that returns `true` when `value` is a {@link Sema}.
   *
   * Delegates to {@link Idion.is} with the {@link identifier} so the check is
   * symbol-based and works across module boundaries.
   *
   * @typeParam T - Narrows the contained value type on a positive match.
   *   Defaults to `unknown` when you only care about the container shape.
   * @param value - Any value to test.
   * @returns `true` if `value` is a `Sema<T>`, `false` otherwise.
   *
   * @example
   * ```ts
   * const sema = Sema.create(42)
   * Sema.is(sema)  // true
   * Sema.is({})    // false
   * ```
   */
  export function is<T = unknown>(value: unknown): value is Sema<T> {
    // biome-ignore lint: we cast it as an object to satisfy the is signature
    return Idion.is(value as {}, identifier)
  }

  /**
   * A function that projects the sema's value `T` to a derived value `R`.
   *
   * Used by `read(selector)` for one-shot projections and by `selector(…)` for
   * creating reactive `Derivation` instances.
   */
  export type Selector<T, R> = (value: T) => R

  /**
   * A point-in-time snapshot of a sema's observable internals.
   *
   * All fields are `readonly` — mutating the snapshot has no effect on the
   * sema.
   */
  export type Snapshot<T> = Agora.Snapshot & {
    /**
     * The sema's current value.
     */
    readonly value: T

    /**
     * The value the sema held before the last write.
     */
    readonly oldValue: T
  }

  /**
   * Reads the sema's current value, optionally projecting it through a selector.
   *
   * When called without a selector, returns the raw value `T`. When a selector is
   * provided, applies it to the current value and returns the derived result `R` —
   * useful for extracting a slice of the sema without creating an intermediate
   * reactive derivation.
   *
   * @typeParam T - The sema's value type.
   * @typeParam R - The derived return type (defaults to `T`).
   *
   * @param sema - The sema to read from.
   * @param selector - An optional projection function `(value: T) => R`.
   *
   * @returns The current value `T`, or the projected result `R`.
   *
   * @example
   * ```ts
   * const sema = Sema.create({ count: 0, name: 'Alice' })
   *
   * Sema.read(sema)                // { count: 0, name: 'Alice' }
   * Sema.read(sema, s => s.count)  // 0
   * ```
   */
  export function read<T>(sema: Sema<T>): T
  export function read<T, R = T>(sema: Sema<T>, selector: Selector<T, R>): R
  export function read(
    sema: Sema<unknown>,
    selector?: Selector<unknown, unknown>,
  ) {
    if (!selector) {
      return Rheon.read(sema.valueRef)
    }

    return selector(Rheon.read(sema.valueRef))
  }

  /**
   * Returns a point-in-time snapshot of the sema's observable internals.
   *
   * The snapshot includes the current and previous values, plus the underlying
   * {@link Agora.Snapshot} (citizen count, registry queue size, frozen state).
   * All fields are `readonly` — mutating the snapshot has no effect on the sema.
   *
   * @typeParam T - The sema's value type.
   * @param sema - The sema to inspect.
   * @returns A {@link Snapshot} with the sema's current state.
   *
   * @example
   * ```ts
   * const snap = Sema.inspect(sema)
   * console.log(snap.value, snap.oldValue, snap.frozen)
   * ```
   */
  export function inspect<T>(sema: Sema<T>): Snapshot<T> {
    return {
      ...Agora.inspect(sema),
      value: Rheon.read(sema.valueRef),
      oldValue: Rheon.read(sema.oldValueRef),
    }
  }

  /**
   * Updates the sema's value and notifies listeners if the value has changed.
   *
   * Accepts either a direct value or a writer function `(value: T) => T` for
   * atomic updates. Before notifying listeners, the new value is compared against
   * the old one using the provided `equality` predicate (defaults to
   * {@link Equality.check}). If they are equal, the sema is short-circuited and
   * no listeners are invoked.
   *
   * When the sema is frozen, `oldValueRef` is not updated and listeners are not
   * notified — but `valueRef` is still mutated.
   *
   * @typeParam T - The sema's value type.
   * @param sema - The sema to update.
   * @param writerOrValue - The new value or a writer function that derives it.
   * @param equality - An equality predicate for comparing old and new values.
   *   Defaults to {@link Equality.check}.
   * @returns A {@link Agora.PublishZygon} — success when all listeners accepted
   *   the update, failure when one or more threw.
   *
   * @example
   * ```ts
   * // Direct value
   * Sema.write(sema, 42)
   *
   * // Writer function
   * Sema.write(sema, (n) => n + 1)
   *
   * // Custom equality
   * Sema.write(sema, newObj, (a, b) => a.id === b.id)
   * ```
   */
  export function write<T>(
    sema: Sema<T>,
    writerOrValue: Rheon.WriterOrValue<T>,
    equality: Equality<T, T> = Equality.check,
  ): Agora.PublishZygon {
    const oldValue = Rheon.read(sema.valueRef)

    Rheon.write(sema.valueRef, writerOrValue)

    const newValue = Rheon.read(sema.valueRef)

    if (equality(oldValue, newValue))
      return Zygon.left(true) as Agora.PublishZygon

    if (!Rheon.read(sema.frozenRef)) {
      Rheon.write(sema.oldValueRef, oldValue)
    }

    return Agora.publish<string>(
      sema as unknown as Sema<string>,
      newValue as string,
    )
  }

  /**
   * Resets the sema back to its initial value — the snapshot taken at creation
   * time via {@link Sema.create}.
   *
   * This is equivalent to calling `write(sema, sema.initialValue)`, so the
   * same equality check and listener notification logic applies. If the sema
   * is already at its initial value, no listeners are notified.
   *
   * @typeParam T - The sema's value type.
   * @param sema - The sema to reset.
   * @returns A {@link Agora.PublishZygon} reflecting whether listeners accepted
   *   the reset without error.
   *
   * @example
   * ```ts
   * const sema = Sema.create({ count: 0 })
   * Sema.write(sema, { count: 5 })
   * Sema.reset(sema) // back to { count: 0 }
   * ```
   */
  export function reset<T>(sema: Sema<T>): Agora.PublishZygon {
    return write(sema, sema.initialValue)
  }

  /**
   * A parameterless callback executed while the sema is temporarily frozen.
   *
   * Used by {@link Sema.batch} to bundle multiple mutations into a single
   * notification. While the batcher runs, listeners are silenced and
   * `oldValueRef` is preserved. After the batcher completes, the sema is
   * unfrozen and a single announcement is published with the final value.
   */
  export type Batcher = () => void

  /**
   * Executes `batcher` while the sema is frozen, then publishes a single
   * announcement with the final value.
   *
   * This is useful when multiple mutations need to happen atomically — instead
   * of notifying listeners after each write, the sema stays frozen until all
   * mutations are complete, then emits once with the resulting state.
   *
   * If the sema is already frozen, this call will temporarily unfreeze it
   * after the batcher runs, which means any pre-existing freeze state is
   * cleared. For explicit freeze management, use {@link Agora.freeze} and
   * {@link Agora.unfreeze} directly.
   *
   * @typeParam T - The sema's value type.
   * @param sema - The sema to batch mutations for.
   * @param batcher - A callback that performs one or more mutations.
   * @returns A {@link Agora.PublishZygon} reflecting whether the final
   *   announcement was delivered cleanly.
   *
   * @example
   * ```ts
   * Sema.batch(sema, () => {
   *   Sema.write(sema, { ...Sema.read(sema), a: 1 })
   *   Sema.write(sema, { ...Sema.read(sema), b: 2 })
   *   // Listeners only see the final { a: 1, b: 2 } state
   * })
   * ```
   */
  export function batch<T>(
    sema: Sema<T>,
    batcher: Batcher,
  ): Agora.PublishZygon {
    Agora.freeze(sema)

    batcher()

    Agora.unfreeze(sema)

    return Agora.publish<string>(
      sema as unknown as Sema<string>,
      Rheon.read(sema.valueRef) as string,
    )
  }

  /**
   * Creates a derived sema that projects `sema` through `selector`.
   *
   * This is a convenience wrapper around {@link Derivation.create} — it returns
   * a `Derivation<T, R>` (which is itself a `Sema<R>`) that stays in sync with
   * the source. Every time the source changes, the selector is re-evaluated and
   * the derivation propagates the new result only when it differs under the
   * configured equality predicate.
   *
   * @typeParam T - The source sema's value type.
   * @typeParam R - The derived value type produced by the selector.
   * @param sema - The source sema to derive from.
   * @param selector - A projection function `(value: T) => R`.
   * @param equality - An equality predicate for suppressing redundant downstream
   *   notifications. Defaults to {@link Equality.check}.
   * @returns A `Derivation<T, R>` that tracks the selected slice of the source.
   *
   * @example
   * ```ts
   * const user = Sema.create({ name: 'Alice', age: 30 })
   * const nameOnly = Sema.select(user, u => u.name)
   *
   * Sema.read(nameOnly) // 'Alice'
   *
   * Sema.write(user, { name: 'Alice', age: 31 })
   * // nameOnly does NOT update — the selected value 'Alice' is unchanged
   * ```
   */
  export function select<T, R>(
    sema: Sema<T>,
    selector: Selector<T, R>,
    equality: Equality<R, R> = Equality.check,
  ): Derivation<T, R> {
    return Derivation.create({
      sema,
      selector,
      equality,
    })
  }
}
