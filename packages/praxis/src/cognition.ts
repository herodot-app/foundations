import { Idion } from '@herodot-app/idion'

export type Cognition<R extends Record<Cognition.Key, unknown>> = Idion<
  Cognition.Identifier,
  {
    readonly services: {
      [K in keyof R]: R[K]
    }
  }
>

export namespace Cognition {
  export const identifier = Symbol.for('@herodot-app/praxis/cognition')

  export type Identifier = typeof identifier

  export type Key = string | symbol

  // biome-ignore lint: we want here any cognition value
  export type Any = Cognition<Record<Key, any>>

  export type Never = Cognition<Record<Key, never>>

  export type Unknown = Cognition<Record<Key, unknown>>

  export type InferKeys<C extends Any> = keyof C['services']

  export type Merge<
    A extends Cognition.Any,
    B extends Cognition.Any,
  > = Cognition<
    { [K in keyof A['services']]: A[K] } & {
      [K2 in keyof B['services']]: B[K2]
    }
  >

  export function merge<A extends Cognition.Any, B extends Cognition.Any>(
    first: A,
    second: B,
  ): Merge<A, B> {
    return Cognition.create(
      Object.assign({}, first.services, second.services),
    ) as Merge<A, B>
  }

  export function create<
    T extends Record<Cognition.Key, unknown> = Record<never, never>,
  >(record: T = Object.create({})): Cognition<T> {
    return Idion.create({
      id: identifier,
      value: {
        services: record,
      },
    })
  }

  export function has<T extends Record<Cognition.Key, unknown>>(
    cognition: Cognition<T>,
    key: keyof T | Key,
  ): boolean {
    return undefined !== cognition.services[key]
  }

  export function get<
    T extends Record<Cognition.Key, unknown>,
    K extends keyof T,
  >(cognition: Cognition<T>, key: K): Cognition<T>['services'][K] {
    return cognition.services[key]
  }

  export function learn<
    T1 extends Record<Cognition.Key, unknown>,
    T2 extends Record<Cognition.Key, unknown>,
  >(cognition: Cognition<T1>, record: T2): Cognition<T1 & T2> {
    return create<T1 & T2>(Object.assign({}, cognition.services, record))
  }
}
