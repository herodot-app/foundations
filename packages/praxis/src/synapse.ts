// biome-ignore-all lint/suspicious/noExplicitAny: synapse is using any

import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Sema } from '@herodot-app/sema'
import { Zygon } from '@herodot-app/zygon'
import type { Experience } from './experience'
import type { Faculty } from './faculty'
import { Pragma } from './pragma'
import { PraxisFailure } from './praxis-failure'
import { SynapseId } from './synapse-id'

export type Synapse<P extends Synapse.Pipeline> = PromiseLike<
  Synapse.InferLastZygon<P>
> &
  Idion<
    Synapse.Identifier,
    {
      readonly pid: SynapseId
      readonly experience: Synapse.InferFirstExperience<P>
      readonly status: Sema<Synapse.Status>
      readonly value: Rheon<Synapse.InferLastZygon<P> | Synapse.Unset>
    }
  >

export namespace Synapse {
  export const identifier = Symbol.for('@herodot-app/praxis/synapse')

  export type Identifier = typeof identifier

  export const unset = Symbol.for('@herodot-app/praxis/synapse/unset')

  export type Unset = typeof unset

  export type Pipeline = readonly Pragma.Any[]

  export type InferLastZygon<P extends Pipeline> = P extends readonly []
    ? Zygon<unknown, PraxisFailure>
    : P extends readonly [infer A extends Pragma.Any]
      ? A extends Pragma<any, any, infer O, any>
        ? Experience.InferValue<Experience.Lift<O, any>>
        : never
      : P extends readonly [...infer _, infer A extends Pragma.Any]
        ? A extends Pragma<any, any, infer O, any>
          ? Experience.InferValue<Experience.Lift<O, any>>
          : never
        : never

  export type InferFirstExperience<P extends Pipeline> = P extends readonly []
    ? Experience<unknown, PraxisFailure, Faculty.Any>
    : P extends readonly [infer A extends Pragma.Any, ...infer _]
      ? A extends Pragma<infer L, infer R, any, infer C>
        ? Experience<L, R, C>
        : never
      : never

  export enum Status {
    Idle = '@herodot-app/praxis/synapse/status/idle',
    Running = '@herodot-app/praxis/synapse/status/running',
    Finished = '@herodot-app/praxis/synapse/status/finished',
  }

  export function create<P extends Pipeline>(
    line: P,
    experience: InferFirstExperience<P>,
  ): Synapse<P> {
    const pid = SynapseId.create()
    const status = Sema.create(Status.Idle)
    const value = Rheon.create<InferLastZygon<P> | Unset>(unset)

    async function then(resolve: (arg: any) => void) {
      try {
        Sema.write(status, Status.Running)

        let currentExperience: any = experience

        for (const pragma of line) {
          currentExperience = await Pragma.run(pragma, currentExperience)
        }

        Rheon.write(value, currentExperience.value)
        Sema.write(status, Status.Finished)

        resolve(currentExperience.value)
      } catch (err: unknown) {
        const right = Zygon.right(
          new PraxisFailure.Unknown(undefined, undefined, { cause: err }),
        )

        Rheon.write(value, right as InferLastZygon<P>)
        Sema.write(status, Status.Finished)

        resolve(right)
      }
    }

    return Idion.create({
      id: identifier,
      value: {
        pid,
        experience,
        status,
        value,
        then,
      },
    }) as Synapse<P>
  }
}
