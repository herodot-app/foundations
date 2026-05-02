/**
 * A branded object type that carries its own identity.
 *
 * From the Ancient Greek **ἴδιον** (*idion*) — meaning "one's own",
 * "particular", or "that which belongs to oneself". Not to be confused with
 * *idiot*, which shares the same root but took a very different career path.
 *
 * An `Idion` is simply a plain object `T` augmented with a hidden brand `I`
 * stored under the well-known {@link Idion.identifier} symbol. At runtime the
 * brand is just a string or symbol sitting on the object; at compile time it
 * gives TypeScript enough information to distinguish structurally identical
 * shapes from one another.
 *
 * ```ts
 * type UserId   = Idion<'UserId', { value: string }>
 * type PostId   = Idion<'PostId', { value: string }>
 *
 * declare const uid: UserId
 * const pid: PostId = uid // ✗ Type error — they may look the same, but they
 *                         //   know who they are.
 * ```
 *
 * @typeParam I - The brand that gives this object its own identity.
 * @typeParam T - The base object shape that carries the actual data.
 */
export type Idion<I extends Idion.Brand, T extends {}> = {
  readonly [Idion.identifier]: true
} & {
  readonly [key in I]: true
} & T

/**
 * Utilities for creating, inspecting, and narrowing {@link Idion} values.
 *
 * The namespace mirrors the type so that both live under the same name —
 * a pattern sometimes called a *companion namespace*. Think of it as the
 * type and its toolbox travelling together, inseparable, like good friends.
 */
export namespace Idion {
  /**
   * The well-known symbol used as the property key that stores the brand on
   * every `Idion` object.
   *
   * Using `Symbol.for` ensures the symbol survives across module boundaries
   * and bundler shenanigans — the same key, everywhere, always.
   */
  export const identifier: unique symbol = Symbol.for(
    '@herodot-app/idion/identifier',
  )

  /**
   * The type of {@link identifier}.
   *
   * Useful when you need to reference the symbol key in mapped types or index
   * signatures without spelling it out in full each time.
   */
  export type Identifier = typeof identifier

  /**
   * The set of allowed brand values — a `string` or a `symbol`.
   *
   * Strings are great for human-readable brands (`'UserId'`, `'PostId'`).
   * Symbols are great when you want the brand to be truly unguessable, known
   * only to whoever holds a reference to the symbol itself.
   */
  export type Brand = string | symbol

  /**
   * The input shape expected by {@link create}.
   *
   * @typeParam I - The brand to apply.
   * @typeParam T - The base object to brand.
   *
   * @example
   * ```ts
   * const input: Idion.CreateInput<'Score', { value: number }> = {
   *   value: { value: 42 },
   *   id: 'Score',
   * }
   * ```
   */
  export type CreateInput<I extends Brand, T extends {}> = {
    /**
     * The plain object that will be mutated in-place to carry the brand.
     */
    value: T

    /**
     * The brand identity to stamp onto `value`.
     */
    id: I
  }

  /**
   * Stamps a brand onto a plain object, returning a fully typed {@link Idion}.
   *
   * The brand is added directly onto `value` via `Object.assign`, so the
   * original reference and the returned `Idion` are the same object. No
   * cloning, no ceremony — just a quiet identity crisis resolved in one line.
   *
   * @typeParam I - The brand to apply.
   * @typeParam T - The base object shape.
   *
   * @param input - An object containing the `value` to brand and the `id` to
   *   brand it with.
   *
   * @returns The same object, now typed as `Idion<T, I>`.
   *
   * @example
   * ```ts
   * const userId = Idion.create({ value: { value: 'abc-123' }, id: 'UserId' })
   * //    ^? Idion<'UserId', { value: string }>
   * ```
   */
  export function create<I extends Brand, T extends {}>({
    value,
    id,
  }: CreateInput<I, T>): Idion<I, T> {
    return Object.assign(
      {
        [Idion.identifier]: true,
        [id]: true,
      } as const,
      value,
    ) as Idion<I, T>
  }

  /**
   * Narrows an arbitrary value to `Idion<T, I>`.
   *
   * Without `id`, the check only confirms that the value carries *some* brand
   * — useful when you want to know "is this thing one of ours?" without caring
   * which specific identity it holds.
   *
   * With `id`, the check also verifies that the brand matches exactly — useful
   * when you need to distinguish a `UserId` from a `PostId` at runtime.
   *
   * @typeParam I - The specific brand to match, defaults to the widest
   *   {@link Brand} when omitted.
   * @typeParam T - The base object shape the caller already expects.
   *
   * @param value - The value to inspect.
   * @param id - An optional brand to match against. When provided, the guard
   *   only passes if the stored brand equals `id`.
   *
   * @returns `true` if `value` is a branded `Idion` (and its brand matches
   *   `id`, when supplied), narrowing the TypeScript type accordingly.
   *
   * @example
   * ```ts
   * if (Idion.is(maybeUser, 'UserId')) {
   *   // TypeScript now knows maybeUser is Idion<typeof maybeUser, 'UserId'>
   * }
   * ```
   */
  // biome-ignore lint/complexity/noBannedTypes: The `{}` type is intentional here to allow any object shape as the base.
  export function is<I extends Brand = Brand, T extends {} = {}>(
    value: T,
    id?: I,
  ): value is Idion<I, T> {
    const inferedValue = value as Idion<I, T>

    if (null === value || undefined === value) return false

    if (inferedValue[Idion.identifier] !== true) return false

    if (id !== undefined) {
      return inferedValue[id] === true
    }

    return true
  }
}
