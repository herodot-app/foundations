import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import { Agora } from '@herodot-app/agora'
import { Process } from './process'
import { Cerebrum } from './cerebrum'
import { Experience } from './experience'

describe('Process', () => {
  describe('Process.create', () => {
    it('creates a process with a thought function', () => {
      const thought = (input: number) => input * 2
      const process = Process.create({ thought, input: 21 })

      expect(Idion.is(process, Process.identifier)).toBe(true)
    })

    it('creates a process and returns a thenable', async () => {
      const thought = (input: number) => input * 2
      const process = Process.create({ thought, input: 21 })

      const result = await process

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left).toBe(42)
      }
    })

    it('exposes experience in value', () => {
      const thought = (input: number) => input * 2
      const process = Process.create({ thought, input: 21 })

      expect(process.experience).toBeDefined()
      expect(process.experience.value).toBe(21)
    })

    it('exposes cerebrum in value', () => {
      const thought = (input: number) => input * 2
      const cerebrum = Cerebrum.create(thought)
      const process = Process.create({ thought, input: 21 })

      expect(process.cerebrum).toBeDefined()
      expect(process.cerebrum.thought).toBe(cerebrum.thought)
    })
  })

  describe('Process.create - with options', () => {
    it('accepts custom input', () => {
      const thought = (input: string) => input.length
      const process = Process.create({ thought, input: 'hello' })

      expect(process.experience.value).toBe('hello')
    })

    it('accepts custom abortions agora', () => {
      const customAbortions = Agora.create<Experience.Abortion>()
      const thought = (input: number) => input * 2

      const process = Process.create({
        thought,
        input: 1,
        abortions: customAbortions,
      })

      expect(process.experience.abortions).toBe(customAbortions)
    })

    it('accepts optional input (undefined)', () => {
      const thought = () => 'default'
      const process = Process.create({ thought })

      expect(process.experience.value).toBeUndefined()
    })

    it('works without input for void thoughts', async () => {
      const thought = () => 'result'
      const process = Process.create({ thought })

      const result = await process

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left).toBe('result')
      }
    })
  })

  describe('Process execution', () => {
    it('returns left when thought succeeds', async () => {
      const thought = (input: number) => input + 10
      const process = Process.create({ thought, input: 5 })

      const result = await process

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left).toBe(15)
      }
    })

    it('returns right when thought throws', async () => {
      const thought = (_input: number) => {
        throw new Error('process error')
      }

      const process = Process.create({ thought, input: 42 })

      const result = await process

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('returns right when aborted', async () => {
      const customAbortions = Agora.create<Experience.Abortion>()
      const thought = (input: number) => input * 2
      const process = Process.create({
        thought,
        input: 1,
        abortions: customAbortions,
      })

      Experience.abort(process.experience, 'done!')

      const result = await process

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toBeInstanceOf(Experience.Abortion)
    })

    it('handles async thought functions', async () => {
      const thought = async (input: number) => {
        return input * 3
      }
      const process = Process.create({ thought, input: 7 })

      const result = await process

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left).toBe(21)
      }
    })

    it('handles Zygon return values', async () => {
      const thought = (_input: number) => {
        return Zygon.left('success')
      }

      const process = Process.create({ thought, input: 1 })

      const result = await process

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left).toBe('success')
      }
    })
  })

  describe('Process typing', () => {
    it('works with typed input', () => {
      const thought = (input: string): number => input.length
      const process = Process.create<string, number>({
        thought,
        input: 'test',
      })

      expect(process.experience.value).toBe('test')
    })

    it('works with complex types', async () => {
      interface User {
        name: string
        age: number
      }
      const thought = async (input: User) => Zygon.left(input.name)
      const process = Process.create({
        thought,
        input: { name: 'John', age: 30 },
      })

      const result = await process

      expect(Zygon.isLeft(result)).toBe(true)

      if (Zygon.isLeft(result)) {
        expect(result.left).toBe('John')
      }
    })
  })
})

