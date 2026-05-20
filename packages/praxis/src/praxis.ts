// biome-ignore-all lint/suspicious/noExplicitAny: Praxis is using any in order to enhanced readability
import { Idion } from '@herodot-app/idion'
import { Cerebrum } from './cerebrum'
import type { Faculty } from './faculty'
import { DoOperator } from './operators/do-operator'
import { RunOperator } from './operators/run-operator'
import { Pragma } from './pragma'
import type { PraxisFailure } from './praxis-failure'
import type { Synapse } from './synapse'

export type Praxis<
  P extends Synapse.Pipeline = readonly [],
  F extends Faculty.Any = Faculty.Never,
> = Idion<
  Praxis.Identifier,
  {
    pipeline: P
    cerebrum: Cerebrum

    run: RunOperator<P, F>
    do: DoOperator<P, F>
  }
>

export namespace Praxis {
  export const identifier = Symbol.for('@herodot-app/praxis')

  export type Identifier = typeof identifier

  export type StarterFn<I, O> = I extends undefined
    ? (input?: I) => O
    : (input: I) => O

  export type Options<P extends Synapse.Pipeline = readonly []> = {
    cerebrum?: Cerebrum
    pipeline?: P
  }

  export function create<
    P extends Synapse.Pipeline = readonly [Pragma.Void],
    F extends Faculty.Any = Faculty.Never,
  >(options: Options<P> = {}): Praxis<P, F> {
    const pipeline = options.pipeline ?? [Pragma.create(() => void undefined)]
    const cerebrum = options.cerebrum ?? Cerebrum.create()

    const praxisPayload = {
      pipeline,
      cerebrum,
    }

    return Idion.create({
      id: identifier,
      value: Object.assign({}, praxisPayload, {
        run: RunOperator.create(praxisPayload as Praxis<P>),
        do: DoOperator.create(praxisPayload as Praxis<P>),
      }),
    }) as Praxis<P, F>
  }

  export function of<I, F extends Faculty.Any = Faculty.Never>(): Praxis<
    readonly [Pragma<I, PraxisFailure, I, F>],
    F
  > {
    return create({
      pipeline: [Pragma.create(exp => exp) as any],
    }) as Praxis<readonly [Pragma<I, PraxisFailure, I, F>], F>
  }
}
