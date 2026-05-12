import { describe, expect, it } from 'bun:test'
import { Zygon } from '@herodot-app/zygon'
import { Task } from './task'
import { Praxis } from './praxis'

describe('Praxis', () => {
  describe('Praxis.create', () => {
    it('creates a Praxis from a synchronous function', async () => {
      const praxis = Praxis.create((x: number) => x * 2)

      const result = await praxis.run(21)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)
    })

    it('creates a Praxis from an async function', async () => {
      const praxis = Praxis.create(async (x: number) => {
        await Promise.resolve()
        return x + 1
      })

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(11)
    })

    it('creates a Praxis that can be piped', async () => {
      const praxis = Praxis.create((x: number) => x * 2).pipe((result) => {
        if (Zygon.isLeft(result)) {
          return result.left + 10
        }

        return result
      })

      const result = await praxis.run(20)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(50)
    })
  })

  describe('Praxis constructor', () => {
    it('exposes the task via the task property', () => {
      const task = Task.create({ run: () => 42 })
      const praxis = new Praxis(task)

      expect(praxis.task).toBe(task)
    })
  })

  describe('Praxis.pipe', () => {
    it('chains a function onto the praxis', async () => {
      const praxis = Praxis.create((x: number) => x + 1).pipe((result) =>
        result.left ? result.left * 2 : result,
      )

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('preserves input type through pipe', async () => {
      const praxis = Praxis.create((x: string) => x.toUpperCase()).pipe(
        (result) => (result.left ? result.left.length : result),
      )

      const result = await praxis.run('hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(5)
    })

    it('handles async piped functions', async () => {
      const praxis = Praxis.create((x: number) => x * 2).pipe(
        async (result) => {
          await Promise.resolve()

          return result.left ? result.left + 100 : result
        },
      )

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(110)
    })

    it('handles errors in piped functions', async () => {
      const praxis = Praxis.create(() => 42).pipe(() => {
        throw new Error('pipe error')
      })

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('can chain multiple pipes', async () => {
      const praxis = Praxis.create((x: number) => x)
        .pipe((result) => (result.left ? result.left + 1 : result))
        .pipe((result) => (result.left ? result.left * 2 : result))
        .pipe((result) => (result.left ? result.left + 10 : result))

      const result = await Task.run(praxis.task, 5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('passes through Right values from the original task', async () => {
      const praxis = Praxis.create(() => {
        throw new Error('original error')
      }).pipe((result) => {
        if (Zygon.isLeft(result)) {
          return result.left * 2
        }

        return result
      })

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
    })
  })
})
