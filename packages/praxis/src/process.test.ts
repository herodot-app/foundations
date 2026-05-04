import { describe, expect, test } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Zygon } from '@herodot-app/zygon'
import { Process } from './process'

describe('Process', () => {
  describe('identifier', () => {
    test('has the correct symbol', () => {
      expect(Process.identifier.description).toBe('@herodot-app/praxis/process')
    })
  })

  describe('RuntimePtoma', () => {
    test('is a Ptoma instance', () => {
      const ptoma = new Process.RuntimePtoma('test error')

      expect(Ptoma.is(ptoma)).toBe(true)
    })

    test('carries the message and cause', () => {
      const cause = new Error('original')
      const ptoma = new Process.RuntimePtoma('wrapped error', undefined, {
        cause,
      })

      expect(ptoma.message).toBe('wrapped error')
      expect(ptoma.cause).toBe(cause)
    })
  })

  describe('create', () => {
    test('creates a process branded with identifier', () => {
      const process = Process.create(() => 'result')

      expect(Idion.is(process, Process.identifier)).toBe(true)
    })

    test('returns a process with a processor function', () => {
      const process = Process.create(() => 'result')

      expect(typeof process.processor).toBe('function')
    })
  })

  describe('processor', () => {
    describe('with no input', () => {
      test('handles functions with no arguments', async () => {
        const process = Process.create(() => 'hello')

        const result = await process.processor()

        expect(Zygon.isLeft(result)).toBe(true)

        if (Zygon.isLeft(result)) {
          expect(result.left).toBe('hello')
        }
      })

      test('handles async functions with no arguments', async () => {
        const process = Process.create(async () => 'async result')

        const result = await process.processor()

        expect(Zygon.isLeft(result)).toBe(true)

        if (Zygon.isLeft(result)) {
          expect(result.left).toBe('async result')
        }
      })
    })

    describe('with input', () => {
      test('passes input to the raw processor', async () => {
        const process = Process.create((n: number) => n * 2)

        const result = await process.processor(21)

        expect(Zygon.isLeft(result)).toBe(true)
        if (Zygon.isLeft(result)) {
          expect(result.left).toBe(42)
        }
      })

      test('handles object input', async () => {
        const process = Process.create((user: { name: string }) => user.name)

        const result = await process.processor({ name: 'Alice' })

        expect(Zygon.isLeft(result)).toBe(true)
        if (Zygon.isLeft(result)) {
          expect(result.left).toBe('Alice')
        }
      })
    })

    describe('when raw processor returns a Zygon', () => {
      test('unwraps Left values from nested Zygons', async () => {
        const process = Process.create(() => Zygon.left(Zygon.left(42)))

        const result = await process.processor()

        expect(Zygon.isLeft(result)).toBe(true)
        if (Zygon.isLeft(result)) {
          expect(result.left).toBe(42)
        }
      })

      test('returns Right values directly when not nested', async () => {
        const process = Process.create(() => Zygon.right('error'))

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBe('error')
        }
      })

      test('unwraps nested Right Zygons', async () => {
        const process = Process.create(() =>
          Zygon.right(Zygon.right('deep error')),
        )

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBe('deep error')
        }
      })

      test('unwraps Right in Error object', async () => {
        const process = Process.create(() => Zygon.right(new Error('original')))

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBeInstanceOf(Error)
        }
      })
    })

    describe('when raw processor throws', () => {
      test('wraps regular errors in RuntimePtoma', async () => {
        const process = Process.create(() => {
          throw new Error('something broke')
        })

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBeInstanceOf(Process.RuntimePtoma)
          expect(result.right.cause).toBeInstanceOf(Error)
          expect((result.right.cause as Error).message).toBe('something broke')
        }
      })

      test('returns Ptoma errors inside the RuntimePtoma cause directly', async () => {
        const CustomPtoma = Ptoma.create('custom-ptoma')
        const ptoma = new CustomPtoma('ptoma error')

        const process = Process.create(() => {
          throw ptoma
        })

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBeInstanceOf(Process.RuntimePtoma)
          expect(result.right.cause).toBeInstanceOf(CustomPtoma)
        }
      })

      test('wraps thrown Zygons.right in RuntimePtoma', async () => {
        const process = Process.create(() => {
          throw Zygon.right('thrown zygon')
        })

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBeInstanceOf(Process.RuntimePtoma)
          expect(result.right.cause).toBe('thrown zygon')
        }
      })

      test('handles non-Error thrown values', async () => {
        const process = Process.create(() => {
          throw 'string error'
        })

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBeInstanceOf(Process.RuntimePtoma)
          expect(result.right.cause).toBe('string error')
        }
      })
    })

    describe('async processors', () => {
      test('handles async functions that resolve', async () => {
        const process = Process.create(async (n: number) => {
          await new Promise((r) => setTimeout(r, 10))

          return n + 1
        })

        const result = await process.processor(41)

        expect(Zygon.isLeft(result)).toBe(true)

        if (Zygon.isLeft(result)) {
          expect(result.left).toBe(42)
        }
      })

      test('handles async functions that reject', async () => {
        const process = Process.create(async () => {
          await new Promise((_, reject) => setTimeout(() => reject('fail'), 10))
        })

        const result = await process.processor()

        expect(Zygon.isRight(result)).toBe(true)

        if (Zygon.isRight(result)) {
          expect(result.right).toBeInstanceOf(Process.RuntimePtoma)
        }
      })

      test('handles async functions returning Zygon', async () => {
        const process = Process.create(async () => {
          await new Promise((r) => setTimeout(r, 10))

          return Zygon.left('async zygon')
        })

        const result = await process.processor()

        expect(Zygon.isLeft(result)).toBe(true)

        if (Zygon.isLeft(result)) {
          expect(result.left).toBe('async zygon')
        }
      })
    })
  })
})
