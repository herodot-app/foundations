import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'

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
}
