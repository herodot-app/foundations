import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'

export type Task<I = undefined, L = unknown, R = Task.Failures> = Idion<
  Task.Identifier,
  {
    run: Task.Run<I, L, R>
    controllerRef: Rheon<AbortController>
    externalRef: Rheon<boolean>
  }
>

export namespace Task {
  export const identifier = Symbol.for('@herodot-app/praxis/task')

  export type Identifier = typeof identifier

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
  ) {}

  export type Failures =
    | RuntimeFailure
    | LiftRightFailure
    | LiftLeftFailure
    | Aborted

  export type ExtractZygonRight<T> =
    // biome-ignore lint: we want any here to accept any Zygon
    T extends Zygon<any, any> ? Zygon.LiftRight<T> : never

  export type RawRun<I = undefined, R = unknown> = [undefined] extends [I]
    ? (input?: I) => R
    : (input: I) => R

  export type Run<I = undefined, L = unknown, R = Failures> = [
    undefined,
  ] extends [I]
    ? (input?: I) => Promise<Zygon<L, R>>
    : (input: I) => Promise<Zygon<L, R>>

  export type CreateInput<I = undefined, L = unknown> = {
    run: RawRun<I, L>
    controller?: AbortController
    external?: boolean
  }

  export function create<I = undefined, L = unknown, R = Failures>(
    input: CreateInput<I, L>,
  ): Task<I, L, R | Zygon.LiftRight<L>> {
    const rawRun = input.run
    const controllerRef = Rheon.create(
      input.controller ?? new AbortController(),
    )
    const externalRef = Rheon.create(input.external ?? false)

    const run = async (input: I) => {
      try {
        if (Rheon.read(controllerRef).signal.aborted) {
          return Zygon.right(
            new Aborted(Rheon.read(controllerRef).signal.reason),
          )
        }

        const result = await Promise.resolve(rawRun(input))

        if (Rheon.read(controllerRef).signal.aborted) {
          return Zygon.right(
            new Aborted(Rheon.read(controllerRef).signal.reason),
          )
        }

        if (Zygon.is(result)) return result

        return Zygon.left(result)
      } catch (err) {
        return Zygon.right(
          new RuntimeFailure('runtime failure during a Task.run', undefined, {
            cause: err,
          }),
        )
      }
    }

    return Idion.create({
      id: identifier,
      value: {
        run,
        controllerRef,
        externalRef,
      },
    }) as Task<I, L, R | Zygon.LiftRight<L>>
  }

  export type InferRunInput<T> = [undefined] extends [T] ? [] : [T]

  export type InferRunReturn<
    I = undefined,
    L = unknown,
    R = Failures,
  > = Awaited<ReturnType<typeof Task.run<I, L, R>>>

  export type InferRunReturnLeft<
    I = undefined,
    L = unknown,
    R = Failures,
  > = Zygon.LiftLeft<InferRunReturn<I, L, R>>

  export type InferRunReturnRight<
    I = undefined,
    L = unknown,
    R = Failures,
  > = Zygon.LiftRight<InferRunReturn<I, L, R>, unknown>

  export async function run<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
    ...inputs: InferRunInput<I>
  ): Promise<Zygon<Zygon.LiftLeft<L>, R | Zygon.LiftRight<L>>> {
    const input = inputs.at(0)

    if (isInternal(task)) {
      const controller = new AbortController()

      Rheon.write(task.controllerRef, controller)
    }

    const result = await task.run(input as I)

    if (Zygon.isRight(result)) {
      return Zygon.right(
        Zygon.unwrapLiftRight(result, new LiftRightFailure()),
        // biome-ignore lint: inference is done in the function signature
      ) as Zygon<any, any>
    }

    return Zygon.left(
      Zygon.unwrapLiftLeft(result, new LiftLeftFailure()),
      // biome-ignore lint: inference is done in the function signature
    ) as Zygon<any, any>
  }

  export function aborted<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
  ): boolean {
    return Rheon.read(task.controllerRef).signal.aborted
  }

  export function abort<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
    reason?: string,
  ): void {
    const controller = Rheon.read(task.controllerRef)

    controller.abort(reason)
  }

  export function controller<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
  ): AbortController {
    return Rheon.read(task.controllerRef)
  }

  export function externalized<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
  ): void {
    Rheon.write(task.externalRef, true)
  }

  export function internalized<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
  ): void {
    Rheon.write(task.externalRef, false)
  }

  export function isExternal<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
  ): boolean {
    return true === Rheon.read(task.externalRef)
  }

  export function isInternal<I = undefined, L = unknown, R = Failures>(
    task: Task<I, L, R>,
  ): boolean {
    return false === Rheon.read(task.externalRef)
  }
}
