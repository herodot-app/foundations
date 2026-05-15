import type { Delay } from './delay'
import { Praxis } from './praxis'
import type { Task } from './task'

export namespace Debounce {
  export type Input<I = undefined, L = unknown, R = Task.Failures> = {
    duration: number
    praxis: Praxis<I, L, R>
    timeoutFn?: Delay.TimeoutFn
  }

  export function create<I = undefined, L = unknown, R = Task.Failures>({
    praxis,
    duration,
    timeoutFn = setTimeout,
  }: Input<I, L, R>): Praxis<I, L, R> {
    let callStack: Praxis<I, L, R>[] = []

    return Praxis.create<I, L, R>(() => void 'none' as any)
      .effect(() => {
        callStack.push(praxis)
      })
      .effect(() => {
        if (callStack.length === 1) return

        const lastCall = callStack.pop()

        for (const index in callStack) {
          const previousPraxis = callStack.at(Number(index))

          previousPraxis?.abort()
        }

        callStack = []
      })
      .fork(() => praxis)
  }
}
