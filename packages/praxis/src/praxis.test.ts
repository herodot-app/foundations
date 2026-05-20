// biome-ignore-all lint/suspicious/noExplicitAny: Praxis is using any in order to enhanced readability
// biome-ignore-all lint/style/noNonNullAssertion: it's okay here
import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import { Cerebrum } from './cerebrum'
import type { Experience } from './experience'
import type { Faculty } from './faculty'
import { Pragma } from './pragma'
import { Praxis } from './praxis'

describe('Praxis', () => {
  describe('Praxis.create', () => {
    it('creates a Praxis with default pipeline', () => {
      const praxis = Praxis.create()

      expect(Idion.is(praxis, Praxis.identifier)).toBe(true)
      expect(praxis.pipeline).toBeDefined()
      expect(typeof praxis.run).toBe('function')
    })

    it('creates a Praxis with custom pipeline', () => {
      const customPragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! * 2
        },
      )

      const praxis = Praxis.create({
        pipeline: [customPragma],
      })

      expect(praxis.pipeline).toHaveLength(1)
    })

    it('creates a Praxis with custom cerebrum', () => {
      const cerebrum = Cerebrum.create()
      const praxis = Praxis.create({ cerebrum })

      expect(praxis.cerebrum).toBe(cerebrum)
    })
  })

  describe('Praxis.run', () => {
    it('executes run with single pragma pipeline', async () => {
      const doublePragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! * 2
        },
      )

      const praxis = Praxis.create({
        pipeline: [doublePragma] as const,
      })

      const result = await praxis.run(21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('executes run with multiple pragma pipeline', async () => {
      const multiplyByTwo = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! * 2
        },
      )
      const addTen = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! + 10
        },
      )

      const praxis = Praxis.create({
        pipeline: [multiplyByTwo, addTen] as const,
      })

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('returns right value when pragma throws', async () => {
      const failingPragma = Pragma.create((): unknown => {
        throw new Error('Pragma failed')
      })

      const praxis = Praxis.create({
        pipeline: [failingPragma] as const,
      })

      const result = await praxis.run(42)

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('returns right value when pragma returns Zygon.right', async () => {
      const errorPragma = Pragma.create(() => {
        return Zygon.right(new Error('Something went wrong'))
      })

      const praxis = Praxis.create({
        pipeline: [errorPragma] as const,
      })

      const result = await praxis.run(42)

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('works with no input (defaults to void)', async () => {
      const praxis = Praxis.create()

      const result = await praxis.run()

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(undefined)
    })

    it('works with async pragmas', async () => {
      const asyncPragma = Pragma.create(
        async (exp: Experience<number, any, Faculty.Any>) => {
          await new Promise(resolve => setTimeout(resolve, 50))
          return exp.value.left! * 2
        },
      )

      const praxis = Praxis.create({
        pipeline: [asyncPragma] as const,
      })

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('registers synapse with cerebrum', async () => {
      const cerebrum = Cerebrum.create()
      const testPragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! * 2
        },
      )

      const praxis = Praxis.create({
        cerebrum,
        pipeline: [testPragma] as const,
      })

      const promise = praxis.run(10).then(() => {})

      expect(Cerebrum.size(cerebrum)).toBe(1)

      await promise
    })

    it('works with string input', async () => {
      const transformPragma = Pragma.create(
        (exp: Experience<string, any, Faculty.Any>) => {
          return exp.value.left!.toUpperCase()
        },
      )

      const praxis = Praxis.create({
        pipeline: [transformPragma] as const,
      })

      const result = await praxis.run('hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('HELLO')
    })

    it('works with object input', async () => {
      const extractPragma = Pragma.create(
        (exp: Experience<{ name: string }, any, Faculty.Any>) => {
          return exp.value.left!.name
        },
      )

      const praxis = Praxis.create({
        pipeline: [extractPragma] as const,
      })

      const result = await praxis.run({ name: 'Alice' })

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('Alice')
    })
  })

  describe('Praxis.of', () => {
    it('creates a Praxis with identity pipeline', () => {
      const praxis = Praxis.of<number>()

      expect(Idion.is(praxis, Praxis.identifier)).toBe(true)
      expect(praxis.pipeline).toHaveLength(1)
    })

    it('returns the input value unchanged', async () => {
      const praxis = Praxis.of<number>()
      const result = await praxis.run(42)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('works with string input', async () => {
      const praxis = Praxis.of<string>()
      const result = await praxis.run('hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('hello')
    })

    it('works with object input', async () => {
      const praxis = Praxis.of<{ name: string }>()
      const result = await praxis.run({ name: 'Alice' })

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toEqual({ name: 'Alice' })
    })

    it('works with void input', async () => {
      const praxis = Praxis.of<void>()
      const result = await praxis.run()

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBeUndefined()
    })
  })

  describe('Praxis.do', () => {
    it('adds a new pragma to the pipeline', async () => {
      const praxis = Praxis.create({
        pipeline: [
          Pragma.create(
            (exp: Experience<number, any, Faculty.Never>) =>
              exp.value.left! * 2,
          ),
        ] as const,
      })

      const newPraxis = praxis.do(exp => {
        return exp.value.left! + 10
      })

      const result = await newPraxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('chains multiple do calls', async () => {
      const praxis = Praxis.create({
        pipeline: [
          Pragma.create(
            (exp: Experience<number, any, Faculty.Any>) => exp.value.left! * 2,
          ),
        ] as const,
      })

      const newPraxis = praxis
        .do(exp => exp.value.left! + 10)
        .do(exp => exp.value.left! * 3)

      const result = await newPraxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(60)
    })

    it('preserves cerebrum across do operations', async () => {
      const cerebrum = Cerebrum.create()
      const praxis = Praxis.create({
        cerebrum,
        pipeline: [
          Pragma.create(
            (exp: Experience<number, any, Faculty.Any>) => exp.value.left! * 2,
          ),
        ] as const,
      })

      const newPraxis = praxis.do(exp => exp.value.left! + 10)

      expect(newPraxis.cerebrum).toBe(cerebrum)
    })

    it('works with async functions in do', async () => {
      const praxis = Praxis.create({
        pipeline: [
          Pragma.create(
            (exp: Experience<number, any, Faculty.Any>) => exp.value.left! * 2,
          ),
        ] as const,
      })

      const newPraxis = praxis.do(async exp => {
        await new Promise(resolve => setTimeout(resolve, 50))

        return exp.value.left! + 10
      })

      const result = await newPraxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('works with string transformations', async () => {
      const praxis = Praxis.create({
        pipeline: [
          Pragma.create((exp: Experience<string, any, Faculty.Any>) =>
            exp.value.left!.toUpperCase(),
          ),
        ] as const,
      })

      const newPraxis = praxis.do(exp => exp.value.left! + '!')

      const result = await newPraxis.run('hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('HELLO!')
    })

    it('handles do function that throws', async () => {
      const praxis = Praxis.create({
        pipeline: [
          Pragma.create(
            (exp: Experience<number, any, Faculty.Any>) => exp.value.left! * 2,
          ),
        ] as const,
      })

      const newPraxis = praxis.do((): unknown => {
        throw new Error('do failed')
      })

      const result = await newPraxis.run(5)

      expect(Zygon.isRight(result)).toBe(true)
    })
  })

  describe('Praxis.Identifier', () => {
    it('has correct identifier symbol', () => {
      expect(Praxis.identifier.description).toBe('@herodot-app/praxis')
    })
  })
})
