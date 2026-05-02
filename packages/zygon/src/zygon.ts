import { Idion } from '@herodot-app/idion'

/**
 * A **Zygon** is a tagged union representing one of two possible outcomes — the
 * functional-programming equivalent of "it either worked or it didn't."
 *
 * The name comes from the Greek **ζυγόν** (_zygon_), meaning *yoke* — the wooden
 * bar that joins two oxen together. A `Zygon` yokes two possible worlds: the
 * happy path and the sad path.
 *
 * Internally, a Zygon holds either a {@link Zygon.Dexion} (success) or a
 * {@link Zygon.Skaion} (failure). Think of it as `Either<D, S>` if you are
 * fluent in Haskell, or `Result<D, S>` if you prefer Rust — just with more
 * Greek mythology.
 *
 * @typeParam D - The **D**exion (success / right) value type.
 * @typeParam S - The **S**kaion (failure / left) value type.
 *
 * @example
 * ```ts
 * const result: Zygon<number, Error> = Zygon.dexion(42)
 *
 * if (Zygon.isDexion(result)) {
 *   console.log('The answer is', result.right) // 42
 * }
 * ```
 */
export type Zygon<D, S = unknown> = Idion<
  Zygon.Identifier,
  Zygon.Dexion<D> | Zygon.Skaion<S>
>

export namespace Zygon {
  /**
   * The unique symbol that brands every `Zygon` value.
   */
  export const identifier = Symbol.for('@herodot-app/zygon/zygon')

  /**
   * Type-level alias for the `Zygon` brand symbol.
   */
  export type Identifier = typeof identifier

  /**
   * The unique symbol that brands a {@link Dexion} (right/success) value.
   */
  export const dexionIdentifier = Symbol.for('@herodot-app/zygon/dexion')

  /**
   * Type-level alias for the `Dexion` brand symbol.
   */
  export type DexionIdentifier = typeof dexionIdentifier

  /**
   * The unique symbol that brands a {@link Skaion} (left/failure) value.
   */
  export const skaionIdentifier = Symbol.for('@herodot-app/zygon/skaion')

  /**
   * Type-level alias for the `Skaion` brand symbol.
   */
  export type SkaionIdentifier = typeof skaionIdentifier

  /**
   * The **Dexion** is the optimistic half of a {@link Zygon} — it holds the
   * success value.
   *
   * The name comes from the Greek **δεξιόν** (_dexion_), derived from _dexios_
   * meaning *right-handed*, *skillful*, or *favourable*. Historically the right
   * side was the side of good omens — and here it lives up to its reputation:
   * the success value sits on the `right` property, exactly where a good omen
   * belongs. No irony, no footnotes, just a word that means what it does.
   *
   * @typeParam T - The type of the success value carried by this Dexion.
   */
  export type Dexion<T> = Idion<
    DexionIdentifier,
    { right: T; left?: never; kind: 'right' }
  >

  /**
   * The **Skaion** is the pessimistic half of a {@link Zygon} — it holds the
   * failure value.
   *
   * The name comes from the Greek **σκαιόν** (_skaion_), derived from _skaios_
   * meaning *left-handed*, *clumsy*, or *awkward*. In antiquity the left side
   * was associated with bad omens (the Latin _sinister_ shares the same cultural
   * baggage). Fittingly, the failure value lives on the `left` property — the
   * etymology and the data model are finally in perfect, if slightly ominous, harmony.
   *
   * @typeParam T - The type of the failure value carried by this Skaion.
   */
  export type Skaion<T> = Idion<
    SkaionIdentifier,
    { left: T; right?: never; kind: 'left' }
  >

  /**
   * Creates a {@link Dexion} — the success side of a {@link Zygon}.
   *
   * Call this when things go right (which is also literally where the value ends up).
   *
   * @typeParam T - The type of the success value.
   * @param right - The success value to wrap.
   * @returns A `Zygon` whose inner value is a `Dexion`.
   *
   * @example
   * ```ts
   * const ok = Zygon.dexion(42) // Zygon<number, unknown>
   * ok.right // 42
   * ```
   */
  export function dexion<T>(right: T): Zygon<T, unknown> {
    return Idion.create({
      id: identifier,
      value: Idion.create({
        id: dexionIdentifier,
        value: { right, kind: 'right' },
      }),
    })
  }

  /**
   * Creates a {@link Skaion} — the failure side of a {@link Zygon}.
   *
   * Call this when things go wrong (which is also literally where the value ends up).
   *
   * @typeParam T - The type of the failure value.
   * @param left - The failure value to wrap.
   * @returns A `Zygon` whose inner value is a `Skaion`.
   *
   * @example
   * ```ts
   * const err = Zygon.skaion(new Error('oops')) // Zygon<unknown, Error>
   * err.left // Error: oops
   * ```
   */
  export function skaion<T>(left: T): Zygon<unknown, T> {
    return Idion.create({
      id: identifier,
      value: Idion.create({
        id: skaionIdentifier,
        value: { left, kind: 'left' },
      }),
    })
  }

  /**
   * Type guard — returns `true` when `value` is a {@link Zygon}.
   *
   * Useful at system boundaries where you receive `unknown` and need to confirm
   * you are holding an actual yoke before you try to drive the oxen.
   *
   * @typeParam D - Expected Dexion value type (defaults to `unknown`).
   * @typeParam S - Expected Skaion value type (defaults to `unknown`).
   * @param value - The value to inspect.
   */
  export function is<D = unknown, S = unknown>(
    value: unknown,
  ): value is Zygon<D, S> {
    // biome-ignore lint: we have to cast to {} to satisfy the type checker, but we know this is safe because Idion.is will check the structure of the object
    return Idion.is(value as {}, identifier)
  }

  /**
   * Type guard — returns `true` when `value` is a {@link Dexion} (the happy path).
   *
   * @typeParam D - Expected success value type (defaults to `unknown`).
   * @param value - The value to inspect.
   */
  export function isDexion<D = unknown>(value: unknown): value is Dexion<D> {
    // biome-ignore lint: we have to cast to {} to satisfy the type checker, but we know this is safe because Idion.is will check the structure of the object
    return Idion.is(value as {}, dexionIdentifier)
  }

  /**
   * Type guard — returns `true` when `value` is a {@link Skaion} (the sad path).
   *
   * @typeParam S - Expected failure value type (defaults to `unknown`).
   * @param value - The value to inspect.
   */
  export function isSkaion<S = unknown>(value: unknown): value is Skaion<S> {
    // biome-ignore lint: we have to cast to {} to satisfy the type checker, but we know this is safe because Idion.is will check the structure of the object
    return Idion.is(value as {}, skaionIdentifier)
  }

  /**
   * Extracts the success value from a {@link Zygon}, or returns `defaultRight`
   * if the zygon turns out to be a {@link Skaion}.
   *
   * The "right" in the name refers to the `right` property on a {@link Dexion},
   * which is where the success value lives. No ambiguity, no ancient Greek
   * philosophical debate — just `.right`.
   *
   * @param zygon - The zygon to unwrap.
   * @param defaultRight - Fallback value returned when the zygon is a Skaion.
   * @returns The success value, or `defaultRight`.
   *
   * @example
   * ```ts
   * Zygon.unwrapRight(Zygon.dexion(7), 0)      // → 7
   * Zygon.unwrapRight(Zygon.skaion('oops'), 0)  // → 0
   * ```
   */
  export function unwrapRight<D, S = unknown>(
    zygon: Zygon<D, S>,
    defaultRight: D,
  ): D {
    if (!isDexion(zygon)) {
      return defaultRight
    }

    return zygon.right
  }

  /**
   * Alias for {@link unwrapRight} — the most common unwrap you will reach for.
   * Because success is the default expectation, and pessimism is optional.
   */
  export const unwrap = unwrapRight

  /**
   * Extracts the failure value from a {@link Zygon}, or returns `defaultLeft`
   * if the zygon turns out to be a {@link Dexion} (i.e., everything was fine).
   *
   * @param zygon - The zygon to unwrap.
   * @param defaultLeft - Fallback value returned when the zygon is a Dexion.
   * @returns The failure value, or `defaultLeft`.
   *
   * @example
   * ```ts
   * Zygon.unwrapLeft(Zygon.skaion('oops'), null)  // → 'oops'
   * Zygon.unwrapLeft(Zygon.dexion(7), null)        // → null
   * ```
   */
  export function unwrapLeft<D = unknown, S = unknown>(
    zygon: Zygon<D, S>,
    defaultLeft: S,
  ): S {
    if (!isSkaion(zygon)) {
      return defaultLeft
    }

    return zygon.left
  }

  /**
   * Any synchronous function. The `any` is intentional — flexibility over purity.
   */
  // biome-ignore lint: we want any here to allow for flexible function signatures
  export type AnyFn = (...args: any[]) => any

  /**
   * Any asynchronous function. Same intentional `any` as {@link AnyFn}.
   */
  // biome-ignore lint: we want any here to allow for flexible function signatures
  export type AnyAsyncFn = (...args: any[]) => Promise<any>

  /**
   * A function that converts a caught error into a typed {@link Skaion} value.
   * Provide one whenever you want to transform the raw `unknown` thrown by the
   * universe into something your type system can actually reason about.
   *
   * @typeParam S - The typed failure value produced by this mapper.
   */
  export type WrapRightFn<S> = (err: unknown) => S

  /**
   * Wraps a synchronous function so that it **never throws** — instead it
   * returns a {@link Zygon} where success lands in a {@link Dexion} and any
   * thrown error lands in a {@link Skaion}.
   *
   * Ideal for taming third-party code that communicates failure via exceptions
   * (i.e., almost all of it).
   *
   * @typeParam Fn - The original synchronous function type.
   * @typeParam S - The failure value type (inferred from `wrapRight` if provided).
   * @param fn - The function to wrap. It may throw; that is the whole point.
   * @param wrapRight - Optional mapper from raw error to a typed `S`. When
   *   omitted the caught value is cast to `S` directly — buyer beware.
   * @returns A new function with the same parameters as `fn`, but returning
   *   `Zygon<ReturnType<Fn>, S>` instead of throwing.
   *
   * @example
   * ```ts
   * const safeParseJson = Zygon.wrap(JSON.parse, (e) => e as SyntaxError)
   *
   * const result = safeParseJson('{ invalid }')
   * // result is Zygon<unknown, SyntaxError>
   * ```
   */
  export function wrap<Fn extends AnyFn, S = unknown>(
    fn: Fn,
    wrapRight?: WrapRightFn<S>,
  ): (...args: Parameters<Fn>) => Zygon<ReturnType<Fn>, S> {
    return (...args: Parameters<Fn>) => {
      try {
        const right = fn(...args)

        return dexion(right) as Zygon<ReturnType<Fn>, S>
      } catch (err) {
        const left = wrapRight ? wrapRight(err) : (err as unknown as S)

        return skaion(left) as Zygon<ReturnType<Fn>, S>
      }
    }
  }

  /**
   * The async sibling of {@link wrap} — wraps an `async` function so that
   * rejected promises become {@link Skaion} values instead of unhandled
   * rejections waiting to ruin your weekend.
   *
   * @typeParam Fn - The original async function type.
   * @typeParam S - The failure value type.
   * @param fn - The async function to wrap.
   * @param wrapRight - Optional mapper from raw rejection reason to a typed `S`.
   * @returns A new async function returning `Promise<Zygon<Awaited<ReturnType<Fn>>, S>>`.
   *
   * @example
   * ```ts
   * const safeFetch = Zygon.asyncWrap(fetch, (e) => e as TypeError)
   *
   * const result = await safeFetch('https://example.com')
   * // result is Zygon<Response, TypeError>
   * ```
   */
  export function asyncWrap<Fn extends AnyAsyncFn, S = unknown>(
    fn: Fn,
    wrapRight?: WrapRightFn<S>,
  ): (...args: Parameters<Fn>) => Promise<Zygon<Awaited<ReturnType<Fn>>, S>> {
    return async (...args: Parameters<Fn>) => {
      try {
        const right = await fn(...args)

        return dexion(right) as Zygon<Awaited<ReturnType<Fn>>, S>
      } catch (err) {
        const left = wrapRight ? wrapRight(err) : (err as unknown as S)

        return skaion(left) as Zygon<Awaited<ReturnType<Fn>>, S>
      }
    }
  }
}
