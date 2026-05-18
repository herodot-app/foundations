import { Idion } from '@herodot-app/idion'

export type Faculty<R extends Record<Faculty.Key, unknown>> = Idion<
  Faculty.Identifier,
  {
    readonly services: {
      [K in keyof R]: R[K]
    }
  }
>

export namespace Faculty {
  export const identifier = Symbol.for('@herodot-app/praxis/faculty')

  export type Identifier = typeof identifier

  export type Key = string | symbol

  // biome-ignore lint: we want here any faculty value
  export type Any = Faculty<Record<Key, any>>

  export type Never = Faculty<Record<Key, never>>

  export type Unknown = Faculty<Record<Key, unknown>>

  export type InferKeys<C extends Any> = keyof C['services']

  export type Merge<A extends Faculty.Any, B extends Faculty.Any> = Faculty<
    { [K in keyof A['services']]: A[K] } & {
      [K2 in keyof B['services']]: B[K2]
    }
  >

  export function merge<A extends Faculty.Any, B extends Faculty.Any>(
    first: A,
    second: B,
  ): Merge<A, B> {
    return Faculty.create(
      Object.assign({}, first.services, second.services),
    ) as Merge<A, B>
  }

  export function create<
    T extends Record<Faculty.Key, unknown> = Record<never, never>,
  >(record: T = Object.create({})): Faculty<T> {
    return Idion.create({
      id: identifier,
      value: {
        services: record,
      },
    })
  }

  export function has<T extends Record<Faculty.Key, unknown>>(
    faculty: Faculty<T>,
    key: keyof T | Key,
  ): boolean {
    return undefined !== faculty.services[key]
  }

  export function get<
    T extends Record<Faculty.Key, unknown>,
    K extends keyof T,
  >(faculty: Faculty<T>, key: K): Faculty<T>['services'][K] {
    return faculty.services[key]
  }

  export function learn<
    T1 extends Record<Faculty.Key, unknown>,
    T2 extends Record<Faculty.Key, unknown>,
  >(faculty: Faculty<T1>, record: T2): Faculty<T1 & T2> {
    return create<T1 & T2>(Object.assign({}, faculty.services, record))
  }
}
