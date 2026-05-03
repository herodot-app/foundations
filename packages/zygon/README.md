# zygon

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/zygon.webp?raw=true" alt="zygon" />
</p>

> From Ancient Greek **ζυγόν** (*zygon*) — "yoke", the wooden bar that joins two oxen together so they pull as one.
> A `Zygon` yokes two possible worlds: the path where things went right, and the path where they very much did not.

Zygon makes your codebase safe to work with by forcing you to always represent both outcomes — success and failure — as first-class, typed values. No exceptions escaping silently. No `undefined` pretending it means "probably fine". Just a yoke: two sides, always present, always accounted for.

---

## Why?

Every function that can fail has two paths. Most codebases acknowledge only one of them.

```ts
async function fetchUser(id: string): Promise<User> {
  // Returns a User on the happy path.
  // Throws... something on every other path.
  // What does it throw? Great question. Check the source. Good luck.
}
```

You throw an exception and hope someone upstream remembers to `try/catch`. TypeScript cannot help you — the type signature says `Promise<User>`, which is technically true for about half of all possible executions. The other half is untyped chaos wearing a stack trace as a disguise.

The standard workaround is to catch everything and return `null` or `undefined` on failure:

```ts
async function fetchUser(id: string): Promise<User | null> {
  try {
    return await db.find(id)
  } catch {
    return null  // Is this "not found"? A timeout? A database on fire? Impossible to tell.
  }
}
```

Now the caller knows *that* it failed, but not *why*, and not *what kind* of failure to expect. You have traded unhandled exceptions for untyped silence.

Zygon solves this by making both paths explicit in the return type:

```ts
import { Zygon } from '@herodot-app/zygon'

async function fetchUser(id: string): Promise<Zygon<User, NotFoundError | DbError>> {
  try {
    return Zygon.left(await db.find(id))        // success — lands on the left
  } catch (err) {
    return Zygon.right(toTypedError(err))        // failure — lands on the right
  }
}

// The caller now knows both paths exist, both are typed,
// and the compiler will not let them ignore either one.
const result = await fetchUser('abc-123')

if (Zygon.isLeft(result)) {
  console.log(result.left.name)      // ✅ User
} else {
  console.log(result.right.message)  // ✅ NotFoundError | DbError
}
```

A `Zygon` is a tagged union with two sides: a **Left** (success), whose value lives on `.left`, and a **Right** (failure), whose value lives on `.right`. Think of it as `Either<L, R>` if you are fluent in Haskell, or `Result<L, R>` if you prefer Rust — just with more Greek mythology in the name.

---

## When to use it

Use Zygon when:

- You have a function that can either succeed or fail and you want *both outcomes* to be visible in the type signature — not hidden behind a thrown exception or a nullable return.
- You are wrapping third-party code that communicates failure via exceptions, and you want to tame it into something your type system can reason about.
- You want callers to be forced by the compiler to handle both the happy path and the sad path — not just the one they feel like dealing with today.
- You are building a codebase where deploying on Friday should be a boring, uneventful experience rather than a ritual sacrifice.

---

## Installation

```bash
bun add @herodot-app/zygon
```

Zygon depends on `@herodot-app/idion` for the branded identity layer underneath. It requires TypeScript 5+.

---

## How to use it

### Create a success value

Use `Zygon.left` to wrap a successful result. The value ends up on `.left`:

```ts
import { Zygon } from '@herodot-app/zygon'

const result = Zygon.left(42)
//    ^? Zygon<number, unknown>

console.log(result.left)  // 42
console.log(result.kind)  // 'left'
```

### Create a failure value

Use `Zygon.right` to wrap a failure. The value ends up on `.right`:

```ts
const result = Zygon.right(new Error('something went sideways'))
//    ^? Zygon<unknown, Error>

console.log(result.right)  // Error: something went sideways
console.log(result.kind)   // 'right'
```

### Branch on the outcome

Use `Zygon.isLeft` and `Zygon.isRight` to narrow the type and handle each path:

```ts
function greet(result: Zygon<string, Error>): string {
  if (Zygon.isLeft(result)) {
    return `Hello, ${result.left}!`   // result.left is string
  }

  return `Error: ${result.right.message}`  // result.right is Error
}
```

Both type guards narrow the full `Zygon` union — TypeScript will know exactly which side you are on after the check.

### Unwrap with a fallback

When you want the value without branching, use `Zygon.unwrapLeft` (aliased as `Zygon.unwrap`) to extract the success value, or `Zygon.unwrapRight` for the failure value. Both require a fallback in case the zygon turns out to be the other kind:

```ts
const ok  = Zygon.left(7)
const err = Zygon.right('oops')

Zygon.unwrapLeft(ok, 0)   // → 7
Zygon.unwrapLeft(err, 0)  // → 0  (fallback — it was a Right)

Zygon.unwrapRight(err, '')  // → 'oops'
Zygon.unwrapRight(ok, '')   // → ''  (fallback — it was a Left)

// unwrap is an alias for unwrapLeft, because success is the default expectation
Zygon.unwrap(ok, 0)  // → 7
```

### Wrap a synchronous function

Use `Zygon.wrap` to turn any function that might throw into one that never does. Exceptions become `Right` values; successful returns become `Left` values:

```ts
const safeParseJson = Zygon.wrap(JSON.parse, (e) => e as SyntaxError)
//    ^? (text: string) => Zygon<unknown, SyntaxError>

const result = safeParseJson('{ not valid json }')

if (Zygon.isRight(result)) {
  console.error(result.right.message)  // ✅ SyntaxError, typed
}
```

The second argument is an optional error mapper. When omitted, the caught value is cast to the failure type directly — which works fine if you enjoy living dangerously.

### Wrap an async function

Use `Zygon.asyncWrap` for the `async`/`await` world. Rejected promises become `Right` values instead of unhandled rejections waiting to ruin your weekend:

```ts
const safeFetch = Zygon.asyncWrap(fetch, (e) => e as TypeError)
//    ^? (input: RequestInfo, init?: RequestInit) => Promise<Zygon<Response, TypeError>>

const result = await safeFetch('https://api.example.com/users')

if (Zygon.isLeft(result)) {
  const users = await result.left.json()  // ✅ Response, typed
}
```

### Extract type parameters statically

Use `Zygon.InferLeft` and `Zygon.InferRight` to pull the left or right type out of a `Zygon` at the type level. These are purely compile-time utilities — no runtime cost:

```ts
type MyZygon = Zygon<number, Error>

type OkType  = Zygon.InferLeft<MyZygon>   // number
type ErrType = Zygon.InferRight<MyZygon>  // Error
```

They are particularly useful when you need to derive related types from a `Zygon`-returning function without repeating yourself:

```ts
type Result = Awaited<ReturnType<typeof fetchUser>>
//   ^? Zygon<User, NotFoundError | DbError>

type Success = Zygon.InferLeft<Result>   // User
type Failure = Zygon.InferRight<Result>  // NotFoundError | DbError
```

### Check for a Zygon at runtime

Use `Zygon.is` when a value arrives from an external source and you need to confirm it is a genuine Zygon before touching it:

```ts
function process(value: unknown) {
  if (Zygon.is<User, ApiError>(value)) {
    // value is Zygon<User, ApiError>
    // proceed with confidence
  }
}
```

The check is symbol-based — it survives module boundaries, multiple bundler instances, and whatever creative runtime environment your deployment pipeline has invented this week.

---

## API reference

### `Zygon<L, R>`

The type of a tagged union that is either a `Left<L>` (success) or a `Right<R>` (failure). Both sides are always present as possibilities in the type — the compiler will not let you pretend the failure path does not exist.

| Parameter | Description |
|-----------|-------------|
| `L` | The **L**eft (success) value type. |
| `R` | The **R**ight (failure) value type. Defaults to `unknown`. |

### `Zygon.Left<T>`

The success half of a `Zygon`. Carries the success value on `.left` and a `kind: 'left'` discriminant. Branded with `Zygon.leftIdentifier`.

### `Zygon.Right<T>`

The failure half of a `Zygon`. Carries the failure value on `.right` and a `kind: 'right'` discriminant. Branded with `Zygon.rightIdentifier`.

### `Zygon.InferLeft<Z>`

Extracts the success (`L`) type from a `Zygon`. Resolves to `never` when `Z` has no left side.

```ts
type Ok = Zygon.InferLeft<Zygon<number, Error>>  // number
```

### `Zygon.InferRight<Z>`

Extracts the failure (`R`) type from a `Zygon`. Resolves to `never` when `Z` has no right side.

```ts
type Err = Zygon.InferRight<Zygon<number, Error>>  // Error
```

### `Zygon.left(value)`

Wraps `value` in a `Left` and returns a `Zygon<T, unknown>`. Call this when things go well.

```ts
Zygon.left(42)  // Zygon<number, unknown>
```

### `Zygon.right(value)`

Wraps `value` in a `Right` and returns a `Zygon<unknown, T>`. Call this when things go wrong.

```ts
Zygon.right(new Error('oops'))  // Zygon<unknown, Error>
```

### `Zygon.is(value)`

Type guard that returns `true` when `value` is a `Zygon`. Narrows to `Zygon<L, R>`, where both default to `unknown` if you do not provide type arguments.

```ts
if (Zygon.is<number, Error>(value)) {
  // value is Zygon<number, Error>
}
```

### `Zygon.isLeft(value)`

Type guard that returns `true` when `value` is a `Left` — the happy path. Narrows to `Left<L>`.

```ts
if (Zygon.isLeft(result)) {
  result.left  // L
}
```

### `Zygon.isRight(value)`

Type guard that returns `true` when `value` is a `Right` — the sad path. Narrows to `Right<R>`.

```ts
if (Zygon.isRight(result)) {
  result.right  // R
}
```

### `Zygon.unwrapLeft(zygon, default)` / `Zygon.unwrap(zygon, default)`

Extracts the success value from `zygon`, or returns `default` if the zygon is a `Right`. `unwrap` is an alias for `unwrapLeft` — because optimism deserves the shorter name.

```ts
Zygon.unwrapLeft(Zygon.left(7), 0)      // → 7
Zygon.unwrapLeft(Zygon.right('oops'), 0) // → 0
```

### `Zygon.unwrapRight(zygon, default)`

Extracts the failure value from `zygon`, or returns `default` if the zygon is a `Left`.

```ts
Zygon.unwrapRight(Zygon.right('oops'), '')  // → 'oops'
Zygon.unwrapRight(Zygon.left(7), '')        // → ''
```

### `Zygon.wrap(fn, wrapRight?)`

Wraps a synchronous function so it never throws. Returns a new function with the same parameters as `fn`, but returning `Zygon<ReturnType<Fn>, R>` instead of throwing. Success lands in a `Left`; thrown errors land in a `Right`.

| Parameter | Description |
|-----------|-------------|
| `fn` | The function to wrap. It may throw — that is the whole point. |
| `wrapRight` | Optional mapper from the caught error to a typed `R`. When omitted the caught value is cast directly. |

### `Zygon.asyncWrap(fn, wrapRight?)`

The async sibling of `wrap`. Wraps an async function so that rejected promises become `Right` values instead of unhandled rejections. Returns a new async function returning `Promise<Zygon<Awaited<ReturnType<Fn>>, R>>`.

| Parameter | Description |
|-----------|-------------|
| `fn` | The async function to wrap. It may reject — that is the whole point. |
| `wrapRight` | Optional mapper from the rejection reason to a typed `R`. |

### `Zygon.identifier`

The well-known symbol (`Symbol.for('@herodot-app/zygon/zygon')`) that brands every `Zygon` instance. Consistent across module boundaries — one yoke, one symbol.

### `Zygon.leftIdentifier`

The well-known symbol (`Symbol.for('@herodot-app/zygon/left')`) that brands every `Left` instance.

### `Zygon.rightIdentifier`

The well-known symbol (`Symbol.for('@herodot-app/zygon/right')`) that brands every `Right` instance.

---

## License

MIT
