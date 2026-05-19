// biome-ignore-all lint/style/noNonNullAssertion: used by the tests
// biome-ignore-all lint/suspicious/noExplicitAny: used by the tests
import { describe, expect, it } from 'bun:test'
import { Idion } from '@herodot-app/idion'
import { SynapseId } from './synapse-id'

describe('SynapseId', () => {
  describe('SynapseId.create', () => {
    it('creates a SynapseId that is a valid Idion', () => {
      const synapseId = SynapseId.create()

      expect(Idion.is(synapseId, SynapseId.identifier)).toBe(true)
    })

    it('returns a SynapseId that is a string', () => {
      const synapseId = SynapseId.create()

      expect(typeof synapseId.id).toBe('string')
    })

    it('creates a SynapseId with correct format (8-4-4-4-12)', () => {
      const synapseId = SynapseId.create()
      const parts = synapseId.id.split('-')

      expect(parts).toHaveLength(5)
      expect(parts[0]).toHaveLength(8)
      expect(parts[1]).toHaveLength(4)
      expect(parts[2]).toHaveLength(4)
      expect(parts[3]).toHaveLength(4)
      expect(parts[4]).toHaveLength(12)
    })

    it('creates a SynapseId with third group starting with 4 (UUID v4)', () => {
      const synapseId = SynapseId.create()
      const thirdGroup = synapseId.id.split('-').at(2)

      expect(thirdGroup?.startsWith('4')).toBe(true)
    })

    it('creates a SynapseId with fourth group starting with 8-b', () => {
      const synapseId = SynapseId.create()
      const fourthGroup = synapseId.id.split('-').at(3)
      const firstHexDigit = fourthGroup?.at(0)

      expect(['8', '9', 'a', 'b', 'A', 'B']).toContain(firstHexDigit!)
    })

    it('creates unique SynapseIds on multiple calls', () => {
      const ids: string[] = []

      for (let i = 0; i < 10_000; i++) {
        const pid = SynapseId.create()

        expect(ids.includes(pid.id)).toBeFalse()

        ids.push(SynapseId.create().id)
      }

      expect(ids.length).toBe(10_000)
    })

    it('creates SynapseIds containing only hex characters', () => {
      const synapseId = SynapseId.create()
      const hexPattern = /^[0-9a-f-]+$/i

      expect(hexPattern.test(synapseId.id)).toBe(true)
    })
  })

  describe('SynapseId.identifier', () => {
    it('is a Symbol', () => {
      expect(typeof SynapseId.identifier).toBe('symbol')
    })

    it('has correct symbol description', () => {
      expect(SynapseId.identifier.description).toBe(
        '@herodot-app/praxis/synapse-id',
      )
    })
  })
})
