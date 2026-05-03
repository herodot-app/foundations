import { describe, expect, test } from 'bun:test'
import { Ptoma } from '@herodot-app/ptoma'
import { Zygon } from '@herodot-app/zygon'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { z } from 'zod'
import { Eidos } from './eidos'

type Expect<T extends true> = T

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false

// Minimal StandardSchemaV1-compatible schema helpers
function successSchema<T>(output: T): StandardSchemaV1<unknown, T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate: () => ({ value: output }),
    },
  }
}

function failSchema(
  issues: StandardSchemaV1.Issue[],
): StandardSchemaV1<unknown, never> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate: () => ({ issues }),
    },
  }
}

describe('Eidos', () => {
  describe('identifier', () => {
    test('is a well-known symbol', () => {
      expect(typeof Eidos.identifier).toBe('symbol')
      expect(Eidos.identifier).toBe(
        // biome-ignore lint: asserting exact symbol value
        Symbol.for('@herodot-app/eidos') as any,
      )
    })
  })

  describe('define', () => {
    test('creates an Eidos with the given string name', () => {
      const schema = successSchema(42)
      const eidos = Eidos.define({ name: 'MyEntity', schema })

      expect(eidos.name).toBe('MyEntity')
    })

    test('creates an Eidos with a symbol name', () => {
      const sym = Symbol('MySymbol')
      const eidos = Eidos.define({ name: sym, schema: successSchema(null) })

      expect(eidos.name).toBe(sym)
    })

    test('stores the schema on the Eidos', () => {
      const schema = successSchema('hello')
      const eidos = Eidos.define({ name: 'Test', schema })

      expect(eidos.schema).toBe(schema)
    })
  })

  describe('is', () => {
    test('returns true for a value created with horismos', () => {
      const eidos = Eidos.define({ name: 'Foo', schema: successSchema(1) })

      expect(Eidos.is(eidos)).toBe(true)
    })

    test('returns false for plain objects', () => {
      expect(Eidos.is({})).toBe(false)
      expect(Eidos.is({ name: 'Foo', schema: {} })).toBe(false)
    })

    test('returns false for primitives', () => {
      expect(Eidos.is(42)).toBe(false)
      expect(Eidos.is('string')).toBe(false)
      expect(Eidos.is(null)).toBe(false)
      expect(Eidos.is(undefined)).toBe(false)
    })
  })

  describe('create', () => {
    test('returns a Left when schema validation succeeds', () => {
      const eidos = Eidos.define({
        name: 'User',
        schema: successSchema({ id: 1 }),
      })
      const result = Eidos.create(eidos, { id: 1 })

      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('the Left carries the validated output value', () => {
      const output = { id: 42, name: 'Alice' }
      const eidos = Eidos.define({
        name: 'User',
        schema: successSchema(output),
      })
      const result = Eidos.create(eidos, {})

      expect(Zygon.unwrap(result, null)).toBe(output)
    })

    test('returns a Right when schema validation fails', () => {
      const eidos = Eidos.define({
        name: 'User',
        schema: failSchema([{ message: 'required' }]),
      })
      const result = Eidos.create(eidos, null)

      expect(Zygon.isRight(result)).toBe(true)
    })

    test('the Right is a CreatePtoma with the validation issues', () => {
      const issues: StandardSchemaV1.Issue[] = [
        { message: 'field is required' },
        { message: 'must be a string' },
      ]
      const eidos = Eidos.define({ name: 'Post', schema: failSchema(issues) })
      const result = Eidos.create(eidos, undefined)

      const error = Zygon.unwrapRight(result, null)

      expect(Ptoma.is(error, Eidos.createPtomaIdentifier)).toBe(true)
      expect((error as Eidos.CreatePtoma).payload?.issues).toEqual(issues)
    })

    test('returns a Zygon', () => {
      const eidos = Eidos.define({
        name: 'Thing',
        schema: successSchema('ok'),
      })
      const result = Eidos.create(eidos, 'ok')

      expect(Zygon.is(result)).toBe(true)
    })
  })

  describe('with Zod schema', () => {
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
    })

    test('define accepts a Zod schema', () => {
      const eidos = Eidos.define({ name: 'User', schema: userSchema })

      expect(eidos.name).toBe('User')
      expect(eidos.schema).toBe(userSchema)
    })

    test('create returns a Left for valid input', () => {
      const eidos = Eidos.define({ name: 'User', schema: userSchema })
      const result = Eidos.create(eidos, { id: 1, name: 'Alice' })

      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('create unwraps to the parsed output', () => {
      const eidos = Eidos.define({ name: 'User', schema: userSchema })
      const result = Eidos.create(eidos, { id: 7, name: 'Bob' })

      expect(Zygon.unwrap(result, null)).toEqual({ id: 7, name: 'Bob' })
    })

    test('create strips unknown keys via Zod parsing', () => {
      const eidos = Eidos.define({ name: 'User', schema: userSchema })
      const result = Eidos.create(eidos, { id: 3, name: 'Carol', extra: true })

      expect(Zygon.unwrap(result, null)).toEqual({ id: 3, name: 'Carol' })
    })

    test('create returns a Right for invalid input', () => {
      const eidos = Eidos.define({ name: 'User', schema: userSchema })
      const result = Eidos.create(eidos, { id: 'not-a-number', name: 'Dave' })

      expect(Zygon.isRight(result)).toBe(true)
    })

    test('create Right is a CreatePtoma with Zod issues', () => {
      const eidos = Eidos.define({ name: 'User', schema: userSchema })
      const result = Eidos.create(eidos, { id: 'bad', name: 42 })

      const error = Zygon.unwrapRight(result, null)

      expect(Ptoma.is(error, Eidos.createPtomaIdentifier)).toBe(true)

      const issues = (error as Eidos.CreatePtoma).payload?.issues ?? []

      expect(issues.length).toBeGreaterThan(0)
      expect(
        issues.every(
          (i: StandardSchemaV1.Issue) => typeof i.message === 'string',
        ),
      ).toBe(true)
    })

    test('create returns a Right when required fields are missing', () => {
      const eidos = Eidos.define({ name: 'User', schema: userSchema })
      const result = Eidos.create(eidos, {})

      expect(Zygon.isRight(result)).toBe(true)
    })
  })

  describe('Infer', () => {
    test('extracts the output type from an Eidos', () => {
      const eidos = Eidos.define({
        name: 'User',
        schema: successSchema({ id: 'u1', age: 30 }),
      })

      type Result = Expect<
        Equal<Eidos.Infer<typeof eidos>, { id: string; age: number }>
      >
      true satisfies Result
    })

    test('extracts the transformed output type when schema transforms', () => {
      const timestampSchema = z
        .string()
        .datetime()
        .transform((s) => new Date(s))

      const eidos = Eidos.define({ name: 'Timestamp', schema: timestampSchema })

      type Result = Expect<Equal<Eidos.Infer<typeof eidos>, Date>>

      true satisfies Result
    })
  })

  describe('InferInput', () => {
    test('extracts the input type from an Eidos without transforms', () => {
      const eidos = Eidos.define({
        name: 'Score',
        schema: successSchema(42),
      })

      type Result = Expect<Equal<Eidos.InferInput<typeof eidos>, unknown>>

      true satisfies Result
    })

    test('extracts the raw input type when schema transforms (differs from output)', () => {
      const timestampSchema = z
        .string()
        .datetime()
        .transform((s) => new Date(s))

      const eidos = Eidos.define({ name: 'Timestamp', schema: timestampSchema })

      type InputResult = Expect<Equal<Eidos.InferInput<typeof eidos>, string>>
      type OutputResult = Expect<Equal<Eidos.Infer<typeof eidos>, Date>>

      true satisfies InputResult
      true satisfies OutputResult
    })
  })

  describe('InferName', () => {
    test('extracts a string name literal', () => {
      const eidos = Eidos.define({ name: 'User', schema: successSchema(null) })

      type Result = Expect<Equal<Eidos.InferName<typeof eidos>, 'User'>>

      true satisfies Result
    })

    test('extracts a symbol name', () => {
      const sym = Symbol('InternalEvent')
      const eidos = Eidos.define({ name: sym, schema: successSchema(null) })

      type Result = Expect<Equal<Eidos.InferName<typeof eidos>, typeof sym>>

      true satisfies Result
    })
  })

  describe('CreatePtoma', () => {
    test('createPtomaIdentifier is the expected string', () => {
      expect(Eidos.createPtomaIdentifier).toBe(
        '@herodot-app/eidos/create-ptoma',
      )
    })

    test('GenesisPtoma instances are branded Ptoma errors', () => {
      const err = new Eidos.CreatePtoma(Eidos.createPtomaIdentifier, {
        issues: [{ message: 'bad input' }],
      })

      expect(Ptoma.is(err)).toBe(true)
      expect(Ptoma.is(err, Eidos.createPtomaIdentifier)).toBe(true)
    })

    test('GenesisPtoma carries the issues payload', () => {
      const issues: StandardSchemaV1.Issue[] = [{ message: 'too short' }]
      const err = new Eidos.CreatePtoma(Eidos.createPtomaIdentifier, {
        issues,
      })

      expect(err.payload?.issues).toEqual(issues)
    })
  })
})
