import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Sema } from '@herodot-app/sema'
import { Zygon } from '@herodot-app/zygon'
import { Synapse } from './synapse'
import type { SynapseId } from './synapse-id'

export type Cerebrum = Agora<Synapse.Any> &
  Idion<
    Cerebrum.Identifier,
    {
      synapses: Map<SynapseId['id'], Synapse.Any>
    }
  >

export namespace Cerebrum {
  export const identifier = Symbol.for('@herodot-app/praxis/cerebrum')

  export type Identifier = typeof identifier

  export type Snapshot = {
    [K in string]: {
      readonly pid: string
      readonly status: Synapse.Status
      readonly valueKind?: 'left' | 'right'
    }
  }

  export function create(): Cerebrum {
    const agora = Agora.create<Synapse.Any>()

    return Idion.create({
      id: identifier,
      value: Object.assign({}, agora, { synapses: new Map() }),
    })
  }

  export function register(
    cerebrum: Cerebrum,
    synapse: Synapse.Any,
  ): Agora.Unlistener {
    cerebrum.synapses.set(synapse.pid.id, synapse)

    const unlisten = Agora.listen(synapse.status, status => {
      console.warn(status)
      Agora.publish(cerebrum, synapse)

      if (status === Synapse.Status.Finished) {
        cerebrum.synapses.delete(synapse.pid.id)
      }
    })

    return unlisten
  }

  export function registerMany(
    cerebrum: Cerebrum,
    synapses: Synapse.Any[],
  ): Agora.Unlistener {
    const unlisteners = synapses.map(synapse => register(cerebrum, synapse))

    return () => {
      unlisteners.forEach(unlisten => void unlisten())
    }
  }

  export function has(cerebrum: Cerebrum, synapse: Synapse.Any): boolean {
    return cerebrum.synapses.has(synapse.pid.id)
  }

  export function size(cerebrum: Cerebrum): number {
    return cerebrum.synapses.size
  }

  export function snap(cerebrum: Cerebrum): Snapshot {
    return Array.from(cerebrum.synapses.values()).reduce((acc, synapse) => {
      // biome-ignore lint: We want to use assign here
      return Object.assign({}, acc, {
        [synapse.pid.id]: {
          pid: synapse.pid.id,
          status: Sema.read(synapse.status),
          valueKind: Zygon.isRight(Rheon.read(synapse.value))
            ? 'right'
            : Zygon.isLeft(Rheon.read(synapse.value))
              ? 'left'
              : undefined,
        },
      })
    }, {})
  }
}
