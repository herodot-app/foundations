import { describe, expect, test } from 'bun:test'
import { Zygon } from './zygon'

type Expect<T extends true> = T

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false

describe('Zygon', () => {
  describe('left', () => {
    test('creates a Zygon with a left value', () => {
      const result = Zygon.left(42)

      expect(result.left).toBe(42)
      expect(result.kind).toBe('left')
    })

    test('works with string values', () => {
      const result = Zygon.left('hello')

      expect(result.left).toBe('hello')
    })

    test('works with object values', () => {
      const obj = { name: 'test' }
      const result = Zygon.left(obj)

      expect(result.left).toBe(obj)
    })

    test('works with null and undefined', () => {
      expect(Zygon.left(null).left).toBeNull()
      expect(Zygon.left(undefined).left).toBeUndefined()
    })
  })

  describe('right', () => {
    test('creates a Zygon with a right value', () => {
      const result = Zygon.right('error')

      expect(result.right).toBe('error')
      expect(result.kind).toBe('right')
    })

    test('works with Error instances', () => {
      const err = new Error('something failed')
      const { right } = Zygon.right(err)

      expect(right).toBe(err)
    })

    test('works with object values', () => {
      const obj = { code: 404 }
      const { right } = Zygon.right(obj)

      expect(right).toBe(obj)
    })
  })

  describe('is', () => {
    test('returns true for a left Zygon', () => {
      expect(Zygon.is(Zygon.left(1))).toBe(true)
    })

    test('returns true for a right Zygon', () => {
      expect(Zygon.is(Zygon.right('err'))).toBe(true)
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

  describe('isLeft', () => {
    test('returns true for a left Zygon', () => {
      expect(Zygon.isLeft(Zygon.left('ok'))).toBe(true)
    })

    test('returns false for a right Zygon', () => {
      expect(Zygon.isLeft(Zygon.right('err'))).toBe(false)
    })

    test('returns false for non-Zygon values', () => {
      expect(Zygon.isLeft({})).toBe(false)
      expect(Zygon.isLeft(42)).toBe(false)
    })
  })

  describe('isRight', () => {
    test('returns true for a right Zygon', () => {
      expect(Zygon.isRight(Zygon.right('err'))).toBe(true)
    })

    test('returns false for a left Zygon', () => {
      expect(Zygon.isRight(Zygon.left('ok'))).toBe(false)
    })

    test('returns false for non-Zygon values', () => {
      expect(Zygon.isRight({})).toBe(false)
      expect(Zygon.isRight(42)).toBe(false)
    })
  })

  describe('unwrapLeft / unwrap', () => {
    test('returns the left value for a left Zygon', () => {
      const z = Zygon.left(99)

      expect(Zygon.unwrapLeft(z, 0)).toBe(99)
    })

    test('returns the default when given a right Zygon', () => {
      const z = Zygon.right('err')

      expect(Zygon.unwrapLeft(z, -1)).toBe(-1)
    })

    test('unwrap is an alias for unwrapLeft', () => {
      expect(Zygon.unwrap).toBe(Zygon.unwrapLeft)
    })
  })

  describe('unwrapRight', () => {
    test('returns the right value for a right Zygon', () => {
      const z = Zygon.right('error-code')

      expect(Zygon.unwrapRight(z, 'default')).toBe('error-code')
    })

    test('returns the default when given a left Zygon', () => {
      const z = Zygon.left(42)

      expect(Zygon.unwrapRight(z, 'fallback')).toBe('fallback')
    })
  })

  describe('wrap', () => {
    test('returns a left Zygon when the function succeeds', () => {
      const add = Zygon.wrap((a: number, b: number) => a + b)
      const result = add(2, 3)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(Zygon.unwrap(result, 0)).toBe(5)
    })

    test('returns a right Zygon when the function throws', () => {
      const boom = Zygon.wrap(() => {
        throw new Error('boom')
      })
      const result = boom()

      expect(Zygon.isRight(result)).toBe(true)
      expect(Zygon.unwrapRight(result, null)).toBeInstanceOf(Error)
    })

    test('uses wrapRight to transform the thrown error', () => {
      const boom = Zygon.wrap(
        () => {
          throw new Error('raw error')
        },
        (err) => (err as Error).message,
      )
      const result = boom()

      expect(Zygon.unwrapRight(result, '')).toBe('raw error')
    })

    test('preserves function arguments', () => {
      const greet = Zygon.wrap((name: string) => `Hello, ${name}!`)
      const result = greet('World')

      expect(Zygon.unwrap(result, '')).toBe('Hello, World!')
    })
  })

  describe('asyncWrap', () => {
    test('returns a left Zygon when the async function resolves', async () => {
      const fetchValue = Zygon.asyncWrap(async (x: number) => x * 2)
      const result = await fetchValue(21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(Zygon.unwrap(result, 0)).toBe(42)
    })

    test('returns a right Zygon when the async function rejects', async () => {
      const boom = Zygon.asyncWrap(async () => {
        throw new Error('async boom')
      })
      const result = await boom()

      expect(Zygon.isRight(result)).toBe(true)
      expect(Zygon.unwrapRight(result, null)).toBeInstanceOf(Error)
    })

    test('uses wrapRight to transform the rejection', async () => {
      const boom = Zygon.asyncWrap(
        async () => {
          throw new Error('async error')
        },
        (err) => ({ message: (err as Error).message }),
      )
      const result = await boom()

      expect(Zygon.unwrapRight(result, { message: '' })).toEqual({
        message: 'async error',
      })
    })

    test('preserves function arguments', async () => {
      const concat = Zygon.asyncWrap(async (a: string, b: string) => a + b)
      const result = await concat('foo', 'bar')

      expect(Zygon.unwrap(result, '')).toBe('foobar')
    })
  })

  describe('InferLeft', () => {
    test('extracts the left type from a Zygon', () => {
      type Z = Zygon<number, Error>
      type Result = Expect<Equal<Zygon.InferLeft<Z>, number>>

      true satisfies Result
    })

    test('resolves to never for a Right-only Zygon', () => {
      type Z = Zygon.Right<string>
      type Result = Expect<Equal<Zygon.InferLeft<Z>, never>>

      true satisfies Result
    })

    test('extracts the left type from a Left-only Zygon', () => {
      type Z = Zygon.Left<boolean>
      type Result = Expect<Equal<Zygon.InferLeft<Z>, boolean>>

      true satisfies Result
    })
  })

  describe('InferRight', () => {
    test('extracts the right type from a Zygon', () => {
      type Z = Zygon<number, Error>
      type Result = Expect<Equal<Zygon.InferRight<Z>, Error>>

      true satisfies Result
    })

    test('resolves to never for a Left-only Zygon', () => {
      type Z = Zygon.Left<string>
      type Result = Expect<Equal<Zygon.InferRight<Z>, never>>

      true satisfies Result
    })

    test('extracts the right type from a Right-only Zygon', () => {
      type Z = Zygon.Right<boolean>
      type Result = Expect<Equal<Zygon.InferRight<Z>, boolean>>

      true satisfies Result
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

    test('leftIdentifier is a well-known symbol', () => {
      expect(typeof Zygon.leftIdentifier).toBe('symbol')

      expect(Zygon.leftIdentifier).toBe(
        // biome-ignore lint: we want to assert the exact symbol value here
        Symbol.for('@herodot-app/zygon/left') as any,
      )
    })

    test('rightIdentifier is a well-known symbol', () => {
      expect(typeof Zygon.rightIdentifier).toBe('symbol')

      expect(Zygon.rightIdentifier).toBe(
        // biome-ignore lint: we want to assert the exact symbol value here
        Symbol.for('@herodot-app/zygon/right') as any,
      )
    })
  })

  describe('LiftLeft type', () => {
    test('resolves a plain type to itself', () => {
      type Result = Expect<Equal<Zygon.LiftLeft<number>, number>>

      true satisfies Result
    })

    test('unwraps a single level of nesting', () => {
      type Z = Zygon<string, Error>
      type Result = Expect<Equal<Zygon.LiftLeft<Z>, string>>

      true satisfies Result
    })

    test('recursively unwraps multiple levels of nesting', () => {
      type Z = Zygon<Zygon<Zygon<number, Error>, Error>, Error>
      type Result = Expect<Equal<Zygon.LiftLeft<Z>, number>>

      true satisfies Result
    })

    test('handles mixed nesting with different left types', () => {
      type Z = Zygon<Zygon<{ id: string }, Error>, Error>
      type Result = Expect<Equal<Zygon.LiftLeft<Z>, { id: string }>>

      true satisfies Result
    })
  })

  describe('LiftRight type', () => {
    test('resolves a plain type to itself', () => {
      type Result = Expect<Equal<Zygon.LiftRight<string>, string>>

      true satisfies Result
    })

    test('unwraps a single level of nesting', () => {
      type Z = Zygon<number, TypeError>
      type Result = Expect<Equal<Zygon.LiftRight<Z>, TypeError>>

      true satisfies Result
    })

    test('recursively unwraps multiple levels of nesting', () => {
      type Z = Zygon<number, Zygon<number, Zygon<number, SyntaxError>>>
      type Result = Expect<Equal<Zygon.LiftRight<Z>, SyntaxError>>

      true satisfies Result
    })
  })

  describe('unwrapLiftLeft / unwrapLift', () => {
    test('unwraps a single left Zygon', () => {
      const z = Zygon.left('hello')

      expect(Zygon.unwrapLiftLeft(z, '')).toBe('hello')
    })

    test('unwraps two levels of nested left Zygons', () => {
      const z = Zygon.left(Zygon.left(99))

      expect(Zygon.unwrapLiftLeft(z, 0)).toBe(99)
    })

    test('unwraps three levels of nested left Zygons', () => {
      const z = Zygon.left(Zygon.left(Zygon.left(42)))

      expect(Zygon.unwrapLiftLeft(z, 0)).toBe(42)
    })

    test('returns default when outermost Zygon is a Right', () => {
      const z = Zygon.right(new Error('outer'))

      expect(Zygon.unwrapLiftLeft(z, 0)).toBe(0)
    })

    test('returns default when innermost Zygon is a Right', () => {
      const z = Zygon.left(Zygon.right(new Error('inner')))

      expect(Zygon.unwrapLiftLeft(z, 0)).toBe(0)
    })

    test('uses the correct default type for nested Zygons', () => {
      const z = Zygon.left(Zygon.left(Zygon.left('deep')))

      expect(Zygon.unwrapLiftLeft(z, 'fallback')).toBe('deep')
    })

    test('unwrapLift is an alias for unwrapLiftLeft', () => {
      expect(Zygon.unwrapLift).toBe(Zygon.unwrapLiftLeft)
    })
  })

  describe('unwrapLiftRight', () => {
    test('unwraps a single right Zygon', () => {
      const z = Zygon.right('error')
      expect(Zygon.unwrapLiftRight(z, '')).toBe('error')
    })

    test('unwraps two levels of nested right Zygons', () => {
      const z = Zygon.right(Zygon.right('deep error'))

      expect(Zygon.unwrapLiftRight(z, '')).toBe('deep error')
    })

    test('unwraps three levels of nested right Zygons', () => {
      const z = Zygon.right(Zygon.right(Zygon.right('triple error')))

      expect(Zygon.unwrapLiftRight(z, '')).toBe('triple error')
    })

    test('returns default when outermost Zygon is a Left', () => {
      const z = Zygon.left(42)
      expect(Zygon.unwrapLiftRight(z, 'fallback')).toBe('fallback')
    })

    test('returns default when innermost Zygon is a Left', () => {
      const z = Zygon.right(Zygon.left(99))

      expect(Zygon.unwrapLiftRight(z, '')).toBe('')
    })

    test('uses the correct default type for nested Zygons', () => {
      const z = Zygon.right(Zygon.right(new Error('nested')))

      const result = Zygon.unwrapLiftRight(z, new Error('default'))

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('nested')
    })
  })

  describe('LiftLeft and LiftRight', () => {
    test('handles never in zygon value in LiftLeft using default', () => {
      type Never = Zygon.LiftLeft<never, string>
      type E = Equal<Never, string>

      true satisfies Expect<E>
    })

    test('handles void in zygon value in LiftLeft not using default', () => {
      type Void = Zygon.LiftLeft<void, string>
      type E = Equal<Void, void>

      true satisfies Expect<E>
    })

    test('handles null and undefined in zygon value in LiftLeft not using default', () => {
      type Null = Zygon.LiftLeft<null, string>
      type Undefined = Zygon.LiftLeft<undefined, string>

      true satisfies Expect<Equal<Null, null>>
      true satisfies Expect<Equal<Undefined, undefined>>
    })

    test('handles Left and never in zygon value in LiftLeft using default', () => {
      type Never = Zygon.LiftLeft<Zygon<never, unknown>, string>

      true satisfies Expect<Equal<Never, string>>
    })

    test('handles Right and zygon value in LiftLeft using default', () => {
      type Number = Zygon.LiftLeft<Zygon.Right<string>, number>

      true satisfies Expect<Equal<Number, number>>
    })

    test('handles unknown and zygon value in LiftLeft not using default', () => {
      type Unknown = Zygon.LiftLeft<unknown, number>

      true satisfies Expect<Equal<Unknown, unknown>>
    })

    test('handles unknown and zygon value in LiftLeft not using default', () => {
      type Unknown = Zygon.LiftLeft<Zygon.Left<unknown>, number>

      true satisfies Expect<Equal<Unknown, unknown>>
    })

    test('handles never in zygon value in LiftRight using default', () => {
      type Never = Zygon.LiftRight<never, string>
      type E = Equal<Never, string>

      true satisfies Expect<E>
    })

    test('handles void in zygon value in LiftRight using default', () => {
      type String = Zygon.LiftRight<void, string>
      type E = Equal<String, string>

      true satisfies Expect<E>
    })

    test('handles null and undefined in zygon value in LiftRight not using default', () => {
      type Null = Zygon.LiftRight<null, string>
      type Undefined = Zygon.LiftRight<undefined, string>

      true satisfies Expect<Equal<Null, null>>
      true satisfies Expect<Equal<Undefined, undefined>>
    })

    test('handles Right and never in zygon value in LiftRight using default', () => {
      type String = Zygon.LiftRight<Zygon<string, never>, string>

      true satisfies Expect<Equal<String, string>>
    })

    test('handles Left and zygon value in LiftRight using default', () => {
      type Number = Zygon.LiftRight<Zygon.Left<string>, number>

      true satisfies Expect<Equal<Number, number>>
    })

    test('handles unknown and zygon value in LiftRight using default', () => {
      type Number = Zygon.LiftRight<unknown, number>

      true satisfies Expect<Equal<Number, number>>
    })

    test('handles unknown and zygon value in LiftRight using default', () => {
      type Number = Zygon.LiftRight<Zygon.Right<unknown>, number>

      true satisfies Expect<Equal<Number, number>>
    })
  })

  describe('Merge', () => {
    test('it merges two non zygon value', () => {
      type Str = Zygon.Merge<number, string>

      true satisfies Expect<Equal<Str, string>>
    })

    test('it merges one Zygon with a scalar', () => {
      type Z = Zygon.Merge<Zygon.Left<number>, string>
      type Z2 = Zygon.Merge<Zygon.Left<number>, string, Error>

      true satisfies Expect<Equal<Z, Zygon<string, unknown>>>
      true satisfies Expect<Equal<Z2, Zygon<string, Error>>>
    })

    test('it merges two zygon', () => {
      type R = Zygon.Merge<Zygon<number, string>, Zygon<string, Error>>

      true satisfies Expect<Equal<R, Zygon<string, string | Error>>>
    })
  })
})
