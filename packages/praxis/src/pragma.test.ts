// biome-ignore-all lint/style/noNonNullAssertion: it's okay here
import { describe, expect, it } from 'bun:test'
import { Zygon } from '@herodot-app/zygon'
import { Experience } from './experience'
import { Faculty } from './faculty'
import { Pragma } from './pragma'
import { PraxisFailure } from './praxis-failure'

describe('Pragma', () => {
  const createTestExperience = <T>(value: T) =>
    Experience.create({ value: Zygon.left(value) })

  describe('Pragma.run with sync function', () => {
    it('transforms sync function to async experience-based function', async () => {
      const syncFn = (exp: Experience<number, unknown, Faculty.Never>) =>
        exp.value.left! + 1
      const pragma = Pragma.create(syncFn)
      const input = createTestExperience(5)

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(6)
    })

    it('preserves faculty through pragma', async () => {
      type Services = {
        service: 'test-service'
      }

      const syncFn = (exp: Experience<number, unknown, Faculty<Services>>) =>
        exp.value.left! * 2

      const pragma = Pragma.create(syncFn)
      const faculty = Faculty.create<Services>({ service: 'test-service' })

      const input = Experience.create({
        value: Zygon.left(3),
        faculty,
      })

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(6)
      expect(Faculty.get(result.faculty, 'service')).toBe('test-service')
    })
  })

  describe('Pragma.run with async function', () => {
    it('handles async function returning plain value', async () => {
      const asyncFn = async (exp: Experience<number, unknown, Faculty.Never>) =>
        exp.value.left! * 3

      const pragma = Pragma.create(asyncFn)
      const input = createTestExperience(4)

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(12)
    })

    it('awaits async function result', async () => {
      const asyncFn = async (
        exp: Experience<number, unknown, Faculty.Never>,
      ) => {
        await new Promise(resolve => setTimeout(resolve, 10))

        return exp.value.left! + 10
      }

      const pragma = Pragma.create(asyncFn)
      const input = createTestExperience(5)

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(15)
    })
  })

  describe('Pragma.run with sync function returning Zygon', () => {
    it('handles sync function returning left', async () => {
      const zygonFn = (exp: Experience<number, unknown, Faculty.Never>) =>
        Zygon.left(exp.value.left! * 2)

      const pragma = Pragma.create(zygonFn)
      const input = createTestExperience(5)

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(10)
    })

    it('handles sync function returning right', async () => {
      const zygonFn = () => Zygon.right(new PraxisFailure.Unknown())
      const pragma = Pragma.create(zygonFn)
      const input = createTestExperience(5)

      const result = await Pragma.run(pragma, input)

      expect(Zygon.isRight(result.value)).toBe(true)
    })
  })

  describe('Pragma.run with async function returning Zygon', () => {
    it('handles async function returning left', async () => {
      const asyncZygonFn = async (
        exp: Experience<number, unknown, Faculty.Never>,
      ) => Zygon.left(exp.value.left! + 1)

      const pragma = Pragma.create(asyncZygonFn)
      const input = createTestExperience(10)

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(11)
    })

    it('handles async function returning right', async () => {
      const asyncZygonFn = async () =>
        Zygon.right(new PraxisFailure.LiftRight())

      const pragma = Pragma.create(asyncZygonFn)
      const input = createTestExperience(0)

      const result = await Pragma.run(pragma, input)

      expect(Zygon.isRight(result.value)).toBe(true)
      expect(result.value.right).toBeInstanceOf(PraxisFailure.LiftRight)
    })
  })

  describe('Pragma.run with function returning Experience', () => {
    it('handles sync function returning Experience', async () => {
      const experienceFn = (exp: Experience<number, unknown, Faculty.Never>) =>
        Experience.create({ value: Zygon.left(exp.value.left! * 4) })

      const pragma = Pragma.create(experienceFn)
      const input = createTestExperience(5)

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(5)
    })

    it('handles async function returning Experience', async () => {
      const asyncExperienceFn = async (
        exp: Experience<number, unknown, Faculty.Never>,
      ) => Experience.create({ value: Zygon.left(exp.value.left! - 1) })

      const pragma = Pragma.create(asyncExperienceFn)
      const input = createTestExperience(10)

      const result = await Pragma.run(pragma, input)

      expect(result.value.left).toBe(10)
    })
  })

  describe('Pragma.run with throwing function', () => {
    it('catches sync function error', async () => {
      const throwingFn = (): unknown => {
        throw new Error('sync error')
      }

      const pragma = Pragma.create(throwingFn)
      const input = createTestExperience(0)

      const result = await Pragma.run(pragma, input)

      expect(Zygon.isRight(result.value)).toBe(true)
      expect(result.value.right).toBeInstanceOf(PraxisFailure.Unknown)
    })

    it('catches async function error', async () => {
      const asyncThrowingFn = async (): Promise<unknown> => {
        throw new Error('async error')
      }
      const pragma = Pragma.create(asyncThrowingFn)
      const input = createTestExperience(0)

      const result = await Pragma.run(pragma, input)

      expect(Zygon.isRight(result.value)).toBe(true)
      expect(result.value.right).toBeInstanceOf(PraxisFailure.Unknown)
    })
  })

  describe('Pragma.run with aborted experience', () => {
    it('returns aborted experience without running pragma', async () => {
      const fn = (): unknown => {
        throw new Error('should not run')
      }
      const pragma = Pragma.create(fn)
      const input = Experience.create({
        value: Zygon.left(0),
      })

      input.controller.abort()

      const result = await Pragma.run(pragma, input)

      expect(Experience.isAborted(result)).toBe(true)
    })
  })
})
