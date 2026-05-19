// biome-ignore-all lint/suspicious/noExplicitAny: any is fine here
// biome-ignore-all lint/style/noNonNullAssertion: we want non null assertion in this test
import { describe, expect, it } from 'bun:test'
import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import { Cerebrum } from './cerebrum'
import { Experience } from './experience'
import type { Faculty } from './faculty'
import { Pragma } from './pragma'
import { Synapse } from './synapse'

describe('Cerebrum', () => {
  const createTestSynapse = (value: number) => {
    const pragma = Pragma.create(
      (exp: Experience<number, any, Faculty.Any>) => {
        return exp.value.left! * 2
      },
    )

    return Synapse.create(
      [pragma] as const,
      Experience.create({ value: Zygon.left(value) }),
    )
  }

  describe('Cerebrum.create', () => {
    it('creates a Cerebrum with empty synapses', () => {
      const cerebrum = Cerebrum.create()

      expect(Cerebrum.size(cerebrum)).toBe(0)
    })

    it('creates a valid Idion', () => {
      const cerebrum = Cerebrum.create()

      expect(Idion.is(cerebrum, Cerebrum.identifier)).toBe(true)
    })
  })

  describe('Cerebrum.register', () => {
    it('registers a synapse to cerebrum', () => {
      const cerebrum = Cerebrum.create()
      const synapse = createTestSynapse(42)

      Cerebrum.register(cerebrum, synapse)

      expect(Cerebrum.has(cerebrum, synapse)).toBe(true)
      expect(Cerebrum.size(cerebrum)).toBe(1)
    })

    it('returns an unlistener function', () => {
      const cerebrum = Cerebrum.create()
      const synapse = createTestSynapse(1)

      const unlisten = Cerebrum.register(cerebrum, synapse)

      expect(typeof unlisten).toBe('function')
    })

    it('can register multiple synapses', () => {
      const cerebrum = Cerebrum.create()
      const synapse1 = createTestSynapse(1)
      const synapse2 = createTestSynapse(2)
      const synapse3 = createTestSynapse(3)

      Cerebrum.register(cerebrum, synapse1)
      Cerebrum.register(cerebrum, synapse2)
      Cerebrum.register(cerebrum, synapse3)

      expect(Cerebrum.size(cerebrum)).toBe(3)
    })

    it('auto-removes synapse when finished', async () => {
      const cerebrum = Cerebrum.create()
      const synapse = createTestSynapse(21)

      Cerebrum.register(cerebrum, synapse)

      expect(Cerebrum.size(cerebrum)).toBe(1)

      const result = await synapse

      expect(Zygon.isLeft(result)).toBe(true)
      expect(result.left).toBe(42)

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(Cerebrum.size(cerebrum)).toBe(0)
    })

    it('publishes synapse to cerebrum events', async () => {
      const cerebrum = Cerebrum.create()
      const synapse = createTestSynapse(10)

      let publishedSynapse: Synapse.Any | undefined

      Cerebrum.register(cerebrum, synapse)

      Agora.listen(cerebrum, (syn: Synapse.Any) => {
        publishedSynapse = syn
      })

      await synapse

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(publishedSynapse).toBe(synapse)
    })

    it('unlistener stops listening for status changes', () => {
      const cerebrum = Cerebrum.create()
      const synapse1 = createTestSynapse(1)
      const synapse2 = createTestSynapse(2)

      const unlisten1 = Cerebrum.register(cerebrum, synapse1)

      Cerebrum.register(cerebrum, synapse2)

      expect(Cerebrum.size(cerebrum)).toBe(2)

      unlisten1()

      expect(Cerebrum.has(cerebrum, synapse1)).toBe(true)
      expect(Cerebrum.has(cerebrum, synapse2)).toBe(true)
      expect(Cerebrum.size(cerebrum)).toBe(2)
    })
  })

  describe('Cerebrum.registerMany', () => {
    it('registers multiple synapses', () => {
      const cerebrum = Cerebrum.create()
      const synapse1 = createTestSynapse(1)
      const synapse2 = createTestSynapse(2)
      const synapse3 = createTestSynapse(3)

      Cerebrum.registerMany(cerebrum, [synapse1, synapse2, synapse3])

      expect(Cerebrum.size(cerebrum)).toBe(3)
    })

    it('returns single unlistener for all synapses', () => {
      const cerebrum = Cerebrum.create()
      const synapse1 = createTestSynapse(1)
      const synapse2 = createTestSynapse(2)

      const unlisten = Cerebrum.registerMany(cerebrum, [synapse1, synapse2])

      expect(typeof unlisten).toBe('function')

      unlisten()

      expect(Agora.inspect(cerebrum).registry).toBe(0)
    })
  })

  describe('Cerebrum.has', () => {
    it('returns true for registered synapse', () => {
      const cerebrum = Cerebrum.create()
      const synapse = createTestSynapse(1)

      Cerebrum.register(cerebrum, synapse)

      expect(Cerebrum.has(cerebrum, synapse)).toBe(true)
    })

    it('returns false for unregistered synapse', () => {
      const cerebrum = Cerebrum.create()
      const synapse = createTestSynapse(1)

      expect(Cerebrum.has(cerebrum, synapse)).toBe(false)
    })
  })

  describe('Cerebrum.size', () => {
    it('returns 0 for empty cerebrum', () => {
      const cerebrum = Cerebrum.create()

      expect(Cerebrum.size(cerebrum)).toBe(0)
    })

    it('returns correct count after registrations', () => {
      const cerebrum = Cerebrum.create()
      const synapse1 = createTestSynapse(1)
      const synapse2 = createTestSynapse(2)

      expect(Cerebrum.size(cerebrum)).toBe(0)

      Cerebrum.register(cerebrum, synapse1)
      expect(Cerebrum.size(cerebrum)).toBe(1)

      Cerebrum.register(cerebrum, synapse2)
      expect(Cerebrum.size(cerebrum)).toBe(2)
    })

    it('decrements after synapse finishes', async () => {
      const cerebrum = Cerebrum.create()
      const synapse = createTestSynapse(5)

      Cerebrum.register(cerebrum, synapse)
      expect(Cerebrum.size(cerebrum)).toBe(1)

      await synapse

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(Cerebrum.size(cerebrum)).toBe(0)
    })
  })

  describe('Cerebrum.snap', () => {
    it('returns snapshot of all synapses', () => {
      const synapse1 = createTestSynapse(5)
      const synapse2 = createTestSynapse(10)
      const cerebrum = Cerebrum.create()

      Cerebrum.register(cerebrum, synapse1)
      Cerebrum.register(cerebrum, synapse2)

      const snapshot = Cerebrum.snap(cerebrum)

      expect(Object.keys(snapshot).length).toBe(2)
      expect(snapshot[synapse1.pid.id]?.pid).toBe(synapse1.pid.id)
      expect(snapshot[synapse1.pid.id]?.status).toBe(Synapse.Status.Idle)
    })

    it('returns empty object for empty cerebrum', () => {
      const cerebrum = Cerebrum.create()
      const snapshot = Cerebrum.snap(cerebrum)

      expect(Object.keys(snapshot).length).toBe(0)
    })
  })
})
