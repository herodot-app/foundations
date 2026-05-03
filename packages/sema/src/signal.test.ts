import { describe, expect, test } from 'bun:test'
import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'
import { Signal } from './signal'
import { Derivation } from './derivation'

describe('Signal', () => {
  describe('identifier', () => {
    test('is a symbol', () => {
      expect(typeof Signal.identifier).toBe('symbol')
    })

    test('has correct description', () => {
      expect(Signal.identifier.description).toBe('@herodot-app/sema/signal')
    })
  })

  describe('is', () => {
    test('detect signal instances', () => {
      const signal = Signal.create(45)

      expect(Signal.is(signal)).toBe(true)
      expect(Signal.is(45)).toBe(false)
    })
  })

  describe('create', () => {
    test('returns an Idion with signal identifier', () => {
      const signal = Signal.create(42)

      expect(Idion.is(signal, Signal.identifier)).toBe(true)
    })

    test('sets initialValue to the provided value', () => {
      const signal = Signal.create('hello')

      expect(signal.initialValue).toBe('hello')
    })

    test('sets valueRef to the provided value', () => {
      const signal = Signal.create('hello')

      expect(Rheon.read(signal.valueRef)).toBe('hello')
    })

    test('sets oldValueRef to the provided value', () => {
      const signal = Signal.create('hello')

      expect(Rheon.read(signal.oldValueRef)).toBe('hello')
    })

    test('initializes valueRef as a Rheon', () => {
      const signal = Signal.create(42)

      expect(Rheon.is(signal.valueRef)).toBe(true)
    })

    test('initializes oldValueRef as a Rheon', () => {
      const signal = Signal.create(42)

      expect(Rheon.is(signal.oldValueRef)).toBe(true)
    })

    test('initializes frozenRef as a Rheon with false', () => {
      const signal = Signal.create(42)

      expect(Rheon.read(signal.frozenRef)).toBe(false)
      expect(Rheon.is(signal.frozenRef)).toBe(true)
    })

    test('initializes empty citizens set', () => {
      const signal = Signal.create(42)

      expect(signal.citizens).toBeInstanceOf(Set)
      expect(signal.citizens.size).toBe(0)
    })

    test('initializes empty registry', () => {
      const signal = Signal.create(42)

      expect(signal.registry).toBeInstanceOf(Set)
      expect(signal.registry.size).toBe(0)
    })

    test('creates a signal with number value', () => {
      const signal = Signal.create(0)

      expect(Rheon.read(signal.valueRef)).toBe(0)
      expect(Rheon.read(signal.oldValueRef)).toBe(0)
      expect(signal.initialValue).toBe(0)
    })

    test('creates a signal with string value', () => {
      const signal = Signal.create('test')

      expect(Rheon.read(signal.valueRef)).toBe('test')
    })

    test('creates a signal with boolean value', () => {
      const signal = Signal.create(true)

      expect(Rheon.read(signal.valueRef)).toBe(true)
    })

    test('creates a signal with null value', () => {
      const signal = Signal.create<string | null>(null)

      expect(Rheon.read(signal.valueRef)).toBe(null)
    })

    test('creates a signal with undefined value', () => {
      const signal = Signal.create<number | undefined>(undefined)

      expect(Rheon.read(signal.valueRef)).toBe(undefined)
    })

    test('creates a signal with object value', () => {
      const obj = { x: 1, y: 2 }
      const signal = Signal.create(obj)

      expect(Rheon.read(signal.valueRef)).toBe(obj)
      expect(signal.initialValue).toBe(obj)
    })

    test('creates a signal with array value', () => {
      const arr = [1, 2, 3]
      const signal = Signal.create(arr)

      expect(Rheon.read(signal.valueRef)).toBe(arr)
    })

    test('creates a signal with Map value', () => {
      const map = new Map([['a', 1]])
      const signal = Signal.create(map)

      expect(Rheon.read(signal.valueRef)).toBe(map)
    })

    test('creates a signal with Set value', () => {
      const set = new Set([1, 2, 3])
      const signal = Signal.create(set)

      expect(Rheon.read(signal.valueRef)).toBe(set)
    })

    test('stores reference equality for object values', () => {
      const obj = { x: 1 }
      const signal = Signal.create(obj)

      expect(Rheon.read(signal.valueRef)).toBe(obj)
      expect(signal.initialValue).toBe(obj)
    })

    test('creates independent signals', () => {
      const signalA = Signal.create(1)
      const signalB = Signal.create(1)

      expect(signalA).not.toBe(signalB)
      expect(signalA.valueRef).not.toBe(signalB.valueRef)
      expect(signalA.oldValueRef).not.toBe(signalB.oldValueRef)
      expect(signalA.citizens).not.toBe(signalB.citizens)
      expect(signalA.registry).not.toBe(signalB.registry)
      expect(signalA.frozenRef).not.toBe(signalB.frozenRef)
    })
  })

  describe('read', () => {
    test('returns current value without selector', () => {
      const signal = Signal.create(42)

      expect(Signal.read(signal)).toBe(42)
    })

    test('returns projected value with selector', () => {
      const signal = Signal.create({ count: 10, name: 'Alice' })

      expect(Signal.read(signal, (s) => s.count)).toBe(10)
    })

    test('selector receives raw value not Rheon', () => {
      const signal = Signal.create({ x: 1 })
      let received: unknown

      Signal.read(signal, (v) => {
        received = v
      })

      expect(received).toEqual({ x: 1 })
    })

    test('reflects updated values', () => {
      const signal = Signal.create(0)

      Signal.write(signal, 99)

      expect(Signal.read(signal)).toBe(99)
    })

    test('works with string values', () => {
      const signal = Signal.create('hello')

      expect(Signal.read(signal, (s) => s.length)).toBe(5)
    })
  })

  describe('inspect', () => {
    test('returns snapshot with value and oldValue', () => {
      const signal = Signal.create(42)
      const snap = Signal.inspect(signal)

      expect(snap.value).toBe(42)
      expect(snap.oldValue).toBe(42)
    })

    test('includes citizens count', () => {
      const signal = Signal.create(0)

      Agora.listen(signal, () => {})
      Agora.listen(signal, () => {})

      expect(Signal.inspect(signal).citizens).toBe(2)
    })

    test('includes registry count', () => {
      const signal = Signal.create(0)

      Agora.register(signal, 1)
      Agora.register(signal, 2)

      expect(Signal.inspect(signal).registry).toBe(2)
    })

    test('includes frozen state', () => {
      const signal = Signal.create(0)

      expect(Signal.inspect(signal).frozen).toBe(false)
      Agora.freeze(signal)
      expect(Signal.inspect(signal).frozen).toBe(true)
    })

    test('snapshot reflects value after write', () => {
      const signal = Signal.create('before')

      Signal.write(signal, 'after')

      expect(Signal.inspect(signal).value).toBe('after')
    })

    test('snapshot reflects oldValue after value change', () => {
      const signal = Signal.create('initial')

      Signal.write(signal, 'updated')

      expect(Signal.inspect(signal).oldValue).toBe('initial')
    })

    test('each call returns a new snapshot object', () => {
      const signal = Signal.create(0)

      const a = Signal.inspect(signal)
      const b = Signal.inspect(signal)

      expect(a).not.toBe(b)
    })

    test('snapshot is immutable after read', () => {
      const signal = Signal.create(1)
      const snap = Signal.inspect(signal)

      Signal.write(signal, 999)

      expect(snap.value).toBe(1)
    })
  })

  describe('write', () => {
    test('updates value with direct value', () => {
      const signal = Signal.create(0)

      const result = Signal.write(signal, 42)

      expect(Signal.read(signal)).toBe(42)
      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('updates value with writer function', () => {
      const signal = Signal.create(5)

      Signal.write(signal, (n) => n * 2)

      expect(Signal.read(signal)).toBe(10)
    })

    test('returns left when all listeners succeed', () => {
      const signal = Signal.create(0)

      Agora.listen(signal, () => {})
      const result = Signal.write(signal, 1)

      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('returns right when a listener throws', () => {
      const signal = Signal.create(0)
      const err = new Error('boom')

      Agora.listen(signal, () => {
        throw err
      })
      const result = Signal.write(signal, 1)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([err])
    })

    test('notifies listeners with new value', () => {
      const signal = Signal.create(0)
      const received: number[] = []

      Agora.listen(signal, (v) => received.push(Number(v)))
      Signal.write(signal, 1)
      Signal.write(signal, 2)

      expect(received).toEqual([1, 2])
    })

    test('updates oldValueRef after change', () => {
      const signal = Signal.create('initial')

      Signal.write(signal, 'updated')

      expect(Rheon.read(signal.oldValueRef)).toBe('initial')
    })

    test('does not notify listeners when value is equal', () => {
      const signal = Signal.create('same')
      let callCount = 0

      Agora.listen(signal, () => {
        callCount++
      })
      Signal.write(signal, 'same')

      expect(callCount).toBe(0)
    })

    test('does not update oldValueRef when value is equal', () => {
      const signal = Signal.create('original')

      Signal.write(signal, 'changed')
      expect(Rheon.read(signal.oldValueRef)).toBe('original')
      Signal.write(signal, 'changed')

      expect(Rheon.read(signal.oldValueRef)).toBe('original')
    })

    test('uses custom equality predicate', () => {
      const signal = Signal.create({ id: 1, name: 'Alice' })
      const received: number[] = []

      Agora.listen(signal, () => {
        received.push(1)
      })
      Signal.write(signal, { id: 1, name: 'Bob' }, (a, b) => a.id === b.id)

      expect(received).toEqual([])
    })

    test('writes even when frozen but does not notify', () => {
      const signal = Signal.create(0)
      const received: number[] = []

      Agora.listen(signal, (v) => received.push(Number(v)))
      Agora.freeze(signal)
      Signal.write(signal, 42)

      expect(Signal.read(signal)).toBe(42)
      expect(received).toEqual([])
    })

    test('does not update oldValueRef when frozen', () => {
      const signal = Signal.create('initial')

      Agora.freeze(signal)
      Signal.write(signal, 'updated')

      expect(Rheon.read(signal.oldValueRef)).toBe('initial')
    })

    test('returns FrozenAgoraPtoma when frozen', () => {
      const signal = Signal.create(0)

      Agora.freeze(signal)
      const result = Signal.write(signal, 1)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right instanceof Agora.FrozenAgoraPtoma).toBe(true)
    })
  })

  describe('reset', () => {
    test('restores signal to initial value', () => {
      const signal = Signal.create('original')

      Signal.write(signal, 'changed')
      Signal.reset(signal)

      expect(Signal.read(signal)).toBe('original')
    })

    test('does not notify if already at initial value', () => {
      const signal = Signal.create(0)
      let callCount = 0

      Agora.listen(signal, () => {
        callCount++
      })
      Signal.reset(signal)

      expect(callCount).toBe(0)
    })

    test('notifies listeners when value differs from initial', () => {
      const signal = Signal.create(0)
      const received: number[] = []

      Signal.write(signal, 5)
      Agora.listen(signal, (v) => received.push(Number(v)))
      Signal.reset(signal)

      expect(received).toEqual([0])
    })

    test('returns PublishZygon', () => {
      const signal = Signal.create(1)

      Signal.write(signal, 2)
      const result = Signal.reset(signal)

      expect(Zygon.isLeft(result)).toBe(true)
    })
  })

  describe('batch', () => {
    test('freezes signal during batcher execution', () => {
      const signal = Signal.create(0)
      let wasFrozen = false

      Agora.listen(signal, () => {
        wasFrozen = Rheon.read(signal.frozenRef)
      })
      Signal.batch(signal, () => {
        Signal.write(signal, 1)
        Signal.write(signal, 2)
        Signal.write(signal, 3)
      })

      expect(wasFrozen).toBe(false)
    })

    test('notifies listeners once after batcher completes', () => {
      const signal = Signal.create(0)
      const received: number[] = []

      Agora.listen(signal, (v) => received.push(Number(v)))
      Signal.batch(signal, () => {
        Signal.write(signal, 1)
        Signal.write(signal, 2)
        Signal.write(signal, 3)
      })

      expect(received).toEqual([3])
    })

    test('returns left when all listeners succeed', () => {
      const signal = Signal.create(0)

      Agora.listen(signal, () => {})
      const result = Signal.batch(signal, () => {
        Signal.write(signal, 1)
      })

      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('returns right when a listener throws', () => {
      const signal = Signal.create(0)
      const err = new Error('boom')

      Agora.listen(signal, () => {
        throw err
      })
      const result = Signal.batch(signal, () => {
        Signal.write(signal, 1)
      })

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([err])
    })

    test('unfreezes signal after batcher completes', () => {
      const signal = Signal.create(0)

      Signal.batch(signal, () => {
        Signal.write(signal, 1)
      })

      expect(Rheon.read(signal.frozenRef)).toBe(false)
    })
  })

  describe('select', () => {
    test('creates a derivation from the source signal', () => {
      const source = Signal.create({ count: 0, name: 'Alice' })
      const derived = Signal.select(source, (s) => s.count)

      expect(Signal.read(derived)).toBe(0)
    })

    test('derivation stays in sync with source', () => {
      const source = Signal.create({ count: 0 })
      const derived = Signal.select(source, (s) => s.count)

      Signal.write(source, { count: 5 })

      expect(Signal.read(derived)).toBe(5)
    })

    test('suppresses propagation when selected value is equal', () => {
      const source = Signal.create({ count: 0, name: 'Alice' })
      const derived = Signal.select(source, (s) => s.count)
      const received: number[] = []

      Agora.listen(derived, (v) => received.push(v))
      Signal.write(source, { count: 0, name: 'Bob' })

      expect(received).toEqual([])
    })

    test('propagates when selected value differs', () => {
      const source = Signal.create({ count: 0 })
      const derived = Signal.select(source, (s) => s.count)
      const received: number[] = []

      Agora.listen(derived, (v) => received.push(v))
      Signal.write(source, { count: 1 })

      expect(received).toEqual([1])
    })

    test('uses custom equality', () => {
      const source = Signal.create({ id: 1, name: 'Alice' })
      const derived = Signal.select(
        source,
        (s) => s,
        (a, b) => a.id === b.id,
      )
      const received: number[] = []

      Agora.listen(derived, () => received.push(1))
      Signal.write(source, { id: 1, name: 'Bob' })

      expect(received).toEqual([])
    })

    test('select is a Derivation', () => {
      const source = Signal.create(0)
      const derived = Signal.select(source, (n) => n)

      expect(Derivation.is(derived)).toBe(true)
    })
  })
})
