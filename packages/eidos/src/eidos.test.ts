import { describe, expect, test } from 'bun:test'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { z } from 'zod'
import { Eidos } from './eidos'
import { Zygon } from '@herodot-app/zygon'
import { Ptoma } from '@herodot-app/ptoma'

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

  describe('horismos', () => {
    test('creates an Eidos with the given string name', () => {
      const schema = successSchema(42)
      const eidos = Eidos.horismos({ name: 'MyEntity', schema })

      expect(eidos.name).toBe('MyEntity')
    })

    test('creates an Eidos with a symbol name', () => {
      const sym = Symbol('MySymbol')
      const eidos = Eidos.horismos({ name: sym, schema: successSchema(null) })

      expect(eidos.name).toBe(sym)
    })

    test('stores the schema on the Eidos', () => {
      const schema = successSchema('hello')
      const eidos = Eidos.horismos({ name: 'Test', schema })

      expect(eidos.schema).toBe(schema)
    })
  })

  describe('is', () => {
    test('returns true for a value created with horismos', () => {
      const eidos = Eidos.horismos({ name: 'Foo', schema: successSchema(1) })

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

  describe('genesis', () => {
    test('returns a Dexion when schema validation succeeds', () => {
      const eidos = Eidos.horismos({
        name: 'User',
        schema: successSchema({ id: 1 }),
      })
      const result = Eidos.genesis(eidos, { id: 1 })

      expect(Zygon.isDexion(result)).toBe(true)
    })

    test('the Dexion carries the validated output value', () => {
      const output = { id: 42, name: 'Alice' }
      const eidos = Eidos.horismos({
        name: 'User',
        schema: successSchema(output),
      })
      const result = Eidos.genesis(eidos, {})

      expect(Zygon.unwrap(result, null)).toBe(output)
    })

    test('returns a Skaion when schema validation fails', () => {
      const eidos = Eidos.horismos({
        name: 'User',
        schema: failSchema([{ message: 'required' }]),
      })
      const result = Eidos.genesis(eidos, null)

      expect(Zygon.isSkaion(result)).toBe(true)
    })

    test('the Skaion is a GenesisPtoma with the validation issues', () => {
      const issues: StandardSchemaV1.Issue[] = [
        { message: 'field is required' },
        { message: 'must be a string' },
      ]
      const eidos = Eidos.horismos({ name: 'Post', schema: failSchema(issues) })
      const result = Eidos.genesis(eidos, undefined)

      const error = Zygon.unwrapLeft(result, null)

      expect(Ptoma.is(error, Eidos.genesisPtomaIdentifier)).toBe(true)
      expect((error as Eidos.GenesisPtoma).payload?.issues).toEqual(issues)
    })

    test('returns a Zygon', () => {
      const eidos = Eidos.horismos({
        name: 'Thing',
        schema: successSchema('ok'),
      })
      const result = Eidos.genesis(eidos, 'ok')

      expect(Zygon.is(result)).toBe(true)
    })
  })

  describe('with Zod schema', () => {
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
    })

    test('horismos accepts a Zod schema', () => {
      const eidos = Eidos.horismos({ name: 'User', schema: userSchema })

      expect(eidos.name).toBe('User')
      expect(eidos.schema).toBe(userSchema)
    })

    test('genesis returns a Dexion for valid input', () => {
      const eidos = Eidos.horismos({ name: 'User', schema: userSchema })
      const result = Eidos.genesis(eidos, { id: 1, name: 'Alice' })

      expect(Zygon.isDexion(result)).toBe(true)
    })

    test('genesis unwraps to the parsed output', () => {
      const eidos = Eidos.horismos({ name: 'User', schema: userSchema })
      const result = Eidos.genesis(eidos, { id: 7, name: 'Bob' })

      expect(Zygon.unwrap(result, null)).toEqual({ id: 7, name: 'Bob' })
    })

    test('genesis strips unknown keys via Zod parsing', () => {
      const eidos = Eidos.horismos({ name: 'User', schema: userSchema })
      const result = Eidos.genesis(eidos, { id: 3, name: 'Carol', extra: true })

      expect(Zygon.unwrap(result, null)).toEqual({ id: 3, name: 'Carol' })
    })

    test('genesis returns a Skaion for invalid input', () => {
      const eidos = Eidos.horismos({ name: 'User', schema: userSchema })
      const result = Eidos.genesis(eidos, { id: 'not-a-number', name: 'Dave' })

      expect(Zygon.isSkaion(result)).toBe(true)
    })

    test('genesis Skaion is a GenesisPtoma with Zod issues', () => {
      const eidos = Eidos.horismos({ name: 'User', schema: userSchema })
      const result = Eidos.genesis(eidos, { id: 'bad', name: 42 })

      const error = Zygon.unwrapLeft(result, null)

      expect(Ptoma.is(error, Eidos.genesisPtomaIdentifier)).toBe(true)
      const issues = (error as Eidos.GenesisPtoma).payload?.issues ?? []
      expect(issues.length).toBeGreaterThan(0)
      expect(
        issues.every(
          (i: StandardSchemaV1.Issue) => typeof i.message === 'string',
        ),
      ).toBe(true)
    })

    test('genesis returns a Skaion when required fields are missing', () => {
      const eidos = Eidos.horismos({ name: 'User', schema: userSchema })
      const result = Eidos.genesis(eidos, {})

      expect(Zygon.isSkaion(result)).toBe(true)
    })
  })

  describe('GenesisPtoma', () => {
    test('genesisPtomaIdentifier is the expected string', () => {
      expect(Eidos.genesisPtomaIdentifier).toBe(
        '@herodot-app/eidos/genesis-ptoma',
      )
    })

    test('GenesisPtoma instances are branded Ptoma errors', () => {
      const err = new Eidos.GenesisPtoma(Eidos.genesisPtomaIdentifier, {
        issues: [{ message: 'bad input' }],
      })

      expect(Ptoma.is(err)).toBe(true)
      expect(Ptoma.is(err, Eidos.genesisPtomaIdentifier)).toBe(true)
    })

    test('GenesisPtoma carries the issues payload', () => {
      const issues: StandardSchemaV1.Issue[] = [{ message: 'too short' }]
      const err = new Eidos.GenesisPtoma(Eidos.genesisPtomaIdentifier, {
        issues,
      })

      expect(err.payload?.issues).toEqual(issues)
    })
  })
})
