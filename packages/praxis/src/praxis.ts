import { type Zygon } from '@herodot-app/zygon'
import { Task } from './task'
import { Rheon } from '@herodot-app/rheon'

export class Praxis<I = undefined, L = unknown, R = Task.RuntimePtoma> {
  static create<I = undefined, L = unknown, R = Task.RuntimePtoma>(
    fn: Task.RawRun<I, L>,
  ): Praxis<I, L, R> {
    const task = Task.create<I, L, R>({
      run: fn,
    })

    return new Praxis(task)
  }

  constructor(public readonly task: Task<I, L, R>) {
    this.pipe.bind(this)
    this.run.bind(this)
  }

  pipe<L2 = unknown, R2 = Task.RuntimePtoma>(
    runner: Task.RawRun<Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>, L2>,
  ): Praxis<
    I,
    Zygon.LiftLeft<L2>,
    R | R2 | Zygon.LiftRight<L2> | Zygon.LiftRight<L>
  > {
    const currentTask = this.task

    const newTask = Task.create({
      run: async (input?: I): Promise<L2> => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(currentTask, input)
        const newResult = await Promise.resolve(runner(result))

        return newResult
      },
      controller: Rheon.read(currentTask.controllerRef),
    })

    newTask.externalRef = currentTask.externalRef
    newTask.controllerRef = currentTask.controllerRef

    return new Praxis(newTask) as Praxis<
      I,
      Zygon.LiftLeft<L2>,
      R | R2 | Zygon.LiftRight<L2> | Zygon.LiftRight<L>
    >
  }

  run(
    ...inputs: Task.InferRunInput<I>
  ): Promise<Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>> {
    const input = inputs.at(0)

    // biome-ignore lint: unable to infer the input args correctly here
    return (Task.run as any)(this.task, input)
  }
}
