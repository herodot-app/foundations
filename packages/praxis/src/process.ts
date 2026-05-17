// biome-ignore-all lint/suspicious/noExplicitAny: process is using any

import { Idion } from '@herodot-app/idion'
import { Rheon } from '@herodot-app/rheon'
import { Sema } from '@herodot-app/sema'
import { Zygon } from '@herodot-app/zygon'
import { Action } from './action'
import type { Cognition } from './cognition'
import type { Experience } from './experience'
import { PraxisFailure } from './praxis-failure'
import { ProcessId } from './process-id'

export type Process<P extends Process.Pipeline> = PromiseLike<
  Process.InferLastZygon<P>
> &
  Idion<
    Process.Identifier,
    {
      readonly pid: ProcessId
      readonly experience: Process.InferFirstExperience<P>
      readonly status: Sema<Process.Status>
      readonly value: Rheon<Process.InferLastZygon<P> | Process.Unset>
    }
  >

export namespace Process {
  export const identifier = Symbol.for('@herodot-app/praxis/process')

  export type Identifier = typeof identifier

  export const unset = Symbol.for('@herodot-app/praxis/process/unset')

  export type Unset = typeof unset

  export type Pipeline = readonly Action.Any[]

  export type InferLastZygon<P extends Pipeline> = P extends readonly []
    ? Zygon<unknown, PraxisFailure>
    : P extends readonly [infer A extends Action.Any]
      ? A extends Action<any, any, infer O, any>
        ? Experience.InferValue<Experience.Lift<O, any>>
        : never
      : P extends readonly [...infer _, infer A extends Action.Any]
        ? A extends Action<any, any, infer O, any>
          ? Experience.InferValue<Experience.Lift<O, any>>
          : never
        : never

  export type InferFirstExperience<P extends Pipeline> = P extends readonly []
    ? Experience<unknown, PraxisFailure, Cognition.Any>
    : P extends readonly [infer A extends Action.Any, ...infer _]
      ? A extends Action<infer L, infer R, any, infer C>
        ? Experience<L, R, C>
        : never
      : never

  export enum Status {
    Idle = '@herodot-app/praxis/process/status/idle',
    Running = '@herodot-app/praxis/process/status/running',
    Finished = '@herodot-app/praxis/process/status/finished',
  }

  export function create<P extends Pipeline>(
    line: P,
    experience: InferFirstExperience<P>,
  ): Process<P> {
    const pid = ProcessId.create()
    const status = Sema.create(Status.Idle)
    const value = Rheon.create<InferLastZygon<P> | Unset>(unset)

    async function then(resolve: (arg: any) => void) {
      try {
        Sema.write(status, Status.Running)

        let currentExperience: any = experience

        for (const action of line) {
          currentExperience = await Action.run(action, currentExperience)
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
    }) as Process<P>
  }
}
