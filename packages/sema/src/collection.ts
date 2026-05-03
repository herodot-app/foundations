/**
 * A key-value map with arbitrary string, number, or symbol keys — a typed alias
 * over the native `Record`.
 *
 * `Collection` represents the most general composite structure in the equality
 * system. When `Equality.check` rules out scalars and lists, it falls back to
 * a key-by-key collection comparison via `Equality.checkCollection`.
 *
 * > **Note:** Because `Collection.is` relies on `typeof value === 'object'`, both
 * > arrays and `null` are technically collections from JavaScript's perspective.
 * > The equality algorithm always tests for `List` first, so arrays are handled
 * > before reaching the collection path. `null` is handled earlier by `Scalar.is`.
 *
 * @typeParam K - The key type. Defaults to `Collection.Key` (`string | number | symbol`).
 * @typeParam V - The value type. Defaults to `unknown`.
 */
export type Collection<K extends Collection.Key, V> = Record<K, V> | Map<K, V>

export namespace Collection {
  /**
   * The set of types that can be used as keys in a {@link Collection}.
   * Mirrors the native `Record` key constraint.
   */
  export type Key = string | number | symbol

  /**
   * Type guard that returns `true` when `value` is an object (i.e. `typeof value === 'object'`).
   *
   * This intentionally matches arrays and `null` as well, since both satisfy
   * `typeof === 'object'`. Callers that need to distinguish between arrays, null,
   * and plain objects should use `List.is` and `Scalar.is` first — exactly as
   * `Equality.check` does.
   *
   * @typeParam K - The expected key type (defaults to `Collection.Key`).
   * @typeParam V - The expected value type (defaults to `unknown`).
   * @param value - Any unknown value to test.
   * @returns `true` if `typeof value === 'object'`.
   *
   * @example
   * ```ts
   * Collection.is({ a: 1 }) // true
   * Collection.is([])       // true  (arrays are objects — use List.is first)
   * Collection.is(null)     // true  (null is object — use Scalar.is first)
   * Collection.is('hello')  // false
   * Collection.is(42)       // false
   * ```
   */
  export function is<K extends Collection.Key = Collection.Key, V = unknown>(
    value: unknown,
  ): value is Collection<K, V> {
    if (Array.isArray(value)) {
      return false
    }

    if (value instanceof Set) {
      return false
    }

    if (null === value) {
      return false
    }

    return 'object' === typeof value
  }
}
