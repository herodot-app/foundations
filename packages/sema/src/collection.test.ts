import { describe, expect, test } from 'bun:test'
import { Collection } from './collection'

describe('Collection', () => {
  describe('Key', () => {
    test('accepts string keys at type level', () => {
      const map: Collection<'a' | 'b', number> = { a: 1, b: 2 }
      expect(map.a).toBe(1)
    })

    test('accepts number keys at type level', () => {
      const map: Collection<1 | 2, string> = { 1: 'one', 2: 'two' }
      expect(map[1]).toBe('one')
    })

    test('accepts symbol keys at type level', () => {
      const key = Symbol('test')
      const map: Collection<typeof key, boolean> = { [key]: true }
      expect(map[key]).toBe(true)
    })
  })

  describe('is', () => {
    test('returns true for plain object', () => {
      expect(Collection.is({})).toBe(true)
    })

    test('returns true for object with properties', () => {
      expect(Collection.is({ a: 1, b: 2 })).toBe(true)
    })

    test('returns true for object with symbol keys', () => {
      expect(Collection.is({ [Symbol('x')]: 1 })).toBe(true)
    })

    test('returns true for empty object literal', () => {
      expect(Collection.is(Object.create(null))).toBe(true)
    })

    test('returns true for Date', () => {
      expect(Collection.is(new Date())).toBe(true)
    })

    test('returns true for RegExp', () => {
      expect(Collection.is(/test/)).toBe(true)
    })

    test('returns true for Map', () => {
      expect(Collection.is(new Map())).toBe(true)
    })

    test('returns true for Map with entries', () => {
      expect(Collection.is(new Map([['a', 1]]))).toBe(true)
    })

    test('returns true for WeakMap', () => {
      expect(Collection.is(new WeakMap())).toBe(true)
    })

    test('returns true for object instance', () => {
      class Foo {}
      expect(Collection.is(new Foo())).toBe(true)
    })

    test('returns false for array', () => {
      expect(Collection.is([])).toBe(false)
    })

    test('returns false for array with elements', () => {
      expect(Collection.is([1, 2, 3])).toBe(false)
    })

    test('returns false for nested array', () => {
      expect(Collection.is([[1], [2]])).toBe(false)
    })

    test('returns false for Set', () => {
      expect(Collection.is(new Set())).toBe(false)
    })

    test('returns false for Set with elements', () => {
      expect(Collection.is(new Set([1, 2]))).toBe(false)
    })

    test('returns false for null', () => {
      expect(Collection.is(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(Collection.is(undefined)).toBe(false)
    })

    test('returns false for string', () => {
      expect(Collection.is('hello')).toBe(false)
    })

    test('returns false for empty string', () => {
      expect(Collection.is('')).toBe(false)
    })

    test('returns false for number', () => {
      expect(Collection.is(42)).toBe(false)
    })

    test('returns false for zero', () => {
      expect(Collection.is(0)).toBe(false)
    })

    test('returns false for NaN', () => {
      expect(Collection.is(Number.NaN)).toBe(false)
    })

    test('returns false for Infinity', () => {
      expect(Collection.is(Infinity)).toBe(false)
    })

    test('returns false for boolean true', () => {
      expect(Collection.is(true)).toBe(false)
    })

    test('returns false for boolean false', () => {
      expect(Collection.is(false)).toBe(false)
    })

    test('returns false for bigint', () => {
      expect(Collection.is(BigInt(1))).toBe(false)
    })

    test('returns false for symbol', () => {
      expect(Collection.is(Symbol('x'))).toBe(false)
    })

    test('returns false for function', () => {
      expect(Collection.is(() => {})).toBe(false)
    })

    test('returns false for async function', () => {
      expect(Collection.is(async () => {})).toBe(false)
    })

    test('returns true for Promise', () => {
      expect(Collection.is(Promise.resolve())).toBe(true)
    })

    test('returns true for Error', () => {
      expect(Collection.is(new Error())).toBe(true)
    })

    test('returns true for typed array', () => {
      expect(Collection.is(new Uint8Array())).toBe(true)
    })

    test('returns true for ArrayBuffer', () => {
      expect(Collection.is(new ArrayBuffer(8))).toBe(true)
    })

    test('returns true for Int8Array', () => {
      expect(Collection.is(new Int8Array())).toBe(true)
    })

    test('returns true for Float32Array', () => {
      expect(Collection.is(new Float32Array())).toBe(true)
    })

    test('returns true for Float64Array', () => {
      expect(Collection.is(new Float64Array())).toBe(true)
    })

    test('returns true for BigInt64Array', () => {
      expect(Collection.is(new BigInt64Array())).toBe(true)
    })

    test('returns true for DataView', () => {
      expect(Collection.is(new DataView(new ArrayBuffer(8)))).toBe(true)
    })
  })
})
