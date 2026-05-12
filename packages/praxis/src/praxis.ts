import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'
import { Task } from './task'

export class Praxis<I = undefined, L = unknown, R = Task.Failures> {
  static create<I = undefined, L = unknown, R = Task.Failures>(
    fn: Task.RawRun<I, L>,
  ): Praxis<I, Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>> {
    const task = Task.create<I, L, R>({
      run: fn,
      external: true,
    })

    return new Praxis(task) as unknown as Praxis<
      I,
      Zygon.LiftLeft<L>,
      R | Zygon.LiftRight<L>
    >
  }

  constructor(public readonly task: Task<I, L, R>) {
    this.pipe.bind(this)
    this.run.bind(this)
    this.chain.bind(this)
    this.chainRight.bind(this)
    this.recover.bind(this)
    this.merge.bind(this)
    this.execute.bind(this)
    this.effect.bind(this)
    this.inherit.bind(this)
  }

  pipe<L2 = unknown, R2 = Task.Failures>(
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

        if (Task.aborted(this.task)) return result

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

  chain<L2 = unknown, R2 = Task.Failures>(
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

  chainRight<R2 = Task.Failures>(
    runner: Task.RawRun<R | Zygon.LiftRight<L>, R2>,
  ): Praxis<I, L, InferChainRightReturn<Awaited<R2>>> {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)

        if (Zygon.isLeft(result)) return result
        if (Task.aborted(this.task)) return result

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

  recover<L2 = unknown, R2 = Task.Failures>(
    runner: Task.RawRun<R | Zygon.LiftRight<L>, L2>,
  ): Praxis<I, L | Zygon.LiftLeft<L2>, R | R2 | Zygon.LiftRight<L2>> {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)

        if (Zygon.isLeft(result)) return result
        if (Task.aborted(this.task)) return result

        return await Promise.resolve(runner(result.right))
      },
    })

    return new Praxis(this.inherit(newTask)) as unknown as Praxis<
      I,
      L | Zygon.LiftLeft<L2>,
      R | R2 | Zygon.LiftRight<L2>
    >
  }

  merge<L2 = unknown, R2 = unknown>(
    runner: Task.RawRun<
      Zygon.LiftLeft<L>,
      Praxis<L, L2, R2> | Promise<Praxis<L, L2, R2>>
    >,
  ): Praxis<
    I,
    Zygon.LiftLeft<L2>,
    R | R2 | Zygon.LiftRight<L2> | Zygon.LiftRight<L>
  > {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)

        if (Zygon.isRight(result)) return result

        const otherPraxis = await Promise.resolve(runner(result.left))

        this.inherit(otherPraxis.task)

        // biome-ignore lint: unable to infer the input here
        return (otherPraxis.run as any)(result.left)
      },
    })

    return new Praxis(this.inherit(newTask)) as unknown as Praxis<
      I,
      Zygon.LiftLeft<L2>,
      R | R2 | Zygon.LiftRight<L2> | Zygon.LiftRight<L>
    >
  }

  execute(
    runner: Task.RawRun<
      Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>,
      void | Promise<void>
    >,
  ): Praxis<I, L, R> {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)

        if (Task.aborted(this.task)) return result

        await Promise.resolve(runner(result))

        return result
      },
    })

    return new Praxis(this.inherit(newTask)) as unknown as Praxis<I, L, R>
  }

  effect(
    runner: Task.RawRun<
      Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>,
      void | Promise<void>
    >,
    catcher?: (err: unknown) => void,
  ): Praxis<I, L, R> {
    const newTask = Task.create({
      run: async (input?: I) => {
        // biome-ignore lint: unable to infer the input correctly here
        const result = await (Task.run as any)(this.task, input)

        if (Task.aborted(this.task)) return result

        new Promise(() => runner(result)).catch(err => catcher?.(err))

        return result
      },
    })

    return new Praxis(this.inherit(newTask)) as unknown as Praxis<I, L, R>
  }

  run(
    ...inputs: Task.InferRunInput<I>
  ): Promise<Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>> {
    const input = inputs.at(0)

    Rheon.write(this.task.controllerRef, new AbortController())
    Rheon.write(this.task.externalRef, true)

    // biome-ignore lint: unable to infer the input args correctly here
    return (Task.run as any)(this.task, input)
  }

  abort(reason?: string): void {
    Task.abort(this.task, reason)
  }

  inherit<I2 = undefined, L2 = unknown, R2 = Task.Failures>(
    task: Task<I2, L2, R2>,
  ): Task<I2, L2, R2> {
    task.externalRef = this.task.externalRef
    task.controllerRef = this.task.controllerRef

    return task
  }
}

type InferChainRightReturn<R> =
  // biome-ignore lint: could be any zygon here
  R extends Zygon<any, any> ? Zygon.LiftRight<R> : R
