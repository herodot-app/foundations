import { Agora } from '@herodot-app/agora'
import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'

export type Task<I = undefined, O = unknown> = Idion<
  Task.Identifier,
  {
    runner: Task.RawRun<I, O>
    abortion: Agora<Task.Aborted>
    controllerRef: Rheon<AbortController>
    unlistenAbortion: Agora.Unlistener
  }
>

export namespace Task {
  export const identifier = Symbol.for('@herodot-app/praxis/task')

  export type Identifier = typeof identifier

  // biome-ignore lint: we want any here
  export type Any = Task<any, any>

  export class RuntimeFailure extends Ptoma.create(
    '@herodot-app/praxis/task/runtimme-failure',
  ) {}

  export class LiftRightFailure extends Ptoma.create(
    '@herodot-app/praxis/task/lift-right-failure',
    'unable to lift the right of a Task.run zygon result',
  ) {}

  export class LiftLeftFailure extends Ptoma.create(
    '@herodot-app/praxis/task/lift-right-failure',
    'unable to lift the left of a Task.run zygon result',
  ) {}

  export class Aborted extends Ptoma.create(
    '@herodot-app/praxis/task/aborted',
    'The task has been aborted',
  ) {}

  export type Failures =
    | RuntimeFailure
    | LiftRightFailure
    | LiftLeftFailure
    | Aborted

  export type ExtractZygonRight<T> =
    // biome-ignore lint: we want any here to accept any Zygon
    T extends Zygon<any, any> ? Zygon.LiftRight<T> : never

  export type RawRun<I = undefined, O = unknown> = [undefined] extends [I]
    ? (input?: I) => O
    : (input: I) => O

  export type Run<I = undefined, L = unknown, R = Failures> = [
    undefined,
  ] extends [I]
    ? (input?: I) => Promise<Zygon<L, R>>
    : (input: I) => Promise<Zygon<L, R>>

  export type CreateInput<I = undefined, O = unknown> = {
    runner: RawRun<I, O>
    linkedTo?: Task.Any
  }

  export function create<I = undefined, O = unknown>(
    input: CreateInput<I, O>,
  ): Task<I, O> {
    const abortion = Agora.create<Aborted>()
    const controllerRef = Rheon.create(new AbortController())

    const unlistenAbortion = Agora.listen(abortion, abort => {
      Rheon.read(controllerRef).abort(abort)
    })

    const task = Idion.create({
      id: identifier,
      value: {
        runner: input.runner,
        controllerRef,
        abortion,
        unlistenAbortion,
      },
    }) as Task<I, O>

    if (input.linkedTo) {
      Task.link(task, input.linkedTo)
    }

    return task
  }

  export type InferRunInput<T> = [undefined] extends [T] ? [] : [T]

  export type Return<L = unknown, R = Failures> = Promise<
    Zygon<Zygon.AwaitedLiftLeft<L>, R | Zygon.AwaitedLiftRight<L>>
  >

  export type Result<L = unknown, R = Failures> = Zygon<
    Zygon.AwaitedLiftLeft<L>,
    R | Zygon.AwaitedLiftRight<L>
  >

  export async function run<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L>,
    ...inputs: InferRunInput<I>
  ): Return<L, R> {
    const input = inputs.at(0) as I

    Rheon.write(task.controllerRef, new AbortController())

    try {
      if (Rheon.read(task.controllerRef).signal.aborted) {
        return Zygon.right(Rheon.read(task.controllerRef).signal.reason as R)
      }

      const result = await Promise.resolve(task.runner(input as I))

      if (Rheon.read(task.controllerRef).signal.aborted) {
        return Zygon.right(Rheon.read(task.controllerRef).signal.reason as R)
      }

      if (Zygon.isLeft(result)) {
        return Zygon.left(
          (await Zygon.asyncUnwrapLiftLeft(
            result,
            new LiftLeftFailure(),
          )) as Zygon.AwaitedLiftLeft<L>,
        )
      }

      if (Zygon.isRight(result)) {
        return Zygon.right(
          (await Zygon.asyncUnwrapLiftRight(
            result,
            new LiftRightFailure(),
          )) as R,
        )
      }

      return Zygon.left(result as Zygon.AwaitedLiftLeft<L>)
    } catch (err) {
      return Zygon.right(
        new RuntimeFailure('runtime failure during a Task.run', undefined, {
          cause: err,
        }) as R,
      )
    }
  }

  export function link(first: Task.Any, second: Task.Any): () => void {
    const firstUnlisten = Agora.listen(first.abortion, abort => {
      Task.abort(second, abort.message)
    })

    const secondUnlisten = Agora.listen(second.abortion, abort => {
      Task.abort(first, abort.message)
    })

    return () => {
      firstUnlisten()
      secondUnlisten()
    }
  }

  export function isAborted(task: Task.Any): boolean {
    return Rheon.read(task.controllerRef).signal.aborted
  }

  export function abort(task: Task.Any, reason?: string): void {
    Agora.publish(task.abortion, new Aborted(reason))
  }
}
