/**
 * # Ptoma
 *
 * **Why "Ptoma"?**
 *
 * From the Ancient Greek _πτῶμα_ (ptôma), meaning "a fall" — and, by natural
 * extension, "a corpse". Because when something goes wrong in your program,
 * what you really have on your hands is a fallen value: not quite dead, but
 * definitely not healthy either.
 *
 * Errors in JavaScript are famously stringly-typed. You throw a `new Error("something
 * went wrong")`, catch it three layers up, squint at `err.message`, and hope for
 * the best. Ptoma gives errors a _name_ and an optional _payload_ — both
 * statically typed — so that you can catch exactly what you expect and let
 * everything else bubble up gracefully.
 *
 * @example
 * ```ts
 * // Define your errors once, at the top of the module
 * const NotFound = Ptoma.create<'NotFound', { id: string }>('NotFound')
 * const Unauthorized = Ptoma.create<'Unauthorized'>('Unauthorized')
 *
 * // Throw them like normal errors
 * throw new NotFound('User not found', { id: '42' })
 *
 * // Catch them with full type safety
 * try {
 *   await fetchUser(id)
 * } catch (err) {
 *   if (Ptoma.is(err, 'NotFound')) {
 *     console.log(err.payload.id) // ✅ typed as string
 *   }
 * }
 * ```
 *
 * @module
 */

/**
 * A branded, typed error.
 *
 * A `Ptoma` is a standard `Error` enriched with two things:
 * - a **name** `N` — a string literal type that uniquely identifies the error kind
 * - a **payload** `P` — optional structured data attached to the error
 *
 * The payload type is optional at the type level. When `P` is `undefined` (the
 * default), the `payload` property is optional on instances. When `P` is
 * provided, it becomes required — because a `NotFound` without an `{ id }` is
 * just a sad, context-free scream into the void.
 *
 * The `[Ptoma.identifier]` symbol brand ensures that `Ptoma.is()` can reliably
 * distinguish a genuine Ptoma from any random `Error` that happens to have the
 * right `.name` set by hand. Trust, but verify.
 *
 * @typeParam N - The unique string literal name of this error kind.
 * @typeParam P - The payload type. Defaults to `undefined` (no payload).
 *
 * @example
 * ```ts
 * type DatabaseError = Ptoma<'DatabaseError', { query: string; code: number }>
 * ```
 */
export type Ptoma<N extends string, P = undefined> = Error & {
  [Ptoma.identifier]: true
  name: N
} & ([undefined] extends [P]
    ? {
        payload?: P
      }
    : {
        payload: P
      })

/**
 * Utilities for creating and narrowing {@link Ptoma} error types.
 *
 * All the machinery lives here: the symbol brand, the constructor type, the
 * factory, and the type guard. Think of this namespace as the coroner's office —
 * it identifies the body, fills in the paperwork, and keeps everything on file.
 */
export namespace Ptoma {
  /**
   * A well-known symbol used to brand Ptoma instances.
   *
   * Using `Symbol.for` means the brand survives across realms (think iframes,
   * workers, or multiple copies of the library loaded in the same process). Two
   * separate `import`s of this module will share the exact same symbol, so
   * `Ptoma.is()` keeps working even when your bundler does something creative.
   */
  export const identifier = Symbol.for('@herodot-app/ptoma/identifier')

  /**
   * The type of {@link identifier}.
   *
   * Useful when you need to reference the brand symbol in a mapped or
   * conditional type without importing the runtime value.
   */
  export type Identifier = typeof identifier

  /**
   * The constructor type of a Ptoma error class produced by {@link create}.
   *
   * When `P` is `undefined`, `payload` is an optional parameter. When `P` is
   * a concrete type, `payload` becomes required — the type system won't let
   * you forget to explain yourself.
   *
   * @typeParam N - The error name literal.
   * @typeParam P - The payload type.
   *
   * @example
   * ```ts
   * const MyError: Ptoma.Constructor<'MyError', { reason: string }> =
   *   Ptoma.create('MyError')
   * ```
   */
  export type Constructor<N extends string, P = undefined> = [
    undefined,
  ] extends [P]
    ? new (
        message?: string,
        payload?: P,
        options?: ErrorOptions,
      ) => Ptoma<N, P>
    : new (
        message: string,
        payload: P,
        options?: ErrorOptions,
      ) => Ptoma<N, P>

  /**
   * Creates a new Ptoma error class for the given error name.
   *
   * The returned class extends `Error`, sets `.name` to `name`, brands the
   * instance with {@link identifier}, and optionally captures a clean stack
   * trace (V8 only — everyone else gets a slightly messier stack, but still a
   * stack).
   *
   * You typically call this once at module level and export the result:
   *
   * ```ts
   * // errors.ts
   * export const NetworkError = Ptoma.create<'NetworkError', { status: number }>('NetworkError')
   * export const TimeoutError = Ptoma.create<'TimeoutError'>('TimeoutError')
   * ```
   *
   * Then throw and catch it anywhere:
   *
   * ```ts
   * throw new NetworkError('Service unavailable', { status: 503 })
   * ```
   *
   * @typeParam N - The string literal that names this error kind. Must be unique
   *   across your error taxonomy, or `Ptoma.is()` will have opinions.
   * @typeParam P - Optional payload type. Omit for payload-free errors.
   * @param name - The runtime name string, mirroring the `N` type parameter.
   * @param defaultMessage - Optional default message used when no message is provided during instantiation.
   * @returns A constructor that produces fully-typed {@link Ptoma} instances.
   */
  export function create<N extends string, P = undefined>(
    name: N,
    defaultMessage?: string,
  ): Constructor<N, P> {
    const id = identifier

    // @ts-expect-error: We want to be able to return a class that extends Error with a dynamic name and payload type.
    return class extends Error {
      constructor(
        message?: string,
        public payload?: P,
        options?: ErrorOptions,
      ) {
        super(message ?? defaultMessage, options)

        // biome-ignore lint: we want to use a symbol to brand the instance without risking key collisions.
        ;(this as any)[id] = true
        this.name = name

        if (typeof Error.captureStackTrace === 'function') {
          Error.captureStackTrace(this, this.constructor)
        }
      }
    }
  }

  /**
   * Type guard that checks whether an unknown value is a {@link Ptoma} instance.
   *
   * When called with only `subject`, it returns `true` for any Ptoma regardless
   * of name. When called with a `name`, it further narrows to that specific error
   * kind — useful in `catch` blocks where you want to handle one case and rethrow
   * the rest.
   *
   * ```ts
   * try {
   *   await riskyOperation()
   * } catch (err) {
   *   if (Ptoma.is(err, 'RateLimited')) {
   *     await sleep(err.payload.retryAfter) // err.payload is typed ✅
   *     return retry()
   *   }
   *   throw err // not our problem, carry on
   * }
   * ```
   *
   * @typeParam N - The expected error name literal (inferred from `name` when provided).
   * @typeParam P - The expected payload type (must be provided explicitly if needed).
   * @param subject - The value to inspect. Any unknown value is acceptable —
   *   no need to pre-check `instanceof Error`.
   * @param name - When provided, also asserts that `subject.name === name`.
   * @returns `true` if `subject` is a branded {@link Ptoma}, narrowing its type accordingly.
   */
  export function is<N extends string = string, P = undefined>(
    subject: unknown,
    name?: N,
  ): subject is Ptoma<N, P> {
    const isPtoma =
      // biome-ignore lint: we want to use a symbol to brand the instance without risking key collisions.
      subject instanceof Error && (subject as any)[identifier] === true

    if (!isPtoma) return false

    if (name !== undefined) {
      return subject.name === name
    }

    return true
  }

  /**
   * Type guard that checks whether an unknown value is an instance of a specific
   * {@link Ptoma} subclass.
   *
   * While {@link is} checks for any Ptoma or a Ptoma by name string, `match`
   * checks against a concrete Ptoma subclass constructor — useful when you've
   * defined multiple error classes and want to discriminate between them at the
   * type level.
   *
   * ```ts
   * // Define specific error classes
   * class DatabaseError extends Ptoma.create<'DatabaseError', { table: string }>('DatabaseError') {}
   * class NetworkError extends Ptoma.create<'NetworkError', { code: number }>('NetworkError') {}
   *
   * function handleError(err: unknown) {
   *   if (Ptoma.match(err, DatabaseError)) {
   *     // err is typed as DatabaseError ✅
   *     console.log(`Failed on table: ${err.payload.table}`)
   *   } else if (Ptoma.match(err, NetworkError)) {
   *     // err is typed as NetworkError ✅
   *     console.log(`Network error code: ${err.payload.code}`)
   *   } else {
   *     // err is unknown - could be a different Ptoma or a plain Error
   *     throw err
   *   }
   * }
   * ```
   *
   * **Why not just use `instanceof`?**
   *
   * JavaScript's `instanceof` checks the prototype chain, but it doesn't know
   * about Ptoma's branding. Without the {@link is} check, any object that happens
   * to inherit from Error could slip through. `match` combines both checks:
   *
   * 1. First verifies it's a genuine Ptoma via {@link is} (the brand check)
   * 2. Then verifies it's an instance of the specific subclass (the prototype check)
   *
   * This gives you the best of both worlds: type safety from the brand, and
   * precise subclass discrimination from `instanceof`.
   *
   * @typeParam I - The Ptoma subclass constructor to match against.
   * @param subject - The value to inspect. Can be any unknown value.
   * @param SubjectClass - The Ptoma subclass constructor to test against.
   * @returns `true` if `subject` is both a valid Ptoma and an instance of `SubjectClass`,
   *   narrowing its type to that specific subclass.
   *
   * @example
   * ```ts
   * // Using match in a catch block with exhaustiveness checking
   * try {
   *   await riskyOperation()
   * } catch (err) {
   *   if (Ptoma.match(err, DatabaseError)) {
   *     return { type: 'db', detail: err.payload.table }
   *   }
   *   if (Ptoma.match(err, NetworkError)) {
   *     return { type: 'net', detail: err.payload.code }
   *   }
   *   // Runtime safety: if we add new Ptoma subclasses, this branch
   *   // will cause a TypeScript error until handled
   *   return { type: 'unknown', detail: String(err) }
   * }
   * ```
   */
  export function match<
    I extends new (
      // biome-ignore lint: we don't ware about entry args here
      ...args: any[]
      // biome-ignore lint: we don't ware about ptoma inference here
    ) => Ptoma<any, any>,
  >(subject: unknown, SubjectClass: I): subject is InstanceType<I> {
    return is(subject) && subject instanceof SubjectClass
  }
}
