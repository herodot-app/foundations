import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Cognition } from './cognition'

export type Experience<
  T = unknown,
  C extends Cognition.Any = Cognition.Never,
> = Idion<
  Experience.Identifier,
  {
    readonly value: T

    readonly abortions: Agora<Experience.Abortion>

    readonly controller: AbortController

    readonly cognition: C
  }
>

export namespace Experience {
  export const identifier = Symbol.for('@herodot-app/praxis/experience')

  export type Identifier = typeof identifier

  export class Abortion extends Ptoma.create(
    '@herodot-app/praxis/experience/abortion',
    'The current experience has been aborted',
  ) {}

  export type Input<T = unknown, C extends Cognition.Any = Cognition.Never> = {
    value: T
    abortions?: Agora<Abortion>
    cognition?: C
  }

  export function create<
    T = unknown,
    C extends Cognition.Any = Cognition.Never,
  >({
    value,
    abortions = Agora.create<Abortion>(),
    cognition = Cognition.create(Object.create({})) as C,
  }: Input<T, C>): Experience<T, C> {
    const controller = new AbortController()

    const experience = Idion.create({
      id: identifier,
      value: {
        value,
        abortions,
        controller,
        cognition,
      },
    })

    controller.signal.addEventListener(
      'abort',
      () => {
        Agora.publish(
          experience.abortions,
          new Abortion(controller.signal.reason),
        )
      },
      { once: true },
    )

    return experience
  }

  export function abort<T = unknown>(
    experience: Experience<T>,
    reason?: string,
  ): void {
    if (experience.controller.signal.aborted) return

    experience.controller.abort(reason)
  }

  export function abortion(reason?: string): Abortion {
    return new Abortion(reason)
  }
}
