import { describe, expect, test } from 'bun:test'
import { Idion } from './idion'

describe('Idion.create', () => {
  test('brands a plain object with a string id', () => {
    const branded = Idion.create({ id: 'User', value: { name: 'Alice' } })

    expect(branded.name).toBe('Alice')
    expect(branded[Idion.identifier]).toBe(true)
  })

  test('brands a plain object with a symbol id', () => {
    const sym = Symbol('OrderId')
    const branded = Idion.create({ id: sym, value: { total: 42 } })

    expect(branded.total).toBe(42)
    expect(branded[Idion.identifier]).toBe(true)
    expect(branded[sym]).toBe(true)
  })

  test('preserves all original properties', () => {
    const input = { a: 1, b: 'two', c: true }
    const branded = Idion.create({ id: 'Triple', value: input })

    expect(branded.a).toBe(1)
    expect(branded.b).toBe('two')
    expect(branded.c).toBe(true)
  })

  test('can merge idions between each other', () => {
    const base = Idion.create({ id: 'Base', value: { x: 0 } })
    const merged = Idion.create({
      id: 'Merged',
      value: Object.assign({ y: 0 }, base),
    })

    expect(merged.x).toBe(0)
    expect(merged.y).toBe(0)
    expect(merged[Idion.identifier]).toBe(true)
    expect(merged.Base).toBe(true)
    expect(merged.Merged).toBe(true)

    expect(Idion.is(base, 'Base')).toBe(true)
    expect(Idion.is(merged, 'Base')).toBe(true)
    expect(Idion.is(base, 'Merged')).toBe(false)
    expect(Idion.is(merged, 'Merged')).toBe(true)
  })
})

describe('Idion.is', () => {
  test('returns true for a branded value without id check', () => {
    const branded = Idion.create({ id: 'Point', value: { x: 0 } })

    expect(Idion.is(branded)).toBe(true)
  })

  test('returns true when id matches', () => {
    const branded = Idion.create({ id: 'Point', value: { x: 0 } })

    expect(Idion.is(branded, 'Point')).toBe(true)
  })

  test('returns false when id does not match', () => {
    const branded = Idion.create({ id: 'Point', value: { x: 0 } })

    expect(Idion.is(branded, 'Vector')).toBe(false)
  })

  test('returns false for a plain unbranded object', () => {
    const plain = { x: 0 }

    expect(Idion.is(plain)).toBe(false)
  })

  test('works with symbol brands', () => {
    const sym = Symbol('Token')
    const branded = Idion.create({ id: sym, value: { raw: 'abc' } })

    expect(Idion.is(branded, sym)).toBe(true)
    expect(Idion.is(branded, Symbol('Token'))).toBe(false)
  })
})

describe('Idion.identifier', () => {
  test('is a global symbol', () => {
    expect(typeof Idion.identifier).toBe('symbol')

    // @ts-expect-error - TypeScript should recognize this as a global symbol
    expect(Idion.identifier).toBe(Symbol.for('@herodot-app/idion/identifier'))
  })
})
