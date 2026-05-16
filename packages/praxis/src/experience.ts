import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import type { Zygon } from '@herodot-app/zygon'
import { Cognition } from './cognition'
import { PraxisFailure } from './praxis-failure'

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

  export type Lift<T, C extends Cognition.Any = Cognition.Never> =
    T extends Promise<infer A>
      ? Lift<A>
      : T extends Experience<infer L, infer R, infer C2>
        ? Experience<
            Zygon.AwaitedLiftLeft<L>,
            Zygon.AwaitedLiftRight<L> | Zygon.AwaitedLiftRight<Zygon.Right<R>>,
            Cognition.Merge<C, C2>
          >
        : Experience<
            Zygon.AwaitedLiftLeft<T>,
            Zygon.AwaitedLiftRight<T> | PraxisFailure,
            C
          >

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

  export function isAborted<
    L = unknown,
    R = PraxisFailure,
    C extends Cognition.Any = Cognition.Never,
  >(experience: Experience<L, R, C>): boolean {
    return (
      experience.controller.signal.aborted
      || Ptoma.match(experience.value.left, PraxisFailure.Aborted)
      || Ptoma.match(experience.value.right, PraxisFailure.Aborted)
    )
  }

  export function is<
    L = unknown,
    R = PraxisFailure,
    C extends Cognition.Any = Cognition.Never,
    // biome-ignore lint: any is fine here
  >(subject: any): subject is Experience<L, R, C> {
    return Idion.is(subject, identifier)
  }
}
