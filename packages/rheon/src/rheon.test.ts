import { describe, expect, test } from 'bun:test'
import { Rheon } from './rheon'

describe('Rheon.create', () => {
  test('creates a Rheon with the given value', () => {
    const rheon = Rheon.create(42)

    expect(Rheon.read(rheon)).toBe(42)
  })

  test('works with string values', () => {
    const rheon = Rheon.create('hello')

    expect(Rheon.read(rheon)).toBe('hello')
  })

  test('works with object values', () => {
    const obj = { x: 1, y: 2 }
    const rheon = Rheon.create(obj)

    expect(Rheon.read(rheon)).toBe(obj)
  })
})

describe('Rheon.read', () => {
  test('returns the stored value', () => {
    const rheon = Rheon.create('test')

    expect(Rheon.read(rheon)).toBe('test')
  })

  test('reflects mutations made via Rheon.write', () => {
    const rheon = Rheon.create(1)

    Rheon.write(rheon, 99)

    expect(Rheon.read(rheon)).toBe(99)
  })
})

describe('Rheon.write', () => {
  test('updates the stored value', () => {
    const rheon = Rheon.create(0)

    Rheon.write(rheon, 42)

    expect(Rheon.read(rheon)).toBe(42)
  })

  test('can write null', () => {
    const rheon = Rheon.create<string | null>('initial')

    Rheon.write(rheon, null)

    expect(Rheon.read(rheon)).toBeNull()
  })
})

describe('Rheon.is', () => {
  test('returns true for a value created by Rheon.create', () => {
    const rheon = Rheon.create(1)

    expect(Rheon.is(rheon)).toBe(true)
  })

  test('returns false for a plain object', () => {
    expect(Rheon.is({ someKey: 'value' })).toBe(false)
  })

  test('returns false for primitives', () => {
    expect(Rheon.is(42)).toBe(false)
    expect(Rheon.is('hello')).toBe(false)
  })
})

describe('Rheon.identifier', () => {
  test('is a global symbol', () => {
    expect(typeof Rheon.identifier).toBe('symbol')

    expect(Rheon.identifier).toBe(
      // biome-ignore lint: we want to ensure this is a global symbol
      Symbol.for('@herodot-app/rheon/identifier') as any,
    )
  })
})

describe('Rheon.valueIdentifier', () => {
  test('is a global symbol', () => {
    expect(typeof Rheon.valueIdentifier).toBe('symbol')
    expect(Rheon.valueIdentifier).toBe(
      // biome-ignore lint: we want to ensure this is a global symbol
      Symbol.for('@herodot-app/rheon/value') as any,
    )
  })
})
