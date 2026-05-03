/*
 * An ordered, index-addressable sequence of values.
 *
 * `List` exists to give arrays a named role in the equality system. The companion
 * `List.is` guard lets `Equality.check` detect arrays before falling through to the
 * generic collection path, ensuring element-by-index comparison rather than
 * key-by-key object comparison.
 *
 * @typeParam T - The element type of the array.
 */
export type List<T> = Array<T> | ReadonlyArray<T> | Set<T> | ReadonlySet<T>

export namespace List {
  /**
   * Type guard that returns `true` when `value` is an `Array` instance.
   *
   * This check is intentionally based on `instanceof Array` rather than
   * `Array.isArray` so that it narrows the type to `List<T>` for the
   * generic type parameter `T`.
   *
   * @typeParam T - The expected element type (defaults to `unknown`).
   * @param value - Any unknown value to test.
   * @returns `true` if `value` is an `Array` instance.
   *
   * @example
   * ```ts
   * List.is([1, 2, 3]) // true
   * List.is([])        // true
   * List.is({})        // false
   * List.is('hello')   // false
   * ```
   */
  export function is<T = unknown>(value: unknown): value is List<T> {
    return Array.isArray(value) || value instanceof Set
  }
}
