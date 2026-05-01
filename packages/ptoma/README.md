# ptoma

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/ptoma.webp?raw=true" alt="idion" />
</p>

> From Ancient Greek **πτῶμα** (*ptôma*) — "a fall", and by extension, "a fallen thing".
> The Greeks used it for anything that had collapsed beyond recovery. We use it for errors, which is basically the same thing.

Ptoma gives your domain errors a proper name and a typed payload — so that when something falls in your program, you know exactly *what* fell, *why* it fell, and *what it was carrying* on the way down. Without touching the JavaScript error system at all.

---

## Why?

JavaScript errors are stringly typed. You `throw new Error("something went wrong")`, catch it three layers up, squint at `err.message`, and hope whoever wrote the message had a good day.

```ts
try {
  await fetchUser(id)
} catch (err) {
  if (err instanceof Error && err.message === 'not found') {
    // Is this *our* not found? Some library's not found?
    // A typo for "not_found"? Nobody knows. Good luck.
  }
}
```

The standard fix — `class NotFoundError extends Error {}` — works, but it forces you to write a class for every error kind, scatter them across files, and hope nothing in your bundler breaks `instanceof` across module boundaries (it will).

Ptoma solves this with two things:

1. **A name** — a string literal type that uniquely identifies the error kind, checked at both compile time and runtime.
2. **A payload** — an optional, typed blob of structured data attached to the error, because `"user not found"` is less useful than `{ id: '42' }`.

Everything else — stack traces, `instanceof Error`, `catch (err)`, `err.cause` — works exactly as you would expect, because a `Ptoma` is a real `Error`. It just knows who it is.

```ts
const NotFound = Ptoma.create<'NotFound', { id: string }>('NotFound')

throw new NotFound('User not found', { id: '42' })

// Somewhere above in the call stack:
try {
  await fetchUser(id)
} catch (err) {
  if (Ptoma.is(err, 'NotFound')) {
    console.log(err.payload.id) // ✅ typed as string
    return null
  }
  throw err // not our problem
}
```

No custom class hierarchies. No stringly-typed message parsing. No broken `instanceof` across realms. Just errors that know what they are.

---

## When to use it

Use Ptoma when:

- You want domain errors that are typed, named, and carry structured context — not just a message string and a prayer.
- You need to distinguish *your* errors from library errors in a `catch` block without guessing at `.message` contents.
- You want to define all your error kinds in one place, export them, and let TypeScript enforce that callers handle the right ones.
- You are tired of writing `class XyzError extends Error { constructor(...) { super(...); this.name = 'XyzError' } }` for every error in your codebase.

---

## Installation

```bash
bun add @herodot-app/ptoma
```

Ptoma has no runtime dependencies and requires TypeScript 5+.

---

## How to use it

### Define your error kinds

Call `Ptoma.create` once at module level, export the result. The type parameters are the name literal and the optional payload type:

```ts
import { Ptoma } from '@herodot-app/ptoma'

// No payload — the name is enough
export const Unauthorized = Ptoma.create<'Unauthorized'>('Unauthorized')

// With a typed payload
export const NotFound = Ptoma.create<'NotFound', { id: string }>('NotFound')
export const RateLimited = Ptoma.create<'RateLimited', { retryAfter: number }>('RateLimited')
export const ValidationFailed = Ptoma.create<'ValidationFailed', { fields: string[] }>('ValidationFailed')
```

You get a constructor back — use it like any other `Error` class.

### Throw them

```ts
throw new Unauthorized('You shall not pass')

throw new NotFound('User not found', { id: userId })

throw new ValidationFailed('Invalid input', { fields: ['email', 'name'] })
```

Payload-free errors take just a message. Errors with a payload type require it — the compiler will not let you forget to explain yourself.

### Catch and narrow them

Use `Ptoma.is` in `catch` blocks to narrow the type:

```ts
try {
  await fetchUser(id)
} catch (err) {
  if (Ptoma.is(err, 'NotFound')) {
    // err is Ptoma<'NotFound', { id: string }>
    console.log(err.payload.id) // ✅
    return null
  }

  if (Ptoma.is(err, 'RateLimited')) {
    // err is Ptoma<'RateLimited', { retryAfter: number }>
    await sleep(err.payload.retryAfter)
    return retry()
  }

  throw err // not ours — send it back whence it came
}
```

When called without a name, `Ptoma.is` narrows to any `Ptoma` — useful when you want to log all domain errors uniformly before rethrowing:

```ts
catch (err) {
  if (Ptoma.is(err)) {
    logger.error(`[${err.name}] ${err.message}`)
  }
  throw err
}
```

### Pass a cause

The third argument to any Ptoma constructor is standard `ErrorOptions` — including `cause`, which chains errors the way the platform intended:

```ts
try {
  await db.query(sql)
} catch (err) {
  throw new DatabaseError('Query failed', { query: sql }, { cause: err })
}
```

### Check if something is a Ptoma

`Ptoma.is` accepts any unknown value — no need to pre-check `instanceof Error`. It returns `false` for `null`, `undefined`, numbers, plain strings, and plain `Error` instances that were not created through Ptoma:

```ts
Ptoma.is(new Error('plain')) // false
Ptoma.is(42)                 // false
Ptoma.is(new NotFound('x'))  // true
```

---

## API reference

### `Ptoma<N, P>`

The type of a domain error with name `N` and optional payload `P`.

A `Ptoma` is a real `Error` — it has a `message`, a `stack`, and a `cause`. On top of that it carries:
- `name: N` — a string literal that uniquely identifies the error kind.
- `payload?: P` — structured data attached to the error. Optional when `P` is `undefined`, required otherwise.
- `[Ptoma.identifier]: true` — a symbol brand that lets `Ptoma.is()` reliably distinguish a genuine Ptoma from any impostor `Error` with a matching `.name`.

| Parameter | Constraint | Description |
|-----------|------------|-------------|
| `N` | `string` | The unique name literal of this error kind. |
| `P` | — | The payload type. Defaults to `undefined` (no payload). |

### `Ptoma.create<N, P>(name)`

Creates a new error class for the given name. Returns a typed constructor.

```ts
const NotFound = Ptoma.create<'NotFound', { id: string }>('NotFound')
//    ^? Ptoma.Constructor<'NotFound', { id: string }>

const err = new NotFound('not found', { id: '42' })
//    ^? Ptoma<'NotFound', { id: string }>
```

When `P` is omitted or `undefined`, the payload parameter is optional. When `P` is a concrete type, it is required — because context-free errors are a burden to whoever has to debug them at 2am.

### `Ptoma.is(subject, name?)`

Type guard that checks whether `subject` is a `Ptoma`.

- Without `name`: narrows to `Ptoma<string, undefined>` — any Ptoma, regardless of kind.
- With `name`: narrows to `Ptoma<N, P>` — a specific kind. The payload type `P` must be provided explicitly as a type argument when you need it.

```ts
if (Ptoma.is(err, 'NotFound')) {
  err.payload // unknown without a type argument
}

if (Ptoma.is<'NotFound', { id: string }>(err, 'NotFound')) {
  err.payload.id // ✅ string
}
```

Returns `false` for any non-Ptoma value, including plain `Error` instances. The check is symbol-based — immune to name collisions, cross-realm issues, and whatever creative things bundlers get up to.

### `Ptoma.Constructor<N, P>`

The type of the class returned by `Ptoma.create`. Useful when you need to annotate a variable or parameter that holds an error constructor rather than an error instance:

```ts
function handle<N extends string, P>(
  ErrorClass: Ptoma.Constructor<N, P>,
  message: string,
) { ... }
```

### `Ptoma.identifier`

The well-known symbol (`Symbol.for('@herodot-app/ptoma/identifier')`) used to brand every Ptoma instance. Consistent across module boundaries — one fall, one symbol.

---

## License

MIT
