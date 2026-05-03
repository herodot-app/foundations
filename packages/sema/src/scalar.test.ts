import { describe, expect, test } from 'bun:test'
import { Scalar } from './scalar'

describe('Scalar', () => {
  describe('brand', () => {
    test('is a symbol', () => {
      expect(typeof Scalar.brand).toBe('symbol')
    })

    test('has a description via Symbol.for', () => {
      expect(Scalar.brand.description).toBe('@herodot-app/sema/scalar/brand')
    })
  })

  describe('is', () => {
    test('returns true for number', () => {
      expect(Scalar.is(42)).toBe(true)
    })

    test('returns true for negative number', () => {
      expect(Scalar.is(-3.14)).toBe(true)
    })

    test('returns true for NaN', () => {
      expect(Scalar.is(Number.NaN)).toBe(true)
    })

    test('returns true for Infinity', () => {
      expect(Scalar.is(Infinity)).toBe(true)
    })

    test('returns true for string', () => {
      expect(Scalar.is('hello')).toBe(true)
    })

    test('returns true for empty string', () => {
      expect(Scalar.is('')).toBe(true)
    })

    test('returns true for boolean true', () => {
      expect(Scalar.is(true)).toBe(true)
    })

    test('returns true for boolean false', () => {
      expect(Scalar.is(false)).toBe(true)
    })

    test('returns true for null', () => {
      expect(Scalar.is(null)).toBe(true)
    })

    test('returns true for undefined', () => {
      expect(Scalar.is(undefined)).toBe(true)
    })

    test('returns true for bigint', () => {
      expect(Scalar.is(BigInt(9007199254740991))).toBe(true)
    })

    test('returns true for branded scalar', () => {
      const branded = Scalar.branded({ value: 42 })
      expect(Scalar.is(branded)).toBe(true)
    })

    test('returns false for plain object', () => {
      expect(Scalar.is({})).toBe(false)
    })

    test('returns false for array', () => {
      expect(Scalar.is([])).toBe(false)
    })

    test('returns false for function', () => {
      expect(Scalar.is(() => {})).toBe(false)
    })

    test('returns false for symbol', () => {
      expect(Scalar.is(Symbol('test'))).toBe(false)
    })

    test('returns false for Date', () => {
      expect(Scalar.is(new Date())).toBe(false)
    })

    test('returns false for RegExp', () => {
      expect(Scalar.is(/test/)).toBe(false)
    })

    test('returns false for Map', () => {
      expect(Scalar.is(new Map())).toBe(false)
    })

    test('returns false for Set', () => {
      expect(Scalar.is(new Set())).toBe(false)
    })
  })

  describe('branded', () => {
    test('returns an object with the brand symbol', () => {
      const obj = { amount: 100 }
      const branded = Scalar.branded(obj)
      expect(Scalar.isBranded(branded)).toBe(true)
    })

    test('preserves the wrapped value', () => {
      const data = { amount: 100, currency: 'EUR' }
      const branded = Scalar.branded(data)
      expect(branded).toHaveProperty('value')
    })

    test('treats branded scalar as scalar via is', () => {
      const branded = Scalar.branded({ id: 'abc' })
      expect(Scalar.is(branded)).toBe(true)
    })

    test('works with string payload', () => {
      const branded = Scalar.branded('user-123')
      expect(Scalar.isBranded(branded)).toBe(true)
    })

    test('works with number payload', () => {
      const branded = Scalar.branded(42)
      expect(Scalar.isBranded(branded)).toBe(true)
    })

    test('works with nested object payload', () => {
      const branded = Scalar.branded({ nested: { deep: true } })
      expect(Scalar.isBranded(branded)).toBe(true)
    })
  })

  describe('isBranded', () => {
    test('returns true for branded scalar', () => {
      const branded = Scalar.branded({ x: 1 })
      expect(Scalar.isBranded(branded)).toBe(true)
    })

    test('returns false for primitives', () => {
      expect(Scalar.isBranded(42)).toBe(false)
      expect(Scalar.isBranded('text')).toBe(false)
      expect(Scalar.isBranded(true)).toBe(false)
      expect(Scalar.isBranded(null)).toBe(false)
      expect(Scalar.isBranded(undefined)).toBe(false)
      expect(Scalar.isBranded(BigInt(1))).toBe(false)
    })

    test('returns false for plain object', () => {
      expect(Scalar.isBranded({})).toBe(false)
    })

    test('returns false for array', () => {
      expect(Scalar.isBranded([1, 2, 3])).toBe(false)
    })

    test('returns false for manually branded-like object without Idion', () => {
      const fake = { [Scalar.brand]: true }
      expect(Scalar.isBranded(fake)).toBe(false)
    })

    test('returns false for symbol', () => {
      expect(Scalar.isBranded(Symbol('x'))).toBe(false)
    })

    test('returns false for function', () => {
      expect(Scalar.isBranded(() => {})).toBe(false)
    })
  })
})
