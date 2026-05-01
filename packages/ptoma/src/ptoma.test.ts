import { describe, expect, it } from 'bun:test'
import { Ptoma } from './ptoma'

describe('Ptoma.create', () => {
  it('creates an error class with the given name', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('something went wrong')

    expect(err.name).toBe('MyError')
    expect(err.message).toBe('something went wrong')
  })

  it('is an instance of Error', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops')

    expect(err).toBeInstanceOf(Error)
  })

  it('has a stack trace', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops')

    expect(err.stack).toBeDefined()
  })

  it('supports optional payload', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops')

    expect(err.payload).toBeUndefined()
  })

  it('accepts a payload', () => {
    const MyError = Ptoma.create<'MyError', { code: number }>('MyError')
    const err = new MyError('oops', { code: 42 })

    expect(err.payload).toEqual({ code: 42 })
  })

  it('accepts ErrorOptions (cause)', () => {
    const cause = new Error('root cause')
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops', undefined, { cause })

    expect(err.cause).toBe(cause)
  })

  it('creates independent error classes', () => {
    const ErrorA = Ptoma.create('ErrorA')
    const ErrorB = Ptoma.create('ErrorB')
    const errA = new ErrorA('a')
    const errB = new ErrorB('b')

    expect(errA).not.toBeInstanceOf(ErrorB)
    expect(errB).not.toBeInstanceOf(ErrorA)
  })

  it('instances of the same class are instanceof each other', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops')

    expect(err).toBeInstanceOf(MyError)
  })

  it('can be caught as Error', () => {
    const MyError = Ptoma.create('MyError')

    let caught: unknown
    try {
      throw new MyError('caught me')
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toBe('caught me')
  })

  it('preserves the name across multiple instances', () => {
    const MyError = Ptoma.create('ConsistentName')
    const err1 = new MyError('first')
    const err2 = new MyError('second')

    expect(err1.name).toBe('ConsistentName')
    expect(err2.name).toBe('ConsistentName')
  })
})

describe('Ptoma.is', () => {
  it('returns true for a ptoma error', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops')

    expect(Ptoma.is(err)).toBe(true)
  })

  it('returns false for a plain Error', () => {
    const err = new Error('plain')

    expect(Ptoma.is(err)).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(Ptoma.is(null)).toBe(false)
    expect(Ptoma.is(undefined)).toBe(false)
    expect(Ptoma.is(42)).toBe(false)
    expect(Ptoma.is('string')).toBe(false)
    expect(Ptoma.is({})).toBe(false)
  })

  it('returns true when name matches', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops')

    expect(Ptoma.is(err, 'MyError')).toBe(true)
  })

  it('returns false when name does not match', () => {
    const MyError = Ptoma.create('MyError')
    const err = new MyError('oops')

    expect(Ptoma.is(err, 'OtherError')).toBe(false)
  })

  it('narrows the type to Ptoma when no name given', () => {
    const MyError = Ptoma.create<'MyError', { code: number }>('MyError')
    const err: unknown = new MyError('oops', { code: 1 })

    if (Ptoma.is(err)) {
      expect(err.name).toBeDefined()
    }
  })

  it('narrows the type to Ptoma<N> when name is given', () => {
    const MyError = Ptoma.create<'MyError', { code: number }>('MyError')
    const err: unknown = new MyError('oops', { code: 99 })

    if (Ptoma.is<'MyError', { code: number }>(err, 'MyError')) {
      expect(err.payload).toEqual({ code: 99 })
    }
  })
})
