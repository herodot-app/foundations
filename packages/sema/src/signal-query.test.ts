import { describe, expect, test } from 'bun:test'
import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Signal } from './signal'
import { SignalQuery } from './signal-query'

describe('SignalQuery', () => {
  describe('identifier', () => {
    test('is a symbol', () => {
      expect(typeof SignalQuery.identifier).toBe('symbol')
    })

    test('has correct description', () => {
      expect(SignalQuery.identifier.description).toBe(
        '@herodot-app/sema/signal-query',
      )
    })
  })

  describe('create', () => {
    test('returns an Idion with signal-query identifier', () => {
      const signal = Signal.create(42)
      const query = SignalQuery.create(signal)

      expect(Idion.is(query, SignalQuery.identifier)).toBe(true)
    })

    test('creates independent query instances for same signal', () => {
      const signal = Signal.create(0)
      const queryA = SignalQuery.create(signal)
      const queryB = SignalQuery.create(signal)

      expect(queryA).not.toBe(queryB)
    })

    test('read returns current value without selector', () => {
      const signal = Signal.create('hello')
      const query = SignalQuery.create(signal)

      expect(query.read()).toBe('hello')
    })

    test('read reflects value after mutation', () => {
      const signal = Signal.create(0)
      const query = SignalQuery.create(signal)

      Rheon.write(signal.valueRef, 42)

      expect(query.read()).toBe(42)
    })

    test('read with selector projects the value', () => {
      const signal = Signal.create({ count: 10, name: 'Alice' })
      const query = SignalQuery.create(signal)

      expect(query.read((s) => s.count)).toBe(10)
    })

    test('read with selector returns projected type', () => {
      const signal = Signal.create({ items: [1, 2, 3] })
      const query = SignalQuery.create(signal)

      const length = query.read((s) => s.items.length)

      expect(length).toBe(3)
    })

    test('read with selector sees updated values', () => {
      const signal = Signal.create({ x: 1, y: 2 })
      const query = SignalQuery.create(signal)

      Rheon.write(signal.valueRef, { x: 10, y: 20 })

      expect(query.read((s) => s.x + s.y)).toBe(30)
    })

    test('read with selector works with primitive values', () => {
      const signal = Signal.create(42)
      const query = SignalQuery.create(signal)

      expect(query.read((n) => n * 2)).toBe(84)
    })

    test('read with selector works with null values', () => {
      const signal = Signal.create<string | null>(null)
      const query = SignalQuery.create(signal)

      expect(query.read((v) => v === null)).toBe(true)
    })

    test('read with selector works with undefined values', () => {
      const signal = Signal.create<number | undefined>(undefined)
      const query = SignalQuery.create(signal)

      expect(query.read((v) => v === undefined)).toBe(true)
    })

    test('read with selector receives the raw value not the rheon', () => {
      const signal = Signal.create({ a: 1 })
      const query = SignalQuery.create(signal)
      let received: unknown

      query.read((v) => {
        received = v
      })

      expect(received).toEqual({ a: 1 })
      expect(received).not.toBe(signal.valueRef)
    })
  })

  describe('inspect', () => {
    test('returns a snapshot with value and oldValue', () => {
      const signal = Signal.create(42)
      const query = SignalQuery.create(signal)

      const snap = query.inspect()

      expect(snap.value).toBe(42)
      expect(snap.oldValue).toBe(42)
    })

    test('snapshot includes Agora citizens count', () => {
      const signal = Signal.create(0)
      const query = SignalQuery.create(signal)

      Agora.listen(signal, () => {})
      Agora.listen(signal, () => {})

      expect(query.inspect().citizens).toBe(2)
    })

    test('snapshot includes registry count', () => {
      const signal = Signal.create(0)
      const query = SignalQuery.create(signal)

      Agora.register(signal, 1)
      Agora.register(signal, 2)

      expect(query.inspect().registry).toBe(2)
    })

    test('snapshot includes frozen state', () => {
      const signal = Signal.create(0)
      const query = SignalQuery.create(signal)

      expect(query.inspect().frozen).toBe(false)
      Agora.freeze(signal)
      expect(query.inspect().frozen).toBe(true)
    })

    test('snapshot reflects current value after mutation', () => {
      const signal = Signal.create('before')
      const query = SignalQuery.create(signal)

      Rheon.write(signal.valueRef, 'after')

      expect(query.inspect().value).toBe('after')
    })

    test('snapshot reflects oldValue after mutation', () => {
      const signal = Signal.create('initial')
      const query = SignalQuery.create(signal)

      Rheon.write(signal.oldValueRef, 'previous')

      expect(query.inspect().oldValue).toBe('previous')
    })

    test('snapshot is a plain object', () => {
      const signal = Signal.create(0)
      const query = SignalQuery.create(signal)

      const snap = query.inspect()

      expect(typeof snap).toBe('object')
      expect(snap).not.toBe(signal)
    })

    test('each inspect call returns a new snapshot object', () => {
      const signal = Signal.create(0)
      const query = SignalQuery.create(signal)

      const snapA = query.inspect()
      const snapB = query.inspect()

      expect(snapA).not.toBe(snapB)
    })

    test('snapshot does not update when signal changes', () => {
      const signal = Signal.create(1)
      const query = SignalQuery.create(signal)

      const snap = query.inspect()

      Rheon.write(signal.valueRef, 999)

      expect(snap.value).toBe(1)
    })

    test('snapshot works with object values', () => {
      const obj = { x: 1, y: 2 }
      const signal = Signal.create(obj)
      const query = SignalQuery.create(signal)

      const snap = query.inspect()

      expect(snap.value).toBe(obj)
    })

    test('snapshot works with array values', () => {
      const arr = [1, 2, 3]
      const signal = Signal.create(arr)
      const query = SignalQuery.create(signal)

      const snap = query.inspect()

      expect(snap.value).toBe(arr)
    })
  })
})
