// biome-ignore-all lint/suspicious/noExplicitAny: Action is using any
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import type { Cognition } from './cognition'
import { Experience } from './experience'
import { PraxisFailure } from './praxis-failure'

export type Action<
  L = unknown,
  R = PraxisFailure,
  O = unknown,
  C extends Cognition.Any = Cognition.Never,
> = Idion<
  Action.Identifier,
  {
    runner: Action.Fn<L, R, O, C>
  }
>

export namespace Action {
  export const identifier = Symbol.for('@herodot-app/praxis/action')

  export type Identifier = typeof identifier

  export type Any = Action<any, any, any, any>

  export type Fn<
    L = unknown,
    R = PraxisFailure,
    O = unknown,
    C extends Cognition.Any = Cognition.Never,
  > = (experience: Experience<L, R, C>) => O

  export function create<
    L = unknown,
    R = PraxisFailure,
    O = unknown,
    C extends Cognition.Any = Cognition.Never,
  >(runner: Fn<L, R, O, C>): Action<L, R, O, C> {
    return Idion.create({
      id: identifier,
      value: { runner },
    })
  }

  export async function run<
    L = unknown,
    R = PraxisFailure,
    O = unknown,
    C extends Cognition.Any = Cognition.Never,
  >(
    action: Action<L, R, O, C>,
    experience: Experience<L, R, C>,
  ): Promise<Experience.Lift<O, C>> {
    try {
      if (Experience.isAborted<any, any>(experience as Experience<any, any>)) {
        Experience.abort(experience as any)

        return experience as any
      }

      const result = await Promise.resolve(action.runner(experience))

      if (Experience.is(result)) {
        return experience as any
      }

      if (Zygon.isRight(result)) {
        const value = await Zygon.asyncUnwrapLiftRight(
          result,
          new PraxisFailure.LiftRight(),
        )

        if (value instanceof Error) {
          return Experience.create({
            value: Zygon.right(value),
            controller: experience.controller,
            cognition: experience.cognition,
          }) as any
        }

        return Experience.create({
          value: Zygon.left(value),
          controller: experience.controller,
          cognition: experience.cognition,
        }) as any
      }

      if (Zygon.isLeft(result)) {
        const value = await Zygon.asyncUnwrapLiftLeft(
          result,
          new PraxisFailure.LiftLeft(),
        )

        if (value instanceof Error) {
          return Experience.create({
            value: Zygon.right(value),
            controller: experience.controller,
            cognition: experience.cognition,
          }) as any
        }

        return Experience.create({
          value: Zygon.left(value),
          controller: experience.controller,
          cognition: experience.cognition,
        }) as any
      }

      return Experience.create({
        value: Zygon.left(result),
        controller: experience.controller,
        cognition: experience.cognition,
      }) as any
    } catch (err: unknown) {
      return Experience.create({
        value: Zygon.right(
          new PraxisFailure.Unknown(undefined, undefined, { cause: err }),
        ),
        controller: experience.controller,
        cognition: experience.cognition,
      }) as any
    }
  }
}
