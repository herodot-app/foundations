import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'

export type Experience<T = unknown> = Idion<
  Experience.Identifier,
  {
    readonly value: T

    readonly abortions: Agora<Experience.Abortion>

    readonly controller: AbortController
  }
>

export namespace Experience {
  export const identifier = Symbol.for('@herodot-app/praxis/experience')

  export type Identifier = typeof identifier

  export class Abortion extends Ptoma.create(
    '@herodot-app/praxis/experience/abortion',
    'The current experience has been aborted',
  ) {}

  export type Input<T = unknown> = {
    value: T
    abortions?: Agora<Abortion>
  }

  export function create<T = unknown>({
    value,
    abortions = Agora.create<Abortion>(),
  }: Input<T>): Experience<T> {
    const controller = new AbortController()

    const experience = Idion.create({
      id: identifier,
      value: {
        value,
        abortions,
        controller,
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

    return Idion.create({
      id: identifier,
      value: {
        value,
        abortions,
        controller,
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

  export function abortion(reason?: string): Abortion {
    return new Abortion(reason)
  }
}
