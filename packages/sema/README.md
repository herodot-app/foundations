# @herodot-app/sema

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/sema.webp?raw=true" alt="sema" />
</p>

> From Ancient Greek **σῆμα** (*sêma*) — "sign, signal, mark, token". In Homer, a *sêma* was a landmark left behind so travellers would know where they had been. It is also the root of *semaphore* and *semantic* — words that, coincidentally, are exactly what this package does.
>
> A `Sema` is a reactive value that broadcasts when it changes, making your codebase a truly reactive place where things actually react to things.

Sema gives you observable values with derived slices, batched updates, and deep equality — all typed, all identifiable, all honest about when they change.

---

## Why?

State is the hardest thing to get right in any codebase. Not because state itself is complex — a value is a value — but because **reacting** to state changes reliably is where everything falls apart.

The straightforward approach is to mutate a variable and hope whoever cares about it noticed:

```ts
let settings = { theme: 'dark', locale: 'en' }

function updateSettings(partial: Partial<typeof settings>) {
  settings = { ...settings, ...partial }
  // Great. settings changed. Now who needs to know?
  // analytics? the UI? a cache layer? good luck remembering.
}
```

This works until you add a third consumer, then a fourth, then someone moves a file and the implicit dependency graph shatters. Every module that cares about `settings` now needs to import `updateSettings` — or worse, poll a global object on an interval like it is 2003.

The classic fix is an event emitter or an Observable. But those come with their own problems: untyped payloads, manual subscription cleanup, no built-in equality to suppress redundant updates, and no way to derive a slice of state that auto-updates when its parent changes.

Sema solves all of this in one package:

```ts
import { Sema, Derivation } from '@herodot-app/sema'
import { Agora } from '@herodot-app/agora'

// A reactive value — everyone who reads it will see the latest state
const settings = Sema.create({ theme: 'dark', locale: 'en' })

// Listen for changes — type-safe, no strings involved
Agora.listen(settings, (next) => {
  console.log(`Theme changed to ${next.theme}`)
})

// Write updates — listeners only fire when the value actually differs
Sema.write(settings, { theme: 'light', locale: 'en' })
// → "Theme changed to light"

// Derive a slice that stays in sync automatically
const theme = Sema.select(settings, (s) => s.theme)
Sema.read(theme) // "light"

// Write to settings — theme derivation updates automatically
Sema.write(settings, { theme: 'solarized', locale: 'fr' })
Sema.read(theme) // "solarized"

// Batch multiple writes — listeners fire exactly once
Sema.batch(settings, () => {
  Sema.write(settings, { theme: 'dark', locale: 'en' })
  Sema.write(settings, { theme: 'dark', locale: 'fr' })
  Sema.write(settings, { theme: 'dark', locale: 'de' })
})
// → Only one listener notification with the final state
```

Every sema is identifiable at runtime via its symbol brand. Every derivation is a sema itself — composable, observable, nestable. Writes use deep equality by default, so redundant updates are silently suppressed. And when you need to mutate multiple values atomically, `batch` freezes the sema, runs your callback, then publishes once.

It is reactive programming without the PhD in FRP.

---

## When to use it

Use Sema when:

- You have a value that changes over time and other parts of your codebase need to react to those changes — without importing each other directly.
- You want to derive slices of state (a single property, a computed value) that stay in sync automatically, without writing the subscribe-transform-unsubscribe boilerplate yourself.
- You need batched atomic updates — multiple writes that should produce a single notification, not a cascade of intermediate states.
- You want deep equality out of the box so that writing `{ theme: 'dark' }` twice does not fire listeners twice.
- You need to reset a value back to its initial state without manually remembering what that initial state was.
- You want to freeze a sema temporarily — useful during teardown, reconfiguration, or any period where writes should still happen but listeners should stay quiet.

---

## Installation

```bash
bun add @herodot-app/sema
```

Sema depends on `@herodot-app/agora` for pub/sub mechanics, `@herodot-app/idion` for branded identity, `@herodot-app/rheon` for reactive cell storage, and `@herodot-app/zygon` for typed error handling. It requires TypeScript 5+.

---

## How to use it

### Create a sema

Use `Sema.create` to make a new reactive value. The type is inferred from the initial value:

```ts
import { Sema } from '@herodot-app/sema'

const counter = Sema.create(0)
//    ^? Sema<number>

const user = Sema.create({ name: 'Alice', age: 30 })
//    ^? Sema<{ name: string; age: number }>
```

Each call produces an independent instance. Two semas do not share state — they are distinct signals, each with their own listeners and history.

### Read the current value

Use `Sema.read` to get the sema's current value. Optionally pass a selector to project a slice without creating a derivation:

```ts
Sema.read(counter)           // 0
Sema.read(user, (u) => u.name)  // "Alice"
```

The selector is a one-shot projection — it does not create a reactive binding. It is just a convenient way to extract a property in a single call.

### Write a new value

Use `Sema.write` to update the sema. Accepts a direct value or a writer function `(value: T) => T`:

```ts
// Direct value
Sema.write(counter, 42)

// Writer function
Sema.write(counter, (n) => n + 1)
```

Before notifying listeners, the new value is compared against the old one using deep equality (`Equality.check` by default). If they are equal, listeners are not called — no redundant updates, no wasted renders.

When the sema is frozen, `valueRef` still updates but listeners are not notified and `oldValueRef` is preserved. This is the mechanism `batch` relies on internally.

### Listen for changes

A sema is also an `Agora` — it inherits the pub/sub system. Use `Agora.listen` to subscribe:

```ts
import { Agora } from '@herodot-app/agora'

const unlisten = Agora.listen(counter, (value) => {
  console.log(`Counter is now ${value}`)
})

Sema.write(counter, 1) // → "Counter is now 1"

// Stop listening when done
unlisten()
```

If a listener throws, the error is collected and returned as a `Zygon` — the broadcast keeps going and the other listeners still receive the update.

### Inspect the sema

Use `Sema.inspect` to get a point-in-time snapshot:

```ts
const snap = Sema.inspect(counter)
// snap.value — current value
// snap.oldValue — value before the last write
// snap.citizens — number of active listeners
// snap.registry — number of queued payloads
// snap.frozen — whether the sema is frozen
```

The snapshot is immutable — mutating it has no effect on the sema. It is a photograph, not a mirror.

### Reset to initial value

Use `Sema.reset` to restore the sema back to the value it had at creation time:

```ts
const settings = Sema.create({ theme: 'dark' })
Sema.write(settings, { theme: 'light' })
Sema.reset(settings)
Sema.read(settings) // { theme: 'dark' }
```

This goes through the normal write path — equality is checked, listeners are notified only if the value actually differs from the current state.

### Batch multiple writes

Use `Sema.batch` to freeze the sema, execute a callback with multiple writes, then publish a single notification:

```ts
Sema.batch(user, () => {
  Sema.write(user, { name: 'Alice', age: 31 })
  Sema.write(user, { name: 'Bob', age: 31 })
  Sema.write(user, { name: 'Bob', age: 32 })
})
// → Listeners see only { name: 'Bob', age: 32 } — one notification
```

While the batcher runs, the sema is frozen. Listeners are silenced, `oldValueRef` is preserved. After the batcher completes, the sema is unfrozen and a single announcement is published with the final value.

### Derive a slice with `select`

Use `Sema.select` to create a derivation — a reactive projection that stays in sync with its source:

```ts
const user = Sema.create({ name: 'Alice', age: 30 })
const name = Sema.select(user, (u) => u.name)

Sema.read(name) // "Alice"

Sema.write(user, { name: 'Alice', age: 31 })
// name does NOT update — the selected value 'Alice' is unchanged
// Deep equality suppresses the redundant propagation

Sema.write(user, { name: 'Bob', age: 31 })
Sema.read(name) // "Bob" — now it updates
```

A derivation is itself a sema — you can listen to it, derive from it, and compose it with other derivations. Call `Derivation.unbind` when you no longer need it to prevent listener accumulation on long-lived source semas.

### Freeze and unfreeze

Use `Agora.freeze` and `Agora.unfreeze` to temporarily pause listener notifications:

```ts
Agora.freeze(counter)
Sema.write(counter, 999)
// Listeners did not fire — but valueRef is now 999

Agora.unfreeze(counter)
Sema.write(counter, 1)
// Back to normal — listeners fire again
```

This is useful during teardown, reconfiguration, or any period where writes should still happen but the downstream reaction should be deferred.

---

## Derivations

A `Derivation<T, R>` is a sema whose value is computed from a source sema via a selector function. It is the reactive equivalent of `Array.map` — transform the source, get a new stream.

### Create a derivation

Use `Derivation.create` for full control over the derivation:

```ts
import { Derivation } from '@herodot-app/sema'

const user = Sema.create({ name: 'Alice', age: 30 })

const derived = Derivation.create({
  sema: user,
  selector: (u) => u.name,
})

Sema.read(derived) // "Alice"
```

### Unbind a derivation

Use `Derivation.unbind` to stop the derivation from listening to its source:

```ts
Derivation.unbind(derived)
// Writes to `user` no longer update `derived`
// Call this when the derivation goes out of scope to prevent memory leaks
```

### Check if a sema is a derivation

Use `Derivation.is` as a type guard:

```ts
if (Derivation.is(maybeDerived)) {
  // maybeDerived is Derivation<T, R>
  // It has .selector, .equality, .sema, and .unbind properties
}
```

---

## Equality

Sema ships with a deep equality engine that handles primitives, arrays, objects, Maps, and Sets. It is used by default in `Sema.write` and `Derivation.create` to suppress redundant updates.

```ts
import { Equality } from '@herodot-app/sema'

// Deep structural equality
Equality.check({ a: 1 }, { a: 1 })           // true
Equality.check([1, [2]], [1, [2]])           // true
Equality.check({ a: 1 }, { a: 2 })           // false

// Strict reference equality
Equality.strict({ x: 1 }, { x: 1 })          // false (different objects)
Equality.strict(obj, obj)                    // true  (same reference)

// NaN-safe strict equality
Equality.strict(NaN, NaN)                    // true
```

You can also pass a custom equality predicate to `Sema.write` or `Derivation.create` when you need domain-specific comparison logic:

```ts
// Only notify when the ID changes, not the whole object
Sema.write(user, { id: 1, name: 'Bob' }, (a, b) => a.id === b.id)
```

---

## Scalar, List, and Collection

These three types form the backbone of the equality system, giving named roles to different data structures:

### Scalar

A union of JavaScript primitives that are compared by identity: `number`, `string`, `boolean`, `null`, `undefined`, `bigint`. Objects can opt in via `Scalar.branded`:

```ts
import { Scalar } from '@herodot-app/sema'

const id = Scalar.branded('abc-123')
Scalar.is(id)     // true — treated as a scalar leaf
Scalar.is(42)     // true — primitives are scalars
Scalar.is({})     // false — plain objects are not
```

Use branded scalars when you have domain value objects (tagged IDs, money amounts) that should be compared as whole units rather than recursively.

### List

Arrays and Sets — compared element-by-element:

```ts
import { List } from '@herodot-app/sema'

List.is([1, 2, 3])  // true
List.is(new Set([1])) // true
List.is({})         // false
```

### Collection

Plain objects and Maps — compared key-by-key:

```ts
import { Collection } from '@herodot-app/sema'

Collection.is({ a: 1 })     // true
Collection.is(new Map())    // true
Collection.is([])           // false — arrays are lists, not collections
Collection.is(null)         // false — null is a scalar
```

---

## API reference

### `Sema<T>`

The core reactive value type. Under the hood it is an `Agora<T>` (pub/sub) combined with an `Idion` (runtime branding) holding `initialValue`, `valueRef`, `oldValueRef`, and `frozenRef`.

| Parameter | Description |
|-----------|-------------|
| `T` | The type of the value this sema holds. |

### `Sema.create(value)`

Creates a new sema with `value` as both the initial and current value. All three value refs start equal to `value`. The citizens set is empty and the sema is unfrozen.

```ts
const sema = Sema.create('hello')
//    ^? Sema<string>
```

### `Sema.read(sema, selector?)`

Returns the sema's current value. When a selector is provided, applies it to the current value and returns the projected result — useful for extracting a slice without creating a derivation.

```ts
Sema.read(sema)                  // T
Sema.read(sema, (v) => v.prop)   // R
```

### `Sema.write(sema, writerOrValue, equality?)`

Updates the sema and notifies listeners if the value changed. Accepts a direct value or a writer function. Uses `Equality.check` by default to suppress redundant updates. Returns a `Zygon` indicating whether all listeners accepted the update cleanly.

```ts
Sema.write(sema, 42)
Sema.write(sema, (n) => n + 1)
Sema.write(sema, newObj, (a, b) => a.id === b.id) // custom equality
```

### `Sema.reset(sema)`

Restores the sema back to its initial value. Goes through the normal write path — equality is checked and listeners are notified only if the value differs.

```ts
Sema.reset(sema)
```

### `Sema.batch(sema, batcher)`

Freezes the sema, runs `batcher`, then publishes a single notification with the final value. Listeners are silenced during batcher execution.

```ts
Sema.batch(sema, () => {
  Sema.write(sema, 1)
  Sema.write(sema, 2)
  Sema.write(sema, 3)
})
// → One notification with value 3
```

### `Sema.select(sema, selector, equality?)`

Creates a `Derivation<T, R>` — a reactive projection that stays in sync with the source sema. The derivation propagates changes only when the selected value differs under the configured equality.

```ts
const name = Sema.select(user, (u) => u.name)
```

### `Sema.inspect(sema)`

Returns a `Snapshot<T>` with `value`, `oldValue`, `citizens`, `registry`, and `frozen`. The snapshot is immutable.

```ts
const snap = Sema.inspect(sema)
```

### `Sema.is(value)`

Type guard that returns `true` when `value` is a sema. Delegates to `Idion.is` for symbol-based checking across module boundaries.

```ts
if (Sema.is(maybeSema)) {
  Sema.read(maybeSema) // safe
}
```

### `Sema.Selector<T, R>`

A projection function `(value: T) => R`. Used by `read` for one-shot projections and by `select` for reactive derivations.

### `Sema.Snapshot<T>`

A point-in-time snapshot of a sema's observable internals. All fields are `readonly`.

| Property | Description |
|----------|-------------|
| `value` | The sema's current value. |
| `oldValue` | The value before the last write. |
| `citizens` | Number of active listeners. |
| `registry` | Number of queued payloads. |
| `frozen` | Whether the sema is currently frozen. |

### `Sema.Batcher`

A parameterless callback `() => void` executed while the sema is frozen during `Sema.batch`.

### `Sema.identifier`

The well-known symbol (`Symbol.for('@herodot-app/sema')`) used to brand every sema instance. Consistent across module boundaries — one signal, one symbol.

---

### `Derivation<T, R>`

A derived sema computed from a source sema via a selector. It is itself a `Sema<R>` — readable, observable, composable.

| Parameter | Description |
|-----------|-------------|
| `T` | The source sema's value type. |
| `R` | The derived value type produced by the selector. |

### `Derivation.create(options)`

Creates a derivation from a source sema. The derived sema is initialised with the selector's current result.

```ts
const derived = Derivation.create({
  sema: source,
  selector: (s) => s.count,
})
```

| Option | Description |
|--------|-------------|
| `sema` | The source sema to derive from. |
| `selector` | A projection function `(value: T) => R`. |
| `equality?` | Custom equality for suppressing redundant propagation. Defaults to `Equality.check`. |

### `Derivation.unbind(derivation)`

Stops the derivation from listening to its source sema. Call this when the derivation goes out of scope to prevent listener accumulation.

```ts
Derivation.unbind(derived)
```

### `Derivation.is(value)`

Type guard that returns `true` when `value` is a derivation. Narrows to `Derivation<T, R>`.

```ts
if (Derivation.is(maybeDerived)) {
  maybeDerived.selector // accessible
}
```

### `Derivation.identifier`

The well-known symbol (`Symbol.for('@herodot-app/sema/derivation')`) used to brand derivation instances.

---

### `Equality<A, B>`

A binary predicate `(a: A, b: B) => boolean` that compares two values.

### `Equality.check(a, b)`

Deep structural equality. Dispatches through scalar → list → collection comparison recursively.

```ts
Equality.check({ a: [1, 2] }, { a: [1, 2] })  // true
Equality.check(1, '1')                        // false
```

### `Equality.strict(a, b)`

Strict reference equality with NaN handling (`NaN === NaN` is `true`).

```ts
Equality.strict(NaN, NaN)  // true
Equality.strict(1, 1)      // true
```

### `Equality.typeOf(a, b)`

Returns `true` when both values share the same `typeof` tag.

### `Equality.length(a, b)`

Returns `true` when two countable values report the same element count via `length`, `size`, or `count`.

### `Equality.checkList(a, b)`

Array/Set equality — same length, deeply equal elements at every index.

### `Equality.checkCollection(a, b)`

Object/Map equality — same keys, deeply equal values for every key.

---

### `Scalar<T>`

A union of JavaScript primitives: `number | string | boolean | null | undefined | bigint`, plus branded objects via `Scalar.Branded<T>`.

### `Scalar.is(value)`

Type guard that returns `true` when `value` is a scalar primitive or a branded scalar.

### `Scalar.branded(value)`

Marks an object as a branded scalar for equality purposes. The deep-equality algorithm treats branded objects as atomic leaves.

```ts
const id = Scalar.branded('abc-123')
Scalar.is(id) // true
```

### `Scalar.isBranded(value)`

Type guard that returns `true` when `value` carries the `Scalar.Brand` symbol.

### `Scalar.brand`

The well-known symbol (`Symbol.for('@herodot-app/sema/scalar/brand')`) used to brand scalar objects.

### `Scalar.Branded<T>`

A branded scalar type that marks an arbitrary value as a scalar leaf. `Idion<Brand, { value: T }>`.

---

### `List<T>`

A typed alias for `Array<T> | ReadonlyArray<T> | Set<T> | ReadonlySet<T>`.

### `List.is(value)`

Type guard that returns `true` when `value` is an array or a Set.

---

### `Collection<K, V>`

A typed alias for `Record<K, V> | Map<K, V>`.

### `Collection.is(value)`

Type guard that returns `true` when `value` is a plain object or Map. Excludes arrays, Sets, and `null`.

### `Collection.Key`

The set of valid key types: `string | number | symbol`.

---

## License

MIT
