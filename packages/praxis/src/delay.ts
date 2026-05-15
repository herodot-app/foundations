import type { Zygon } from '@herodot-app/zygon'
import { Praxis } from './praxis'
import type { Task } from './task'

export namespace Delay {
  export type TimeoutFn = (handler: () => void, duration: number) => void

  export type Input<T = undefined> = {
    duration: number
    return?: T
    timeoutFn?: TimeoutFn
  }

  export function create<I = undefined, L = unknown, R = Task.Failures>({
    duration,
    return: value,
    timeoutFn = setTimeout,
  }: Input<L>): Praxis<I, Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>> {
    return Praxis.create((input: any) => input)
      .effect(
        () =>
          new Promise(resolve => {
            timeoutFn(resolve, duration)
          }),
      )
      .chain(input => value ?? input) as Praxis<
      I,
      Zygon.LiftLeft<L>,
      R | Zygon.LiftRight<L>
    >
  }
}
