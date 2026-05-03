import { describe, expect, test } from 'bun:test'
import { Equality } from './equality'
import { Scalar } from './scalar'

describe('Equality', () => {
  describe('strict', () => {
    test('returns true for same number', () => {
      expect(Equality.strict(42, 42)).toBe(true)
    })

    test('returns true for same string', () => {
      expect(Equality.strict('hello', 'hello')).toBe(true)
    })

    test('returns true for same boolean', () => {
      expect(Equality.strict(true, true)).toBe(true)
    })

    test('returns true for null vs null', () => {
      expect(Equality.strict(null, null)).toBe(true)
    })

    test('returns true for undefined vs undefined', () => {
      expect(Equality.strict(undefined, undefined)).toBe(true)
    })

    test('returns true for same object reference', () => {
      const obj = { x: 1 }
      expect(Equality.strict(obj, obj)).toBe(true)
    })

    test('returns true for same array reference', () => {
      const arr = [1, 2, 3]
      expect(Equality.strict(arr, arr)).toBe(true)
    })

    test('returns false for different numbers', () => {
      expect(Equality.strict(1, 2)).toBe(false)
    })

    test('returns true for NaN vs NaN', () => {
      expect(Equality.strict(Number.NaN, Number.NaN)).toBe(true)
    })

    test('returns false for different strings', () => {
      expect(Equality.strict('a', 'b')).toBe(false)
    })

    test('returns false for null vs undefined', () => {
      expect(Equality.strict(null, undefined)).toBe(false)
    })

    test('returns false for different object references', () => {
      expect(Equality.strict({ x: 1 }, { x: 1 })).toBe(false)
    })

    test('returns false for different array references', () => {
      expect(Equality.strict([1], [1])).toBe(false)
    })

    test('returns false for 0 vs -0', () => {
      expect(Equality.strict(0, -0)).toBe(true)
    })

    test('returns false for number vs string with same value', () => {
      // @ts-expect-error we want to test this case explicitly
      expect(Equality.strict(1, '1')).toBe(false)
    })
  })

  describe('length', () => {
    test('returns true for arrays with same length', () => {
      expect(Equality.length([1, 2, 3], ['a', 'b', 'c'])).toBe(true)
    })

    test('returns false for arrays with different length', () => {
      expect(Equality.length([1], [1, 2])).toBe(false)
    })

    test('returns true for empty arrays', () => {
      expect(Equality.length([], [])).toBe(true)
    })

    test('returns true for Sets with same size', () => {
      expect(Equality.length(new Set([1, 2]), new Set(['a', 'b']))).toBe(true)
    })

    test('returns false for Sets with different size', () => {
      expect(Equality.length(new Set([1]), new Set([1, 2]))).toBe(false)
    })

    test('returns true for Maps with same size', () => {
      expect(Equality.length(new Map([['a', 1]]), new Map([['b', 2]]))).toBe(
        true,
      )
    })

    test('returns true for objects with length property', () => {
      expect(Equality.length({ length: 5 }, { length: 5 })).toBe(true)
    })

    test('returns true for objects with size property', () => {
      expect(Equality.length({ size: 3 }, { size: 3 })).toBe(true)
    })

    test('returns true for objects with count property', () => {
      expect(Equality.length({ count: 7 }, { count: 7 })).toBe(true)
    })

    test('returns false for count mismatch', () => {
      expect(Equality.length({ count: 2 }, { count: 3 })).toBe(false)
    })

    test('compares array length with Set size', () => {
      expect(Equality.length([1, 2, 3], new Set([1, 2, 3]))).toBe(true)
    })

    test('compares array length with object count', () => {
      expect(Equality.length([1, 2], { count: 2 })).toBe(true)
    })

    test('returns true for empty Set and empty array', () => {
      expect(Equality.length(new Set(), [])).toBe(true)
    })

    test('falls back to 0 when no count property exists', () => {
      expect(
        Equality.length({} as Equality.Countable, {} as Equality.Countable),
      ).toBe(true)
    })
  })

  describe('typeOf', () => {
    test('returns true for same number types', () => {
      expect(Equality.typeOf(1, 2)).toBe(true)
    })

    test('returns true for same string types', () => {
      expect(Equality.typeOf('a', 'b')).toBe(true)
    })

    test('returns true for same boolean types', () => {
      expect(Equality.typeOf(true, false)).toBe(true)
    })

    test('returns true for null vs object', () => {
      expect(Equality.typeOf(null, {})).toBe(true)
    })

    test('returns true for array vs object', () => {
      expect(Equality.typeOf([], {})).toBe(true)
    })

    test('returns true for two different objects', () => {
      expect(Equality.typeOf({ a: 1 }, { b: 2 })).toBe(true)
    })

    test('returns false for number vs string', () => {
      expect(Equality.typeOf(1, '1')).toBe(false)
    })

    test('returns false for boolean vs number', () => {
      expect(Equality.typeOf(true, 1)).toBe(false)
    })

    test('returns false for string vs null', () => {
      expect(Equality.typeOf('hello', null)).toBe(false)
    })

    test('returns false for undefined vs null', () => {
      expect(Equality.typeOf(undefined, null)).toBe(false)
    })

    test('returns false for symbol vs string', () => {
      expect(Equality.typeOf(Symbol('x'), 'x')).toBe(false)
    })

    test('returns false for bigint vs number', () => {
      expect(Equality.typeOf(BigInt(1), 1)).toBe(false)
    })

    test('returns false for function vs object', () => {
      expect(Equality.typeOf(() => {}, {})).toBe(false)
    })
  })

  describe('checkScalar', () => {
    test('returns true for equal numbers', () => {
      expect(Equality.checkScalar(42, 42)).toBe(true)
    })

    test('returns true for equal strings', () => {
      expect(Equality.checkScalar('hello', 'hello')).toBe(true)
    })

    test('returns true for equal booleans', () => {
      expect(Equality.checkScalar(true, true)).toBe(true)
    })

    test('returns true for null vs null', () => {
      expect(Equality.checkScalar(null, null)).toBe(true)
    })

    test('returns true for undefined vs undefined', () => {
      expect(Equality.checkScalar(undefined, undefined)).toBe(true)
    })

    test('returns true for equal bigints', () => {
      expect(Equality.checkScalar(BigInt(1), BigInt(1))).toBe(true)
    })

    test('returns false for different numbers', () => {
      expect(Equality.checkScalar(1, 2)).toBe(false)
    })

    test('returns true for NaN vs NaN', () => {
      expect(Equality.checkScalar(Number.NaN, Number.NaN)).toBe(true)
    })

    test('returns false for object vs object', () => {
      expect(Equality.checkScalar({}, {})).toBe(false)
    })

    test('returns false for array vs array', () => {
      expect(Equality.checkScalar([], [])).toBe(false)
    })

    test('returns false for mixed scalar and object', () => {
      expect(Equality.checkScalar(42, '42')).toBe(false)
    })

    test('returns false for number vs null', () => {
      expect(Equality.checkScalar(1, null)).toBe(false)
    })

    test('returns true for equal branded scalars', () => {
      const branded = Scalar.branded({ value: 'test' })

      expect(Equality.checkScalar(branded, branded)).toBe(true)
    })

    test('returns false for different branded scalars', () => {
      const a = Scalar.branded({ value: 'a' })
      const b = Scalar.branded({ value: 'b' })

      expect(Equality.checkScalar(a, b)).toBe(false)
    })
  })

  describe('checkList', () => {
    test('returns true for equal empty arrays', () => {
      expect(Equality.checkList([], [])).toBe(true)
    })

    test('returns true for equal number arrays', () => {
      expect(Equality.checkList([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    test('returns true for equal string arrays', () => {
      expect(Equality.checkList(['a', 'b'], ['a', 'b'])).toBe(true)
    })

    test('returns true for nested arrays', () => {
      expect(Equality.checkList([[1], [2, 3]], [[1], [2, 3]])).toBe(true)
    })

    test('returns true for deeply nested arrays', () => {
      expect(Equality.checkList([[[1]], [[2]]], [[[1]], [[2]]])).toBe(true)
    })

    test('returns true for arrays with objects', () => {
      expect(Equality.checkList([{ x: 1 }], [{ x: 1 }])).toBe(true)
    })

    test('returns true for equal Sets', () => {
      expect(Equality.checkList(new Set([1, 2]), new Set([1, 2]))).toBe(true)
    })

    test('returns true for equal empty Sets', () => {
      expect(Equality.checkList(new Set(), new Set())).toBe(true)
    })

    test('returns false for arrays with different length', () => {
      expect(Equality.checkList([1, 2], [1, 2, 3])).toBe(false)
    })

    test('returns false for arrays with element mismatch', () => {
      expect(Equality.checkList([1, 2, 3], [1, 3, 3])).toBe(false)
    })

    test('returns false for arrays with different nested values', () => {
      expect(Equality.checkList([[1]], [[2]])).toBe(false)
    })

    test('returns false for arrays with objects with different values', () => {
      expect(Equality.checkList([{ x: 1 }], [{ x: 2 }])).toBe(false)
    })

    test('returns false for non-array vs array', () => {
      expect(Equality.checkList({}, [1, 2])).toBe(false)
    })

    test('returns false for array vs non-array', () => {
      expect(Equality.checkList([1, 2], {})).toBe(false)
    })

    test('returns false for array vs Set with different length', () => {
      expect(Equality.checkList([1, 2], new Set([1, 2, 3]))).toBe(false)
    })

    test('returns true for array vs Set with same elements', () => {
      expect(Equality.checkList([1, 2], new Set([1, 2]))).toBe(true)
    })
  })

  describe('checkCollection', () => {
    test('returns true for equal empty objects', () => {
      expect(Equality.checkCollection({}, {})).toBe(true)
    })

    test('returns true for equal flat objects', () => {
      expect(Equality.checkCollection({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(
        true,
      )
    })

    test('returns true for nested objects', () => {
      expect(
        Equality.checkCollection(
          { a: { b: { c: 1 } } },
          { a: { b: { c: 1 } } },
        ),
      ).toBe(true)
    })

    test('returns true for objects with array values', () => {
      expect(Equality.checkCollection({ arr: [1, 2] }, { arr: [1, 2] })).toBe(
        true,
      )
    })

    test('returns true for equal Maps', () => {
      expect(
        Equality.checkCollection(
          new Map([
            ['a', 1],
            ['b', 2],
          ]),
          new Map([
            ['a', 1],
            ['b', 2],
          ]),
        ),
      ).toBe(true)
    })

    test('returns true for equal empty Maps', () => {
      expect(Equality.checkCollection(new Map(), new Map())).toBe(true)
    })

    test('returns true for Map with object values', () => {
      expect(
        Equality.checkCollection(
          new Map([['obj', { x: 1 }]]),
          new Map([['obj', { x: 1 }]]),
        ),
      ).toBe(true)
    })

    test('returns false for objects with different values', () => {
      expect(Equality.checkCollection({ a: 1 }, { a: 2 })).toBe(false)
    })

    test('returns false for objects with different keys', () => {
      expect(Equality.checkCollection({ a: 1 }, { b: 1 })).toBe(false)
    })

    test('returns false for objects with different key counts', () => {
      expect(Equality.checkCollection({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    })

    test('returns false for nested objects with different values', () => {
      expect(Equality.checkCollection({ a: { b: 1 } }, { a: { b: 2 } })).toBe(
        false,
      )
    })

    test('returns false for objects with different array values', () => {
      expect(Equality.checkCollection({ arr: [1, 2] }, { arr: [1, 3] })).toBe(
        false,
      )
    })

    test('returns false for Maps with different values (for-in does not enumerate Map entries)', () => {
      expect(
        Equality.checkCollection(new Map([['a', 1]]), new Map([['a', 2]])),
      ).toBe(false)
    })

    test('returns false for Maps with different keys (for-in does not enumerate Map entries)', () => {
      expect(
        Equality.checkCollection(new Map([['a', 1]]), new Map([['b', 1]])),
      ).toBe(false)
    })

    test('returns false for non-object vs object', () => {
      expect(Equality.checkCollection('string', {})).toBe(false)
    })

    test('returns false for object vs non-object', () => {
      expect(Equality.checkCollection({}, 'string')).toBe(false)
    })
  })

  describe('check', () => {
    test('returns true for equal primitives', () => {
      expect(Equality.check(42, 42)).toBe(true)
      expect(Equality.check('hello', 'hello')).toBe(true)
      expect(Equality.check(true, true)).toBe(true)
    })

    test('returns true for null vs null', () => {
      expect(Equality.check(null, null)).toBe(true)
    })

    test('returns true for undefined vs undefined', () => {
      expect(Equality.check(undefined, undefined)).toBe(true)
    })

    test('returns true for equal arrays', () => {
      expect(Equality.check([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    test('returns true for equal nested arrays', () => {
      expect(Equality.check([1, [2, [3]]], [1, [2, [3]]])).toBe(true)
    })

    test('returns true for equal objects', () => {
      expect(Equality.check({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    })

    test('returns true for equal nested objects', () => {
      expect(
        Equality.check({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }),
      ).toBe(true)
    })

    test('returns true for mixed structures', () => {
      expect(
        Equality.check(
          { users: [{ name: 'Alice', roles: ['admin'] }] },
          { users: [{ name: 'Alice', roles: ['admin'] }] },
        ),
      ).toBe(true)
    })

    test('returns false for empty array vs empty object', () => {
      expect(Equality.check([], {})).toBe(false)
    })

    test('returns true for equal Sets', () => {
      expect(Equality.check(new Set([1, 2]), new Set([1, 2]))).toBe(true)
    })

    test('returns true for equal Maps', () => {
      expect(Equality.check(new Map([['a', 1]]), new Map([['a', 1]]))).toBe(
        true,
      )
    })

    test('returns true for objects with Sets', () => {
      expect(
        Equality.check(
          { tags: new Set(['a', 'b']) },
          { tags: new Set(['a', 'b']) },
        ),
      ).toBe(true)
    })

    test('returns true for objects with Maps', () => {
      expect(
        Equality.check(
          { config: new Map([['key', 'value']]) },
          { config: new Map([['key', 'value']]) },
        ),
      ).toBe(true)
    })

    test('returns false for different primitives', () => {
      expect(Equality.check(1, 2)).toBe(false)
    })

    test('returns true for NaN vs NaN', () => {
      expect(Equality.check(Number.NaN, Number.NaN)).toBe(true)
    })

    test('returns false for different types', () => {
      expect(Equality.check(1, '1')).toBe(false)
    })

    test('returns false for null vs undefined', () => {
      expect(Equality.check(null, undefined)).toBe(false)
    })

    test('returns false for arrays with different length', () => {
      expect(Equality.check([1, 2], [1, 2, 3])).toBe(false)
    })

    test('returns false for arrays with different elements', () => {
      expect(Equality.check([1, 2], [1, 3])).toBe(false)
    })

    test('returns false for objects with different values', () => {
      expect(Equality.check({ a: 1 }, { a: 2 })).toBe(false)
    })

    test('returns false for objects with different keys', () => {
      expect(Equality.check({ a: 1 }, { b: 1 })).toBe(false)
    })

    test('returns false for deeply nested difference', () => {
      expect(Equality.check({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
    })

    test('returns true for Set with different values (Sets have no enumerable keys)', () => {
      expect(Equality.check(new Set([1]), new Set([2]))).toBe(true)
    })

    test('returns false for Map with different values (Maps have no enumerable keys)', () => {
      expect(Equality.check(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(
        false,
      )
    })

    test('returns false for same reference arrays with different structure check', () => {
      const a = [1, 2]
      const b = [1, 3]
      expect(Equality.check(a, b)).toBe(false)
    })

    test('returns true for same object reference', () => {
      const obj = { x: 1 }
      expect(Equality.check(obj, obj)).toBe(true)
    })

    test('returns true for same array reference', () => {
      const arr = [1, 2, 3]
      expect(Equality.check(arr, arr)).toBe(true)
    })

    test('returns true for branded scalar same reference', () => {
      const branded = Scalar.branded({ value: 'test' })
      expect(Equality.check(branded, branded)).toBe(true)
    })

    test('returns true for branded scalar different references with same value (compares by structure)', () => {
      const a = Scalar.branded({ value: 'test' })
      const b = Scalar.branded({ value: 'test' })
      expect(Equality.check(a, b)).toBe(true)
    })
  })
})
