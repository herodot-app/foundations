import { describe, expect, test } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Signal } from './signal'

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

    test('initializes empty listeners set', () => {
      const signal = Signal.create(42)

      expect(signal.listeners).toBeInstanceOf(Set)
      expect(signal.listeners.size).toBe(0)
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
      expect(signalA.listeners).not.toBe(signalB.listeners)
      expect(signalA.frozenRef).not.toBe(signalB.frozenRef)
    })
  })
})
