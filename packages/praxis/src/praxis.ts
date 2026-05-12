import { Zygon } from '@herodot-app/zygon'
import { Task } from './task'

type InferChainRightReturn<R> =
  R extends Zygon<any, any> ? Zygon.LiftRight<R> : R

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
    this.chain.bind(this)
  }

  pipe<L2 = unknown, R2 = Task.RuntimePtoma>(
    runner: Task.RawRun<Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>, L2>,
  ): Praxis<
    I,
    Zygon.LiftLeft<L2>,
    R | R2 | Zygon.LiftRight<L2> | Zygon.LiftRight<L>
  > {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)
        const newResult = await Promise.resolve(runner(result))

        return newResult
      },
    })

    return new Praxis(this.inherit(newTask)) as unknown as Praxis<
      I,
      Zygon.LiftLeft<L2>,
      R | R2 | Zygon.LiftRight<L2> | Zygon.LiftRight<L>
    >
  }

  chain<L2 = unknown, R2 = Task.RuntimePtoma>(
    runner: Task.RawRun<Zygon.LiftLeft<L>, L2>,
  ): Praxis<
    I,
    Zygon.LiftLeft<L2>,
    R | R2 | Zygon.LiftRight<L> | Zygon.LiftRight<L2>
  > {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)

        if (Zygon.isRight(result)) return result

        const newResult = await Promise.resolve(runner(result.left))

        return newResult
      },
    })

    return new Praxis(this.inherit(newTask)) as unknown as Praxis<
      I,
      Zygon.LiftLeft<L2>,
      R | R2 | Zygon.LiftRight<L2> | Zygon.LiftRight<L>
    >
  }

  chainRight<R2 = Task.RuntimePtoma>(
    runner: Task.RawRun<R | Zygon.LiftRight<L>, R2>,
  ): Praxis<I, L, InferChainRightReturn<Awaited<R2>>> {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)

        if (Zygon.isLeft(result)) return result

        const newResult = await Promise.resolve(runner(result.right))

        return Zygon.right(newResult)
      },
    })

    return new Praxis(this.inherit(newTask)) as unknown as Praxis<
      I,
      L,
      InferChainRightReturn<Awaited<R2>>
    >
  }

  run(
    ...inputs: Task.InferRunInput<I>
  ): Promise<Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>> {
    const input = inputs.at(0)

    // biome-ignore lint: unable to infer the input args correctly here
    return (Task.run as any)(this.task, input)
  }

  private inherit<I2 = undefined, L2 = unknown, R2 = Task.RuntimePtoma>(
    task: Task<I2, L2, R2>,
  ): Task<I2, L2, R2> {
    task.externalRef = this.task.externalRef
    task.controllerRef = this.task.controllerRef

    return task
  }
}
