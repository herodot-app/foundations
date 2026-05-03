import { Collection } from './collection'
import { List } from './list'
import { Scalar } from './scalar'

/**
 * A binary predicate that compares two values and returns `true` when they are
 * considered equal under some definition of equality.
 *
 * This type is the generic contract for all equality functions in this module.
 * It is also used by TanStack Store selectors to decide whether to trigger a
 * re-render — pass a custom `Equality` function to fine-tune when a selector
 * is considered "changed".
 *
 * @typeParam A - The type of the first operand.
 * @typeParam B - The type of the second operand (often the same as `A`).
 *
 * @example
 * ```ts
 * const byId: Equality<{ id: number }, { id: number }> = (a, b) => a.id === b.id
 * ```
 */
export type Equality<A, B = A> = (a: A, b: B) => boolean

export namespace Equality {
  /**
   * Compares two values using strict reference equality (`===`).
   *
   * This is the fastest possible equality check and is appropriate for primitives
   * or when you intentionally want to compare by reference rather than structure.
   *
   * @typeParam A - The type of the first operand.
   *
   * @param valueA - The first value.
   * @param valueB - The second value.
   *
   * @returns `true` if `valueA === valueB`.
   *
   * @example
   * ```ts
   * Equality.strict(1, 1)    // true
   * Equality.strict('a', 'a') // true
   *
   * const obj = { x: 1 }
   * Equality.strict(obj, obj)        // true  (same reference)
   * Equality.strict(obj, { x: 1 })   // false (different reference)
   * ```
   */
  export function strict<A>(a: A, b: A): boolean {
    if (Number.isNaN(a) && Number.isNaN(b)) {
      return true
    }

    return a === b
  }

  /**
   * A shape that exposes its size via a `length` property.
   * Mutually exclusive with `size` and `count`.
   */
  export type LengthOwner = {
    size?: undefined
    count?: undefined
    length: number
  }

  /**
   * A shape that exposes its size via a `size` property (e.g. `Map`, `Set`).
   * Mutually exclusive with `length` and `count`.
   */
  export type SizeOwner = {
    count?: undefined
    length?: undefined
    size: number
  }

  /**
   * A shape that exposes its size via a `count` property.
   * Mutually exclusive with `length` and `size`.
   */
  export type CountOwner = {
    size?: undefined
    length?: undefined
    count: number
  }

  /**
   * Any value that declares its element count through one of three conventional
   * property names: `length`, `size`, or `count`.
   *
   * Used by {@link Equality.length} to compare heterogeneous countable structures
   * (arrays, Sets, Maps, custom collections) without assuming a specific API.
   */
  export type Countable = LengthOwner | SizeOwner | CountOwner

  /**
   * Returns `true` when two {@link Countable} values report the same element count,
   * regardless of which property (`length`, `size`, or `count`) they use.
   *
   * This is a cheap pre-flight check used by `checkList` and `checkCollection`
   * to short-circuit before doing element-by-element comparison.
   *
   * @param valueA - The first countable value.
   * @param valueB - The second countable value.
   * @returns `true` if both values have the same count.
   *
   * @example
   * ```ts
   * Equality.length([1, 2, 3], ['a', 'b', 'c']) // true  (both length=3)
   * Equality.length([1], [1, 2])                 // false (1 vs 2)
   * Equality.length({ size: 4 }, { size: 4 })    // true
   * Equality.length({ count: 2 }, { count: 3 })  // false
   * ```
   */
  export function length<A extends Countable, B extends Countable>(
    valueA: A,
    valueB: B,
  ): boolean {
    const countA = valueA.length ?? valueA.size ?? valueA.count ?? 0
    const countB = valueB.length ?? valueB.size ?? valueB.count ?? 0

    return countA === countB
  }

  /**
   * Returns `true` when both values share the same `typeof` tag.
   *
   * This is the outermost gate in `check` — if the types diverge, no further
   * comparison is attempted.
   *
   * @param valueA - The first value.
   * @param valueB - The second value.
   * @returns `true` if `typeof valueA === typeof valueB`.
   *
   * @example
   * ```ts
   * Equality.typeOf(1, 2)        // true  (both 'number')
   * Equality.typeOf('a', 'b')    // true  (both 'string')
   * Equality.typeOf(null, {})    // true  (both 'object')
   * Equality.typeOf(1, '1')      // false ('number' vs 'string')
   * Equality.typeOf(true, 1)     // false ('boolean' vs 'number')
   * ```
   */
  export function typeOf<A, B>(valueA: A, valueB: B): boolean {
    return typeof valueA === typeof valueB
  }

  /**
   * Performs a deep structural equality check between two arbitrary values.
   *
   * The algorithm dispatches in order:
   * 1. **Type gate** — `typeOf` must pass; different `typeof` tags → `false`.
   * 2. **Scalar** — if both values are primitives, compares with `===`.
   * 3. **List** — if both are arrays, compares element-by-element (recursive).
   * 4. **Collection** — if both are objects, compares key-by-key (recursive).
   * 5. If none of the above match → `false`.
   *
   * > **Edge case:** An empty array `[]` and an empty object `{}` are considered
   * > equal because both have `typeof === 'object'` and zero enumerable keys.
   * > If you need to distinguish them, use `checkList` or `checkCollection` directly.
   *
   * @param valueA - The first value.
   * @param valueB - The second value.
   * @returns `true` if the two values are deeply structurally equal.
   *
   * @example
   * ```ts
   * Equality.check(1, 1)                        // true
   * Equality.check([1, [2, 3]], [1, [2, 3]])     // true
   * Equality.check({ a: { b: 1 } }, { a: { b: 1 } }) // true
   * Equality.check({ a: 1 }, { a: 2 })           // false
   * Equality.check(1, '1')                       // false
   * ```
   */
  export function check<A, B>(valueA: A, valueB: B): boolean {
    if (!typeOf(valueA, valueB)) return false

    if (!checkScalar(valueA, valueB)) {
      if (!checkList(valueA, valueB)) {
        if (!checkCollection(valueA, valueB)) return false
      }
    }

    return true
  }

  /**
   * Returns `true` when both values are {@link Scalar} primitives that are strictly equal.
   *
   * This is the base case of the recursive `check` algorithm. It returns `false`
   * (rather than throwing) when either value is not a scalar, so the caller can
   * fall through to the next check.
   *
   * @param valueA - The first value.
   * @param valueB - The second value.
   * @returns `true` if both are scalars and `valueA === valueB`.
   *
   * @example
   * ```ts
   * Equality.checkScalar(42, 42)       // true
   * Equality.checkScalar('x', 'x')     // true
   * Equality.checkScalar(null, null)   // true
   * Equality.checkScalar(1, 2)         // false (different values)
   * Equality.checkScalar({}, {})       // false (not scalars)
   * ```
   */
  export function checkScalar<A, B>(valueA: A, valueB: B): boolean {
    if (!Scalar.is(valueA)) return false

    if (!Scalar.is(valueB)) return false

    // biome-ignore lint: we explicitly want any here
    if (!strict(valueA, valueB as any)) return false

    return true
  }

  /**
   * Returns `true` when both values are arrays with the same length and deeply
   * equal elements at every index.
   *
   * Returns `false` (without throwing) when either value is not an array, so the
   * caller can fall through to `checkCollection`.
   *
   * @param valueA - The first value.
   * @param valueB - The second value.
   * @returns `true` if both are arrays of the same length with recursively equal elements.
   *
   * @example
   * ```ts
   * Equality.checkList([1, 2, 3], [1, 2, 3])     // true
   * Equality.checkList([[1], [2]], [[1], [2]])     // true
   * Equality.checkList([1, 2], [1, 3])             // false (element mismatch)
   * Equality.checkList([1], [1, 2])                // false (length mismatch)
   * Equality.checkList({}, {})                     // false (not arrays)
   * ```
   */
  export function checkList<A, B>(valueA: A, valueB: B): boolean {
    if (!List.is(valueA)) return false

    if (!List.is(valueB)) return false

    if (!length(valueA, valueB)) return false

    for (const index in valueA) {
      const a = [...valueA][Number(index)]
      const b = [...valueB][Number(index)]

      if (!check(a, b)) return false
    }

    return true
  }

  /**
   * Returns `true` when both values are objects with the same number of keys and
   * deeply equal values for every key.
   *
   * Returns `false` (without throwing) when either value is not an object, so it
   * is safe to call speculatively. Only enumerable own keys (via `Object.keys`) are
   * compared — prototype properties and non-enumerable keys are ignored.
   *
   * @param valueA - The first value.
   * @param valueB - The second value.
   * @returns `true` if both are objects with the same keys and recursively equal values.
   *
   * @example
   * ```ts
   * Equality.checkCollection({ a: 1, b: 2 }, { a: 1, b: 2 })   // true
   * Equality.checkCollection({ x: { y: 1 } }, { x: { y: 1 } }) // true
   * Equality.checkCollection({ a: 1 }, { a: 2 })                 // false (value mismatch)
   * Equality.checkCollection({ a: 1 }, { a: 1, b: 2 })           // false (key count mismatch)
   * Equality.checkCollection('string', {})                        // false (not objects)
   * ```
   */
  export function checkCollection<A, B>(valueA: A, valueB: B): boolean {
    if (!Collection.is(valueA)) return false

    if (!Collection.is(valueB)) return false

    const keysOfA =
      valueA instanceof Map ? [...valueA.keys()] : Object.keys(valueA)
    const keysOfB =
      valueB instanceof Map ? [...valueB.keys()] : Object.keys(valueB)

    if (!length(keysOfA, keysOfB)) return false

    const iterableObject =
      valueA instanceof Map
        ? valueA.entries().reduce(
            (acc, [k, v]) => ({
              // biome-ignore lint: we explicitly want to spread here
              ...acc,
              [k]: v,
            }),
            {},
          )
        : valueA

    for (const key in iterableObject) {
      const a = valueA instanceof Map ? valueA.get(key) : valueA[key]
      const b = valueB instanceof Map ? valueB.get(key) : valueB[key]

      if (!check(a, b)) return false
    }

    return true
  }
}
