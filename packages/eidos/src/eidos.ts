import { Idion } from '@herodot-app/idion'
import { Ptoma } from '@herodot-app/ptoma'
import { Zygon } from '@herodot-app/zygon'
import type { StandardSchemaV1 } from '@standard-schema/spec'

/**
 * A named, typed schema definition — the Platonic Form of your data.
 *
 * From the Ancient Greek **εἶδος** (_eidos_) — meaning "form", "shape", or
 * "essence". In Plato's philosophy, the Eidos is the ideal blueprint that
 * real-world things are mere shadows of. Here, an `Eidos` is the blueprint
 * your data must live up to before it is allowed to exist in your system.
 *
 * An `Eidos` is an {@link Idion} that carries two things:
 * - a **name** `N` — a string or symbol that identifies what this form
 *   represents (e.g. `'User'`, `'Invoice'`)
 * - a **schema** — a {@link StandardSchemaV1}-compliant validator that
 *   knows the shape the data must conform to
 *
 * Bring data into existence with {@link Eidos.genesis}, which validates input
 * against the schema and returns a {@link Zygon} — success on the left,
 * failure on the right. The Platonic Form judges; the Zygon carries the verdict.
 *
 * ```ts
 * import * as v from 'valibot'
 *
 * const UserEidos = Eidos.horismos({
 *   name: 'User',
 *   schema: v.object({ id: v.string(), age: v.number() }),
 * })
 *
 * const result = Eidos.genesis(UserEidos, { id: 'u1', age: 30 })
 * // result is Zygon<{ id: string; age: number }, Eidos.GenesisPtoma>
 * ```
 *
 * @typeParam N - The name literal that identifies this Eidos.
 * @typeParam I - The input type accepted by the schema (what comes in raw).
 * @typeParam O - The output type produced by the schema (what comes out validated).
 *   Defaults to `I` — because most schemas don't transform the data, they
 *   just refuse to let the bad bits through.
 */
export type Eidos<N extends Eidos.Name, I = unknown, O = I> = Idion<
  Eidos.Identifier,
  {
    name: N
    schema: StandardSchemaV1<I, O>
  }
>

/**
 * Utilities for defining, inspecting, and instantiating {@link Eidos} values.
 *
 * The companion namespace to the `Eidos` type — they share a name because one
 * without the other would be philosophically incomplete. The type is the Form;
 * the namespace is the toolkit for working with it.
 */
export namespace Eidos {
  /**
   * The well-known symbol that brands every `Eidos` object.
   *
   * Using `Symbol.for` means this brand is stable across module boundaries and
   * bundler magic — no matter how many times the library gets loaded, there is
   * only one Eidos brand. Platonically speaking, there is only ever one Form.
   */
  export const identifier = Symbol.for('@herodot-app/eidos')

  /**
   * The type of {@link identifier}.
   *
   * Useful when you need the brand in a type position without importing the
   * runtime symbol.
   */
  export type Identifier = typeof identifier

  /**
   * The allowed types for an Eidos name.
   *
   * Strings work great for human-readable labels (`'User'`, `'Invoice'`).
   * Symbols work great when you want a name that is truly unique and
   * unguessable — known only to whoever holds the symbol reference.
   * Both are first-class Platonic citizens here.
   */
  export type Name = string | symbol

  /**
   * The input shape expected by {@link horismos}.
   *
   * @typeParam N - The name of the Eidos to create.
   * @typeParam I - The raw input type accepted by the schema.
   * @typeParam O - The validated output type produced by the schema.
   *
   * @example
   * ```ts
   * const opts: Eidos.Options<'Score', number, number> = {
   *   name: 'Score',
   *   schema: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
   * }
   * ```
   */
  export type Options<N extends Name, I = unknown, O = I> = {
    /**
     * The name that identifies this Eidos — its Platonic label.
     */
    name: N

    /**
     * A {@link StandardSchemaV1}-compliant schema that defines the Form.
     */
    schema: StandardSchemaV1<I, O>
  }

  /**
   * Creates an `Eidos` from a name and a schema — the act of defining a Form.
   *
   * The function name comes from the Greek **ὁρισμός** (_horismos_) — meaning
   * "definition" or "boundary". In Aristotelian logic, a _horismos_ is a
   * rigorous definition that draws the line between what a thing is and what
   * it is not. That is precisely what this function does: it draws the boundary
   * of your data and gives it a name.
   *
   * @typeParam N - The name literal for this Eidos.
   * @typeParam I - The raw input type accepted by the schema.
   * @typeParam O - The validated output type produced by the schema.
   *
   * @param options - The name and schema that together define this Form.
   * @returns A fully branded {@link Eidos} ready to be used with {@link genesis}.
   *
   * @example
   * ```ts
   * import * as v from 'valibot'
   *
   * const EmailEidos = Eidos.horismos({
   *   name: 'Email',
   *   schema: v.pipe(v.string(), v.email()),
   * })
   * ```
   */
  export function horismos<N extends Name, I, O>(
    options: Options<N, I, O>,
  ): Eidos<N, I, O> {
    return Idion.create({
      id: identifier,
      value: {
        name: options.name,
        schema: options.schema,
      },
    })
  }

  /**
   * Type guard — returns `true` when `value` is an {@link Eidos}.
   *
   * Useful at module boundaries where you receive `unknown` and need to verify
   * that someone actually handed you a Form and not just a random object that
   * happens to have a `name` property.
   *
   * @typeParam N - Expected name type (defaults to `'unknown'`).
   * @typeParam I - Expected input type (defaults to `unknown`).
   * @typeParam O - Expected output type (defaults to `I`).
   *
   * @param value - The value to inspect.
   * @returns `true` if `value` is a branded {@link Eidos}, narrowing its type.
   */
  export function is<N extends Name = 'unknown', I = unknown, O = I>(
    value: unknown,
  ): value is Eidos<N, I, O> {
    // biome-ignore lint: we neeed to cast is as {} to ensure Idion.is has no conflicts with the value type
    return Idion.is(value as {}, identifier)
  }

  /**
   * The string identifier that brands a {@link GenesisPtoma}.
   *
   * A plain string rather than a symbol so it can survive serialisation — handy
   * when you need to describe a validation failure in an error log and the reader
   * cannot import this module to compare symbols.
   */
  export const genesisPtomaIdentifier =
    '@herodot-app/eidos/genesis-ptoma' as const

  /**
   * The type of {@link genesisPtomaIdentifier}.
   */
  export type GenesisPtomaIdentifier = typeof genesisPtomaIdentifier

  /**
   * The {@link Ptoma} (fallen value) produced when {@link genesis} rejects its input.
   *
   * When data fails to match the Eidos's Form, the schema returns issues.
   * Those issues are wrapped into a `GenesisPtoma` and placed on the right
   * side of the {@link Zygon} — a named, typed record of everything that was
   * wrong with the input, rather than a cryptic `ValidationError: invalid_type`.
   *
   * The `issues` payload is a read-only array of {@link StandardSchemaV1.Issue}
   * entries, compatible with every major schema library (Zod, Valibot, Arktype…).
   *
   * @example
   * ```ts
   * const result = Eidos.genesis(UserEidos, { id: 123 }) // id should be a string
   *
   * if (Zygon.isRight(result)) {
   *   console.log(result.right.payload.issues)
   *   // [{ message: 'Expected string, received number', path: ['id'] }]
   * }
   * ```
   */
  export class GenesisPtoma extends Ptoma.create<
    GenesisPtomaIdentifier,
    { issues: ReadonlyArray<StandardSchemaV1.Issue> }
  >(genesisPtomaIdentifier) {}

  /**
   * Validates `input` against an `Eidos`'s schema, bringing a value into
   * typed existence — or recording its failure to do so.
   *
   * The function name comes from the Greek **γένεσις** (_genesis_) — meaning
   * "origin", "creation", or "coming into being". In the Platonic sense, this is
   * the moment a raw, unverified value either rises to the level of its ideal
   * Form, or falls short and is turned away at the door.
   *
   * Returns a {@link Zygon}:
   * - **{@link Zygon.Left | Left}** (left/success) — the validated output
   *   value `O`, ready to use.
   * - **{@link Zygon.Right | Right}** (right/failure) — a {@link GenesisPtoma}
   *   carrying the list of schema issues that prevented the value from existing.
   *
   * @typeParam N - The Eidos name.
   * @typeParam I - The raw input type.
   * @typeParam O - The validated output type.
   *
   * @param eidos - The Form to validate `input` against.
   * @param input - The raw, unverified data. Any `unknown` is welcome to try.
   * @returns A `Zygon<O, GenesisPtoma>` — success on the left, issues on the right.
   *
   * @example
   * ```ts
   * const result = Eidos.genesis(EmailEidos, 'hello@example.com')
   *
   * if (Zygon.isLeft(result)) {
   *   sendWelcomeEmail(result.left) // ✅ typed as string (validated email)
   * } else {
   *   console.error(result.right.payload.issues) // ❌ what went wrong
   * }
   * ```
   */
  export function genesis<N extends Name, I = unknown, O = I>(
    eidos: Eidos<N, I, O>,
    input: unknown,
  ): Zygon<O, GenesisPtoma> {
    const payload = eidos.schema['~standard'].validate(
      input,
    ) as StandardSchemaV1.Result<O>

    if (payload.issues) {
      return Zygon.right(
        new GenesisPtoma(genesisPtomaIdentifier, { issues: payload.issues }),
      ) as Zygon<O, GenesisPtoma>
    }

    return Zygon.left(payload.value) as Zygon<O, GenesisPtoma>
  }

  /**
   * Type guard — returns `true` when `value` is a {@link GenesisPtoma}.
   *
   * Use this inside a `Zygon.isRight` branch when you want to distinguish a
   * validation failure from any other error that might be lurking on the right
   * side of a {@link Zygon}. A fallen value should at least be identifiable.
   *
   * @param value - The value to inspect.
   * @returns `true` if `value` is an instance of {@link GenesisPtoma}.
   */
  export function isPtoma(value: unknown): value is GenesisPtoma {
    return value instanceof GenesisPtoma
  }
}
