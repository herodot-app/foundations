// biome-ignore-all lint/style/noNonNullAssertion: it's okay here
import { describe, expect, it } from 'bun:test'
import { Zygon } from '@herodot-app/zygon'
import { Action } from './action'
import { Cognition } from './cognition'
import { Experience } from './experience'
import { PraxisFailure } from './praxis-failure'

describe('Action', () => {
  const createTestExperience = <T>(value: T) =>
    Experience.create({ value: Zygon.left(value) })

  describe('Action.run with sync function', () => {
    it('transforms sync function to async experience-based function', async () => {
      const syncFn = (exp: Experience<number, unknown, Cognition.Never>) =>
        exp.value.left! + 1
      const action = Action.create(syncFn)
      const input = createTestExperience(5)

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(6)
    })

    it('preserves cognition through action', async () => {
      type Services = {
        service: 'test-service'
      }

      const syncFn = (exp: Experience<number, unknown, Cognition<Services>>) =>
        exp.value.left! * 2

      const action = Action.create(syncFn)
      const cognition = Cognition.create<Services>({ service: 'test-service' })

      const input = Experience.create({
        value: Zygon.left(3),
        cognition,
      })

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(6)
      expect(Cognition.get(result.cognition, 'service')).toBe('test-service')
    })
  })

  describe('Action.run with async function', () => {
    it('handles async function returning plain value', async () => {
      const asyncFn = async (
        exp: Experience<number, unknown, Cognition.Never>,
      ) => exp.value.left! * 3

      const action = Action.create(asyncFn)
      const input = createTestExperience(4)

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(12)
    })

    it('awaits async function result', async () => {
      const asyncFn = async (
        exp: Experience<number, unknown, Cognition.Never>,
      ) => {
        await new Promise(resolve => setTimeout(resolve, 10))

        return exp.value.left! + 10
      }

      const action = Action.create(asyncFn)
      const input = createTestExperience(5)

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(15)
    })
  })

  describe('Action.run with sync function returning Zygon', () => {
    it('handles sync function returning left', async () => {
      const zygonFn = (exp: Experience<number, unknown, Cognition.Never>) =>
        Zygon.left(exp.value.left! * 2)

      const action = Action.create(zygonFn)
      const input = createTestExperience(5)

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(10)
    })

    it('handles sync function returning right', async () => {
      const zygonFn = () => Zygon.right(new PraxisFailure.Unknown())
      const action = Action.create(zygonFn)
      const input = createTestExperience(5)

      const result = await Action.run(action, input)

      expect(Zygon.isRight(result.value)).toBe(true)
    })
  })

  describe('Action.run with async function returning Zygon', () => {
    it('handles async function returning left', async () => {
      const asyncZygonFn = async (
        exp: Experience<number, unknown, Cognition.Never>,
      ) => Zygon.left(exp.value.left! + 1)

      const action = Action.create(asyncZygonFn)
      const input = createTestExperience(10)

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(11)
    })

    it('handles async function returning right', async () => {
      const asyncZygonFn = async () =>
        Zygon.right(new PraxisFailure.LiftRight())

      const action = Action.create(asyncZygonFn)
      const input = createTestExperience(0)

      const result = await Action.run(action, input)

      expect(Zygon.isRight(result.value)).toBe(true)
      expect(result.value.right).toBeInstanceOf(PraxisFailure.LiftRight)
    })
  })

  describe('Action.run with function returning Experience', () => {
    it('handles sync function returning Experience', async () => {
      const experienceFn = (
        exp: Experience<number, unknown, Cognition.Never>,
      ) => Experience.create({ value: Zygon.left(exp.value.left! * 4) })

      const action = Action.create(experienceFn)
      const input = createTestExperience(5)

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(5)
    })

    it('handles async function returning Experience', async () => {
      const asyncExperienceFn = async (
        exp: Experience<number, unknown, Cognition.Never>,
      ) => Experience.create({ value: Zygon.left(exp.value.left! - 1) })

      const action = Action.create(asyncExperienceFn)
      const input = createTestExperience(10)

      const result = await Action.run(action, input)

      expect(result.value.left).toBe(10)
    })
  })

  describe('Action.run with throwing function', () => {
    it('catches sync function error', async () => {
      const throwingFn = (): unknown => {
        throw new Error('sync error')
      }

      const action = Action.create(throwingFn)
      const input = createTestExperience(0)

      const result = await Action.run(action, input)

      expect(Zygon.isRight(result.value)).toBe(true)
      expect(result.value.right).toBeInstanceOf(PraxisFailure.Unknown)
    })

    it('catches async function error', async () => {
      const asyncThrowingFn = async (): Promise<unknown> => {
        throw new Error('async error')
      }
      const action = Action.create(asyncThrowingFn)
      const input = createTestExperience(0)

      const result = await Action.run(action, input)

      expect(Zygon.isRight(result.value)).toBe(true)
      expect(result.value.right).toBeInstanceOf(PraxisFailure.Unknown)
    })
  })

  describe('Action.run with aborted experience', () => {
    it('returns aborted experience without running action', async () => {
      const fn = (): unknown => {
        throw new Error('should not run')
      }
      const action = Action.create(fn)
      const input = Experience.create({
        value: Zygon.left(0),
      })

      input.controller.abort()

      const result = await Action.run(action, input)

      expect(Experience.isAborted(result)).toBe(true)
    })
  })
})
