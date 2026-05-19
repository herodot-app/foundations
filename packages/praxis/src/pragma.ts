// biome-ignore-all lint/suspicious/noExplicitAny: Pragma is using any
import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'
import { Experience } from './experience'
import type { Faculty } from './faculty'
import { PraxisFailure } from './praxis-failure'

export type Pragma<
  L = unknown,
  R = PraxisFailure,
  O = unknown,
  C extends Faculty.Any = Faculty.Never,
> = Idion<
  Pragma.Identifier,
  {
    runner: Pragma.Fn<L, R, O, C>
  }
>

export namespace Pragma {
  export const identifier = Symbol.for('@herodot-app/praxis/pragma')

  export type Identifier = typeof identifier

  export type Any = Pragma<any, any, any, any>

  export type Fn<
    L = unknown,
    R = PraxisFailure,
    O = unknown,
    C extends Faculty.Any = Faculty.Never,
  > = (experience: Experience<L, R, C>) => O

  export function create<
    L = unknown,
    R = PraxisFailure,
    O = unknown,
    C extends Faculty.Any = Faculty.Never,
  >(runner: Fn<L, R, O, C>): Pragma<L, R, O, C> {
    return Idion.create({
      id: identifier,
      value: { runner },
    })
  }

  export async function run<
    L = unknown,
    R = PraxisFailure,
    O = unknown,
    C extends Faculty.Any = Faculty.Never,
  >(
    pragma: Pragma<L, R, O, C>,
    experience: Experience<L, R, C>,
  ): Promise<Experience.Lift<O, C>> {
    try {
      if (Experience.isAborted<any, any>(experience as Experience<any, any>)) {
        Experience.abort(experience as any)

        return experience as any
      }

      const result = await Promise.resolve(pragma.runner(experience))

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
            faculty: experience.faculty,
          }) as any
        }

        return Experience.create({
          value: Zygon.left(value),
          controller: experience.controller,
          faculty: experience.faculty,
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
            faculty: experience.faculty,
          }) as any
        }

        return Experience.create({
          value: Zygon.left(value),
          controller: experience.controller,
          faculty: experience.faculty,
        }) as any
      }

      return Experience.create({
        value: Zygon.left(result),
        controller: experience.controller,
        faculty: experience.faculty,
      }) as any
    } catch (err: unknown) {
      return Experience.create({
        value: Zygon.right(
          new PraxisFailure.Unknown(undefined, undefined, { cause: err }),
        ),
        controller: experience.controller,
        faculty: experience.faculty,
      }) as any
    }
  }
}
