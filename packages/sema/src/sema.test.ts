import { describe, expect, test } from 'bun:test'
import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'
import { Derivation } from './derivation'
import { Sema } from './sema'

describe('Sema', () => {
  describe('identifier', () => {
    test('is a symbol', () => {
      expect(typeof Sema.identifier).toBe('symbol')
    })

    test('has correct description', () => {
      expect(Sema.identifier.description).toBe('@herodot-app/sema')
    })
  })

  describe('is', () => {
    test('detect sema instances', () => {
      const sema = Sema.create(45)

      expect(Sema.is(sema)).toBe(true)
      expect(Sema.is(45)).toBe(false)
    })
  })

  describe('create', () => {
    test('returns an Idion with sema identifier', () => {
      const sema = Sema.create(42)

      expect(Idion.is(sema, Sema.identifier)).toBe(true)
    })

    test('sets initialValue to the provided value', () => {
      const sema = Sema.create('hello')

      expect(sema.initialValue).toBe('hello')
    })

    test('sets valueRef to the provided value', () => {
      const sema = Sema.create('hello')

      expect(Rheon.read(sema.valueRef)).toBe('hello')
    })

    test('sets oldValueRef to the provided value', () => {
      const sema = Sema.create('hello')

      expect(Rheon.read(sema.oldValueRef)).toBe('hello')
    })

    test('initializes valueRef as a Rheon', () => {
      const sema = Sema.create(42)

      expect(Rheon.is(sema.valueRef)).toBe(true)
    })

    test('initializes oldValueRef as a Rheon', () => {
      const sema = Sema.create(42)

      expect(Rheon.is(sema.oldValueRef)).toBe(true)
    })

    test('initializes frozenRef as a Rheon with false', () => {
      const sema = Sema.create(42)

      expect(Rheon.read(sema.frozenRef)).toBe(false)
      expect(Rheon.is(sema.frozenRef)).toBe(true)
    })

    test('initializes empty citizens set', () => {
      const sema = Sema.create(42)

      expect(sema.citizens).toBeInstanceOf(Set)
      expect(sema.citizens.size).toBe(0)
    })

    test('initializes empty registry', () => {
      const sema = Sema.create(42)

      expect(sema.registry).toBeInstanceOf(Set)
      expect(sema.registry.size).toBe(0)
    })

    test('creates a sema with number value', () => {
      const sema = Sema.create(0)

      expect(Rheon.read(sema.valueRef)).toBe(0)
      expect(Rheon.read(sema.oldValueRef)).toBe(0)
      expect(sema.initialValue).toBe(0)
    })

    test('creates a sema with string value', () => {
      const sema = Sema.create('test')

      expect(Rheon.read(sema.valueRef)).toBe('test')
    })

    test('creates a sema with boolean value', () => {
      const sema = Sema.create(true)

      expect(Rheon.read(sema.valueRef)).toBe(true)
    })

    test('creates a sema with null value', () => {
      const sema = Sema.create<string | null>(null)

      expect(Rheon.read(sema.valueRef)).toBe(null)
    })

    test('creates a sema with undefined value', () => {
      const sema = Sema.create<number | undefined>(undefined)

      expect(Rheon.read(sema.valueRef)).toBe(undefined)
    })

    test('creates a sema with object value', () => {
      const obj = { x: 1, y: 2 }
      const sema = Sema.create(obj)

      expect(Rheon.read(sema.valueRef)).toBe(obj)
      expect(sema.initialValue).toBe(obj)
    })

    test('creates a sema with array value', () => {
      const arr = [1, 2, 3]
      const sema = Sema.create(arr)

      expect(Rheon.read(sema.valueRef)).toBe(arr)
    })

    test('creates a sema with Map value', () => {
      const map = new Map([['a', 1]])
      const sema = Sema.create(map)

      expect(Rheon.read(sema.valueRef)).toBe(map)
    })

    test('creates a sema with Set value', () => {
      const set = new Set([1, 2, 3])
      const sema = Sema.create(set)

      expect(Rheon.read(sema.valueRef)).toBe(set)
    })

    test('stores reference equality for object values', () => {
      const obj = { x: 1 }
      const sema = Sema.create(obj)

      expect(Rheon.read(sema.valueRef)).toBe(obj)
      expect(sema.initialValue).toBe(obj)
    })

    test('creates independent semas', () => {
      const semaA = Sema.create(1)
      const semaB = Sema.create(1)

      expect(semaA).not.toBe(semaB)
      expect(semaA.valueRef).not.toBe(semaB.valueRef)
      expect(semaA.oldValueRef).not.toBe(semaB.oldValueRef)
      expect(semaA.citizens).not.toBe(semaB.citizens)
      expect(semaA.registry).not.toBe(semaB.registry)
      expect(semaA.frozenRef).not.toBe(semaB.frozenRef)
    })
  })

  describe('read', () => {
    test('returns current value without selector', () => {
      const sema = Sema.create(42)

      expect(Sema.read(sema)).toBe(42)
    })

    test('returns projected value with selector', () => {
      const sema = Sema.create({ count: 10, name: 'Alice' })

      expect(Sema.read(sema, (s) => s.count)).toBe(10)
    })

    test('selector receives raw value not Rheon', () => {
      const sema = Sema.create({ x: 1 })
      let received: unknown

      Sema.read(sema, (v) => {
        received = v
      })

      expect(received).toEqual({ x: 1 })
    })

    test('reflects updated values', () => {
      const sema = Sema.create(0)

      Sema.write(sema, 99)

      expect(Sema.read(sema)).toBe(99)
    })

    test('works with string values', () => {
      const sema = Sema.create('hello')

      expect(Sema.read(sema, (s) => s.length)).toBe(5)
    })
  })

  describe('inspect', () => {
    test('returns snapshot with value and oldValue', () => {
      const sema = Sema.create(42)
      const snap = Sema.inspect(sema)

      expect(snap.value).toBe(42)
      expect(snap.oldValue).toBe(42)
    })

    test('includes citizens count', () => {
      const sema = Sema.create(0)

      Agora.listen(sema, () => {})
      Agora.listen(sema, () => {})

      expect(Sema.inspect(sema).citizens).toBe(2)
    })

    test('includes registry count', () => {
      const sema = Sema.create(0)

      Agora.register(sema, 1)
      Agora.register(sema, 2)

      expect(Sema.inspect(sema).registry).toBe(2)
    })

    test('includes frozen state', () => {
      const sema = Sema.create(0)

      expect(Sema.inspect(sema).frozen).toBe(false)
      Agora.freeze(sema)
      expect(Sema.inspect(sema).frozen).toBe(true)
    })

    test('snapshot reflects value after write', () => {
      const sema = Sema.create('before')

      Sema.write(sema, 'after')

      expect(Sema.inspect(sema).value).toBe('after')
    })

    test('snapshot reflects oldValue after value change', () => {
      const sema = Sema.create('initial')

      Sema.write(sema, 'updated')

      expect(Sema.inspect(sema).oldValue).toBe('initial')
    })

    test('each call returns a new snapshot object', () => {
      const sema = Sema.create(0)

      const a = Sema.inspect(sema)
      const b = Sema.inspect(sema)

      expect(a).not.toBe(b)
    })

    test('snapshot is immutable after read', () => {
      const sema = Sema.create(1)
      const snap = Sema.inspect(sema)

      Sema.write(sema, 999)

      expect(snap.value).toBe(1)
    })
  })

  describe('write', () => {
    test('updates value with direct value', () => {
      const sema = Sema.create(0)

      const result = Sema.write(sema, 42)

      expect(Sema.read(sema)).toBe(42)
      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('updates value with writer function', () => {
      const sema = Sema.create(5)

      Sema.write(sema, (n) => n * 2)

      expect(Sema.read(sema)).toBe(10)
    })

    test('returns left when all listeners succeed', () => {
      const sema = Sema.create(0)

      Agora.listen(sema, () => {})
      const result = Sema.write(sema, 1)

      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('returns right when a listener throws', () => {
      const sema = Sema.create(0)
      const err = new Error('boom')

      Agora.listen(sema, () => {
        throw err
      })
      const result = Sema.write(sema, 1)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([err])
    })

    test('notifies listeners with new value', () => {
      const sema = Sema.create(0)
      const received: number[] = []

      Agora.listen(sema, (v) => received.push(Number(v)))
      Sema.write(sema, 1)
      Sema.write(sema, 2)

      expect(received).toEqual([1, 2])
    })

    test('updates oldValueRef after change', () => {
      const sema = Sema.create('initial')

      Sema.write(sema, 'updated')

      expect(Rheon.read(sema.oldValueRef)).toBe('initial')
    })

    test('does not notify listeners when value is equal', () => {
      const sema = Sema.create('same')
      let callCount = 0

      Agora.listen(sema, () => {
        callCount++
      })
      Sema.write(sema, 'same')

      expect(callCount).toBe(0)
    })

    test('does not update oldValueRef when value is equal', () => {
      const sema = Sema.create('original')

      Sema.write(sema, 'changed')
      expect(Rheon.read(sema.oldValueRef)).toBe('original')
      Sema.write(sema, 'changed')

      expect(Rheon.read(sema.oldValueRef)).toBe('original')
    })

    test('uses custom equality predicate', () => {
      const sema = Sema.create({ id: 1, name: 'Alice' })
      const received: number[] = []

      Agora.listen(sema, () => {
        received.push(1)
      })
      Sema.write(sema, { id: 1, name: 'Bob' }, (a, b) => a.id === b.id)

      expect(received).toEqual([])
    })

    test('writes even when frozen but does not notify', () => {
      const sema = Sema.create(0)
      const received: number[] = []

      Agora.listen(sema, (v) => received.push(Number(v)))
      Agora.freeze(sema)
      Sema.write(sema, 42)

      expect(Sema.read(sema)).toBe(42)
      expect(received).toEqual([])
    })

    test('does not update oldValueRef when frozen', () => {
      const sema = Sema.create('initial')

      Agora.freeze(sema)
      Sema.write(sema, 'updated')

      expect(Rheon.read(sema.oldValueRef)).toBe('initial')
    })

    test('returns FrozenAgoraPtoma when frozen', () => {
      const sema = Sema.create(0)

      Agora.freeze(sema)
      const result = Sema.write(sema, 1)

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right instanceof Agora.FrozenAgoraPtoma).toBe(true)
    })
  })

  describe('reset', () => {
    test('restores sema to initial value', () => {
      const sema = Sema.create('original')

      Sema.write(sema, 'changed')
      Sema.reset(sema)

      expect(Sema.read(sema)).toBe('original')
    })

    test('does not notify if already at initial value', () => {
      const sema = Sema.create(0)
      let callCount = 0

      Agora.listen(sema, () => {
        callCount++
      })
      Sema.reset(sema)

      expect(callCount).toBe(0)
    })

    test('notifies listeners when value differs from initial', () => {
      const sema = Sema.create(0)
      const received: number[] = []

      Sema.write(sema, 5)
      Agora.listen(sema, (v) => received.push(Number(v)))
      Sema.reset(sema)

      expect(received).toEqual([0])
    })

    test('returns PublishZygon', () => {
      const sema = Sema.create(1)

      Sema.write(sema, 2)
      const result = Sema.reset(sema)

      expect(Zygon.isLeft(result)).toBe(true)
    })
  })

  describe('batch', () => {
    test('freezes sema during batcher execution', () => {
      const sema = Sema.create(0)
      let wasFrozen = false

      Agora.listen(sema, () => {
        wasFrozen = Rheon.read(sema.frozenRef)
      })
      Sema.batch(sema, () => {
        Sema.write(sema, 1)
        Sema.write(sema, 2)
        Sema.write(sema, 3)
      })

      expect(wasFrozen).toBe(false)
    })

    test('notifies listeners once after batcher completes', () => {
      const sema = Sema.create(0)
      const received: number[] = []

      Agora.listen(sema, (v) => received.push(Number(v)))
      Sema.batch(sema, () => {
        Sema.write(sema, 1)
        Sema.write(sema, 2)
        Sema.write(sema, 3)
      })

      expect(received).toEqual([3])
    })

    test('returns left when all listeners succeed', () => {
      const sema = Sema.create(0)

      Agora.listen(sema, () => {})
      const result = Sema.batch(sema, () => {
        Sema.write(sema, 1)
      })

      expect(Zygon.isLeft(result)).toBe(true)
    })

    test('returns right when a listener throws', () => {
      const sema = Sema.create(0)
      const err = new Error('boom')

      Agora.listen(sema, () => {
        throw err
      })
      const result = Sema.batch(sema, () => {
        Sema.write(sema, 1)
      })

      expect(Zygon.isRight(result)).toBe(true)
      expect(result.right).toEqual([err])
    })

    test('unfreezes sema after batcher completes', () => {
      const sema = Sema.create(0)

      Sema.batch(sema, () => {
        Sema.write(sema, 1)
      })

      expect(Rheon.read(sema.frozenRef)).toBe(false)
    })
  })

  describe('select', () => {
    test('creates a derivation from the source sema', () => {
      const source = Sema.create({ count: 0, name: 'Alice' })
      const derived = Sema.select(source, (s) => s.count)

      expect(Sema.read(derived)).toBe(0)
    })

    test('derivation stays in sync with source', () => {
      const source = Sema.create({ count: 0 })
      const derived = Sema.select(source, (s) => s.count)

      Sema.write(source, { count: 5 })

      expect(Sema.read(derived)).toBe(5)
    })

    test('suppresses propagation when selected value is equal', () => {
      const source = Sema.create({ count: 0, name: 'Alice' })
      const derived = Sema.select(source, (s) => s.count)
      const received: number[] = []

      Agora.listen(derived, (v) => received.push(v))
      Sema.write(source, { count: 0, name: 'Bob' })

      expect(received).toEqual([])
    })

    test('propagates when selected value differs', () => {
      const source = Sema.create({ count: 0 })
      const derived = Sema.select(source, (s) => s.count)
      const received: number[] = []

      Agora.listen(derived, (v) => received.push(v))
      Sema.write(source, { count: 1 })

      expect(received).toEqual([1])
    })

    test('uses custom equality', () => {
      const source = Sema.create({ id: 1, name: 'Alice' })
      const derived = Sema.select(
        source,
        (s) => s,
        (a, b) => a.id === b.id,
      )
      const received: number[] = []

      Agora.listen(derived, () => received.push(1))
      Sema.write(source, { id: 1, name: 'Bob' })

      expect(received).toEqual([])
    })

    test('select is a Derivation', () => {
      const source = Sema.create(0)
      const derived = Sema.select(source, (n) => n)

      expect(Derivation.is(derived)).toBe(true)
    })
  })
})
