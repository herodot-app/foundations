import { Idion } from '@herodot-app/idion'
import { Cognition } from './cognition'
import type { Zygon } from '@herodot-app/zygon'
import { PraxisFailure } from './praxis-failure'
import { Ptoma } from '@herodot-app/ptoma'

export type Experience<
  L = unknown,
  R = PraxisFailure,
  C extends Cognition.Any = Cognition.Never,
> = Idion<
  Experience.Identifier,
  {
    readonly value: Zygon<L, R>
    readonly controller: AbortController
    readonly cognition: C
  }
>

export namespace Experience {
  export const identifier = Symbol.for('@herodot-app/praxis/experience')

  export type Identifier = typeof identifier

  // biome-ignore lint: could be any cognition here
  export type InferValue<T> = T extends Experience<infer I, any> ? I : T

  export type Input<
    L = unknown,
    R = PraxisFailure,
    C extends Cognition.Any = Cognition.Never,
  > = {
    value: Zygon<L, R>
    cognition?: C
    controller?: AbortController
  }

  export function create<
    L = unknown,
    R = PraxisFailure,
    C extends Cognition.Any = Cognition.Never,
  >({
    value,
    cognition = Cognition.create(Object.create({})) as C,
    controller = new AbortController(),
  }: Input<L, R, C>): Experience<L, R, C> {
    return Idion.create({
      id: identifier,
      value: {
        value,
        controller,
        cognition,
      },
    })
  }

  export function abort<T = unknown>(
    experience: Experience<T>,
    reason?: string,
  ): void {
    if (experience.controller.signal.aborted) return

    experience.controller.abort(reason)
  }

  export function isAborted<T, C extends Cognition.Any = Cognition.Never>(
    experience: Experience<T, C>,
  ): boolean {
    return (
      experience.controller.signal.aborted
      || Ptoma.match(experience.value.left, PraxisFailure.Aborted)
      || Ptoma.match(experience.value.right, PraxisFailure.Aborted)
    )
  }
}
