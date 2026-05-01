export type Idion<T extends {}, I extends Idion.Brand> = {
  [Idion.identifier]: I
} & T

export namespace Idion {
  export const identifier: unique symbol = Symbol.for(
    '@herodot-app/idion/identifier',
  )

  export type Identifier = typeof identifier

  export type Brand = string | symbol

  export type CreateInput<T extends {}, I extends Brand> = {
    value: T
    id: I
  }

  export function create<T extends {}, I extends Brand>({
    value,
    id,
  }: CreateInput<T, I>): Idion<T, I> {
    return Object.assign(value, {
      [Idion.identifier]: id,
    })
  }

  export function is<T extends {}, I extends Brand = Brand>(
    value: T,
    id?: I,
  ): value is Idion<T, I> {
    const inferedValue = value as Idion<T, I>

    if (inferedValue[Idion.identifier] === undefined) return false

    if (id !== undefined) {
      return inferedValue[Idion.identifier] === id
    }

    return true
  }
}
