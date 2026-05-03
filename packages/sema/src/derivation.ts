import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Equality } from './equality'
import { Sema } from './sema'

/**
 * A derived sema whose value is computed from a source `Sema<T>` via a
 * selector function `(T) => R`.
 *
 * A `Derivation<T, R>` is itself a `Sema<R>` — it can be read, observed, and
 * composed with other derivations exactly like any other sema. Its value is
 * kept in sync with the source: every time the source changes the selector is
 * re-evaluated and, if the result differs under the configured equality check,
 * the derivation's own listeners are notified.
 *
 * Call `Derivation.unbind` when the derivation is no longer needed to stop
 * listening to the source sema and prevent memory leaks.
 *
 * @typeParam T - The value type of the source sema.
 * @typeParam R - The derived / projected value type.
 *
 * @example
 * const sema = Sema.create({ count: 0, name: 'Alice' })
 * const derived = Derivation.create({ sema, selector: s => s.count })
 *
 * Sema.read(derived) // 0
 *
 * Sema.write(sema, { count: 1, name: 'Alice' })
 *
 * Sema.read(derived) // 1
 *
 * Derivation.unbind(derived)
 */
export type Derivation<T, R> = Sema<R> &
  Idion<
    Derivation.Identifier,
    {
      /**
       * The projection function applied to the source sema's value.
       */
      readonly selector: Sema.Selector<T, R>

      /**
       * The equality predicate used to decide whether to propagate a change.
       */
      readonly equality: Equality<R, R>

      /**
       * The source sema this derivation is subscribed to.
       */
      readonly sema: Sema<T>

      /**
       * The dispose function that stops listening to the source sema.
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
     * The source sema to derive from.
     */
    readonly sema: Sema<T>

    /**
     * Projects the source value to the derived value.
     */
    readonly selector: Sema.Selector<T, R>

    /**
     * Custom equality used to suppress redundant downstream notifications.
     * Defaults to `Equality.check` (deep structural equality).
     */
    readonly equality?: Equality<R, R>
  }

  /**
   * Creates a `Derivation<T, R>` that tracks `options.sema` through
   * `options.selector`.
   *
   * The derived sema is initialised with the selector's current result.
   * From that point on, each write to the source sema triggers a
   * re-evaluation; the derivation only propagates when the new selected value
   * differs from the current one under the configured equality.
   *
   * The returned value is a `Sema<R>` augmented with derivation metadata
   * (`selector`, `equality`, `sema`, `unbind`).
   *
   * @typeParam T - The source sema's value type.
   * @typeParam R - The derived value type.
   * @param options - Configuration with `sema`, `selector`, and optional `equality`.
   * @returns A `Derivation<T, R>` that stays in sync with the source.
   *
   * @example
   * ```ts
   * const source = Sema.create({ x: 1, y: 2 })
   * const xOnly = Derivation.create({ sema: source, selector: s => s.x })
   * // xOnly is a Sema<number> seeded with 1
   * ```
   */
  export function create<T, R>(options: Options<T, R>): Derivation<T, R> {
    const selector = options.selector
    const equality = options.equality ?? Equality.check
    const sema = options.sema

    const selectedValue = Sema.read(sema, selector)

    const derivedSema = Sema.create(selectedValue)

    // biome-ignore lint: we don't care about infering T here
    const unbind = Agora.listen(sema, (value: any) => {
      const newValue = selector(value)
      const currentValue = Sema.read(derivedSema)

      if (equality(newValue, currentValue)) return

      Sema.write(derivedSema, newValue)
    })

    return Idion.create({
      id: identifier,
      value: Object.assign({}, derivedSema, {
        selector,
        equality,
        sema,
        unbind,
        frozenRef: sema.frozenRef,
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
   * const derived = Derivation.create({ sema, selector: s => s.count })
   * // ... use derived ...
   * Derivation.unbind(derived)
   */
  export function unbind<T, R>(derivedSignal: Derivation<T, R>): void {
    derivedSignal.unbind()
  }

  /**
   * Type guard that returns `true` when `sema` is a {@link Derivation}.
   *
   * Delegates to {@link Idion.is} with the {@link identifier} so the check is
   * symbol-based and works across module boundaries.
   *
   * @typeParam T - The source sema's value type (inferred on narrowing).
   * @typeParam R - The derived value type (inferred on narrowing).
   * @param sema - Any sema to test.
   * @returns `true` if `sema` is a `Derivation<T, R>`, narrowing the type
   *   accordingly; `false` otherwise.
   *
   * @example
   * ```ts
   * const derived = Derivation.create({ sema, selector: s => s.count })
   * Derivation.is(derived) // true
   * Derivation.is(sema)    // false (source sema, not a derivation)
   * ```
   */
  export function is<T = unknown, R = unknown>(
    sema: unknown,
  ): sema is Derivation<T, R> {
    // biome-ignore lint: we have to cast it as object to respect the Idion.ts signature
    return Idion.is(sema as {}, identifier)
  }
}
