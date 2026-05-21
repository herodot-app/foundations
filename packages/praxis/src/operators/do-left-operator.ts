// biome-ignore-all lint/suspicious/noExplicitAny: Praxis is using any in order to enhanced readability
import { Zygon } from '@herodot-app/zygon'
import type { Experience } from '../experience'
import type { Faculty } from '../faculty'
import { Pragma } from '../pragma'
import { Praxis } from '../praxis'
import type { Synapse } from '../synapse'

export type DoLeftOperator<
  P extends Synapse.Pipeline = readonly [Pragma.Void],
  F extends Faculty.Any = Faculty.Never,
> = <O = unknown>(
  fn: (value: Synapse.InferLastZygonLeft<P>) => O,
) => Praxis<
  readonly [
    ...P,
    Pragma<
      Synapse.InferLastZygonLeft<P>,
      Synapse.InferLastZygonRight<P, O>,
      O,
      F
    >,
  ],
  Faculty.LooseMerge<F, Experience.InferFaculty<O>> | F
>

export namespace DoLeftOperator {
  export function create<
    P extends Synapse.Pipeline = readonly [Pragma.Void],
    F extends Faculty.Any = Faculty.Never,
  >(praxis: Praxis<P>): DoLeftOperator<P, F> {
    return fn => {
      const pragma = Pragma.create(exp => {
        if (Zygon.isLeft(exp.value)) {
          return fn(exp.value.left as any)
        }

        return exp
      })

      return Praxis.create({
        pipeline: [...praxis.pipeline, pragma],
        cerebrum: praxis.cerebrum,
      }) as unknown as Praxis<any, any>
    }
  }
}
