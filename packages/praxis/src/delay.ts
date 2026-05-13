import type { Praxis } from './praxis'
import type { Task } from './task'

export namespace Delay {
  export type TimeoutFn = (handler: () => void, duration: number) => void

  export type Input<I = undefined, L = unknown, R = Task.Failures> = {
    praxis: Praxis<I, L, R>
    duration: number
    timeoutFn?: TimeoutFn
  }

  export function create<I = undefined, L = unknown, R = Task.Failures>({
    praxis,
    duration,
    timeoutFn = setTimeout,
  }: Input<I, L, R>): Praxis<I, L, R> {
    return praxis.effect(() => {
      return new Promise(resolve => {
        timeoutFn(resolve, duration)
      })
    })
  }
}
