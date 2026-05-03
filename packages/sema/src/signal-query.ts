import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import type { Signal } from './signal'

/**
 * The read-side API for a `Signal<T>`.
 *
 * A `SignalQuery` provides three operations: `read` (get the current value,
 * optionally projected through a selector), `snap` (capture a full diagnostic
 * snapshot), and `selector` (create a derived `Derivation` that stays in sync
 * with a projected slice of the signal).
 *
 * It is always paired with a `SignalMutation` for the same signal — the query
 * only observes, never writes.
 *
 * @example
 * const signal = Signal.create({ count: 0, name: 'Alice' })
 * const query = SignalQuery.create(signal)
 *
 * query.read()               // { count: 0, name: 'Alice' }
 * query.read(s => s.count)   // 0
 */
export type SignalQuery<T> = Idion<
  SignalQuery.Identifier,
  {
    /**
     * Returns the signal's current value, optionally projected through
     * `selector`.
     *
     * Calling `read()` without arguments returns `T` directly. Calling
     * `read(selector)` applies the selector to the current value and returns
     * `R` — no intermediate signal is created.
     */
    read: {
      (): T
      <R>(selector: SignalQuery.Selector<T, R>): R
    }

    /**
     * Returns a point-in-time snapshot of all observable signal internals.
     *
     * Useful for debugging and assertions — the snapshot is a plain object and
     * will not update when the signal changes.
     */
    inspect: () => SignalQuery.Snapshot<T>
  }
>

export namespace SignalQuery {
  /**
   * Unique symbol used to brand `SignalQuery` objects.
   */
  export const identifier: unique symbol = Symbol.for(
    '@herodot-app/sema/signal-query',
  )

  /**
   * Type of the `SignalQuery` brand.
   */
  export type Identifier = typeof identifier

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
   * Creates a `SignalQuery<T>` for `signal`.
   *
   * The returned object is a branded collection of `read`, `inspect`, and
   * `selector` functions closed over the signal's refs and listeners set.
   *
   * @example
   * const signal = Signal.create(42)
   * const query = SignalQuery.create(signal)
   *
   * query.read()       // 42
   * query.snap().frozen // false
   */
  export function create<T>(signal: Signal<T>): SignalQuery<T> {
    function read<R>(selector?: Selector<T, R>): T | R {
      if (!selector) {
        return Rheon.read(signal.valueRef)
      }

      return selector(Rheon.read(signal.valueRef))
    }

    function inspect(): Snapshot<T> {
      return {
        ...Agora.inspect(signal),
        value: Rheon.read(signal.valueRef),
        oldValue: Rheon.read(signal.oldValueRef),
      }
    }

    return Idion.create({
      id: identifier,
      value: { read, inspect },
    })
  }
}
