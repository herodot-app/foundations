// biome-ignore-all lint/suspicious/noExplicitAny: Praxis is using any in order to enhanced readability
import type { Experience } from '../experience'
import type { Faculty } from '../faculty'
import { Pragma } from '../pragma'
import { Praxis } from '../praxis'
import type { Synapse } from '../synapse'

export type DoOperator<
  P extends Synapse.Pipeline = readonly [Pragma.Void],
  F extends Faculty.Any = Faculty.Never,
> = <O = unknown>(
  fn: (experience: Synapse.InferLastExperience<P>) => O,
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

export namespace DoOperator {
  export function create<
    P extends Synapse.Pipeline = readonly [Pragma.Void],
    F extends Faculty.Any = Faculty.Never,
  >(praxis: Praxis<P>): DoOperator<P, F> {
    return fn => {
      const pragma = Pragma.create(exp => fn(exp as any))

      return Praxis.create({
        pipeline: [...praxis.pipeline, pragma],
        cerebrum: praxis.cerebrum,
      }) as unknown as Praxis<any, any>
    }
  }
}
