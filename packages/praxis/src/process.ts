import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Zygon } from '@herodot-app/zygon'

/**
 * A branded process — a function transformed into a managed execution unit.
 *
 * A `Process` wraps an arbitrary function and guarantees that calling its
 * {@link processor} method will return a [`Zygon`](../../zygon/src/zygon.ts) rather
 * than throwing. This is the foundation for building robust workflows where
 * errors are values, not exceptions to be caught at every layer.
 *
 * The process is branded with {@link Process.identifier}, making it identifiable
 * at runtime and distinguishable from plain objects that might have the same
 * shape.
 *
 * @typeParam T - The input type. `undefined` means the processor takes no input.
 * @typeParam R - The raw return type of the wrapped function, before any lifting.
 *
 * @example
 * ```ts
 * type MyProcess = Process<number, string>
 * // A process that takes a number and returns a string
 * ```
 */
export type Process<T = undefined, R = unknown> = Idion<
  Process.Identifier,
  {
    processor: Process.Fn<T, R>
  }
>

/**
 * Utilities for creating and working with `Process` values.
 *
 * This namespace holds the brand symbol, the runtime error type, and the factory
 * function — everything you need to create and use processes in your code.
 */
export namespace Process {
  /**
   * The well-known symbol that brands every `Process` value.
   *
   * Using `Symbol.for` ensures the symbol survives across module boundaries,
   * bundlers, and any other runtime shenanigans.
   */
  export const identifier = Symbol.for('@herodot-app/praxis/process')

  /**
   * The type of {@link identifier}.
   *
   * Useful when you need to reference the brand symbol in mapped or
   * conditional types.
   */
  export type Identifier = typeof identifier

  /**
   * The runtime error produced when a process fails in an unexpected way.
   *
   * This is a [`Ptoma`](../../ptoma/src/ptoma.ts) error — a branded, typed error that
   * carries a `cause` property explaining what went wrong. It is used when:
   * - The wrapped function throws a non-Ptoma value
   * - The wrapped function returns a `Zygon.Right` that isn't a Ptoma
   * - Something goes wrong during the unwrapping process
   *
   * @example
   * ```ts
   * const process = Process.create(() => {
   *   throw new Error('boom')
   * })
   *
   * const result = await process.processor()
   * // result.right is a Process.RuntimePtoma
   * // result.right.cause is the original Error
   * ```
   */
  export class RuntimePtoma extends Ptoma.create(
    '@herodot-app/praxis/runtime-ptoma',
  ) {}

  /**
   * The guaranteed output type of a process's processor function.
   *
   * This is always a `Promise` of a [`Zygon`](../../zygon/src/zygon.ts) where:
   * - The **left** type is the lifted success type (innermost `Left` unwrapped via
   *   [`Zygon.LiftLeft`](../../zygon/src/zygon.ts))
   * - The **right** type is the lifted failure type (innermost `Right` unwrapped via
   *   [`Zygon.LiftRight`](../../zygon/src/zygon.ts), defaulting to `RuntimePtoma`
   *   for unexpected errors)
   *
   * @typeParam L - The success (left) value type.
   * @typeParam R - The raw failure (right) value type from the wrapped function.
   */
  export type Output<L, R = unknown> = Promise<
    Zygon<Zygon.LiftLeft<Awaited<L>>, Zygon.LiftRight<Awaited<R>, RuntimePtoma>>
  >

  /**
   * Infers the raw function type that a process wraps.
   *
   * This handles the tricky case where `undefined` input means the function is
   * optional — i.e., `(input?: T) => R` rather than `(input: T) => R`.
   *
   * @typeParam L - The input type (the parameter).
   * @typeParam R - The return type.
   */
  export type RawFn<L = undefined, R = unknown> = [undefined] extends [L]
    ? (input?: L) => R
    : (input: L) => R

  /**
   * Extracts the input type from a function type.
   *
   * Given a function `F`, returns the type of its first parameter. Falls back
   * to `any` when the inference fails.
   *
   * @typeParam F - The function type to inspect.
   *
   * @example
   * ```ts
   * type Input = Process.Input<(name: string, age: number) => void>
   * // Input is string
   * ```
   */
  // biome-ignore lint: we especialy want any here
  export type Input<F extends (...args: any[]) => any> =
    // biome-ignore lint: we especialy want any here
    F extends (arg: infer I) => any ? I : any

  /**
   * The processor function type — the core of a process.
   *
   * This is the function you call at runtime to execute the process.
   * It takes an input (optional if the wrapped function doesn't require one)
   * and returns a {@link Promise} of a {@link Zygon}:
   * - [`Zygon.Left`](../../zygon/src/zygon.ts) on success
   * - [`Zygon.Right`](../../zygon/src/zygon.ts) on failure
   *
   * The output is lifted — nested `Zygon` values are unwrapped automatically,
   * so you don't have to drill through layers of `Left` or `Right` to get
   * to the actual value.
   *
   * @typeParam I - The input type.
   * @typeParam R - The raw return type of the wrapped function.
   */
  export type Fn<I = undefined, R = unknown> = [undefined] extends [I]
    ? (input?: I) => Output<R, R>
    : (input: I) => Output<R, R>

  /**
   * Creates a new process from a raw function.
   *
   * This is the main factory — pass any function and get back a `Process` that:
   * - Returns a `Zygon` instead of throwing
   * - Automatically unwraps nested `Zygon` results
   * - Preserves [`Ptoma`](../../ptoma/src/ptoma.ts) errors through the pipeline
   * - Brands the result so it identifies as a process
   *
   * @typeParam F - The raw function type to wrap.
   * @param rawProcessor - The function to transform into a process.
   * @returns A `Process` with an injectable `processor` method.
   *
   * @example
   * ```ts
   * // A simple processor
   * const double = Process.create((n: number) => n * 2)
   * const result = await double.processor(21)
   * result.left // 42
   *
   * // A processor that might fail
   * const sqrt = Process.create((n: number) => {
   *   if (n < 0) throw new Error('no imaginary numbers')
   *   return Math.sqrt(n)
   * })
   * const result = await sqrt.processor(-1)
   * result.right // RuntimePtoma with cause: Error('no imaginary numbers')
   * ```
   *
   * @example
   * ```ts
   * // Process returning a Ptoma — preserved through the pipeline
   * const NotFound = Ptoma.create<'NotFound', { id: string }>('NotFound')
   *
   * const fetchUser = Process.create((id: string) => {
   *   if (!db.has(id)) throw new NotFound('User not found', { id })
   *   return db.get(id)
   * })
   *
   * const result = await fetchUser('unknown')
   * if (result.right) {
   *   // Ptoma.is(result.right.cause, 'NotFound') is true
   *   console.log(result.right.cause.payload.id) // 'unknown' — full type info preserved!
   * }
   * ```
   */
  // biome-ignore lint: we especialy want any here
  export function create<F extends RawFn<any, any>>(
    rawProcessor: F,
  ): Process<Input<F>, ReturnType<F>> {
    const processor = async (input: Input<F>) => {
      try {
        const result = await Promise.resolve(rawProcessor(input))

        if (Zygon.is(result)) {
          if (Zygon.isLeft(result)) {
            return Zygon.left(Zygon.unwrapLiftLeft(result, result.left))
          }

          return Zygon.right(
            Zygon.unwrapLiftRight(
              result,
              new RuntimePtoma(
                'unknown runtime error process ptoma',
                undefined,
                {
                  cause: result.right,
                },
              ),
            ),
          )
        }

        return Zygon.left(result)
      } catch (err) {
        if (Ptoma.is(err)) {
          return Zygon.right(
            new RuntimePtoma(err.message, err.payload, {
              cause: err,
            }),
          )
        }

        if (Zygon.is(err)) {
          const cause = Zygon.unwrapLiftRight(
            err,
            new RuntimePtoma('unable to unwrap the errored zygon', undefined, {
              cause: err,
            }),
          )

          return Zygon.right(
            new RuntimePtoma('error during process:', undefined, {
              cause,
            }),
          )
        }

        return Zygon.right(
          new RuntimePtoma('unknown runtime error process ptoma', undefined, {
            cause: err,
          }),
        )
      }
    }

    return Idion.create({
      id: identifier,
      value: {
        processor,
      },
    }) as Process<Input<F>, ReturnType<F>>
  }
}
