import { describe, expect, test } from 'bun:test'
import { Zygon } from './zygon'

describe('Zygon', () => {
  describe('dexion', () => {
    test('creates a Zygon with a right value', () => {
      const result = Zygon.dexion(42)

      expect(result.right).toBe(42)
      expect(result.kind).toBe('right')
    })

    test('works with string values', () => {
      const result = Zygon.dexion('hello')

      expect(result.right).toBe('hello')
    })

    test('works with object values', () => {
      const obj = { name: 'test' }
      const result = Zygon.dexion(obj)

      expect(result.right).toBe(obj)
    })

    test('works with null and undefined', () => {
      expect(Zygon.dexion(null).right).toBeNull()
      expect(Zygon.dexion(undefined).right).toBeUndefined()
    })
  })

  describe('skaion', () => {
    test('creates a Zygon with a left value', () => {
      const result = Zygon.skaion('error')

      expect(result.left).toBe('error')
      expect(result.kind).toBe('left')
    })

    test('works with Error instances', () => {
      const err = new Error('something failed')
      const { left } = Zygon.skaion(err)

      expect(left).toBe(err)
    })

    test('works with object values', () => {
      const obj = { code: 404 }
      const { left } = Zygon.skaion(obj)

      expect(left).toBe(obj)
    })
  })

  describe('is', () => {
    test('returns true for a dexion Zygon', () => {
      expect(Zygon.is(Zygon.dexion(1))).toBe(true)
    })

    test('returns true for a skaion Zygon', () => {
      expect(Zygon.is(Zygon.skaion('err'))).toBe(true)
    })

    test('returns false for plain objects', () => {
      expect(Zygon.is({})).toBe(false)
      expect(Zygon.is({ right: 1, kind: 'right' })).toBe(false)
    })

    test('returns false for primitives', () => {
      expect(Zygon.is(42)).toBe(false)
      expect(Zygon.is('string')).toBe(false)
    })
  })

  describe('isDexion', () => {
    test('returns true for a dexion', () => {
      expect(Zygon.isDexion(Zygon.dexion('ok'))).toBe(true)
    })

    test('returns false for a skaion', () => {
      expect(Zygon.isDexion(Zygon.skaion('err'))).toBe(false)
    })

    test('returns false for non-Zygon values', () => {
      expect(Zygon.isDexion({})).toBe(false)
      expect(Zygon.isDexion(42)).toBe(false)
    })
  })

  describe('isSkaion', () => {
    test('returns true for a skaion', () => {
      expect(Zygon.isSkaion(Zygon.skaion('err'))).toBe(true)
    })

    test('returns false for a dexion', () => {
      expect(Zygon.isSkaion(Zygon.dexion('ok'))).toBe(false)
    })

    test('returns false for non-Zygon values', () => {
      expect(Zygon.isSkaion({})).toBe(false)
      expect(Zygon.isSkaion(42)).toBe(false)
    })
  })

  describe('unwrapRight / unwrap', () => {
    test('returns the right value for a dexion', () => {
      const z = Zygon.dexion(99)

      expect(Zygon.unwrapRight(z, 0)).toBe(99)
    })

    test('returns the default when given a skaion', () => {
      const z = Zygon.skaion('err')

      expect(Zygon.unwrapRight(z, -1)).toBe(-1)
    })

    test('unwrap is an alias for unwrapRight', () => {
      expect(Zygon.unwrap).toBe(Zygon.unwrapRight)
    })
  })

  describe('unwrapLeft', () => {
    test('returns the left value for a skaion', () => {
      const z = Zygon.skaion('error-code')

      expect(Zygon.unwrapLeft(z, 'default')).toBe('error-code')
    })

    test('returns the default when given a dexion', () => {
      const z = Zygon.dexion(42)

      expect(Zygon.unwrapLeft(z, 'fallback')).toBe('fallback')
    })
  })

  describe('wrap', () => {
    test('returns a dexion when the function succeeds', () => {
      const add = Zygon.wrap((a: number, b: number) => a + b)
      const result = add(2, 3)

      expect(Zygon.isDexion(result)).toBe(true)
      expect(Zygon.unwrap(result, 0)).toBe(5)
    })

    test('returns a skaion when the function throws', () => {
      const boom = Zygon.wrap(() => {
        throw new Error('boom')
      })
      const result = boom()

      expect(Zygon.isSkaion(result)).toBe(true)
      expect(Zygon.unwrapLeft(result, null)).toBeInstanceOf(Error)
    })

    test('uses wrapRight to transform the thrown error', () => {
      const boom = Zygon.wrap(
        () => {
          throw new Error('raw error')
        },
        (err) => (err as Error).message,
      )
      const result = boom()

      expect(Zygon.unwrapLeft(result, '')).toBe('raw error')
    })

    test('preserves function arguments', () => {
      const greet = Zygon.wrap((name: string) => `Hello, ${name}!`)
      const result = greet('World')

      expect(Zygon.unwrap(result, '')).toBe('Hello, World!')
    })
  })

  describe('asyncWrap', () => {
    test('returns a dexion when the async function resolves', async () => {
      const fetchValue = Zygon.asyncWrap(async (x: number) => x * 2)
      const result = await fetchValue(21)

      expect(Zygon.isDexion(result)).toBe(true)
      expect(Zygon.unwrap(result, 0)).toBe(42)
    })

    test('returns a skaion when the async function rejects', async () => {
      const boom = Zygon.asyncWrap(async () => {
        throw new Error('async boom')
      })
      const result = await boom()

      expect(Zygon.isSkaion(result)).toBe(true)
      expect(Zygon.unwrapLeft(result, null)).toBeInstanceOf(Error)
    })

    test('uses wrapRight to transform the rejection', async () => {
      const boom = Zygon.asyncWrap(
        async () => {
          throw new Error('async error')
        },
        (err) => ({ message: (err as Error).message }),
      )
      const result = await boom()

      expect(Zygon.unwrapLeft(result, { message: '' })).toEqual({
        message: 'async error',
      })
    })

    test('preserves function arguments', async () => {
      const concat = Zygon.asyncWrap(async (a: string, b: string) => a + b)
      const result = await concat('foo', 'bar')

      expect(Zygon.unwrap(result, '')).toBe('foobar')
    })
  })

  describe('identifiers', () => {
    test('identifier is a well-known symbol', () => {
      expect(typeof Zygon.identifier).toBe('symbol')

      expect(Zygon.identifier).toBe(
        // biome-ignore lint: we want to assert the exact symbol value here
        Symbol.for('@herodot-app/zygon/zygon') as any,
      )
    })

    test('dexionIdentifier is a well-known symbol', () => {
      expect(typeof Zygon.dexionIdentifier).toBe('symbol')

      expect(Zygon.dexionIdentifier).toBe(
        // biome-ignore lint: we want to assert the exact symbol value here
        Symbol.for('@herodot-app/zygon/dexion') as any,
      )
    })

    test('skaionIdentifier is a well-known symbol', () => {
      expect(typeof Zygon.skaionIdentifier).toBe('symbol')

      expect(Zygon.skaionIdentifier).toBe(
        // biome-ignore lint: we want to assert the exact symbol value here
        Symbol.for('@herodot-app/zygon/skaion') as any,
      )
    })
  })
})
