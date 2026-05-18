import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Zygon } from '@herodot-app/zygon'
import { Cerebrum } from './cerebrum'
import { Experience } from './experience'
import type { Faculty } from './faculty'
import { Processor } from './processor'

export type Praxis<
  I = undefined,
  L = unknown,
  R = Cerebrum.Failures,
  C extends Faculty.Any = Faculty.Never,
> = Idion<
  Praxis.Identifier,
  {
    readonly cerebrum: Cerebrum<I, L>

    readonly processor: Processor

    pipe<L2 = unknown, R2 = Cerebrum.Failures>(
      thought: Cerebrum.Thought<Zygon<Experience<L>, Experience<R>>>,
    ): InferPraxis<I, L2, R | R2, C>
  }
>

export namespace Praxis {
  export const identifier = Symbol.for('@herodot-app/praxis')

  export type Identifier = typeof identifier

  export function create<I = undefined, L = unknown>(
    thought: Cerebrum.Thought<I, L>,
    processor: Processor = Processor.create(),
  ) {
    const cerebrum = Cerebrum.create(thought)

    function pipe(thought: (arg: any) => any) {
      const fn = async (experience: Experience<any, any>) => {
        const result = await Cerebrum.think(cerebrum, experience)

        if (Zygon.isRight(result) && Experience.isAborted(result.right)) {
          return Zygon.right(result.right)
        }

        if (Zygon.isLeft(result) && Experience.isAborted(result.left)) {
          return Zygon.right(result.left)
        }

        return thought(result)
      }

      return create(fn, processor)
    }

    return Idion.create({
      id: identifier,
      value: { cerebrum, processor, pipe },
    })
  }
}

//export class Praxis<I = undefined, L = unknown, R = Cerebrum.Failures, C extends Faculty.Any = Faculty.Never> {

// static create<I = undefined, L = unknown, R = Task.Failures>(
//   fn: Task.Runner<I, L>,
// ): InferPraxis<I, L, R> {
//   const task = Task.create<I, L>({
//     runner: fn,
//   })

//   return new Praxis(task) as InferPraxis<I, L, R>
// }

// constructor(public readonly task: Task<I, L>) {
//   this.pipe = this.pipe.bind(this)
//   this.run = this.run.bind(this)
//   this.chain = this.chain.bind(this)
//   this.chainRight = this.chainRight.bind(this)
//   this.recover = this.recover.bind(this)
//   this.fork = this.fork.bind(this)
//   this.effect = this.effect.bind(this)
//   this.spawn = this.spawn.bind(this)
// }

// pipe<L2 = unknown, R2 = Task.Failures>(
//   runner: Task.Runner<Zygon<L, R>, L2>,
// ): InferPraxis<I, L2, R | R2> {
//   const newTask = Task.create({
//     runner: async (input?: I) => {
//       // biome-ignore lint: unable to infer the input correctly here
//       const result = await (Task.run as any)(this.task, input)

//       if (Task.isAborted(this.task)) return result

//       const newResult = await Promise.resolve(runner(result))

//       return newResult
//     },
//     linkedTo: this.task,
//   })

//   return new Praxis(newTask) as unknown as InferPraxis<I, L2, R | R2>
// }

// chain<L2 = unknown, R2 = Task.Failures>(
//   runner: Task.Runner<L, L2>,
// ): InferPraxis<I, L2, R | R2> {
//   const newTask = Task.create({
//     linkedTo: this.task,
//     runner: async (input?: I) => {
//       // biome-ignore lint: unable to infer the input correctly here
//       const result = await (Task.run as any)(this.task, input)

//       if (Zygon.isRight(result)) return result

//       const newResult = await Promise.resolve(runner(result.left))

//       return newResult
//     },
//   })

//   return new Praxis(newTask) as unknown as InferPraxis<I, L2, R | R2>
// }

// chainRight<R2 = Task.Failures>(
//   runner: Task.Runner<R, R2>,
// ): InferPraxis<I, L, R2 | Task.Failures> {
//   const newTask = Task.create({
//     linkedTo: this.task,
//     runner: async (input?: I) => {
//       // biome-ignore lint: unable to infer the input correctly here
//       const result = await (Task.run as any)(this.task, input)

//       if (Zygon.isLeft(result)) return result
//       if (Task.isAborted(this.task)) return result

//       const newResult = await Promise.resolve(runner(result.right))

//       return Zygon.right(newResult)
//     },
//   })

//   return new Praxis(newTask) as unknown as InferPraxis<
//     I,
//     L,
//     R2 | Task.Failures
//   >
// }

// recover<L2 = unknown>(runner: Task.Runner<R, L2>): InferPraxis<I, L | L2, R> {
//   const newTask = Task.create({
//     linkedTo: this.task,
//     runner: async (input?: I) => {
//       // biome-ignore lint: unable to infer the input correctly here
//       const result = await (Task.run as any)(this.task, input)

//       if (Zygon.isLeft(result)) return result
//       if (Task.isAborted(this.task)) return result

//       return await Promise.resolve(runner(result.right))
//     },
//   })

//   return new Praxis(newTask) as unknown as InferPraxis<I, L | L2, R>
// }

// fork<I2 = undefined, L2 = unknown, R2 = Task.Failures>(
//   runner: Task.Runner<
//     L,
//     Praxis<L | I2, L2, R2> | Promise<Praxis<L | I2, L2, R2>>
//   >,
// ): InferPraxis<I, L2, R | R2> {
//   const newTask = Task.create({
//     linkedTo: this.task,
//     runner: async (input?: I) => {
//       // biome-ignore lint: unable to infer the input correctly here
//       const result = await (Task.run as any)(this.task, input)

//       if (Zygon.isRight(result)) return result

//       const otherPraxis = await Promise.resolve(runner(result.left))

//       const unlink = Task.link(this.task, otherPraxis.task)

//       // biome-ignore lint: unable to infer the input here
//       const value = (otherPraxis.run as any)(result.left)

//       unlink()

//       return value
//     },
//   })

//   return new Praxis(newTask) as unknown as InferPraxis<I, L2, R | R2>
// }

// effect(
//   runner: Task.Runner<Zygon<L, R>, void | Promise<void>>,
// ): InferPraxis<I, L, R> {
//   const newTask = Task.create({
//     linkedTo: this.task,
//     runner: async (input?: I) => {
//       // biome-ignore lint: unable to infer the input correctly here
//       const result = await (Task.run as any)(this.task, input)

//       if (Task.isAborted(this.task)) return result

//       await Promise.resolve(runner(result))

//       return result
//     },
//   })

//   return new Praxis(newTask) as unknown as InferPraxis<I, L, R>
// }

// spawn(
//   runner: Task.Runner<Zygon<L, R>, void | Promise<void>>,
//   catcher?: (err: unknown) => void,
// ): InferPraxis<I, L, R> {
//   const newTask = Task.create({
//     linkedTo: this.task,
//     runner: async (input?: I) => {
//       // biome-ignore lint: unable to infer the input correctly here
//       const result = await (Task.run as any)(this.task, input)

//       if (Task.isAborted(this.task)) return result

//       new Promise(() => runner(result)).catch(err => catcher?.(err))

//       return result
//     },
//   })

//   return new Praxis(newTask) as unknown as InferPraxis<I, L, R>
// }

// run(...inputs: Task.InferRunInput<I>): Task.Return<L, R> {
//   const input = inputs.at(0)

//   Task.restore(this.task)

//   // biome-ignore lint: unable to infer the input args correctly here
//   return (Task.run as any)(this.task, input)
// }

// abort(reason?: string): void {
//   Task.abort(this.task, reason)
// }
//}

type InferPraxis<
  I = undefined,
  L = unknown,
  R = Cerebrum.Failures,
  C extends Faculty.Any = Faculty.Never,
> = Praxis<
  I,
  Experience.InferValue<Zygon.AwaitedLiftLeft<L>>,
  Experience.InferValue<
    Zygon.AwaitedLiftRight<Zygon.Right<R>> | Zygon.AwaitedLiftRight<L>
  >,
  C
>
