import { describe, expect, it } from 'bun:test'
import { Ptoma } from '@herodot-app/ptoma'
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import { Cerebrum } from './cerebrum'
import { Experience } from './experience'

describe('Cerebrum', () => {
  describe('Cerebrum.create', () => {
    it('creates a cerebrum with a thought function', () => {
      const thought = (input: number) => input * 2
      const cerebrum = Cerebrum.create(thought)

      expect(Idion.is(cerebrum, Cerebrum.identifier)).toBe(true)
      expect(cerebrum.thought).toBe(thought)
    })

    it('creates a cerebrum with optional input', () => {
      const thought = () => 'default'
      const cerebrum = Cerebrum.create(thought)

      expect(cerebrum.thought()).toBe('default')
    })

    it('creates a cerebrum with typed input and output', () => {
      const thought = (input: string): number => input.length
      const cerebrum = Cerebrum.create(thought)

      expect(cerebrum.thought('hello')).toBe(5)
    })
  })

  describe('Cerebrum.think - successful execution', () => {
    it('returns a left Zygon with Experience when thought succeeds', async () => {
      const thought = (input: number) => input * 2
      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 21 })

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left.value).toBe(42)
      }
    })

    it('preserves experience properties in success result', async () => {
      const thought = (input: string) => input.toUpperCase()
      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 'hello' })

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left.cognition).toBe(experience.cognition)
        expect(result.left.abortions).toBe(experience.abortions)
      }
    })

    it('handles async thought functions', async () => {
      const thought = async (input: number) => {
        return input + 10
      }

      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 5 })

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left.value).toBe(15)
      }
    })
  })

  describe('Cerebrum.think - failed execution', () => {
    it('returns a right Zygon with failure when thought throws', async () => {
      const thought = (_input: number) => {
        throw new Error('Thought failed')
      }

      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 42 })

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isRight(result)).toBe(true)

      if (Zygon.isRight(result)) {
        expect(Ptoma.match(result.right.value, Cerebrum.UnknownFailure)).toBe(
          true,
        )
      }
    })

    it('returns a right Zygon when thought returns a right Zygon', async () => {
      const thought = (_input: number) => Zygon.right('error reason')

      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 42 })

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isRight(result)).toBe(true)

      if (Zygon.isRight(result)) {
        expect(result.right.value).toEqual('error reason')
      }
    })

    it('returns a right Zygon with abortion when already aborted', async () => {
      const thought = (input: number) => input * 2
      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 42 })

      experience.controller.abort('already aborted')

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isRight(result)).toBe(true)

      if (Zygon.isRight(result)) {
        expect(Ptoma.match(result.right.value, Experience.Abortion)).toBe(true)
      }
    })

    it('returns a right Zygon when aborted during thought execution', async () => {
      const thought = (_input: number) => {
        return new Promise<number>(resolve => {
          setTimeout(() => resolve(42), 100)
        })
      }

      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 1 })

      setTimeout(() => {
        Experience.abort(experience, 'during execution')
      }, 10)

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isRight(result)).toBe(true)

      if (Zygon.isRight(result)) {
        expect(Ptoma.match(result.right.value, Experience.Abortion)).toBe(true)
      }
    })
  })

  describe('Cerebrum.think - Zygon handling', () => {
    it('unwraps left Zygon from thought and returns left', async () => {
      const thought = (_input: number) => {
        return Zygon.left(100)
      }
      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 5 })

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isLeft(result)).toBe(true)
      if (Zygon.isLeft(result)) {
        expect(result.left.value).toBe(100)
      }
    })

    it('handles async Zygon from thought', async () => {
      const thought = async (_input: number) => {
        return Zygon.left('async result')
      }

      const cerebrum = Cerebrum.create(thought)
      const experience = Experience.create({ value: 1 })

      const result = await Cerebrum.think(cerebrum, experience)

      expect(Zygon.isLeft(result)).toBe(true)
      if (Zygon.isLeft(result)) {
        expect(result.left.value).toBe('async result')
      }
    })
  })
})

