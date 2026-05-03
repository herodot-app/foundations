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

    test('starts with an empty registry queue', () => {
      const agora = Agora.create()

      expect(agora.registry.size).toBe(0)
    })

    test('creates independent instances', () => {
      const a = Agora.create()
      const b = Agora.create()

      expect(a).not.toBe(b)
      expect(a.citizens).not.toBe(b.citizens)
      expect(a.registry).not.toBe(b.registry)
    })
  })

  describe('listen', () => {
    test('adds a citizen to the agora', () => {
      const agora = Agora.create()
      const listener = () => {}

      Agora.listen(agora, listener)

      expect(agora.citizens.size).toBe(1)
      expect(agora.citizens.has(listener)).toBe(true)
    })

    test('returns an unlistener function', () => {
      const agora = Agora.create()

      const unlisten = Agora.listen(agora, () => {})

      expect(typeof unlisten).toBe('function')
    })

    test('calling the unlistener removes the citizen from the agora', () => {
      const agora = Agora.create()
      const listener = () => {}

      const unlisten = Agora.listen(agora, listener)

      unlisten()

      expect(agora.citizens.size).toBe(0)
      expect(agora.citizens.has(listener)).toBe(false)
    })

    test('multiple citizens can be registered independently', () => {
      const agora = Agora.create()

      Agora.listen(agora, () => {})
      Agora.listen(agora, () => {})
      Agora.listen(agora, () => {})

      expect(agora.citizens.size).toBe(3)
    })

    test('unlistener only removes its own citizen', () => {
      const agora = Agora.create<string>()
      const listener1 = (_: string) => {}
      const listener2 = (_: string) => {}

      const unlisten1 = Agora.listen(agora, listener1)

      Agora.listen(agora, listener2)

      unlisten1()

      expect(agora.citizens.size).toBe(1)
      expect(agora.citizens.has(listener2)).toBe(true)
    })
  })

  describe('inspect', () => {
    test('returns 0 citizens and 0 registry for an empty agora', () => {
      const agora = Agora.create()

      expect(Agora.inspect(agora)).toEqual({
        citizens: 0,
        registry: 0,
        frozen: false,
      })
    })

    test('returns the number of registered citizens', () => {
      const agora = Agora.create()

      Agora.listen(agora, () => {})
      Agora.listen(agora, () => {})

      expect(Agora.inspect(agora).citizens).toBe(2)
    })

    test('reflects the registry queue size', () => {
      const agora = Agora.create<number>()

      Agora.register(agora, 1)
      Agora.register(agora, 2)

      expect(Agora.inspect(agora).registry).toBe(2)
    })

    test('decrements citizens after an unlisten call', () => {
      const agora = Agora.create()
      const unlisten = Agora.listen(agora, () => {})

      Agora.listen(agora, () => {})

      unlisten()

      expect(Agora.inspect(agora).citizens).toBe(1)
    })

    test('returns 0 citizens and 0 registry after clear', () => {
      const agora = Agora.create<string>()

      Agora.listen(agora, () => {})
      Agora.listen(agora, () => {})
      Agora.register(agora, 'msg')

      Agora.clear(agora)

      expect(Agora.inspect(agora)).toEqual({
        citizens: 0,
        registry: 0,
        frozen: false,
      })
    })
  })

  describe('publish', () => {
    test('calls all citizens with the given payload', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.listen(agora, (msg) => received.push(msg))
      Agora.listen(agora, (msg) => received.push(msg))

      Agora.publish(agora, 'hello')

      expect(received).toEqual(['hello', 'hello'])
    })

    test('returns a left when all citizens succeed', () => {
      const agora = Agora.create<number>()
      Agora.listen(agora, () => {})

      const result = Agora.publish(agora, 42)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(true)
    })

    test('returns a right when a citizen throws', () => {
      const agora = Agora.create<number>()
      const err = new Error('citizen failed')

      Agora.listen(agora, () => {
        throw err
      })

      const result = Agora.publish(agora, 42)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([err])
    })

    test('continues calling remaining citizens after one throws', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.listen(agora, () => {
        throw new Error('boom')
      })
      Agora.listen(agora, (msg) => received.push(msg))

      Agora.publish(agora, 'test')

      expect(received).toEqual(['test'])
    })

    test('returns a left with no citizens', () => {
      const agora = Agora.create()

      const result = Agora.publish(agora)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(true)
    })

    test('works without a payload (undefined default)', () => {
      const agora = Agora.create()
      let called = false

      Agora.listen(agora, () => {
        called = true
      })

      Agora.publish(agora)

      expect(called).toBe(true)
    })
  })

  describe('register', () => {
    test('enqueues a payload into the registry', () => {
      const agora = Agora.create<string>()

      Agora.register(agora, 'queued')

      expect(agora.registry.size).toBe(1)
      expect(agora.registry.has('queued')).toBe(true)
    })

    test('multiple distinct payloads can be queued', () => {
      const agora = Agora.create<number>()

      Agora.register(agora, 1)
      Agora.register(agora, 2)
      Agora.register(agora, 3)

      expect(agora.registry.size).toBe(3)
    })

    test('works without a payload (undefined default)', () => {
      const agora = Agora.create()

      Agora.register(agora)

      expect(agora.registry.size).toBe(1)
    })

    test('does not notify citizens immediately', () => {
      const agora = Agora.create<string>()
      let called = false

      Agora.listen(agora, () => {
        called = true
      })
      Agora.register(agora, 'msg')

      expect(called).toBe(false)
    })
  })

  describe('dispatch', () => {
    test('dispatches each queued payload to each citizen', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.listen(agora, (msg) => received.push(msg))
      Agora.register(agora, 'first')
      Agora.register(agora, 'second')

      Agora.dispatch(agora)

      expect(received).toContain('first')
      expect(received).toContain('second')
    })

    test('dispatches each payload to every citizen', () => {
      const agora = Agora.create<number>()
      const calls: [string, number][] = []

      Agora.listen(agora, (n) => calls.push(['a', n]))
      Agora.listen(agora, (n) => calls.push(['b', n]))
      Agora.register(agora, 1)
      Agora.register(agora, 2)

      Agora.dispatch(agora)

      expect(calls.filter(([, n]) => n === 1).length).toBe(2)
      expect(calls.filter(([, n]) => n === 2).length).toBe(2)
    })

    test('clears the registry queue after dispatching', () => {
      const agora = Agora.create<string>()
      Agora.register(agora, 'msg')

      Agora.dispatch(agora)

      expect(agora.registry.size).toBe(0)
    })

    test('clears the queue even when a citizen throws', () => {
      const agora = Agora.create<string>()
      Agora.listen(agora, () => {
        throw new Error('boom')
      })
      Agora.register(agora, 'msg')

      Agora.dispatch(agora)

      expect(agora.registry.size).toBe(0)
    })

    test('returns a left when all dispatches succeed', () => {
      const agora = Agora.create<number>()
      Agora.listen(agora, () => {})
      Agora.register(agora, 1)

      const result = Agora.dispatch(agora)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(true)
    })

    test('returns a right when a citizen throws', () => {
      const agora = Agora.create<number>()
      const err = new Error('dispatch failed')
      Agora.listen(agora, () => {
        throw err
      })
      Agora.register(agora, 42)

      const result = Agora.dispatch(agora)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([[err]])
    })

    test('returns a left for an empty queue', () => {
      const agora = Agora.create()

      const result = Agora.dispatch(agora)

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
      expect(Agora.is({ citizens: new Set(), registry: new Set() })).toBe(false)
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

  describe('clear', () => {
    test('removes all citizens', () => {
      const agora = Agora.create()
      Agora.listen(agora, () => {})
      Agora.listen(agora, () => {})

      Agora.clear(agora)

      expect(agora.citizens.size).toBe(0)
    })

    test('citizens no longer receive announcements after clear', () => {
      const agora = Agora.create<string>()
      let called = false

      Agora.listen(agora, () => {
        called = true
      })

      Agora.clear(agora)
      Agora.publish(agora, 'msg')

      expect(called).toBe(false)
    })

    test('also clears the registry queue', () => {
      const agora = Agora.create<string>()
      Agora.register(agora, 'queued')

      Agora.clear(agora)

      expect(agora.registry.size).toBe(0)
    })
  })

  describe('freeze', () => {
    test('sets the frozen flag to true', () => {
      const agora = Agora.create()

      Agora.freeze(agora)

      expect(Agora.inspect(agora).frozen).toBe(true)
    })

    test('prevents publish and returns FrozenAgoraPtoma', () => {
      const agora = Agora.create<string>()

      Agora.listen(agora, () => {})
      Agora.freeze(agora)

      const result = Agora.publish(agora, 'hello')

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right instanceof Agora.FrozenAgoraPtoma).toBe(true)
    })

    test('prevents dispatch and returns FrozenAgoraPtoma', () => {
      const agora = Agora.create<string>()

      Agora.register(agora, 'queued')
      Agora.freeze(agora)

      const result = Agora.dispatch(agora)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right instanceof Agora.FrozenAgoraPtoma).toBe(true)
    })

    test('preserves citizens and registry while frozen', () => {
      const agora = Agora.create<string>()

      Agora.listen(agora, () => {})
      Agora.register(agora, 'msg')
      Agora.freeze(agora)

      expect(agora.citizens.size).toBe(1)
      expect(agora.registry.size).toBe(1)
    })
  })

  describe('unfreeze', () => {
    test('sets the frozen flag to false', () => {
      const agora = Agora.create()

      Agora.freeze(agora)
      Agora.unfreeze(agora)

      expect(Agora.inspect(agora).frozen).toBe(false)
    })

    test('allows publish again after unfreezing', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.listen(agora, (msg) => received.push(msg))
      Agora.freeze(agora)
      Agora.unfreeze(agora)

      const result = Agora.publish(agora, 'hello')

      expect(Zygon.isLeft(result)).toBe(true)
      expect(received).toEqual(['hello'])
    })

    test('allows dispatch again after unfreezing', () => {
      const agora = Agora.create<string>()
      const received: string[] = []

      Agora.listen(agora, (msg) => received.push(msg))
      Agora.register(agora, 'queued')
      Agora.freeze(agora)
      Agora.unfreeze(agora)

      const result = Agora.dispatch(agora)

      expect(Zygon.isLeft(result)).toBe(true)
      expect(received).toEqual(['queued'])
    })

    test('unfreezing a non-frozen agora is safe', () => {
      const agora = Agora.create()

      Agora.unfreeze(agora)

      expect(Agora.inspect(agora).frozen).toBe(false)
    })
  })

  describe('FrozenAgoraPtoma', () => {
    test('is an Error instance', () => {
      const ptoma = new Agora.FrozenAgoraPtoma('test message')

      expect(ptoma instanceof Error).toBe(true)
    })

    test('carries the provided message', () => {
      const ptoma = new Agora.FrozenAgoraPtoma('custom error')

      expect(ptoma.message).toBe('custom error')
    })

    test('has a name matching the ptoma type', () => {
      const ptoma = new Agora.FrozenAgoraPtoma('test')

      expect(ptoma.name).toBe('@herodot-app/agora/frozen-agora-ptoma')
    })

    test('is thrown by publish on frozen agora', () => {
      const agora = Agora.create()

      Agora.freeze(agora)

      const result = Agora.publish(agora)

      expect(result.right).toBeInstanceOf(Agora.FrozenAgoraPtoma)
    })

    test('is thrown by dispatch on frozen agora', () => {
      const agora = Agora.create()

      Agora.freeze(agora)

      const result = Agora.dispatch(agora)

      expect(result.right).toBeInstanceOf(Agora.FrozenAgoraPtoma)
    })
  })
})
