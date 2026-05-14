import { Idion } from '@herodot-app/idion'
import type { Process } from './process'
import { Zygon } from '@herodot-app/zygon'
import { Ptoma } from '@herodot-app/ptoma'

export type Processor = Idion<
  Processor.Identifier,
  {
    stack: ReadonlyMap<string, Process.Any>
  }
>

export namespace Processor {
  export const identifier = Symbol.for('@herodot-app/praxis/processor')

  export type Identifier = typeof identifier

  export class UnregisteredFailure extends Ptoma.create(
    '@herodot-app/praxis/processor/unregistered-failure',
  ) {}

  export function create(stack: Process.Any[] = []): Processor {
    const stackMap = stack.reduce(
      (acc, process) => acc.set(process.id, process),
      new Map(),
    )

    return Idion.create({
      id: identifier,
      value: { stack: stackMap },
    })
  }

  export function get(
    processor: Processor,
    id: string,
  ): Zygon<Process.Any, UnregisteredFailure> {
    const process = processor.stack.get(id)

    if (undefined === process) {
      return Zygon.right(
        new UnregisteredFailure(`unable to retrieve process with id ${id}`),
      )
    }

    return Zygon.left(process)
  }

  export function has(processor: Processor, id: string): boolean {
    return processor.stack.get(id) !== undefined
  }

  export function register(
    processor: Processor,
    process: Process.Any,
  ): Processor {
    return Processor.create([process, ...processor.stack.values()])
  }

  export function length(processor: Processor): number {
    return processor.stack.size
  }

  export function each(
    processor: Processor,
    fn: (process: Process.Any) => void,
  ): void {
    processor.stack.values().forEach(fn)
  }

  export function unregister(
    processor: Processor,
    idOrProcess: string | Process.Any,
  ): Processor {
    const id = 'string' === typeof idOrProcess ? idOrProcess : idOrProcess.id

    return Processor.create(
      [...processor.stack.values()].filter(process => process.id !== id),
    )
  }

  export function unstack(processor: Processor): Processor {
    return Processor.create([...processor.stack.values()].slice(0, -1))
  }
}
