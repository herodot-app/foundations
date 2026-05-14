import { Idion } from '@herodot-app/idion'
import { Experience } from './experience'
import type { Cognition } from './cognition'
import { Zygon } from '@herodot-app/zygon'
import { Ptoma } from '@herodot-app/ptoma'

export type Cerebrum<I = undefined, O = undefined> = Idion<
  Cerebrum.Identifier,
  {
    thought: Cerebrum.Thought<I, O>
  }
>

export namespace Cerebrum {
  export const identifier = Symbol.for('@herodot-app/praxis/cerebrum')

  export type Identifier = typeof identifier

  export class LiftRightFailure extends Ptoma.create(
    '@herodot-app/praxis/cerebrum/lift-right-failure',
    'unable to lift the right value of a cerebrum thought zygonc',
  ) {}

  export class LiftLeftFailure extends Ptoma.create(
    '@herodot-app/praxis/cerebrum/lift-left-failure',
    'unable to lift the right value of a cerebrum thought zygonc',
  ) {}

  export class UnknownFailure extends Ptoma.create(
    '@herodot-app/praxis/cerebrum/unknown-failure',
    'unknown failure during a cerebrum thought',
  ) {}

  export type Failures =
    | LiftLeftFailure
    | LiftRightFailure
    | UnknownFailure
    | Experience.Abortion

  export type Thought<I = undefined, O = unknown> = I extends undefined
    ? (input?: I) => O
    : (input: I) => O

  export function create<I = undefined, O = unknown>(
    thought: Thought<I, O>,
  ): Cerebrum<I, O> {
    return Idion.create({
      id: identifier,
      value: { thought },
    })
  }

  export type ThinkInput<
    I = undefined,
    O = unknown,
    C extends Cognition.Any = Cognition.Never,
  > = {
    cerebrum: Cerebrum<I, O>
    experience: Experience<I, C>
  }

  export type Success<
    T,
    C extends Cognition.Any = Cognition.Never,
  > = Experience<Zygon.AwaitedLiftLeft<T>, C>

  export type Failure<
    T,
    C extends Cognition.Any = Cognition.Never,
  > = Experience<Zygon.AwaitedLiftRight<Zygon.Right<T>>, C>

  export function left<T, C extends Cognition.Any = Cognition.Never>(
    experience: Experience<T, C>,
    value: T,
  ): Zygon.Left<Success<T, C>> {
    return Zygon.left(
      Experience.create({
        value,
        abortions: experience.abortions,
        cognition: experience.cognition,
      }),
    ) as Zygon.Left<Success<T, C>>
  }

  export function right<T, C extends Cognition.Any = Cognition.Never>(
    experience: Experience<T, C>,
    value: T,
  ): Zygon.Right<Failure<T, C>> {
    return Zygon.right(
      Experience.create({
        value,
        abortions: experience.abortions,
        cognition: experience.cognition,
      }),
    ) as Zygon.Right<Failure<T, C>>
  }

  export async function think<
    I = undefined,
    L = unknown,
    R = Failures,
    C extends Cognition.Any = Cognition.Never,
  >(
    cerebrum: Cerebrum<I, L>,
    experience: Experience<I, C>,
  ): Promise<Zygon<Success<L, C>, Failure<L | R, C>>> {
    try {
      if (experience.controller.signal.aborted) {
        return right(
          experience,
          Experience.abortion(experience.controller.signal.reason) as I,
        ) as Zygon.Right<Failure<L | R, C>>
      }

      const data = await Promise.resolve(cerebrum.thought(experience.value))

      if (experience.controller.signal.aborted) {
        return right(
          experience,
          Experience.abortion(experience.controller.signal.reason) as I,
        ) as Zygon.Right<Failure<L | R, C>>
      }

      if (Zygon.isRight(data)) {
        return right(
          experience,
          (await Zygon.asyncUnwrapLiftRight(data, new LiftRightFailure())) as I,
        ) as Zygon.Right<Failure<L | R, C>>
      }

      if (Zygon.isLeft(data)) {
        const value = await Zygon.asyncUnwrapLiftLeft(
          data,
          new LiftLeftFailure(),
        )

        if (Ptoma.match(value, LiftLeftFailure)) {
          return right(experience, value as I) as Zygon.Right<Failure<L | R, C>>
        }

        return left(experience, value) as Zygon.Left<Success<L, C>>
      }

      return left(experience, data as I) as unknown as Zygon.Left<Success<L, C>>
    } catch (err) {
      return right(
        experience,
        new UnknownFailure(undefined, undefined, { cause: err }) as I,
      ) as Zygon.Right<Failure<L | R, C>>
    }
  }
}
