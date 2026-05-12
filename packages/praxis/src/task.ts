import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Rheon } from '@herodot-app/rheon'
import { Zygon } from '@herodot-app/zygon'

export type Task<I = undefined, L = unknown, R = Task.RuntimePtoma> = Idion<
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

  export class RuntimePtoma extends Ptoma.create(
    '@herodot-app/praxis/task/runtime-ptoma',
  ) {
    static readonly RUN = 'unknown runtime error in task.run'
    static readonly LIFT_RIGHT =
      'unable to unwrap the right zygon during a task.run'
    static readonly LIFT_LEFT =
      'unable to unwrap the left zygon during a task.run'
    static readonly ABORTED = 'the task.run has been aborted'

    static isRun(ptoma: RuntimePtoma): boolean {
      return ptoma.message === RuntimePtoma.RUN
    }

    static isLiftLeft(ptoma: RuntimePtoma): boolean {
      return ptoma.message === RuntimePtoma.LIFT_LEFT
    }

    static isLiftRight(ptoma: RuntimePtoma): boolean {
      return ptoma.message === RuntimePtoma.LIFT_RIGHT
    }

    static isAborted(ptoma: RuntimePtoma): boolean {
      return ptoma.message === RuntimePtoma.ABORTED
    }
  }

  export type ExtractZygonRight<T> =
    // biome-ignore lint: we want any here to accept any Zygon
    T extends Zygon<any, any> ? Zygon.LiftRight<T> : never

  export type RawRun<I = undefined, R = unknown> = [undefined] extends [I]
    ? (input?: I) => R
    : (input: I) => R

  export type Run<I = undefined, L = unknown, R = RuntimePtoma> = [
    undefined,
  ] extends [I]
    ? (input?: I) => Promise<Zygon<L, R>>
    : (input: I) => Promise<Zygon<L, R>>

  export type CreateInput<I = undefined, L = unknown> = {
    run: RawRun<I, L>
    controller?: AbortController
    external?: boolean
  }

  export function create<I = undefined, L = unknown, R = RuntimePtoma>(
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
            new RuntimePtoma(RuntimePtoma.ABORTED, undefined, {
              cause: Rheon.read(controllerRef).signal.reason,
            }),
          )
        }

        const result = await Promise.resolve(rawRun(input))

        if (Rheon.read(controllerRef).signal.aborted) {
          return Zygon.right(
            new RuntimePtoma(RuntimePtoma.ABORTED, undefined, {
              cause: Rheon.read(controllerRef).signal.reason,
            }),
          )
        }

        if (Zygon.is(result)) return result

        return Zygon.left(result)
      } catch (err) {
        return Zygon.right(
          new RuntimePtoma(RuntimePtoma.RUN, undefined, {
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
    R = RuntimePtoma,
  > = Awaited<ReturnType<typeof Task.run<I, L, R>>>

  export type InferRunReturnLeft<
    I = undefined,
    L = unknown,
    R = RuntimePtoma,
  > = Zygon.LiftLeft<InferRunReturn<I, L, R>>

  export type InferRunReturnRight<
    I = undefined,
    L = unknown,
    R = RuntimePtoma,
  > = Zygon.LiftRight<InferRunReturn<I, L, R>, unknown>

  export async function run<I = undefined, L = unknown, R = RuntimePtoma>(
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
        Zygon.unwrapLiftRight(
          result,
          new RuntimePtoma(RuntimePtoma.LIFT_RIGHT),
        ),
        // biome-ignore lint: inference is done in the function signature
      ) as Zygon<any, any>
    }

    return Zygon.left(
      Zygon.unwrapLiftLeft(result, new RuntimePtoma(RuntimePtoma.LIFT_LEFT)),
      // biome-ignore lint: inference is done in the function signature
    ) as Zygon<any, any>
  }

  export function aborted<I = undefined, L = unknown, R = RuntimePtoma>(
    task: Task<I, L, R>,
  ): boolean {
    return Rheon.read(task.controllerRef).signal.aborted
  }

  export function abort<I = undefined, L = unknown, R = RuntimePtoma>(
    task: Task<I, L, R>,
    reason?: string,
  ): void {
    const controller = Rheon.read(task.controllerRef)

    controller.abort(reason)
  }

  export function controller<I = undefined, L = unknown, R = RuntimePtoma>(
    task: Task<I, L, R>,
  ): AbortController {
    return Rheon.read(task.controllerRef)
  }

  export function externalized<I = undefined, L = unknown, R = RuntimePtoma>(
    task: Task<I, L, R>,
  ): void {
    Rheon.write(task.externalRef, true)
  }

  export function internalized<I = undefined, L = unknown, R = RuntimePtoma>(
    task: Task<I, L, R>,
  ): void {
    Rheon.write(task.externalRef, false)
  }

  export function isExternal<I = undefined, L = unknown, R = RuntimePtoma>(
    task: Task<I, L, R>,
  ): boolean {
    return true === Rheon.read(task.externalRef)
  }

  export function isInternal<I = undefined, L = unknown, R = RuntimePtoma>(
    task: Task<I, L, R>,
  ): boolean {
    return false === Rheon.read(task.externalRef)
  }
}
