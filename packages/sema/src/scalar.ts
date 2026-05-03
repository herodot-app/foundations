import { Idion } from '@herodot-app/idion'

/**
 * A union of all JavaScript primitive types that carry their value by identity.
 *
 * Scalars are the leaves of any data structure — they hold no children and can be
 * compared directly with `===`. This type (and its companion `Scalar.is` guard) are
 * the foundation of the recursive deep-equality algorithm in `Equality.check`.
 *
 * Included primitives:
 * - `number` (including `NaN` and `Infinity`)
 * - `string`
 * - `boolean`
 * - `null`
 * - `undefined`
 * - `bigint`
 *
 * Note: `symbol` is intentionally excluded — symbols are always unique by design
 * and do not participate in structural equality comparisons.
 */
export type Scalar<T = unknown> =
  | number
  | string
  | boolean
  | null
  | undefined
  | bigint
  | Scalar.Branded<T>

/**
 * Namespace for scalar-related utilities: the branding mechanism and the `is` type guard.
 *
 * In addition to raw JavaScript primitives, any object can opt in to scalar
 * treatment by carrying the {@link Scalar.Brand} symbol property. This lets
 * domain value objects (e.g. tagged IDs, money amounts) declare themselves as
 * identity-comparable leaves so the deep-equality algorithm in `Equality.check`
 * stops recursing into them and falls back to `===`.
 *
 * Use {@link Scalar.branded} to mark an object as a branded scalar, and
 * {@link Scalar.isBranded} / {@link Scalar.is} to detect them at runtime.
 */
export namespace Scalar {
  /**
   * The well-known symbol used as the brand key.
   * An object carrying `{ [Scalar.brand]: true }` is treated as a scalar leaf
   * by the equality algorithm.
   */
  export const brand: unique symbol = Symbol.for(
    '@herodot-app/sema/scalar/brand',
  )

  /**
   * The type of the {@link Scalar.brand} symbol.
   * Used as the computed key in the {@link Scalar.Branded} mapped type.
   */
  export type Brand = typeof brand

  /**
   * A branded scalar type that marks an arbitrary value as a scalar leaf
   * for equality comparisons.
   *
   * When an object carries this type, the deep-equality algorithm in
   * `Equality.check` treats it as an atomic value and compares it by
   * reference (`===`) instead of recursing into its properties.
   *
   * This is useful for domain value objects — such as tagged IDs, money
   * amounts, or dates — that should be compared as whole units rather
   * than structurally.
   *
   * Use {@link Scalar.branded} to create a branded scalar at runtime,
   * and {@link Scalar.isBranded} to detect one.
   *
   * @typeParam T - The underlying value type wrapped by the brand.
   *
   * @example
   * ```ts
   * type UserId = Scalar.Branded<string>
   * const id: UserId = Scalar.branded('abc-123')
   *
   * // Equality checks stop at `id` — no property traversal
   * Scalar.is(id) // → true
   * ```
   */
  export type Branded<T> = Idion<Brand, { value: T }>

  /**
   * Attaches the {@link Scalar.Brand} symbol to an existing object, marking it
   * as a scalar leaf for equality comparisons.
   *
   * The original object is mutated in-place (via `Object.assign`) and returned
   * with the intersection type `T & Branded`.
   *
   * @typeParam T - The type of the object to brand. Must be a non-null object (`{}`).
   * @param value - The object to mark as a branded scalar.
   * @returns The same object reference, now typed as `T & Branded`.
   *
   * @example
   * ```ts
   * const money = Scalar.branded({ amount: 100, currency: 'EUR' })
   *
   * Scalar.is(money)       // → true  (treated as a scalar leaf)
   * Scalar.isBranded(money) // → true
   * ```
   */
  export function branded<T extends {}>(value: T): Scalar<T> {
    return Idion.create({
      id: brand,
      value: {
        value,
      },
    }) as Branded<T>
  }

  /**
   * Type guard that returns `true` when `value` is a {@link Scalar} primitive.
   *
   * Use this to distinguish leaf nodes from composite structures (arrays, objects)
   * before applying a strict `===` comparison.
   *
   * @param value - Any unknown value to test.
   * @returns `true` if `value` is a `number`, `string`, `bigint`, `boolean`, `null`, or `undefined`.
   *
   * @example
   * ```ts
   * Scalar.is(42)        // true
   * Scalar.is('hello')   // true
   * Scalar.is(null)      // true
   * Scalar.is(undefined) // true
   * Scalar.is({})        // false
   * Scalar.is([])        // false
   * ```
   */
  export function is(value: unknown): value is Scalar {
    return (
      'string' === typeof value
      || 'number' === typeof value
      || 'bigint' === typeof value
      || 'boolean' === typeof value
      || value === null
      || value === undefined
      || isBranded(value)
    )
  }

  /**
   * Type guard that returns `true` when `value` is an object carrying the
   * {@link Scalar.Brand} symbol property set to `true`.
   *
   * This is the runtime check used by {@link Scalar.is} to detect branded scalars.
   * Prefer `Scalar.is` when you want to test for *any* scalar (primitive or branded);
   * use this directly when you specifically need to distinguish branded objects.
   *
   * @param value - Any unknown value to test.
   * @returns `true` if `value` satisfies the {@link Scalar.Branded} contract.
   *
   * @example
   * ```ts
   * const money = Scalar.branded({ amount: 100 })
   * Scalar.isBranded(money) // → true
   * Scalar.isBranded(42)    // → false (primitive, not branded)
   * Scalar.isBranded({})    // → false (plain object, no brand)
   * ```
   */
  export function isBranded<T = unknown>(value: unknown): value is Branded<T> {
    // biome-ignore lint: we explicitly want to treat any object as a potential branded scalar
    return Idion.is(value as {}, brand)
  }
}
