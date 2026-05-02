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
    return Zygon.dexion(await db.find(id))        // success — lands on the right
  } catch (err) {
    return Zygon.skaion(toTypedError(err))         // failure — lands on the left
  }
}

// The caller now knows both paths exist, both are typed,
// and the compiler will not let them ignore either one.
const result = await fetchUser('abc-123')

if (Zygon.isDexion(result)) {
  console.log(result.right.name)      // ✅ User
} else {
  console.log(result.left.message)    // ✅ NotFoundError | DbError
}
```

The two halves even have proper names. The success side is a **Dexion**, from the Greek *δεξιόν* meaning *right-handed* and *favourable* — historically the side of good omens. Fittingly, the success value lives on the `.right` property. The failure side is a **Skaion**, from the Greek *σκαιόν* meaning *left-handed*, *clumsy*, and *awkward* — the side of bad omens since antiquity, and also the origin of the Latin *sinister* (make of that what you will). The failure value lives on `.left`. The etymology and the data model have never been in more perfect, if slightly ominous, alignment.

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

Use `Zygon.dexion` to wrap a successful result. The value ends up on `.right` — where good things belong:

```ts
import { Zygon } from '@herodot-app/zygon'

const result = Zygon.dexion(42)
//    ^? Zygon<number, unknown>

console.log(result.right)  // 42
console.log(result.kind)   // 'right'
```

### Create a failure value

Use `Zygon.skaion` to wrap a failure. The value ends up on `.left` — where bad omens have always lived:

```ts
const result = Zygon.skaion(new Error('something went sideways'))
//    ^? Zygon<unknown, Error>

console.log(result.left)   // Error: something went sideways
console.log(result.kind)   // 'left'
```

### Branch on the outcome

Use `Zygon.isDexion` and `Zygon.isSkaion` to narrow the type and handle each path:

```ts
function greet(result: Zygon<string, Error>): string {
  if (Zygon.isDexion(result)) {
    return `Hello, ${result.right}!`   // result.right is string
  }

  return `Error: ${result.left.message}`  // result.left is Error
}
```

Both type guards narrow the full `Zygon` union — TypeScript will know exactly which side you are on after the check.

### Unwrap with a fallback

When you want the value without branching, use `Zygon.unwrapRight` (aliased as `Zygon.unwrap`) to extract the success value, or `Zygon.unwrapLeft` for the failure value. Both require a fallback in case the zygon turns out to be the other kind:

```ts
const ok = Zygon.dexion(7)
const err = Zygon.skaion('oops')

Zygon.unwrapRight(ok, 0)   // → 7
Zygon.unwrapRight(err, 0)  // → 0  (fallback — it was a Skaion)

Zygon.unwrapLeft(err, '')  // → 'oops'
Zygon.unwrapLeft(ok, '')   // → ''  (fallback — it was a Dexion)

// unwrap is an alias for unwrapRight, because success is the default expectation
Zygon.unwrap(ok, 0)        // → 7
```

### Wrap a synchronous function

Use `Zygon.wrap` to turn any function that might throw into one that never does. Exceptions become `Skaion` values; successful returns become `Dexion` values:

```ts
const safeParseJson = Zygon.wrap(JSON.parse, (e) => e as SyntaxError)
//    ^? (text: string) => Zygon<unknown, SyntaxError>

const result = safeParseJson('{ not valid json }')

if (Zygon.isSkaion(result)) {
  console.error(result.left.message)  // ✅ SyntaxError, typed
}
```

The second argument is an optional error mapper. When omitted, the caught value is cast to the failure type directly — which works fine if you enjoy living dangerously.

### Wrap an async function

Use `Zygon.asyncWrap` for the `async`/`await` world. Rejected promises become `Skaion` values instead of unhandled rejections waiting to ruin your weekend:

```ts
const safeFetch = Zygon.asyncWrap(fetch, (e) => e as TypeError)
//    ^? (input: RequestInfo, init?: RequestInit) => Promise<Zygon<Response, TypeError>>

const result = await safeFetch('https://api.example.com/users')

if (Zygon.isDexion(result)) {
  const users = await result.right.json()  // ✅ Response, typed
}
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

### `Zygon<D, S>`

The type of a tagged union that is either a `Dexion<D>` (success) or a `Skaion<S>` (failure). Both sides are always present as possibilities in the type — the compiler will not let you pretend the failure path does not exist.

| Parameter | Description |
|-----------|-------------|
| `D` | The **D**exion (success / right) value type. |
| `S` | The **S**kaion (failure / left) value type. Defaults to `unknown`. |

### `Zygon.Dexion<T>`

The success half of a `Zygon`. Carries the success value on `.right` and a `kind: 'right'` discriminant. Branded with `Zygon.dexionIdentifier`.

### `Zygon.Skaion<T>`

The failure half of a `Zygon`. Carries the failure value on `.left` and a `kind: 'left'` discriminant. Branded with `Zygon.skaionIdentifier`.

### `Zygon.dexion(value)`

Wraps `value` in a `Dexion` and returns a `Zygon<T, unknown>`. Call this when things go right — which is also literally where the value ends up.

```ts
Zygon.dexion(42)  // Zygon<number, unknown>
```

### `Zygon.skaion(value)`

Wraps `value` in a `Skaion` and returns a `Zygon<unknown, T>`. Call this when things go wrong — which is also literally where the value ends up.

```ts
Zygon.skaion(new Error('oops'))  // Zygon<unknown, Error>
```

### `Zygon.is(value)`

Type guard that returns `true` when `value` is a `Zygon`. Narrows to `Zygon<D, S>`, where both default to `unknown` if you do not provide type arguments.

```ts
if (Zygon.is<number, Error>(value)) {
  // value is Zygon<number, Error>
}
```

### `Zygon.isDexion(value)`

Type guard that returns `true` when `value` is a `Dexion` — the happy path. Narrows to `Dexion<D>`.

```ts
if (Zygon.isDexion(result)) {
  result.right  // D
}
```

### `Zygon.isSkaion(value)`

Type guard that returns `true` when `value` is a `Skaion` — the sad path. Narrows to `Skaion<S>`.

```ts
if (Zygon.isSkaion(result)) {
  result.left  // S
}
```

### `Zygon.unwrapRight(zygon, default)` / `Zygon.unwrap(zygon, default)`

Extracts the success value from `zygon`, or returns `default` if the zygon is a `Skaion`. `unwrap` is an alias for `unwrapRight` — because optimism deserves the shorter name.

```ts
Zygon.unwrapRight(Zygon.dexion(7), 0)      // → 7
Zygon.unwrapRight(Zygon.skaion('oops'), 0)  // → 0
```

### `Zygon.unwrapLeft(zygon, default)`

Extracts the failure value from `zygon`, or returns `default` if the zygon is a `Dexion`.

```ts
Zygon.unwrapLeft(Zygon.skaion('oops'), '')  // → 'oops'
Zygon.unwrapLeft(Zygon.dexion(7), '')       // → ''
```

### `Zygon.wrap(fn, wrapRight?)`

Wraps a synchronous function so it never throws. Returns a new function with the same parameters as `fn`, but returning `Zygon<ReturnType<Fn>, S>` instead of throwing.

| Parameter | Description |
|-----------|-------------|
| `fn` | The function to wrap. It may throw — that is the whole point. |
| `wrapRight` | Optional mapper from the caught error to a typed `S`. When omitted the caught value is cast directly. |

### `Zygon.asyncWrap(fn, wrapRight?)`

The async sibling of `wrap`. Wraps an async function so that rejected promises become `Skaion` values instead of unhandled rejections. Returns a new async function returning `Promise<Zygon<Awaited<ReturnType<Fn>>, S>>`.

| Parameter | Description |
|-----------|-------------|
| `fn` | The async function to wrap. It may reject — that is the whole point. |
| `wrapRight` | Optional mapper from the rejection reason to a typed `S`. |

### `Zygon.identifier`

The well-known symbol (`Symbol.for('@herodot-app/zygon/zygon')`) that brands every `Zygon` instance. Consistent across module boundaries — one yoke, one symbol.

### `Zygon.dexionIdentifier`

The well-known symbol (`Symbol.for('@herodot-app/zygon/dexion')`) that brands every `Dexion` instance.

### `Zygon.skaionIdentifier`

The well-known symbol (`Symbol.for('@herodot-app/zygon/skaion')`) that brands every `Skaion` instance.

---

## License

MIT
