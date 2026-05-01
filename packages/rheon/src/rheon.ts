import { Idion } from '@herodot-app/idion'

/**
 * A **Rheon** is a typed, mutable reactive container — a single cell of state
 * that knows what it holds and is proud of it.
 *
 * The name comes from the ancient Greek *ῥέων* (rhéōn), meaning *"flowing"* —
 * the present participle of *ῥέω* (rhéō), "to flow". A rheon is a value in
 * motion: you can read it, overwrite it, and pass it around without losing
 * track of what lives inside.
 *
 * Under the hood it is an {@link Idion} stamped with {@link Rheon.Identifier},
 * so every rheon is unambiguously identifiable at runtime regardless of how
 * deep inside a data structure it has drifted.
 *
 * @typeParam T - The type of the value flowing through this container.
 *
 * @example
 * ```ts
 * const counter = Rheon.create(0)
 *
 * Rheon.write(counter, Rheon.read(counter) + 1)
 * console.log(Rheon.read(counter)) // 1
 * ```
 */
export type Rheon<T> = Idion<
  Rheon.Identifier,
  {
    [key in Rheon.ValueIdentifier]: T
  }
>

export namespace Rheon {
  /**
   * The well-known {@link Symbol} that brands every {@link Rheon} instance.
   *
   * Using `Symbol.for` ensures that the identity check in {@link is} works
   * correctly across module boundaries — no matter how many copies of this
   * package end up in your bundle. One river, one symbol.
   */
  export const identifier = Symbol.for('@herodot-app/rheon/identifier')

  /**
   * The TypeScript type of {@link identifier}.
   * Used as the first type parameter of the underlying {@link Idion}.
   */
  export type Identifier = typeof identifier

  /**
   * The well-known {@link Symbol} used as the key under which the wrapped
   * value is stored inside an {@link Idion}.
   *
   * Keeping this as a symbol prevents accidental key collisions and makes
   * it very hard to poke at the value without going through {@link read}
   * or {@link write} — which is exactly the point.
   */
  export const valueIdentifier = Symbol.for('@herodot-app/rheon/value')

  /**
   * The TypeScript type of {@link valueIdentifier}.
   * Used as the mapped key in the value record of the underlying {@link Idion}.
   */
  export type ValueIdentifier = typeof valueIdentifier

  /**
   * Extracts the value type `T` from a {@link Rheon} type.
   *
   * Useful when you have a `Rheon<T>` and need to refer to its inner type
   * without holding an instance — for example, when writing generic utilities
   * that operate on rheons and need to surface the value type in their own
   * signatures.
   *
   * @typeParam R - A {@link Rheon} type from which to infer `T`.
   *
   * @example
   * ```ts
   * type Counter = Rheon<number>
   * type CounterValue = Rheon.Infer<Counter>
   * //   ^? number
   * ```
   *
   * @example
   * ```ts
   * function snapshot<R extends Rheon<unknown>>(rheon: R): Rheon.Infer<R> {
   *   return Rheon.read(rheon) as Rheon.Infer<R>
   * }
   * ```
   */
  // biome-ignore lint: we want to be any here to allow the type to be inferred from the value passed to `create`.
  export type Infer<R extends Rheon<any>> = R extends Rheon<infer T> ? T : never

  /**
   * Creates a new {@link Rheon} wrapping the given `value`.
   *
   * Think of it as pouring water into a freshly conjured vessel — the vessel
   * knows it contains water, and it will keep flowing until you tell it
   * otherwise.
   *
   * @typeParam T - Inferred from `value`; the type of the contained state.
   * @param value - The initial value to store inside the rheon.
   * @returns A new {@link Rheon} instance containing `value`.
   *
   * @example
   * ```ts
   * const greeting = Rheon.create('hello')
   * ```
   */
  export function create<T>(value: T): Rheon<T> {
    return Idion.create({
      id: identifier,
      value: {
        [valueIdentifier]: value,
      },
    })
  }

  /**
   * Reads the current value stored inside a {@link Rheon}.
   *
   * @typeParam T - The type of the contained value.
   * @param rheon - The rheon to read from.
   * @returns The value currently flowing through `rheon`.
   *
   * @example
   * ```ts
   * const name = Rheon.create('Heraclitus')
   * console.log(Rheon.read(name)) // "Heraclitus"
   * ```
   */
  export function read<T>(rheon: Rheon<T>): T {
    return rheon[valueIdentifier]
  }

  /**
   * Overwrites the value stored inside a {@link Rheon} in place.
   *
   * The rheon is mutated directly — no new container is created. If you were
   * hoping for immutability you may have wandered into the wrong river.
   *
   * @typeParam T - The type of the contained value.
   * @param rheon - The rheon to update.
   * @param value - The new value to store.
   *
   * @example
   * ```ts
   * const score = Rheon.create(0)
   * Rheon.write(score, 42)
   * console.log(Rheon.read(score)) // 42
   * ```
   */
  export function write<T>(rheon: Rheon<T>, value: T): void {
    rheon[valueIdentifier] = value
  }

  /**
   * Type guard that returns `true` when `value` is a {@link Rheon}.
   *
   * Delegates to {@link Idion.is} with {@link identifier} so the check is
   * purely symbol-based and works across realms, iframes, and whatever other
   * exotic environments your code finds itself flowing through.
   *
   * @typeParam T - Narrows the contained value type on a positive match.
   *   Defaults to `unknown` when you only care about the container shape.
   * @param value - Any value to test.
   * @returns `true` if `value` is a {@link Rheon}, `false` otherwise.
   *
   * @example
   * ```ts
   * const x: unknown = Rheon.create('maybe')
   * if (Rheon.is<string>(x)) {
   *   console.log(Rheon.read(x)) // "maybe"
   * }
   * ```
   */
  export function is<T = unknown>(value: unknown): value is Rheon<T> {
    // biome-ignore lint/complexity/noBannedTypes: We need to use `{}` here to ensure type safety.
    return Idion.is(value as {}, identifier)
  }
}
