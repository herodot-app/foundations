import { describe, expect, it, vi } from 'bun:test'
import { Zygon } from '@herodot-app/zygon'
import { Delay } from './delay'
import { Praxis } from './praxis'

describe('Delay', () => {
  describe('Delay.create', () => {
    it('adds a delay before executing the praxis', async () => {
      const start = Date.now()
      const praxis = Praxis.create((x: number) => x * 2).fork(x =>
        Delay.create({ duration: 100, return: x }),
      )

      const result = await praxis.run(10)

      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(90)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('returns the original result after delay', async () => {
      const praxis = Delay.create({
        praxis: Praxis.create((x: string) => x.toUpperCase()),
        duration: 50,
      })

      const result = await praxis.run('hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe('HELLO')
    })

    it('preserves Right values from the original praxis', async () => {
      const praxis = Delay.create({
        praxis: Praxis.create(() => {
          throw new Error('error')
        }),
        duration: 50,
      })

      const result = await praxis.run()

      expect(Zygon.isRight(result)).toBe(true)
    })

    it('works with chained praxis', async () => {
      const praxis = Delay.create({
        praxis: Praxis.create((x: number) => x + 1),
        duration: 50,
      }).chain(value => value * 2)

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(22)
    })

    it('works with piped praxis', async () => {
      const praxis = Delay.create({
        praxis: Praxis.create((x: number) => x * 2),
        duration: 50,
      }).pipe(result => (result.left ? result.left + 10 : result))

      const result = await praxis.run(5)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(20)
    })

    it('allows custom timeout function', async () => {
      const mockTimeout = vi.fn((_handler: () => void, duration: number) => {
        setTimeout(_handler, duration)
      })

      const praxis = Delay.create({
        praxis: Praxis.create((x: number) => x + 1),
        duration: 50,
        timeoutFn: mockTimeout,
      })

      await praxis.run(10)

      expect(mockTimeout).toHaveBeenCalled()
    })

    it('handles async inner praxis with delay', async () => {
      const praxis = Delay.create({
        praxis: Praxis.create(async (x: number) => {
          await Promise.resolve()
          return x + 1
        }),
        duration: 50,
      })

      const result = await praxis.run(10)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(11)
    })

    it('can chain delay with other delay', async () => {
      const praxis = Delay.create({
        praxis: Delay.create({
          praxis: Praxis.create((x: number) => x + 1),
          duration: 30,
        }),
        duration: 30,
      })

      const start = Date.now()
      const result = await praxis.run(10)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(50)
      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(11)
    })
  })
})
