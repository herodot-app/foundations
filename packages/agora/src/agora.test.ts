import { describe, expect, test } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import { Agora } from './agora'

describe('Agora', () => {
  describe('identifier', () => {
    test('is a well-known symbol', () => {
      expect(typeof Agora.identifier).toBe('symbol')

      expect(Agora.identifier).toBe(
        // biome-ignore lint: we want to assert the exact symbol value here
        Symbol.for('@herodot-app/agora') as any,
      )
    })
  })

  describe('create', () => {
    test('returns an Idion-branded agora', () => {
      const agora = Agora.create()

      expect(Idion.is(agora, Agora.identifier)).toBe(true)
    })

    test('starts with an empty citizens set', () => {
      const agora = Agora.create()

      expect(agora.citizens.size).toBe(0)
    })

    test('starts with an empty keryssos queue', () => {
      const agora = Agora.create()

      expect(agora.keryssos.size).toBe(0)
    })

    test('creates independent instances', () => {
      const a = Agora.create()
      const b = Agora.create()

      expect(a).not.toBe(b)
      expect(a.citizens).not.toBe(b.citizens)
      expect(a.keryssos).not.toBe(b.keryssos)
    })
  })

  describe('akouo', () => {
    test('adds a citizen to the agora', () => {
      const agora = Agora.create()
      const listener = () => {}

      Agora.akouo(agora, listener)

      expect(agora.citizens.size).toBe(1)
      expect(agora.citizens.has(listener)).toBe(true)
    })

    test('returns an apotasso (unsubscribe) function', () => {
      const agora = Agora.create()

      const apotasso = Agora.akouo(agora, () => {})

      expect(typeof apotasso).toBe('function')
    })

    test('apotasso removes the citizen from the agora', () => {
      const agora = Agora.create()
      const listener = () => {}

      const apotasso = Agora.akouo(agora, listener)

      apotasso()

      expect(agora.citizens.size).toBe(0)
      expect(agora.citizens.has(listener)).toBe(false)
    })

    test('multiple citizens can be registered independently', () => {
      const agora = Agora.create()

      Agora.akouo(agora, () => {})
      Agora.akouo(agora, () => {})
      Agora.akouo(agora, () => {})

      expect(agora.citizens.size).toBe(3)
    })

    test('apotasso only removes its own citizen', () => {
      const agora = Agora.create<string>()
      const listener1 = (_: string) => {}
      const listener2 = (_: string) => {}

      const apotasso1 = Agora.akouo(agora, listener1)

      Agora.akouo(agora, listener2)

      apotasso1()

      expect(agora.citizens.size).toBe(1)
      expect(agora.citizens.has(listener2)).toBe(true)
    })
  })

  describe('plethos', () => {
    test('returns 0 citizens and 0 keryssos for an empty agora', () => {
      const agora = Agora.create()

      expect(Agora.plethos(agora)).toEqual({ citizens: 0, keryssos: 0 })
    })

    test('returns the number of registered citizens', () => {
      const agora = Agora.create()

      Agora.akouo(agora, () => {})
      Agora.akouo(agora, () => {})

      expect(Agora.plethos(agora).citizens).toBe(2)
    })

    test('reflects the keryssos queue size', () => {
      const agora = Agora.create<number>()

      Agora.katatasso(agora, 1)
      Agora.katatasso(agora, 2)

      expect(Agora.plethos(agora).keryssos).toBe(2)
    })

    test('decrements citizens after an apotasso call', () => {
      const agora = Agora.create()
      const apotasso = Agora.akouo(agora, () => {})

      Agora.akouo(agora, () => {})

      apotasso()

      expect(Agora.plethos(agora).citizens).toBe(1)
    })

    test('returns 0 citizens and 0 keryssos after dialyo', () => {
      const agora = Agora.create<string>()

      Agora.akouo(agora, () => {})
      Agora.akouo(agora, () => {})
      Agora.katatasso(agora, 'msg')

      Agora.dialyo(agora)

      expect(Agora.plethos(agora)).toEqual({ citizens: 0, keryssos: 0 })
    })
  })

  describe('kerysso', () => {
    test('calls all citizens with the given payload', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.akouo(agora, (msg) => received.push(msg))
      Agora.akouo(agora, (msg) => received.push(msg))

      Agora.kerysso(agora, 'hello')

      expect(received).toEqual(['hello', 'hello'])
    })

    test('returns a dexion when all citizens succeed', () => {
      const agora = Agora.create<number>()
      Agora.akouo(agora, () => {})

      const result = Agora.kerysso(agora, 42)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(true)
    })

    test('returns a skaion when a citizen throws', () => {
      const agora = Agora.create<number>()
      const err = new Error('citizen failed')

      Agora.akouo(agora, () => {
        throw err
      })

      const result = Agora.kerysso(agora, 42)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([err])
    })

    test('continues calling remaining citizens after one throws', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.akouo(agora, () => {
        throw new Error('boom')
      })
      Agora.akouo(agora, (msg) => received.push(msg))

      Agora.kerysso(agora, 'test')

      expect(received).toEqual(['test'])
    })

    test('returns a dexion with no citizens', () => {
      const agora = Agora.create()

      const result = Agora.kerysso(agora)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(true)
    })

    test('works without a payload (undefined default)', () => {
      const agora = Agora.create()
      let called = false

      Agora.akouo(agora, () => {
        called = true
      })

      Agora.kerysso(agora)

      expect(called).toBe(true)
    })
  })

  describe('katatasso', () => {
    test('enqueues a payload into keryssos', () => {
      const agora = Agora.create<string>()

      Agora.katatasso(agora, 'queued')

      expect(agora.keryssos.size).toBe(1)
      expect(agora.keryssos.has('queued')).toBe(true)
    })

    test('multiple distinct payloads can be queued', () => {
      const agora = Agora.create<number>()

      Agora.katatasso(agora, 1)
      Agora.katatasso(agora, 2)
      Agora.katatasso(agora, 3)

      expect(agora.keryssos.size).toBe(3)
    })

    test('works without a payload (undefined default)', () => {
      const agora = Agora.create()

      Agora.katatasso(agora)

      expect(agora.keryssos.size).toBe(1)
    })

    test('does not notify citizens immediately', () => {
      const agora = Agora.create<string>()
      let called = false

      Agora.akouo(agora, () => {
        called = true
      })
      Agora.katatasso(agora, 'msg')

      expect(called).toBe(false)
    })
  })

  describe('diangelo', () => {
    test('dispatches each queued payload to each citizen', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.akouo(agora, (msg) => received.push(msg))
      Agora.katatasso(agora, 'first')
      Agora.katatasso(agora, 'second')

      Agora.diangelo(agora)

      expect(received).toContain('first')
      expect(received).toContain('second')
    })

    test('dispatches each payload to every citizen', () => {
      const agora = Agora.create<number>()
      const calls: [string, number][] = []

      Agora.akouo(agora, (n) => calls.push(['a', n]))
      Agora.akouo(agora, (n) => calls.push(['b', n]))
      Agora.katatasso(agora, 1)
      Agora.katatasso(agora, 2)

      Agora.diangelo(agora)

      expect(calls.filter(([, n]) => n === 1).length).toBe(2)
      expect(calls.filter(([, n]) => n === 2).length).toBe(2)
    })

    test('clears the keryssos queue after dispatching', () => {
      const agora = Agora.create<string>()
      Agora.katatasso(agora, 'msg')

      Agora.diangelo(agora)

      expect(agora.keryssos.size).toBe(0)
    })

    test('clears the queue even when a citizen throws', () => {
      const agora = Agora.create<string>()
      Agora.akouo(agora, () => {
        throw new Error('boom')
      })
      Agora.katatasso(agora, 'msg')

      Agora.diangelo(agora)

      expect(agora.keryssos.size).toBe(0)
    })

    test('returns a dexion when all dispatches succeed', () => {
      const agora = Agora.create<number>()
      Agora.akouo(agora, () => {})
      Agora.katatasso(agora, 1)

      const result = Agora.diangelo(agora)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(true)
    })

    test('returns a skaion when a citizen throws', () => {
      const agora = Agora.create<number>()
      const err = new Error('dispatch failed')
      Agora.akouo(agora, () => {
        throw err
      })
      Agora.katatasso(agora, 42)

      const result = Agora.diangelo(agora)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([[err]])
    })

    test('returns a dexion for an empty queue', () => {
      const agora = Agora.create()

      const result = Agora.diangelo(agora)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(true)
    })
  })

  describe('is', () => {
    test('returns true for an agora created with Agora.create', () => {
      const agora = Agora.create()

      expect(Agora.is(agora)).toBe(true)
    })

    test('returns true for a typed agora', () => {
      const agora = Agora.create<string>()

      expect(Agora.is<string>(agora)).toBe(true)
    })

    test('returns false for null', () => {
      expect(Agora.is(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(Agora.is(undefined)).toBe(false)
    })

    test('returns false for a plain object', () => {
      expect(Agora.is({ citizens: new Set(), keryssos: new Set() })).toBe(false)
    })

    test('returns false for a primitive', () => {
      expect(Agora.is(42)).toBe(false)
      expect(Agora.is('agora')).toBe(false)
    })

    test('narrows the type in a conditional branch', () => {
      const maybeAgora: unknown = Agora.create<number>()

      if (Agora.is<number>(maybeAgora)) {
        // TypeScript should accept this — the guard narrowed correctly
        expect(maybeAgora.citizens).toBeDefined()
      } else {
        throw new Error('guard should have returned true')
      }
    })
  })

  describe('dialyo', () => {
    test('removes all citizens', () => {
      const agora = Agora.create()
      Agora.akouo(agora, () => {})
      Agora.akouo(agora, () => {})

      Agora.dialyo(agora)

      expect(agora.citizens.size).toBe(0)
    })

    test('citizens no longer receive announcements after dialyo', () => {
      const agora = Agora.create<string>()
      let called = false

      Agora.akouo(agora, () => {
        called = true
      })

      Agora.dialyo(agora)
      Agora.kerysso(agora, 'msg')

      expect(called).toBe(false)
    })

    test('also clears the keryssos queue', () => {
      const agora = Agora.create<string>()
      Agora.katatasso(agora, 'queued')

      Agora.dialyo(agora)

      expect(agora.keryssos.size).toBe(0)
    })
  })
})
