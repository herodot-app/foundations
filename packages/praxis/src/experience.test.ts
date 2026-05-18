import { describe, expect, it } from 'bun:test'
import { Zygon } from '@herodot-app/zygon'
import { Experience } from './experience'
import { Faculty } from './faculty'
import { PraxisFailure } from './praxis-failure'

describe('Experience', () => {
  describe('Experience.create', () => {
    it('creates an experience with left value', () => {
      const experience = Experience.create({
        value: Zygon.left(42),
      })

      expect(Experience.is(experience)).toBe(true)
      expect(experience.value.left).toBe(42)
    })

    it('creates an experience with right value', () => {
      const experience = Experience.create({
        value: Zygon.right(new PraxisFailure.Unknown()),
      })

      expect(Experience.is(experience)).toBe(true)
      expect(experience.value.right).toBeInstanceOf(PraxisFailure.Unknown)
    })

    it('creates experience with custom faculty', () => {
      const faculty = Faculty.create({ service: 'test' })
      const experience = Experience.create({
        value: Zygon.left('data'),
        faculty,
      })

      expect(Faculty.get(experience.faculty, 'service')).toBe('test')
    })

    it('creates experience with custom abort controller', () => {
      const controller = new AbortController()
      const experience = Experience.create({
        value: Zygon.left('data'),
        controller,
      })

      expect(experience.controller).toBe(controller)
    })

    it('creates experience with default faculty', () => {
      const experience = Experience.create({
        value: Zygon.left('data'),
      })

      expect(Experience.is(experience)).toBe(true)
    })
  })

  describe('Experience.abort', () => {
    it('aborts the experience controller', () => {
      const experience = Experience.create({
        value: Zygon.left('data'),
      })

      Experience.abort(experience, 'test reason')

      expect(experience.controller.signal.aborted).toBe(true)
      expect(experience.controller.signal.reason).toBe('test reason')
    })

    it('does nothing if already aborted', () => {
      const experience = Experience.create({
        value: Zygon.left('data'),
      })

      experience.controller.abort('first reason')
      Experience.abort(experience, 'second reason')

      expect(experience.controller.signal.reason).toBe('first reason')
    })
  })

  describe('Experience.isAborted', () => {
    it('returns false for non-aborted experience', () => {
      const experience = Experience.create({
        value: Zygon.left('data'),
      })

      expect(Experience.isAborted(experience)).toBe(false)
    })

    it('returns true when controller is aborted', () => {
      const experience = Experience.create({
        value: Zygon.left('data'),
      })

      experience.controller.abort()

      expect(Experience.isAborted(experience)).toBe(true)
    })

    it('returns true when left value is Aborted', () => {
      const experience = Experience.create({
        value: Zygon.left(new PraxisFailure.Aborted()),
      })

      expect(Experience.isAborted(experience)).toBe(true)
    })

    it('returns true when right value is Aborted', () => {
      const experience = Experience.create({
        value: Zygon.right(new PraxisFailure.Aborted()),
      })

      expect(Experience.isAborted(experience)).toBe(true)
    })

    it('returns false for other failure types', () => {
      const experience = Experience.create({
        value: Zygon.right(new PraxisFailure.Unknown()),
      })

      expect(Experience.isAborted(experience)).toBe(false)
    })
  })

  describe('Experience.is', () => {
    it('returns true for Experience', () => {
      const experience = Experience.create({
        value: Zygon.left('data'),
      })

      expect(Experience.is(experience)).toBe(true)
    })

    it('returns false for non-Experience', () => {
      expect(Experience.is({ value: 'data' })).toBe(false)
      expect(Experience.is(null)).toBe(false)
      expect(Experience.is(undefined)).toBe(false)
    })
  })
})
