// biome-ignore-all lint/suspicious/noExplicitAny: any is fine here
// biome-ignore-all lint/style/noNonNullAssertion: we want non null assertion in this test
import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Sema } from '@herodot-app/sema'
import { Zygon } from '@herodot-app/zygon'
import { Experience } from './experience'
import type { Faculty } from './faculty'
import { Pragma } from './pragma'
import { Process } from './process'
import { ProcessId } from './process-id'

describe('Process', () => {
  describe('Process.create', () => {
    it('builds a pipeline of pragmas', async () => {
      const multiplyByTwo = Pragma.create(
        async (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! * 2
        },
      )
      const addTen = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! + 10
        },
      )
      const displayNumber = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return `Number is ${exp.value.left!}`
        },
      )

      const pipeline = [multiplyByTwo, addTen, displayNumber] as const

      const processor = Process.create(
        pipeline,
        Experience.create({
          value: Zygon.left(2),
        }),
      )

      const value = await processor

      expect(Zygon.isLeft(value)).toBe(true)

      expect(value.left).toEqual('Number is 14')
    })

    it('creates a Process that is a valid Idion', () => {
      const pragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left
        },
      )

      const pipeline = [pragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(42) }),
      )

      expect(Idion.is(processor, Process.identifier)).toBe(true)
    })

    it('creates a Process with a pid', () => {
      const pragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left
        },
      )

      const pipeline = [pragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(42) }),
      )

      expect(Idion.is(processor.pid, ProcessId.identifier)).toBe(true)
    })

    it('creates a Process with initial experience', () => {
      const pragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left
        },
      )

      const initialExperience = Experience.create({ value: Zygon.left(42) })
      const pipeline = [pragma] as const

      const processor = Process.create(pipeline, initialExperience)

      expect(processor.experience).toBe(initialExperience)
    })

    it('creates a Process with Idle status initially', () => {
      const pragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left
        },
      )

      const pipeline = [pragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(42) }),
      )

      const status = processor.status
      expect(status).toBeDefined()
      expect(Sema.read(status)).toBe(Process.Status.Idle)
    })

    it('creates a Process that is thenable', async () => {
      const pragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! * 2
        },
      )

      const pipeline = [pragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(21) }),
      )

      expect(typeof processor.then).toBe('function')

      const result = await processor

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('transitions status from Idle to Running to Finished', async () => {
      const pragma = Pragma.create(
        async (exp: Experience<number, any, Faculty.Any>) => {
          await new Promise(resolve => setTimeout(resolve, 150))

          return exp.value.left! * 2
        },
      )

      const pipeline = [pragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(10) }),
      )

      expect(Sema.read(processor.status)).toBe(Process.Status.Idle)

      const newPromise = processor.then(value => {
        expect(Sema.read(processor.status)).toBe(Process.Status.Finished)

        return value
      })

      expect(Sema.read(processor.status)).toBe(Process.Status.Running)

      await newPromise
    })

    it('handles errors when pragma throws', async () => {
      const failingPragma = Pragma.create((): unknown => {
        throw new Error('Pragma failed')
      })

      const pipeline = [failingPragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(42) }),
      )

      const result = await processor

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('handles Zygon.right results correctly', async () => {
      const errorPragma = Pragma.create(() => {
        return Zygon.right(new Error('Something went wrong'))
      })

      const pipeline = [errorPragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(42) }),
      )

      const result = await processor

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('works with single pragma pipeline', async () => {
      const pragma = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! + 100
        },
      )

      const pipeline = [pragma] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(5) }),
      )

      const result = await processor

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(105)
    })

    it('works with empty pipeline', async () => {
      const pipeline = [] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(42) }),
      )

      const result = await processor

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('passes experience through pipeline correctly', async () => {
      const extractValue = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left
        },
      )
      const doubleValue = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! * 2
        },
      )
      const addTen = Pragma.create(
        (exp: Experience<number, any, Faculty.Any>) => {
          return exp.value.left! + 10
        },
      )

      const pipeline = [extractValue, doubleValue, addTen] as const

      const processor = Process.create(
        pipeline,
        Experience.create({ value: Zygon.left(5) }),
      )

      const result = await processor

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })
  })

  describe('Process.Status', () => {
    it('has Idle status', () => {
      expect(String(Process.Status.Idle)).toBe(
        '@herodot-app/praxis/process/status/idle',
      )
    })

    it('has Running status', () => {
      expect(String(Process.Status.Running)).toBe(
        '@herodot-app/praxis/process/status/running',
      )
    })

    it('has Finished status', () => {
      expect(String(Process.Status.Finished)).toBe(
        '@herodot-app/praxis/process/status/finished',
      )
    })
  })
})
