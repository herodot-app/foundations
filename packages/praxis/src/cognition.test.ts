import { describe, expect, it } from 'bun:test'
import { Cognition } from './cognition'

describe('Cognition', () => {
  describe('Cognition.create', () => {
    it('creates an empty cognition', () => {
      const cognition = Cognition.create()

      expect(Cognition.has(cognition, 'service1')).toBe(false)
    })

    it('creates a cognition with initial values', () => {
      const cognition = Cognition.create({
        http: 'http-service',
        database: 'db-service',
      } as const)

      expect(Cognition.has(cognition, 'http')).toBe(true)
      expect(Cognition.has(cognition, 'database')).toBe(true)
      expect(Cognition.get(cognition, 'http')).toBe('http-service')
      expect(Cognition.get(cognition, 'database')).toBe('db-service')
    })
  })

  describe('Cognition.has', () => {
    it('returns true for existing key', () => {
      const cognition = Cognition.create({ service: 'value' })

      expect(Cognition.has(cognition, 'service')).toBe(true)
    })

    it('returns false for non-existing key', () => {
      const cognition = Cognition.create({ service: 'value' })

      expect(Cognition.has(cognition, 'missing')).toBe(false)
    })

    it('returns false for empty cognition', () => {
      const cognition = Cognition.create()

      expect(Cognition.has(cognition, 'any')).toBe(false)
    })
  })

  describe('Cognition.get', () => {
    it('retrieves value for existing key', () => {
      const cognition = Cognition.create({ service: 'my-service' })

      expect(Cognition.get(cognition, 'service')).toBe('my-service')
    })

    it('returns undefined for non-existing key', () => {
      const cognition = Cognition.create({ service: 'value' })

      // @ts-expect-error
      expect(Cognition.get(cognition, 'missing')).toBe(undefined)
    })

    it('returns undefined for empty cognition', () => {
      const cognition = Cognition.create()

      // @ts-expect-error
      expect(Cognition.get(cognition, 'any')).toBe(undefined)
    })
  })

  describe('Cognition.learn', () => {
    it('adds new keys to existing cognition', () => {
      const cognition = Cognition.create({ http: 'http-service' })

      const learned = Cognition.learn(cognition, {
        database: 'db-service',
        cache: 'redis',
      })

      expect(Cognition.get(learned, 'http')).toBe('http-service')
      expect(Cognition.get(learned, 'database')).toBe('db-service')
      expect(Cognition.get(learned, 'cache')).toBe('redis')
    })

    it('overwrites existing keys', () => {
      const cognition = Cognition.create({ service: 'old-value' })
      const learned = Cognition.learn(cognition, { service: 'new-value' })

      expect(Cognition.get(learned, 'service')).toBe('new-value')
    })

    it('learns on empty cognition', () => {
      const cognition = Cognition.create()
      const learned = Cognition.learn(cognition, { api: 'rest-api' })

      expect(Cognition.has(learned, 'api')).toBe(true)
      expect(Cognition.get(learned, 'api')).toBe('rest-api')
    })

    it('preserves original cognition unchanged', () => {
      const cognition = Cognition.create({ original: 'value' })

      Cognition.learn(cognition, { new: 'entry' })

      expect(Cognition.has(cognition, 'new')).toBe(false)
    })

    it('returns new cognition with merged types', () => {
      const cognition = Cognition.create({
        http: 'http-service',
      })

      const learned = Cognition.learn(cognition, {
        count: 42,
      })

      expect(Cognition.get(learned, 'http')).toBe('http-service')
      expect(Cognition.get(learned, 'count')).toBe(42)
    })
  })

  describe('Cognition type safety', () => {
    it('supports multiple service types', () => {
      const cognition = Cognition.create({
        http: 'http-service',
        database: 'db-service',
        cache: 'redis-service',
        counter: 0,
      })

      expect(Cognition.get(cognition, 'http')).toBe('http-service')
      expect(Cognition.get(cognition, 'database')).toBe('db-service')
      expect(Cognition.get(cognition, 'cache')).toBe('redis-service')
      expect(Cognition.get(cognition, 'counter')).toBe(0)
    })
  })

  describe('Cognition.merge', () => {
    it('merges two cognitions', () => {
      const first = Cognition.create({ a: 1 })
      const second = Cognition.create({ b: 2 })

      const merged = Cognition.merge(first, second)

      expect(Cognition.get(merged, 'a')).toBe(1)
      expect(Cognition.get(merged, 'b')).toBe(2)
    })

    it('second cognition overwrites first on conflict', () => {
      const first = Cognition.create({ key: 'first' })
      const second = Cognition.create({ key: 'second' })

      const merged = Cognition.merge(first, second)

      expect(Cognition.get(merged, 'key')).toBe('second')
    })

    it('merges multiple services', () => {
      const first = Cognition.create({ http: 'service1', db: 'db1' })
      const second = Cognition.create({ cache: 'redis', logger: 'logger' })

      const merged = Cognition.merge(first, second)

      expect(Cognition.get(merged, 'http')).toBe('service1')
      expect(Cognition.get(merged, 'db')).toBe('db1')
      expect(Cognition.get(merged, 'cache')).toBe('redis')
      expect(Cognition.get(merged, 'logger')).toBe('logger')
    })

    it('preserves original cognitions unchanged', () => {
      const first = Cognition.create({ original: 'value' })
      const second = Cognition.create({ other: 'data' })

      Cognition.merge(first, second)

      // @ts-expect-error
      expect(Cognition.get(first, 'other')).toBeUndefined()
      // @ts-expect-error
      expect(Cognition.get(second, 'original')).toBeUndefined()
    })
  })
})
