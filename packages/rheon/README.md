# rheon

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/rheon.webp?raw=true" alt="rheon" />
</p>

> From Ancient Greek **ῥέων** (*rhéōn*) — "flowing", the present participle of **ῥέω** (*rhéō*), "to flow".
> Heraclitus famously said you cannot step into the same river twice. A rheon is how you represent that river in TypeScript.

Rheon gives your mutable values a proper container — typed, identifiable, and honest about the fact that they change.

---

## Why?

Some values in a codebase are stable: a user ID, a config flag, a parsed date. Others are fundamentally in motion: a counter that increments, a status that transitions, a value that is one thing now and something else by the time the next request arrives.

TypeScript has no built-in way to express this distinction. A `let` variable carries no signal about its role. A plain object wrapping a value looks exactly like every other plain object. And a mutable value passed across module boundaries is just... a value, with no indication that whoever receives it should treat it as a live cell rather than a snapshot.

```ts
let score = 0
// Is this a constant that happens to be `let`?
// A counter someone will increment?
// A cache entry that gets invalidated?
// The compiler cannot tell. Neither can the person reading it at 11pm.
```

Rheon solves this by making the intent explicit: a `Rheon<T>` is a container for a value that changes over time. You read from it, you write to it, and you can identify it at runtime — no matter where it has drifted in your data structures.

```ts
const score = Rheon.create(0)

Rheon.write(score, Rheon.read(score) + 1)
console.log(Rheon.read(score)) // 1
// Everyone who touches `score` knows exactly what they are dealing with.
```

---

## When to use it

Use Rheon when:

- You have a value that changes over time and want to make that fact visible in the type system.
- You pass mutable state across module or function boundaries and want the receiver to know it is a live cell, not a copy.
- You need to identify mutable containers at runtime — in a store, a registry, a reactive system, or anywhere you receive `unknown` values and want to know if they flow.
- You want explicit, deliberate mutation rather than the ambient mutability of a `let` or an unwrapped object field.

---

## Installation

```bash
bun add @herodot-app/rheon
```

Rheon has a single peer dependency: `@herodot-app/idion`, which provides the branded identity layer underneath. It requires TypeScript 5+.

---

## How to use it

### Create a flowing value

Use `Rheon.create` to wrap any value in a typed, identifiable container. The type of the container is inferred from the initial value — no annotations needed:

```ts
import { Rheon } from '@herodot-app/rheon'

const counter = Rheon.create(0)
//    ^? Rheon<number>

const username = Rheon.create('Heraclitus')
//    ^? Rheon<string>

const config = Rheon.create({ theme: 'dark', locale: 'en' })
//    ^? Rheon<{ theme: string; locale: string }>
```

### Read the current value

Use `Rheon.read` to get whatever is flowing through the container right now:

```ts
const name = Rheon.create('Heraclitus')

console.log(Rheon.read(name)) // "Heraclitus"
```

### Write a new value

Use `Rheon.write` to update the container in place. The rheon is mutated directly — the container stays the same, only the water changes:

```ts
const score = Rheon.create(0)

// Direct value
Rheon.write(score, 42)
console.log(Rheon.read(score)) // 42

// Writer function — receives the current value and returns the new one
Rheon.write(score, (n) => n + 1)
console.log(Rheon.read(score)) // 43
```

Because the container is a stable reference, you can pass it around freely and any code holding a reference will always see the latest value when it calls `Rheon.read`:

```ts
function increment(counter: Rheon<number>) {
  Rheon.write(counter, (n) => n + 1)
}

const hits = Rheon.create(0)

increment(hits)
increment(hits)
increment(hits)

console.log(Rheon.read(hits)) // 3
```

### Infer the value type with `Rheon.Infer`

When writing generic utilities that accept a `Rheon<T>` and need to surface the inner type `T` in their own signatures, use `Rheon.Infer`:

```ts
type Counter = Rheon<number>
type CounterValue = Rheon.Infer<Counter>
//   ^? number
```

This is especially useful when you receive a rheon as a generic parameter and need to thread its value type through your function's return type or other type positions:

```ts
function snapshot<R extends Rheon<unknown>>(rheon: R): Rheon.Infer<R> {
  return Rheon.read(rheon) as Rheon.Infer<R>
}

const counter = Rheon.create(42)
const value = snapshot(counter)
//    ^? number
```

### Narrow at runtime with `Rheon.is`

When a value arrives from an external source — a message bus, a dynamic registry, a poorly typed legacy API — use `Rheon.is` to confirm it is a rheon before reading from it:

```ts
function maybeRead(value: unknown): number | null {
  if (Rheon.is<number>(value)) {
    return Rheon.read(value) // TypeScript knows this is Rheon<number>
  }
  return null
}
```

The check is purely symbol-based and works correctly across module boundaries, iframes, and whatever other exotic environments your code finds itself flowing through.

---

## API reference

### `Rheon<T>`

The type of a mutable container holding a value of type `T`. Under the hood it is an `Idion` stamped with `Rheon.identifier`, which means every rheon is uniquely branded and distinguishable from any other kind of object at runtime.

| Parameter | Description |
|-----------|-------------|
| `T` | The type of the value flowing through this container. |

### `Rheon.create(value)`

Wraps `value` in a new `Rheon<T>` container. The type `T` is inferred from the argument.

```ts
const rheon = Rheon.create('initial')
//    ^? Rheon<string>
```

### `Rheon.read(rheon)`

Returns the current value stored inside `rheon`. Does not mutate anything. Safe to call as many times as you like — it will always return whatever flowed in last.

```ts
Rheon.read(rheon) // T
```

### `Rheon.write(rheon, writerOrValue)`

Updates the value stored inside `rheon` in place. Returns `void`. There is no new container, no copy, no ceremony — just the river changing course.

Accepts either a **direct value** to replace the current one, or a **writer function** `(value: T) => T` that receives the current value and returns the new one — useful for atomic updates like incrementing a counter:

```ts
// Direct value
Rheon.write(rheon, 'new value')

// Writer function
Rheon.write(rheon, (prev) => prev + 1)
```

### `Rheon.WriterOrValue<T>`

The union type representing what `Rheon.write` accepts as its second argument:

```ts
type WriterOrValue<T> = T | ((value: T) => T)
```

When passed a plain value `T`, `write` replaces the rheon's content directly. When passed a writer function `(value: T) => T`, it calls the function with the current value and stores the result. Useful for atomic updates that depend on the existing state.

### `Rheon.is(value)`

Type guard that returns `true` when `value` is a `Rheon`. Narrows the type to `Rheon<T>`, where `T` defaults to `unknown` if you do not provide a type argument.

```ts
if (Rheon.is<string>(value)) {
  Rheon.read(value) // string
}
```

### `Rheon.Infer<R>`

Extracts the value type `T` from a `Rheon<T>` type. Resolves to `never` when `R` is not a `Rheon`.

| Parameter | Description |
|-----------|-------------|
| `R` | A `Rheon` type from which to extract the value type. |

```ts
type Counter = Rheon<number>
type CounterValue = Rheon.Infer<Counter>
//   ^? number
```

### `Rheon.identifier`

The well-known symbol (`Symbol.for('@herodot-app/rheon/identifier')`) used to brand every rheon instance. Consistent across module boundaries — one river, one symbol.

### `Rheon.valueIdentifier`

The well-known symbol (`Symbol.for('@herodot-app/rheon/value')`) used as the key under which the wrapped value is stored. Kept as a symbol to prevent accidental key collisions and to discourage poking at the internals without going through `read` or `write` — which is exactly the point.

---

## License

MIT
