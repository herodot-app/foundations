import { describe, expect, it } from 'bun:test'
import { Faculty } from './faculty'

describe('Faculty', () => {
  describe('Faculty.create', () => {
    it('creates an empty faculty', () => {
      const faculty = Faculty.create()

      expect(Faculty.has(faculty, 'service1')).toBe(false)
    })

    it('creates a faculty with initial values', () => {
      const faculty = Faculty.create({
        http: 'http-service',
        database: 'db-service',
      } as const)

      expect(Faculty.has(faculty, 'http')).toBe(true)
      expect(Faculty.has(faculty, 'database')).toBe(true)
      expect(Faculty.get(faculty, 'http')).toBe('http-service')
      expect(Faculty.get(faculty, 'database')).toBe('db-service')
    })
  })

  describe('Faculty.has', () => {
    it('returns true for existing key', () => {
      const faculty = Faculty.create({ service: 'value' })

      expect(Faculty.has(faculty, 'service')).toBe(true)
    })

    it('returns false for non-existing key', () => {
      const faculty = Faculty.create({ service: 'value' })

      expect(Faculty.has(faculty, 'missing')).toBe(false)
    })

    it('returns false for empty faculty', () => {
      const faculty = Faculty.create()

      expect(Faculty.has(faculty, 'any')).toBe(false)
    })
  })

  describe('Faculty.get', () => {
    it('retrieves value for existing key', () => {
      const faculty = Faculty.create({ service: 'my-service' })

      expect(Faculty.get(faculty, 'service')).toBe('my-service')
    })

    it('returns undefined for non-existing key', () => {
      const faculty = Faculty.create({ service: 'value' })

      // @ts-expect-error
      expect(Faculty.get(faculty, 'missing')).toBe(undefined)
    })

    it('returns undefined for empty faculty', () => {
      const faculty = Faculty.create()

      // @ts-expect-error
      expect(Faculty.get(faculty, 'any')).toBe(undefined)
    })
  })

  describe('Faculty.learn', () => {
    it('adds new keys to existing faculty', () => {
      const faculty = Faculty.create({ http: 'http-service' })

      const learned = Faculty.learn(faculty, {
        database: 'db-service',
        cache: 'redis',
      })

      expect(Faculty.get(learned, 'http')).toBe('http-service')
      expect(Faculty.get(learned, 'database')).toBe('db-service')
      expect(Faculty.get(learned, 'cache')).toBe('redis')
    })

    it('overwrites existing keys', () => {
      const faculty = Faculty.create({ service: 'old-value' })
      const learned = Faculty.learn(faculty, { service: 'new-value' })

      expect(Faculty.get(learned, 'service')).toBe('new-value')
    })

    it('learns on empty faculty', () => {
      const faculty = Faculty.create()
      const learned = Faculty.learn(faculty, { api: 'rest-api' })

      expect(Faculty.has(learned, 'api')).toBe(true)
      expect(Faculty.get(learned, 'api')).toBe('rest-api')
    })

    it('preserves original faculty unchanged', () => {
      const faculty = Faculty.create({ original: 'value' })

      Faculty.learn(faculty, { new: 'entry' })

      expect(Faculty.has(faculty, 'new')).toBe(false)
    })

    it('returns new faculty with merged types', () => {
      const faculty = Faculty.create({
        http: 'http-service',
      })

      const learned = Faculty.learn(faculty, {
        count: 42,
      })

      expect(Faculty.get(learned, 'http')).toBe('http-service')
      expect(Faculty.get(learned, 'count')).toBe(42)
    })
  })

  describe('Faculty type safety', () => {
    it('supports multiple service types', () => {
      const faculty = Faculty.create({
        http: 'http-service',
        database: 'db-service',
        cache: 'redis-service',
        counter: 0,
      })

      expect(Faculty.get(faculty, 'http')).toBe('http-service')
      expect(Faculty.get(faculty, 'database')).toBe('db-service')
      expect(Faculty.get(faculty, 'cache')).toBe('redis-service')
      expect(Faculty.get(faculty, 'counter')).toBe(0)
    })
  })

  describe('Faculty.merge', () => {
    it('merges two faculties', () => {
      const first = Faculty.create({ a: 1 })
      const second = Faculty.create({ b: 2 })

      const merged = Faculty.merge(first, second)

      expect(Faculty.get(merged, 'a')).toBe(1)
      expect(Faculty.get(merged, 'b')).toBe(2)
    })

    it('second faculty overwrites first on conflict', () => {
      const first = Faculty.create({ key: 'first' })
      const second = Faculty.create({ key: 'second' })

      const merged = Faculty.merge(first, second)

      expect(Faculty.get(merged, 'key')).toBe('second')
    })

    it('merges multiple services', () => {
      const first = Faculty.create({ http: 'service1', db: 'db1' })
      const second = Faculty.create({ cache: 'redis', logger: 'logger' })

      const merged = Faculty.merge(first, second)

      expect(Faculty.get(merged, 'http')).toBe('service1')
      expect(Faculty.get(merged, 'db')).toBe('db1')
      expect(Faculty.get(merged, 'cache')).toBe('redis')
      expect(Faculty.get(merged, 'logger')).toBe('logger')
    })

    it('preserves original faculties unchanged', () => {
      const first = Faculty.create({ original: 'value' })
      const second = Faculty.create({ other: 'data' })

      Faculty.merge(first, second)

      // @ts-expect-error
      expect(Faculty.get(first, 'other')).toBeUndefined()
      // @ts-expect-error
      expect(Faculty.get(second, 'original')).toBeUndefined()
    })
  })
})
