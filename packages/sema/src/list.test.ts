import { describe, expect, test } from 'bun:test'
import { List } from './list'

describe('List', () => {
  describe('is', () => {
    test('returns true for empty array', () => {
      expect(List.is([])).toBe(true)
    })

    test('returns true for array of numbers', () => {
      expect(List.is([1, 2, 3])).toBe(true)
    })

    test('returns true for array of strings', () => {
      expect(List.is(['a', 'b'])).toBe(true)
    })

    test('returns true for array of mixed types', () => {
      expect(List.is([1, 'two', null])).toBe(true)
    })

    test('returns true for array of objects', () => {
      expect(List.is([{ x: 1 }, { y: 2 }])).toBe(true)
    })

    test('returns true for array of arrays', () => {
      expect(List.is([[1], [2]])).toBe(true)
    })

    test('returns true for empty Set', () => {
      expect(List.is(new Set())).toBe(true)
    })

    test('returns true for Set with numbers', () => {
      expect(List.is(new Set([1, 2, 3]))).toBe(true)
    })

    test('returns true for Set with strings', () => {
      expect(List.is(new Set(['a', 'b']))).toBe(true)
    })

    test('returns true for Set with objects', () => {
      const obj = { x: 1 }
      expect(List.is(new Set([obj]))).toBe(true)
    })

    test('returns false for plain object', () => {
      expect(List.is({})).toBe(false)
    })

    test('returns false for object with numeric keys', () => {
      expect(List.is({ 0: 'a', 1: 'b', length: 2 })).toBe(false)
    })

    test('returns false for null', () => {
      expect(List.is(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(List.is(undefined)).toBe(false)
    })

    test('returns false for string', () => {
      expect(List.is('hello')).toBe(false)
    })

    test('returns false for empty string', () => {
      expect(List.is('')).toBe(false)
    })

    test('returns false for number', () => {
      expect(List.is(42)).toBe(false)
    })

    test('returns false for zero', () => {
      expect(List.is(0)).toBe(false)
    })

    test('returns false for boolean true', () => {
      expect(List.is(true)).toBe(false)
    })

    test('returns false for boolean false', () => {
      expect(List.is(false)).toBe(false)
    })

    test('returns false for bigint', () => {
      expect(List.is(BigInt(1))).toBe(false)
    })

    test('returns false for symbol', () => {
      expect(List.is(Symbol('test'))).toBe(false)
    })

    test('returns false for function', () => {
      expect(List.is(() => {})).toBe(false)
    })

    test('returns false for arrow function', () => {
      expect(List.is(async () => {})).toBe(false)
    })

    test('returns false for Date', () => {
      expect(List.is(new Date())).toBe(false)
    })

    test('returns false for RegExp', () => {
      expect(List.is(/test/)).toBe(false)
    })

    test('returns false for Map', () => {
      expect(List.is(new Map())).toBe(false)
    })

    test('returns false for WeakMap', () => {
      expect(List.is(new WeakMap())).toBe(false)
    })

    test('returns false for WeakSet', () => {
      expect(List.is(new WeakSet())).toBe(false)
    })

    test('returns false for Error', () => {
      expect(List.is(new Error())).toBe(false)
    })

    test('returns false for Promise', () => {
      expect(List.is(Promise.resolve())).toBe(false)
    })

    test('returns false for typed array', () => {
      expect(List.is(new Uint8Array([1, 2, 3]))).toBe(false)
    })

    test('returns false for ArrayBuffer', () => {
      expect(List.is(new ArrayBuffer(8))).toBe(false)
    })

    test('returns false for Int8Array', () => {
      expect(List.is(new Int8Array())).toBe(false)
    })

    test('returns false for Float64Array', () => {
      expect(List.is(new Float64Array())).toBe(false)
    })
  })
})
