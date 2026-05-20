import { Zygon } from '@herodot-app/zygon'
import { Cerebrum } from '../cerebrum'
import { Experience } from '../experience'
import type { Faculty } from '../faculty'
import type { Pragma } from '../pragma'
import type { Praxis } from '../praxis'
import { Synapse } from '../synapse'

export type RunOperator<
  P extends Synapse.Pipeline = readonly [Pragma.Void],
  F extends Faculty.Any = Faculty.Never,
> = (
  ...args: RunOperator.InferRunInputs<P, F>
) => Promise<Synapse.InferLastZygon<P>>

export namespace RunOperator {
  export type InferInput<P extends Synapse.Pipeline = readonly [Pragma.Void]> =
    Zygon.InferLeft<Experience.InferValue<Synapse.InferFirstExperience<P>>>

  export type InferRunArgs<
    P extends Synapse.Pipeline = readonly [Pragma.Void],
  > = InferInput<P> extends undefined | never ? [] : [InferInput<P>]

  export type InferFacultyArgs<F extends Faculty.Any> = F extends Faculty.Never
    ? []
    : [F]

  export type InferRunInputs<
    P extends Synapse.Pipeline = readonly [Pragma.Void],
    F extends Faculty.Any = Faculty.Never,
  > = [...InferRunArgs<P>, ...InferFacultyArgs<F>]

  export function create<
    P extends Synapse.Pipeline,
    F extends Faculty.Any = Faculty.Never,
  >(praxis: Praxis<P>): RunOperator<P, F> {
    return async (...args) => {
      const input = args.at(0) as InferInput<P>

      const firstExperience = Experience.create({
        value: Zygon.left(input),
      }) as Synapse.InferFirstExperience<P>

      const synapse = Synapse.create(praxis.pipeline, firstExperience)

      Cerebrum.register(praxis.cerebrum, synapse)

      const result = await synapse

      return result
    }
  }
}
