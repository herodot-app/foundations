import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Equality } from './equality'
import { Signal } from './signal'

/**
 * A derived signal whose value is computed from a source `Signal<T>` via a
 * selector function `(T) => R`.
 *
 * A `Derivation<T, R>` is itself a `Signal<R>` — it can be read, observed, and
 * composed with other derivations exactly like any other signal. Its value is
 * kept in sync with the source: every time the source changes the selector is
 * re-evaluated and, if the result differs under the configured equality check,
 * the derivation's own listeners are notified.
 *
 * Call `Derivation.unbind` when the derivation is no longer needed to stop
 * listening to the source signal and prevent memory leaks.
 *
 * @typeParam T - The value type of the source signal.
 * @typeParam R - The derived / projected value type.
 *
 * @example
 * const signal = Signal.create({ count: 0, name: 'Alice' })
 * const derived = Derivation.create({ signal, selector: s => s.count })
 *
 * Signal.read(derived) // 0
 *
 * Signal.write(signal, { count: 1, name: 'Alice' })
 *
 * Signal.read(derived) // 1
 *
 * Derivation.unbind(derived)
 */
export type Derivation<T, R> = Signal<R> &
  Idion<
    Derivation.Identifier,
    {
      /**
       * The projection function applied to the source signal's value.
       */
      readonly selector: Signal.Selector<T, R>

      /**
       * The equality predicate used to decide whether to propagate a change.
       */
      readonly equality: Equality<R, R>

      /**
       * The source signal this derivation is subscribed to.
       */
      readonly signal: Signal<T>

      /**
       * The dispose function that stops listening to the source signal.
       */
      readonly unbind: Agora.Unlistener
    }
  >

export namespace Derivation {
  /**
   * The well-known symbol used to brand `Derivation` instances.
   *
   * Using `Symbol.for` ensures the identity check in {@link is} works
   * correctly across module boundaries.
   */
  export const identifier = Symbol.for('@herodot-app/sema/derivation')

  /**
   * The TypeScript type of {@link identifier}.
   * Used as the brand key in the underlying {@link Idion}.
   */
  export type Identifier = typeof identifier

  /**
   * Configuration object passed to {@link Derivation.create}.
   *
   * Contains the source signal, the projection function, and an optional
   * equality predicate for controlling when changes propagate downstream.
   */
  export type Options<T, R> = {
    /**
     * The source signal to derive from.
     */
    readonly signal: Signal<T>

    /**
     * Projects the source value to the derived value.
     */
    readonly selector: Signal.Selector<T, R>

    /**
     * Custom equality used to suppress redundant downstream notifications.
     * Defaults to `Equality.check` (deep structural equality).
     */
    readonly equality?: Equality<R, R>
  }

  /**
   * Creates a `Derivation<T, R>` that tracks `options.signal` through
   * `options.selector`.
   *
   * The derived signal is initialised with the selector's current result.
   * From that point on, each write to the source signal triggers a
   * re-evaluation; the derivation only propagates when the new selected value
   * differs from the current one under the configured equality.
   *
   * The returned value is a `Signal<R>` augmented with derivation metadata
   * (`selector`, `equality`, `signal`, `unbind`).
   *
   * @typeParam T - The source signal's value type.
   * @typeParam R - The derived value type.
   * @param options - Configuration with `signal`, `selector`, and optional `equality`.
   * @returns A `Derivation<T, R>` that stays in sync with the source.
   *
   * @example
   * ```ts
   * const source = Signal.create({ x: 1, y: 2 })
   * const xOnly = Derivation.create({ signal: source, selector: s => s.x })
   * // xOnly is a Signal<number> seeded with 1
   * ```
   */
  export function create<T, R>(options: Options<T, R>): Derivation<T, R> {
    const selector = options.selector
    const equality = options.equality ?? Equality.check
    const signal = options.signal

    const selectedValue = Signal.read(signal, selector)

    const derivedSignal = Signal.create(selectedValue)

    // biome-ignore lint: we don't care about infering T here
    const unbind = Agora.listen(signal, (value: any) => {
      const newValue = selector(value)
      const currentValue = Signal.read(derivedSignal)

      if (equality(newValue, currentValue)) return

      Signal.write(derivedSignal, newValue)
    })

    return Idion.create({
      id: identifier,
      value: Object.assign({}, derivedSignal, {
        selector,
        equality,
        signal,
        unbind,
        frozenRef: signal.frozenRef,
      }),
    })
  }

  /**
   * Stops the derivation from listening to its source signal.
   *
   * After calling `unbind`, writes to the source will no longer update the
   * derivation. Call this whenever the derived signal goes out of scope to
   * prevent listener accumulation on long-lived source signals.
   *
   * @example
   * const derived = Derivation.create({ signal, selector: s => s.count })
   * // ... use derived ...
   * Derivation.unbind(derived)
   */
  export function unbind<T, R>(derivedSignal: Derivation<T, R>): void {
    derivedSignal.unbind()
  }

  /**
   * Type guard that returns `true` when `signal` is a {@link Derivation}.
   *
   * Delegates to {@link Idion.is} with the {@link identifier} so the check is
   * symbol-based and works across module boundaries.
   *
   * @typeParam T - The source signal's value type (inferred on narrowing).
   * @typeParam R - The derived value type (inferred on narrowing).
   * @param signal - Any signal to test.
   * @returns `true` if `signal` is a `Derivation<T, R>`, narrowing the type
   *   accordingly; `false` otherwise.
   *
   * @example
   * ```ts
   * const derived = Derivation.create({ signal, selector: s => s.count })
   * Derivation.is(derived) // true
   * Derivation.is(signal)  // false (source signal, not a derivation)
   * ```
   */
  export function is<T = unknown, R = unknown>(
    signal: unknown,
  ): signal is Derivation<T, R> {
    // biome-ignore lint: we have to cast it as object to respect the Idion.ts signature
    return Idion.is(signal as {}, identifier)
  }
}
