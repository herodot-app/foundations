import { describe, expect, test } from 'bun:test'
import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Derivation } from './derivation'
import { Equality } from './equality'
import { Sema } from './sema'

describe('Derivation', () => {
  describe('identifier', () => {
    test('is a symbol', () => {
      expect(typeof Derivation.identifier).toBe('symbol')
    })

    test('has correct description', () => {
      expect(Derivation.identifier.description).toBe(
        '@herodot-app/sema/derivation',
      )
    })
  })

  describe('is', () => {
    test('returns true for a derivation', () => {
      const source = Sema.create({ count: 0 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.count,
      })

      expect(Derivation.is(derived)).toBe(true)
    })

    test('returns false for a plain sema', () => {
      const sema = Sema.create(0)

      expect(Derivation.is(sema)).toBe(false)
    })

    test('returns false for non-signal values', () => {
      expect(Derivation.is(null)).toBe(false)
      expect(Derivation.is(undefined)).toBe(false)
      expect(Derivation.is(42)).toBe(false)
      expect(Derivation.is({})).toBe(false)
    })

    test('narrows type in conditional branch', () => {
      const source = Sema.create({ count: 0 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.count,
      })

      expect(derived.selector).toBeDefined()
      expect(derived.sema).toBe(source)
    })
  })

  describe('create', () => {
    test('returns a Sema<R> branded with derivation identifier', () => {
      const source = Sema.create({ x: 1 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.x,
      })

      expect(Idion.is(derived, Derivation.identifier)).toBe(true)
    })

    test('initialises with the selector applied to current source value', () => {
      const source = Sema.create({ count: 42 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.count,
      })

      expect(Sema.read(derived)).toBe(42)
    })

    test('derivation is itself a Sema', () => {
      const source = Sema.create({ count: 0 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.count,
      })

      expect(Sema.is(derived)).toBe(true)
    })

    test('stores the selector', () => {
      const source = Sema.create({ x: 1 })
      const selector = (s: { x: number }) => s.x
      const derived = Derivation.create({ sema: source, selector })

      expect(derived.selector).toBe(selector)
    })

    test('stores the source signal reference', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n,
      })

      expect(derived.sema).toBe(source)
    })

    test('stores the equality function', () => {
      const source = Sema.create({ x: 1 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.x,
      })

      expect(derived.equality).toBe(Equality.check)
    })

    test('stores a custom equality function', () => {
      const source = Sema.create({ x: 1 })
      const customEquality: Equality<number, number> = (a, b) => a === b
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.x,
        equality: customEquality,
      })

      expect(derived.equality).toBe(customEquality)
    })

    test('stores the unbind function', () => {
      const source = Sema.create({ x: 1 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.x,
      })

      expect(typeof derived.unbind).toBe('function')
    })

    test('updates when source changes', () => {
      const source = Sema.create({ count: 0 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.count,
      })

      expect(Sema.read(derived)).toBe(0)

      Sema.write(source, { count: 5 })

      expect(Sema.read(derived)).toBe(5)
    })

    test('propagates nested property changes', () => {
      const source = Sema.create({ user: { name: 'Alice' } })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.user.name,
      })

      Sema.write(source, { user: { name: 'Bob' } })

      expect(Sema.read(derived)).toBe('Bob')
    })

    test('works with identity selector', () => {
      const source = Sema.create(42)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n,
      })

      expect(Sema.read(derived)).toBe(42)

      Sema.write(source, 99)

      expect(Sema.read(derived)).toBe(99)
    })

    test('works with constant selector', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: () => 'static',
      })

      expect(Sema.read(derived)).toBe('static')

      Sema.write(source, 1)

      expect(Sema.read(derived)).toBe('static')
    })

    test('suppresses propagation when selected value is equal', () => {
      const source = Sema.create({ count: 0, name: 'Alice' })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.count,
      })
      const received: number[] = []

      Agora.listen(derived, (v) => received.push(v))

      Sema.write(source, { count: 0, name: 'Bob' })

      expect(received).toEqual([])
    })

    test('propagates when selected value differs', () => {
      const source = Sema.create({ count: 0 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s.count,
      })
      const received: number[] = []

      Agora.listen(derived, (v) => received.push(v))
      Sema.write(source, { count: 1 })

      expect(received).toEqual([1])
    })

    test('uses custom equality to suppress propagation', () => {
      const source = Sema.create({ id: 1, name: 'Alice' })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s,
        equality: (a, b) => a.id === b.id,
      })
      const received: number[] = []

      Agora.listen(derived, () => received.push(1))
      Sema.write(source, { id: 1, name: 'Bob' })

      expect(received).toEqual([])
    })

    test('uses custom equality to allow propagation', () => {
      const source = Sema.create({ id: 1 })
      const derived = Derivation.create({
        sema: source,
        selector: (s) => s,
        equality: (a, b) => a.id === b.id,
      })
      const received: number[] = []

      Agora.listen(derived, () => received.push(1))
      Sema.write(source, { id: 2 })

      expect(received).toEqual([1])
    })

    test('can be composed — derivation of a derivation', () => {
      const source = Sema.create({ x: 1, y: 2 })
      const derivedA = Derivation.create({
        sema: source,
        selector: (s) => s.x + s.y,
      })
      const derivedB = Derivation.create({
        sema: derivedA,
        selector: (n) => n * 2,
      })

      expect(Sema.read(derivedB)).toBe(6)

      Sema.write(source, { x: 10, y: 20 })

      expect(Sema.read(derivedA)).toBe(30)
      expect(Sema.read(derivedB)).toBe(60)
    })

    test('supports listeners on the derivation', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n * 10,
      })
      const received: number[] = []

      Agora.listen(derived, (v) => received.push(v))
      Sema.write(source, 1)
      Sema.write(source, 2)
      Sema.write(source, 3)

      expect(received).toEqual([10, 20, 30])
    })

    test('shares frozenRef with source signal', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n,
      })

      expect(derived.frozenRef).toBe(source.frozenRef)
    })
  })

  describe('unbind', () => {
    test('stops derivation from updating after source changes', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n * 2,
      })

      expect(Sema.read(derived)).toBe(0)

      Sema.write(source, 5)

      expect(Sema.read(derived)).toBe(10)

      Derivation.unbind(derived)

      Sema.write(source, 10)

      expect(Sema.read(derived)).toBe(10)
    })

    test('unbind is idempotent', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n,
      })

      Derivation.unbind(derived)
      Derivation.unbind(derived)

      Sema.write(source, 1)

      expect(Sema.read(derived)).toBe(0)
    })

    test('unbind allows garbage collection of derivation listeners', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n,
      })
      let callCount = 0

      Agora.listen(derived, () => {
        callCount++
      })
      Derivation.unbind(derived)
      Sema.write(source, 1)

      expect(callCount).toBe(0)
    })

    test('unbind does not affect source signal listeners', () => {
      const source = Sema.create(0)
      const derived = Derivation.create({
        sema: source,
        selector: (n) => n,
      })
      const sourceReceived: number[] = []

      Agora.listen(source, (v) => sourceReceived.push(v))
      Derivation.unbind(derived)
      Sema.write(source, 1)
      Sema.write(source, 2)

      expect(sourceReceived).toEqual([1, 2])
    })
  })
})
