import { Idion } from '@herodot-app/idion'
import { Task } from './task'

export type Praxis<I = undefined, L = unknown, R = Task.RuntimePtoma> = Idion<
  Praxis.Identifier,
  {
    task: Task<I, L, R>
  }
>

/**
 * From Ancient Greek **πρᾶξις** (*praxis*) — "action, practice, doing".
 * While theory (*theoria*) is what you think about, praxis is what you actually do.
 *
 * Praxis provides simple, elegant monadic operations for the Herodot App
 * foundations — without the Haskell sorcery.
 */
export namespace Praxis {
  export const identifier = Symbol.for('@herodot-app/praxis')

  export type Identifier = typeof identifier

  export function create<I = undefined, L = unknown, R = Task.RuntimePtoma>(
    fn: Task.RawRun<I, L>,
  ): Praxis<I, L, R> {
    const task = Task.create<I, L, R>({
      run: fn,
    })

    return Idion.create({
      id: identifier,
      value: {
        task,
      },
    }) as Praxis<I, L, R>
  }
}
