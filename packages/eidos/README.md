# @herodot-app/eidos

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/eidos.webp?raw=true" alt="idion" />
</p>

> From Ancient Greek **εἶδος** (_eidos_) — "form", "shape", "essence". In Plato's philosophy, the Eidos is the ideal blueprint that real-world things are imperfect shadows of. Your `User` object at runtime is just a loose collection of bits hoping to be considered a `User`. The Eidos is the Form it must live up to — the judge at the door with a clipboard and no interest in excuses.
>
> An `Eidos` is the named, typed definition of what your data must look like before it is allowed to exist in your system.

Eidos lets you name your data shapes, validate them at runtime against any Standard Schema-compatible library (Zod, Valibot, Arktype — take your pick), and handle failures as typed, structured values rather than `try/catch` archaeology. Shape your own data. With consistency. Using any tools you want.

---

## Why?

Your application has data flying in from all directions: HTTP request bodies, database rows, localStorage, third-party webhooks, the output of an AI model that is having a creative day. Somewhere, someone has to decide whether that data is actually a `User` or just an object that is *pretending* to be one.

The naive approach is scattered validation logic — a Zod parse here, a manual check there, a `as User` cast when everyone is tired of arguing:

```ts
// somewhere in a route handler
const user = JSON.parse(body) as User   // 🤞 fingers crossed
user.id.toUpperCase()                   // TypeError at 3am: undefined is not a string
```

The slightly-less-naive approach is centralising the schema, but it still leaves you with library-specific types, raw errors, and a `try/catch` around every parse call:

```ts
try {
  const user = UserSchema.parse(input)
  // handle user
} catch (e) {
  // handle... what exactly? ZodError? A string? An artisanal exception?
}
```

Eidos gives you a better contract: define your Form once with a name and a schema, call `create` to bring data into typed existence, and get back a `Zygon` — success on the left, a structured `CreatePtoma` on the right. No exceptions escaping. No `as` casts. No library lock-in. The Form judges; the Zygon carries the verdict.

```ts
import * as v from 'valibot'
import { Eidos } from '@herodot-app/eidos'
import { Zygon } from '@herodot-app/zygon'

const UserEidos = Eidos.define({
  name: 'User',
  schema: v.object({ id: v.string(), age: v.number() }),
})

const result = Eidos.create(UserEidos, incoming)

if (Zygon.isLeft(result)) {
  // result.left is typed as { id: string; age: number } — validated, safe to use
}

if (Zygon.isRight(result)) {
  // result.right is a CreatePtoma with the full list of schema issues
  console.error(result.right.payload.issues)
}
```

Switch from Valibot to Zod next quarter? Swap the schema. The `Eidos`, the call sites, and the error handling all stay exactly the same.

---

## When to use it

Use Eidos when:

- You need to validate data at system boundaries — API payloads, form inputs, external feeds — and want failures to be typed, named values rather than thrown exceptions.
- You want your validation logic decoupled from any specific schema library so you can swap or mix them without rewriting the rest of your code.
- You want a single canonical definition of what a domain entity looks like, reusable across multiple entry points (HTTP handler, queue consumer, CLI argument parser…).
- You are already using `Zygon` for error handling and want your validation failures to slot neatly into the same pattern.
- You want the data that reaches your business logic to have been formally judged worthy, not just hopefully cast.

---

## Installation

```bash
bun add @herodot-app/eidos
```

Eidos depends on `@herodot-app/idion` for the branded identity layer, `@herodot-app/ptoma` for typed error values, and `@herodot-app/zygon` for the result type. It accepts any schema that implements the [Standard Schema V1](https://standardschema.dev/) spec — which includes Zod, Valibot, and Arktype out of the box. It requires TypeScript 5+.

---

## How to use it

### Define a Form with `define`

Use `Eidos.define` to create a named, typed Form. Supply a `name` and a Standard Schema-compatible `schema`.

```ts
import * as v from 'valibot'
import { z } from 'zod'
import { Eidos } from '@herodot-app/eidos'

// With Valibot
const UserEidos = Eidos.define({
  name: 'User',
  schema: v.object({ id: v.string(), age: v.number() }),
})
//    ^? Eidos<'User', { id: string; age: number }, { id: string; age: number }>

// With Zod
const EmailEidos = Eidos.define({
  name: 'Email',
  schema: z.string().email(),
})

// With a symbol name — for Forms that are known only to whoever holds the symbol
const sym = Symbol('InternalEvent')
const InternalEventEidos = Eidos.define({
  name: sym,
  schema: v.object({ type: v.string(), ts: v.number() }),
})
```

The `name` is purely a label — it travels with the Form for identification and debugging purposes. It does not affect validation. A string works for human-readable labels; a symbol works when you want a name that is truly unguessable.

### Bring data into existence with `create`

Use `Eidos.create` to validate raw input against an Eidos's schema. This is the moment a raw value either rises to the level of its ideal Form, or is politely turned away at the door.

```ts
import { Zygon } from '@herodot-app/zygon'

const result = Eidos.create(UserEidos, { id: 'u1', age: 30 })
//    ^? Zygon<{ id: string; age: number }, Eidos.CreatePtoma>

if (Zygon.isLeft(result)) {
  const user = result.left  // typed as { id: string; age: number }
  console.log(`Welcome, user ${user.id}`)
}

if (Zygon.isRight(result)) {
  const failure = result.right  // Eidos.CreatePtoma
  console.error('Validation failed:', failure.payload.issues)
  // [{ message: 'Expected string, received number', path: ['id'] }, ...]
}
```

`create` never throws. If the schema throws internally (which well-behaved Standard Schema libraries do not), that is the schema's problem, not yours — and it will still surface as an issue rather than an escaped exception.

Schemas that transform data (Zod's `.transform()`, Valibot's `v.transform()`) are fully supported. The output type `O` of the Eidos reflects the transformed shape — so you can validate *and* coerce in one step.

```ts
const TimestampEidos = Eidos.define({
  name: 'Timestamp',
  schema: z.string().datetime().transform((s) => new Date(s)),
  //                                        input: string → output: Date
})

const result = Eidos.create(TimestampEidos, '2025-01-01T00:00:00Z')

if (Zygon.isLeft(result)) {
  result.left  // typed as Date — already transformed, ready to use
}
```

### Check for a validation failure with `isPtoma`

Use `Eidos.isPtoma` to distinguish a validation failure from any other error that might appear on the right side of a `Zygon`. Useful when you are composing results and need to know whether you are dealing with a bad input or a different category of problem entirely.

```ts
if (Zygon.isRight(result)) {
  if (Eidos.isPtoma(result.right)) {
    // definitely a validation failure — safe to read result.right.payload.issues
    return { status: 422, errors: result.right.payload.issues }
  }
  // something else went wrong
}
```

### Check whether a value is an Eidos with `is`

Use `Eidos.is` to confirm that an unknown value is a branded `Eidos` instance — useful at module boundaries where you receive `unknown` and would like to verify that someone actually handed you a Form rather than a random object with a `name` property and ambition.

```ts
if (Eidos.is(maybeEidos)) {
  // maybeEidos is Eidos<Eidos.Name, unknown, unknown>
}

// Narrow to a more specific type when you know what to expect
if (Eidos.is<'User', { id: string }>(maybeEidos)) {
  Eidos.create(maybeEidos, input)
}
```

---

## API reference

### `Eidos<N, I, O>`

The type of a named, typed Form. Under the hood it is an `Idion` branded with `Eidos.identifier`, which means every Eidos is uniquely identifiable at runtime — even across module boundaries and bundler magic.

| Parameter | Description |
|-----------|-------------|
| `N` | The name type (`string` or `symbol` literal) that identifies this Form. |
| `I` | The raw input type accepted by the schema. Defaults to `unknown`. |
| `O` | The validated output type produced by the schema. Defaults to `I`. |

### `Eidos.Name`

The union type `string | symbol` — the allowed types for an Eidos name. Both are first-class citizens. A string for human-readable labels; a symbol for names that are known only to whoever holds the reference.

### `Eidos.Infer<E>`

Extracts the **validated output type** (`O`) from an `Eidos` at the type level. This is what you receive on the left side of a successful `create` call — the shape the schema produces after validation (and any transforms). Purely compile-time; zero runtime cost.

```ts
const UserEidos = Eidos.define({
  name: 'User',
  schema: v.object({ id: v.string(), age: v.number() }),
})

type User = Eidos.Infer<typeof UserEidos>
//   ^? { id: string; age: number }
```

Particularly useful for declaring function parameters or return types that match a Form without repeating the schema shape inline.

### `Eidos.InferInput<E>`

Extracts the **raw input type** (`I`) accepted by an `Eidos`'s schema — the unvalidated shape you pass *into* `create` before the schema runs.

For schemas without transforms, `InferInput` and `Infer` return the same type. They diverge when a transform is involved:

```ts
const TimestampEidos = Eidos.define({
  name: 'Timestamp',
  schema: z.string().datetime().transform((s) => new Date(s)),
})

type RawTimestamp    = Eidos.InferInput<typeof TimestampEidos>  // string
type ParsedTimestamp = Eidos.Infer<typeof TimestampEidos>       // Date
```

### `Eidos.InferName<E>`

Extracts the **name literal** (`N`) from an `Eidos` — the exact string or symbol passed as `name` to `define`. Useful for building type-level registries or narrowing on Eidos identity without holding a runtime reference.

```ts
const UserEidos = Eidos.define({ name: 'User', schema: userSchema })

type UserName = Eidos.InferName<typeof UserEidos>
//   ^? 'User'
```

### `Eidos.Options<N, I, O>`

The input shape expected by `Eidos.define`.

| Property | Description |
|----------|-------------|
| `name` | The `N` label that identifies this Eidos. |
| `schema` | A `StandardSchemaV1<I, O>`-compliant schema that defines the Form. |

### `Eidos.define(options)`

Creates a new `Eidos` from a name and a schema. Returns a fully branded `Eidos<N, I, O>` ready for use with `create`.

```ts
const ScoreEidos = Eidos.define({
  name: 'Score',
  schema: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
})
//    ^? Eidos<'Score', number, number>
```

| Parameter | Description |
|-----------|-------------|
| `options` | An `Eidos.Options<N, I, O>` object containing `name` and `schema`. |

### `Eidos.create(eidos, input)`

Validates `input` against `eidos`'s schema and returns a `Zygon<O, CreatePtoma>`. Never throws.

| Parameter | Description |
|-----------|-------------|
| `eidos` | The Form to validate `input` against. |
| `input` | The raw, unverified data. Any `unknown` is welcome to try its luck. |

Returns:
- `Zygon.Left<O>` — the validated (and possibly transformed) output value.
- `Zygon.Right<CreatePtoma>` — a `CreatePtoma` carrying the list of schema issues.

### `Eidos.CreatePtoma`

The typed error produced when `create` rejects its input. A `Ptoma` with identifier `'@herodot-app/eidos/create-ptoma'` and a `payload.issues` of type `ReadonlyArray<StandardSchemaV1.Issue>` — the full list of everything the schema found objectionable about the input.

```ts
if (Zygon.isRight(result)) {
  console.log(result.right.payload.issues)
  // [{ message: 'Expected string, received number', path: ['id'] }]
}
```

The identifier is a plain string (not a symbol) so it survives serialisation — handy when you need to log or transmit the failure and the reader cannot import this module to compare symbols.

### `Eidos.createPtomaIdentifier`

The string `'@herodot-app/eidos/create-ptoma'` — the well-known identifier that brands every `CreatePtoma`. Use it with `Ptoma.is` to check whether a `Ptoma` value is specifically a validation failure from this library.

```ts
import { Ptoma } from '@herodot-app/ptoma'

if (Ptoma.is(error, Eidos.createPtomaIdentifier)) {
  // error is Eidos.CreatePtoma
}
```

### `Eidos.isPtoma(value)`

Type guard that returns `true` when `value` is an `Eidos.CreatePtoma` instance. Equivalent to `value instanceof Eidos.CreatePtoma`, but saves you the import dance.

| Parameter | Description |
|-----------|-------------|
| `value` | The value to inspect. |

### `Eidos.is<N, I, O>(value)`

Type guard that returns `true` when `value` is an `Eidos` instance — i.e. it carries the `Eidos.identifier` brand. Delegates to `Idion.is` so the check works safely across module boundaries without relying on `instanceof`.

```ts
if (Eidos.is(maybeEidos)) {
  // maybeEidos is Eidos<Eidos.Name, unknown, unknown> here
}
```

| Parameter | Description |
|-----------|-------------|
| `value` | The value to inspect. |

### `Eidos.identifier`

The well-known symbol (`Symbol.for('@herodot-app/eidos')`) used to brand every Eidos instance. Stable across module boundaries — one Form, one seal. Platonically speaking, there is only ever one Form per concept.

---

## License

MIT
