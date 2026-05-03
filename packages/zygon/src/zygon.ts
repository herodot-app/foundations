import { Idion } from '@herodot-app/idion'

/**
 * A **Zygon** is a tagged union representing one of two possible outcomes — the
 * functional-programming equivalent of "it either worked or it didn't."
 *
 * The name comes from the Greek **ζυγόν** (_zygon_), meaning *yoke* — the wooden
 * bar that joins two oxen together. A `Zygon` yokes two possible worlds: the
 * happy path and the sad path.
 *
 * Internally, a Zygon holds either a {@link Zygon.Left} (success) or a
 * {@link Zygon.Right} (failure). Think of it as `Either<L, R>` if you are
 * fluent in Haskell, or `Result<L, R>` if you prefer Rust — just with more
 * Greek mythology.
 *
 * @typeParam L - The success (left) value type.
 * @typeParam R - The failure (right) value type.
 *
 * @example
 * ```ts
 * const result: Zygon<number, Error> = Zygon.left(42)
 *
 * if (Zygon.isLeft(result)) {
 *   console.log('The answer is', result.left) // 42
 * }
 * ```
 */
export type Zygon<L, R = unknown> = Zygon.Left<L> | Zygon.Right<R>

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
   * The unique symbol that brands a {@link Left} (right/success) value.
   */
  export const leftIdentifier = Symbol.for('@herodot-app/zygon/left')

  /**
   * Type-level alias for the `Dexion` brand symbol.
   */
  export type LeftIdentifier = typeof leftIdentifier

  /**
   * The unique symbol that brands a {@link Right} (left/failure) value.
   */
  export const rightIdentifier = Symbol.for('@herodot-app/zygon/right')

  /**
   * Type-level alias for the `Skaion` brand symbol.
   */
  export type RightIdentifier = typeof rightIdentifier

  /**
   * The **Left** is the optimistic half of a {@link Zygon} — it holds the
   * success value on the `.left` property.
   *
   * Created by {@link left}. Check for it with {@link isLeft}.
   *
   * @typeParam T - The type of the success value carried by this Left.
   */
  export type Left<T> = Idion<
    Identifier,
    Idion<LeftIdentifier, { right?: never; left: T; kind: 'left' }>
  >

  /**
   * The **Right** is the pessimistic half of a {@link Zygon} — it holds the
   * failure value on the `.right` property.
   *
   * Created by {@link right}. Check for it with {@link isRight}.
   *
   * @typeParam T - The type of the failure value carried by this Right.
   */
  export type Right<T> = Idion<
    Identifier,
    Idion<RightIdentifier, { left?: never; right: T; kind: 'right' }>
  >

  /**
   * Creates a {@link Left} — the success side of a {@link Zygon}.
   *
   * @typeParam T - The type of the success value.
   * @param left - The success value to wrap.
   * @returns A `Zygon` whose inner value is a `Left`.
   *
   * @example
   * ```ts
   * const ok = Zygon.left(42) // Zygon<number, unknown>
   * ok.left // 42
   * ```
   */
  export function left<T>(left: T): Zygon<T, unknown> {
    return Idion.create({
      id: identifier,
      value: Idion.create({
        id: leftIdentifier,
        value: { left, kind: 'left' },
      }),
    })
  }

  /**
   * Creates a {@link Right} — the failure side of a {@link Zygon}.
   *
   * @typeParam T - The type of the failure value.
   * @param right - The failure value to wrap.
   * @returns A `Zygon` whose inner value is a `Right`.
   *
   * @example
   * ```ts
   * const err = Zygon.right(new Error('oops')) // Zygon<unknown, Error>
   * err.right // Error: oops
   * ```
   */
  export function right<T>(right: T): Zygon<unknown, T> {
    return Idion.create({
      id: identifier,
      value: Idion.create({
        id: rightIdentifier,
        value: { right, kind: 'right' },
      }),
    })
  }

  /**
   * Type guard — returns `true` when `value` is a {@link Zygon}.
   *
   * Useful at system boundaries where you receive `unknown` and need to confirm
   * you are holding an actual yoke before you try to drive the oxen.
   *
   * @typeParam L - Expected left value type (defaults to `unknown`).
   * @typeParam R - Expected right value type (defaults to `unknown`).
   * @param value - The value to inspect.
   */
  export function is<L = unknown, R = unknown>(
    value: unknown,
  ): value is Zygon<L, R> {
    // biome-ignore lint: we have to cast to {} to satisfy the type checker, but we know this is safe because Idion.is will check the structure of the object
    return Idion.is(value as {}, identifier)
  }

  /**
   * Type guard — returns `true` when `value` is a {@link Left} (the happy path).
   *
   * @typeParam L - Expected success value type (defaults to `unknown`).
   * @param value - The value to inspect.
   */
  export function isLeft<L = unknown>(value: unknown): value is Left<L> {
    // biome-ignore lint: we have to cast to {} to satisfy the type checker, but we know this is safe because Idion.is will check the structure of the object
    return Idion.is(value as {}, leftIdentifier)
  }

  /**
   * Type guard — returns `true` when `value` is a {@link Right} (the sad path).
   *
   * @typeParam R - Expected failure value type (defaults to `unknown`).
   * @param value - The value to inspect.
   */
  export function isRight<R = unknown>(value: unknown): value is Right<R> {
    // biome-ignore lint: we have to cast to {} to satisfy the type checker, but we know this is safe because Idion.is will check the structure of the object
    return Idion.is(value as {}, rightIdentifier)
  }

  /**
   * Extracts the success value from a {@link Zygon}, or returns `defaultLeft`
   * if the zygon turns out to be a {@link Right}.
   *
   * @param zygon - The zygon to unwrap.
   * @param defaultLeft - Fallback value returned when the zygon is a Right.
   * @returns The success value, or `defaultLeft`.
   *
   * @example
   * ```ts
   * Zygon.unwrapLeft(Zygon.left(7), 0)       // → 7
   * Zygon.unwrapLeft(Zygon.right('oops'), 0) // → 0
   * ```
   */
  export function unwrapLeft<L, R = unknown>(
    zygon: Zygon<L, R>,
    defaultLeft: L,
  ): L {
    if (!isLeft(zygon)) {
      return defaultLeft
    }

    return zygon.left
  }

  /**
   * Alias for {@link unwrapLeft} — the most common unwrap you will reach for.
   * Because success is the default expectation, and pessimism is optional.
   */
  export const unwrap = unwrapLeft

  /**
   * Extracts the failure value from a {@link Zygon}, or returns `defaultRight`
   * if the zygon turns out to be a {@link Left} (i.e., everything was fine).
   *
   * @param zygon - The zygon to unwrap.
   * @param defaultRight - Fallback value returned when the zygon is a Left.
   * @returns The failure value, or `defaultRight`.
   *
   * @example
   * ```ts
   * Zygon.unwrapRight(Zygon.right('oops'), null) // → 'oops'
   * Zygon.unwrapRight(Zygon.left(7), null)       // → null
   * ```
   */
  export function unwrapRight<L = unknown, R = unknown>(
    zygon: Zygon<L, R>,
    defaultRight: R,
  ): R {
    if (!isRight(zygon)) {
      return defaultRight
    }

    return zygon.right
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
   * A function that converts a caught error into a typed {@link Right} value.
   * Provide one whenever you want to transform the raw `unknown` thrown by the
   * universe into something your type system can actually reason about.
   *
   * @typeParam R - The typed failure value produced by this mapper.
   */
  export type WrapRightFn<R> = (err: unknown) => R

  /**
   * Wraps a synchronous function so that it **never throws** — instead it
   * returns a {@link Zygon} where success lands in a {@link Left} and any
   * thrown error lands in a {@link Right}.
   *
   * Ideal for taming third-party code that communicates failure via exceptions
   * (i.e., almost all of it).
   *
   * @typeParam Fn - The original synchronous function type.
   * @typeParam R - The failure value type (inferred from `wrapRight` if provided).
   * @param fn - The function to wrap. It may throw; that is the whole point.
   * @param wrapRight - Optional mapper from raw error to a typed `R`. When
   *   omitted the caught value is cast to `R` directly — buyer beware.
   * @returns A new function with the same parameters as `fn`, but returning
   *   `Zygon<ReturnType<Fn>, R>` instead of throwing.
   *
   * @example
   * ```ts
   * const safeParseJson = Zygon.wrap(JSON.parse, (e) => e as SyntaxError)
   *
   * const result = safeParseJson('{ invalid }')
   * // result is Zygon<unknown, SyntaxError>
   * ```
   */
  export function wrap<Fn extends AnyFn, R = unknown>(
    fn: Fn,
    wrapRight?: WrapRightFn<R>,
  ): (...args: Parameters<Fn>) => Zygon<ReturnType<Fn>, R> {
    return (...args: Parameters<Fn>) => {
      try {
        const right = fn(...args)

        return left(right) as Zygon<ReturnType<Fn>, R>
      } catch (err) {
        const left = wrapRight ? wrapRight(err) : (err as unknown as R)

        return right(left) as Zygon<ReturnType<Fn>, R>
      }
    }
  }

  /**
   * The async sibling of {@link wrap} — wraps an `async` function so that
   * rejected promises become {@link Right} values instead of unhandled
   * rejections waiting to ruin your weekend.
   *
   * @typeParam Fn - The original async function type.
   * @typeParam R - The failure value type.
   * @param fn - The async function to wrap.
   * @param wrapRight - Optional mapper from raw rejection reason to a typed `R`.
   * @returns A new async function returning `Promise<Zygon<Awaited<ReturnType<Fn>>, R>>`.
   *
   * @example
   * ```ts
   * const safeFetch = Zygon.asyncWrap(fetch, (e) => e as TypeError)
   *
   * const result = await safeFetch('https://example.com')
   * // result is Zygon<Response, TypeError>
   * ```
   */
  export function asyncWrap<Fn extends AnyAsyncFn, R = unknown>(
    fn: Fn,
    wrapRight?: WrapRightFn<R>,
  ): (...args: Parameters<Fn>) => Promise<Zygon<Awaited<ReturnType<Fn>>, R>> {
    return async (...args: Parameters<Fn>) => {
      try {
        const right = await fn(...args)

        return left(right) as Zygon<Awaited<ReturnType<Fn>>, R>
      } catch (err) {
        const left = wrapRight ? wrapRight(err) : (err as unknown as R)

        return right(left) as Zygon<Awaited<ReturnType<Fn>>, R>
      }
    }
  }
}
