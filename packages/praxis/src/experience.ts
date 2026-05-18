import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import type { Zygon } from '@herodot-app/zygon'
import { Faculty } from './faculty'
import { PraxisFailure } from './praxis-failure'

export type Experience<
  L = unknown,
  R = PraxisFailure,
  C extends Faculty.Any = Faculty.Never,
> = Idion<
  Experience.Identifier,
  {
    readonly value: Zygon<L, R>
    readonly controller: AbortController
    readonly faculty: C
  }
>

export namespace Experience {
  export const identifier = Symbol.for('@herodot-app/praxis/experience')

  export type Identifier = typeof identifier

  export type InferValue<T> =
    // biome-ignore lint: could be any faculty here
    T extends Experience<any, any, any> ? T['value'] : never

  export type Lift<T, C extends Faculty.Any = Faculty.Never> =
    T extends Promise<infer A>
      ? Lift<A, C>
      : T extends Experience<infer L, infer R, infer C2>
        ? Experience<
            Zygon.AwaitedLiftLeft<L>,
            Zygon.AwaitedLiftRight<L> | Zygon.AwaitedLiftRight<Zygon.Right<R>>,
            Faculty.Merge<C, C2>
          >
        : T extends never
          ? Experience<Zygon.AwaitedLiftLeft<unknown>, PraxisFailure, C>
          : Experience<
              Zygon.AwaitedLiftLeft<T>,
              Zygon.AwaitedLiftRight<T> | PraxisFailure,
              C
            >

  export type Input<
    L = unknown,
    R = PraxisFailure,
    C extends Faculty.Any = Faculty.Never,
  > = {
    value: Zygon<L, R>
    faculty?: C
    controller?: AbortController
  }

  export function create<
    L = unknown,
    R = PraxisFailure,
    C extends Faculty.Any = Faculty.Never,
  >({
    value,
    faculty = Faculty.create(Object.create({})) as C,
    controller = new AbortController(),
  }: Input<L, R, C>): Experience<L, R, C> {
    return Idion.create({
      id: identifier,
      value: {
        value,
        controller,
        faculty,
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
    C extends Faculty.Any = Faculty.Never,
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
    C extends Faculty.Any = Faculty.Never,
    // biome-ignore lint: any is fine here
  >(subject: any): subject is Experience<L, R, C> {
    return Idion.is(subject, identifier)
  }
}
