// biome-ignore-all lint/style/noNonNullAssertion: used by the tests
// biome-ignore-all lint/suspicious/noExplicitAny: used by the tests
import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { ProcessId } from './process-id'

describe('ProcessId', () => {
  describe('ProcessId.create', () => {
    it('creates a ProcessId that is a valid Idion', () => {
      const processId = ProcessId.create()

      expect(Idion.is(processId, ProcessId.identifier)).toBe(true)
    })

    it('returns a ProcessId that is a string', () => {
      const processId = ProcessId.create()

      expect(typeof processId.id).toBe('string')
    })

    it('creates a ProcessId with correct format (8-4-4-4-12)', () => {
      const processId = ProcessId.create()
      const parts = processId.id.split('-')

      expect(parts).toHaveLength(5)
      expect(parts[0]).toHaveLength(8)
      expect(parts[1]).toHaveLength(4)
      expect(parts[2]).toHaveLength(4)
      expect(parts[3]).toHaveLength(4)
      expect(parts[4]).toHaveLength(12)
    })

    it('creates a ProcessId with third group starting with 4 (UUID v4)', () => {
      const processId = ProcessId.create()
      const thirdGroup = processId.id.split('-').at(2)

      expect(thirdGroup?.startsWith('4')).toBe(true)
    })

    it('creates a ProcessId with fourth group starting with 8-b', () => {
      const processId = ProcessId.create()
      const fourthGroup = processId.id.split('-').at(3)
      const firstHexDigit = fourthGroup?.at(0)

      expect(['8', '9', 'a', 'b', 'A', 'B']).toContain(firstHexDigit!)
    })

    it('creates unique ProcessIds on multiple calls', () => {
      const ids: string[] = []

      for (let i = 0; i < 10_000; i++) {
        const pid = ProcessId.create()

        expect(ids.includes(pid.id)).toBeFalse()

        ids.push(ProcessId.create().id)
      }

      expect(ids.length).toBe(10_000)
    })

    it('creates ProcessIds containing only hex characters', () => {
      const processId = ProcessId.create()
      const hexPattern = /^[0-9a-f-]+$/i

      expect(hexPattern.test(processId.id)).toBe(true)
    })
  })

  describe('ProcessId.identifier', () => {
    it('is a Symbol', () => {
      expect(typeof ProcessId.identifier).toBe('symbol')
    })

    it('has correct symbol description', () => {
      expect(ProcessId.identifier.description).toBe(
        '@herodot-app/pracis/process-id',
      )
    })
  })
})
