import { Zygon } from '@herodot-app/zygon'
import { Cerebrum } from './cerebrum'
import { Idion } from '@herodot-app/idion'
import { Experience } from './experience'
import type { Cognition } from './cognition'
import type { Agora } from '@herodot-app/agora'

export type Process<
  I = undefined,
  L = unknown,
  R = Cerebrum.Failures,
  C extends Cognition.Any = Cognition.Never,
> = PromiseLike<
  Zygon<
    Zygon.AwaitedLiftLeft<L>,
    Zygon.AwaitedLiftRight<L> | Zygon.AwaitedLiftRight<Zygon.Right<R>>
  >
> &
  Idion<
    Process.Identifier,
    {
      readonly id: string
      readonly experience: Experience<I, C>
      readonly cerebrum: Cerebrum<I, L>
    }
  >

export namespace Process {
  export const identifier = Symbol.for('@herodot-app/praxis/process')

  export type Identifier = typeof identifier

  export type Input<
    I = undefined,
    O = unknown,
    C extends Cognition.Any = Cognition.Never,
  > = {
    thought: Cerebrum.Thought<I, O>
    cognition?: C
    abortions?: Agora<Experience.Abortion>
    input?: I
  }

  export function create<
    I = undefined,
    L = unknown,
    R = Cerebrum.Failures,
    C extends Cognition.Any = Cognition.Never,
  >({
    abortions,
    thought,
    cognition,
    input,
  }: Input<I, L, C>): Process<I, L, R, C> {
    const id = identify()
    const cerebrum = Cerebrum.create(thought)
    const experience = Experience.create({
      value: input,
      cognition,
      abortions,
    })

    // biome-ignore lint: we don't care about the arg type here
    function then(next: (arg: any) => void) {
      // biome-ignore lint: same here
      Cerebrum.think(cerebrum, experience as any)
        .then(result => {
          if (Zygon.isLeft(result)) {
            return Zygon.left(result.left.value)
          }

          return Zygon.right(result.right.value)
        })
        .then(result => next(result))
    }

    return Idion.create({
      id: identifier,
      value: { id, experience, cerebrum, then },
    }) as Process<I, L, R, C>
  }

  export function identify(): string {
    const firstDigits = Array(8)
      .fill(null)
      .reduce(acc => acc + hexDigit(), hexDigit())
    const secondDigits = Array(4)
      .fill(null)
      .reduce(acc => acc + hexDigit(), hexDigit())
    const thirdDigits = `4${Array(3)
      .fill(null)
      .reduce(acc => acc + hexDigit(), hexDigit())}`
    const fourthDigits = Array(4)
      .fill(null)
      .reduce(
        acc => acc + hexDigit(),
        (Math.floor(Math.random() * 4) + 8).toString(16),
      )
    const fithDigits = Array(12)
      .fill(null)
      .reduce(acc => acc + hexDigit(), hexDigit())

    return [
      firstDigits,
      secondDigits,
      thirdDigits,
      fourthDigits,
      fithDigits,
    ].join('-')
  }

  function hexDigit(): string {
    return Math.floor(Math.random() * 16).toString(16)
  }
}
