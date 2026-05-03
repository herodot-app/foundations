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
 * Bring data into existence with {@link Eidos.create}, which validates input
 * against the schema and returns a {@link Zygon} — success on the left,
 * failure on the right. The Platonic Form judges; the Zygon carries the verdict.
 *
 * ```ts
 * import * as v from 'valibot'
 *
 * const UserEidos = Eidos.define({
 *   name: 'User',
 *   schema: v.object({ id: v.string(), age: v.number() }),
 * })
 *
 * const result = Eidos.create(UserEidos, { id: 'u1', age: 30 })
 * // result is Zygon<{ id: string; age: number }, Eidos.CreatePtoma>
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
   * The input shape expected by {@link define}.
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
   * Extracts the **validated output type** (`O`) from an {@link Eidos}.
   *
   * This is the type you receive on the left side of a successful {@link create}
   * call — the shape the schema produces after validation (and any transforms).
   * Purely compile-time; zero runtime cost.
   *
   * @typeParam E - An `Eidos` type to inspect.
   *
   * @example
   * ```ts
   * const UserEidos = Eidos.define({
   *   name: 'User',
   *   schema: v.object({ id: v.string(), age: v.number() }),
   * })
   *
   * type User = Eidos.Infer<typeof UserEidos>
   * //   ^? { id: string; age: number }
   * ```
   */
  // biome-ignore lint: we especially want any here to allow all values
  export type Infer<E extends Eidos<Name, any, any>> =
    // biome-ignore lint: we especially want any here to allow all values
    E extends Eidos<Name, any, any>
      ? StandardSchemaV1.InferOutput<E['schema']>
      : never

  /**
   * Extracts the **raw input type** (`I`) accepted by an {@link Eidos}'s schema.
   *
   * This is the type you pass into {@link create} — the unvalidated shape before
   * the schema runs. `InferInput` and {@link Infer} return the same type for
   * schemas without transforms; they diverge when a transform is involved.
   *
   * @typeParam E - An `Eidos` type to inspect.
   *
   * @example
   * ```ts
   * // With a transforming schema (input ≠ output):
   * const TimestampEidos = Eidos.define({
   *   name: 'Timestamp',
   *   schema: z.string().datetime().transform((s) => new Date(s)),
   * })
   *
   * type RawTimestamp    = Eidos.InferInput<typeof TimestampEidos>  // string
   * type ParsedTimestamp = Eidos.Infer<typeof TimestampEidos>       // Date
   * ```
   */
  // biome-ignore lint: we especially want any here to allow all values
  export type InferInput<E extends Eidos<Name, any, any>> =
    // biome-ignore lint: we especially want any here to allow all values
    E extends Eidos<Name, any, any>
      ? StandardSchemaV1.InferInput<E['schema']>
      : never

  /**
   * Extracts the **name literal** (`N`) from an {@link Eidos}.
   *
   * Returns the exact string or symbol literal passed as `name` to
   * {@link define}. Useful for building type-level registries or discriminating
   * on Eidos identity at the type level without holding a runtime reference.
   *
   * @typeParam E - An `Eidos` type to inspect.
   *
   * @example
   * ```ts
   * const UserEidos = Eidos.define({ name: 'User', schema: userSchema })
   *
   * type UserName = Eidos.InferName<typeof UserEidos>
   * //   ^? 'User'
   * ```
   */
  // biome-ignore lint: we especially want any here to allow all values
  export type InferName<E extends Eidos<Name, any, any>> =
    // biome-ignore lint: we especially want any here to allow all values
    E extends Eidos<infer N, any, any> ? N : never

  /**
   * Creates an `Eidos` from a name and a schema — the act of defining a Form.
   *
   * Draws the boundary of your data and gives it a name: it defines the line
   * between what a thing is and what it is not.
   *
   * @typeParam N - The name literal for this Eidos.
   * @typeParam I - The raw input type accepted by the schema.
   * @typeParam O - The validated output type produced by the schema.
   *
   * @param options - The name and schema that together define this Form.
   * @returns A fully branded {@link Eidos} ready to be used with {@link create}.
   *
   * @example
   * ```ts
   * import * as v from 'valibot'
   *
   * const EmailEidos = Eidos.define({
   *   name: 'Email',
   *   schema: v.pipe(v.string(), v.email()),
   * })
   * ```
   */
  export function define<N extends Name, I, O>(
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
   * The string identifier that brands a {@link CreatePtoma}.
   *
   * A plain string rather than a symbol so it can survive serialisation — handy
   * when you need to describe a validation failure in an error log and the reader
   * cannot import this module to compare symbols.
   */
  export const createPtomaIdentifier =
    '@herodot-app/eidos/create-ptoma' as const

  /**
   * The type of {@link createPtomaIdentifier}.
   */
  export type CreatePtomaIdentifier = typeof createPtomaIdentifier

  /**
   * The {@link Ptoma} (fallen value) produced when {@link create} rejects its input.
   *
   * When data fails to match the Eidos's Form, the schema returns issues.
   * Those issues are wrapped into a `CreatePtoma` and placed on the right
   * side of the {@link Zygon} — a named, typed record of everything that was
   * wrong with the input, rather than a cryptic `ValidationError: invalid_type`.
   *
   * The `issues` payload is a read-only array of {@link StandardSchemaV1.Issue}
   * entries, compatible with every major schema library (Zod, Valibot, Arktype…).
   *
   * @example
   * ```ts
   * const result = Eidos.create(UserEidos, { id: 123 }) // id should be a string
   *
   * if (Zygon.isRight(result)) {
   *   console.log(result.right.payload.issues)
   *   // [{ message: 'Expected string, received number', path: ['id'] }]
   * }
   * ```
   */
  export class CreatePtoma extends Ptoma.create<
    CreatePtomaIdentifier,
    { issues: ReadonlyArray<StandardSchemaV1.Issue> }
  >(createPtomaIdentifier) {}

  /**
   * Validates `input` against an `Eidos`'s schema, bringing a value into
   * typed existence — or recording its failure to do so.
   *
   * This is the moment a raw, unverified value either rises to the level of its
   * ideal Form, or falls short and is turned away at the door.
   *
   * Returns a {@link Zygon}:
   * - **{@link Zygon.Left | Left}** (left/success) — the validated output
   *   value `O`, ready to use.
   * - **{@link Zygon.Right | Right}** (right/failure) — a {@link CreatePtoma}
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
   * const result = Eidos.create(EmailEidos, 'hello@example.com')
   *
   * if (Zygon.isLeft(result)) {
   *   sendWelcomeEmail(result.left) // ✅ typed as string (validated email)
   * } else {
   *   console.error(result.right.payload.issues) // ❌ what went wrong
   * }
   * ```
   */
  export function create<N extends Name, I = unknown, O = I>(
    eidos: Eidos<N, I, O>,
    input: unknown,
  ): Zygon<O, CreatePtoma> {
    const payload = eidos.schema['~standard'].validate(
      input,
    ) as StandardSchemaV1.Result<O>

    if (payload.issues) {
      return Zygon.right(
        new CreatePtoma(createPtomaIdentifier, { issues: payload.issues }),
      ) as Zygon<O, CreatePtoma>
    }

    return Zygon.left(payload.value) as Zygon<O, CreatePtoma>
  }

  /**
   * Type guard — returns `true` when `value` is a {@link CreatePtoma}.
   *
   * Use this inside a `Zygon.isRight` branch when you want to distinguish a
   * validation failure from any other error that might be lurking on the right
   * side of a {@link Zygon}. A fallen value should at least be identifiable.
   *
   * @param value - The value to inspect.
   * @returns `true` if `value` is an instance of {@link CreatePtoma}.
   */
  export function isPtoma(value: unknown): value is CreatePtoma {
    return value instanceof CreatePtoma
  }
}
