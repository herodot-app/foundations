# idion

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/idion.webp?raw=true" alt="idion" />
</p>

> From Ancient Greek **ἴδιον** (*idion*) — "one's own", "particular", "that which belongs to oneself".
> Not to be confused with *idiot*, which shares the same root but took a very different career path.

Idion gives your domain objects a proper identity — not just a shape, but a name they can be proud of.

---

## Why?

TypeScript's structural type system is powerful, but it has a blind spot: two objects with identical shapes are considered the same type, even if they represent completely different things.

```ts
type UserId = { value: string }
type PostId = { value: string }

declare const userId: UserId

const postId: PostId = userId // TypeScript is perfectly fine with this.
                              // Your domain model is not.
```

This is the classic "stringly typed" trap in disguise. You end up writing runtime checks, defensive guards, and the occasional panicked comment saying `// DON'T PASS A POST ID HERE`.

Idion solves this by branding objects at both the type level and the runtime level. Each branded object carries a hidden identity — a symbol stamp — that TypeScript tracks statically and that you can inspect at runtime:

```ts
type UserId = Idion<'UserId', { value: string }>
type PostId = Idion<'PostId', { value: string }>

declare const userId: UserId

const postId: PostId = userId // Type error. They know who they are.
```

No wrappers. No classes. No ceremony. Just a plain object that knows its own name.

---

## When to use it

Use Idion when:

- You have multiple types that share the same structure but mean different things (`UserId` vs `PostId`, `EuroAmount` vs `DollarAmount`, `RawHtml` vs `SafeHtml`).
- You want domain boundaries to be enforced by the compiler, not by convention and hope.
- You need to distinguish branded values at runtime — for example in a type guard, a validation layer, or a serializer.
- You want branded types without the overhead of wrapper classes or the fragility of plain type aliases.

---

## Installation

```bash
bun add @herodot-app/idion
```

Idion is a pure TypeScript utility with no runtime dependencies. It requires TypeScript 5+.

---

## How to use it

### Define your branded types

Declare your domain identity types using the `Idion` generic. The first parameter is the brand (a string literal), the second is the base object shape:

```ts
import { Idion } from '@herodot-app/idion'

type UserId = Idion<'UserId', { value: string }>
type PostId = Idion<'PostId', { value: string }>
type EuroAmount = Idion<'EuroAmount', { value: number; currency: 'EUR' }>
```

### Create branded values

Use `Idion.create` to stamp a brand onto a plain object. The brand is added in-place via `Object.assign` — no cloning, no wrapping:

```ts
const userId = Idion.create({ id: 'UserId', value: { value: 'abc-123' } })
//    ^? Idion<'UserId', { value: string }>

const postId = Idion.create({ id: 'PostId', value: { value: 'xyz-456' } })
//    ^? Idion<'PostId', { value: string }>
```

Now TypeScript will refuse to mix them up:

```ts
function getUser(id: UserId) { /* ... */ }

getUser(postId) // Type error — PostId is not assignable to UserId.
getUser(userId) // All good.
```

### Narrow at runtime with `Idion.is`

When you receive a value from an external source (an API, a message queue, user input), use `Idion.is` to confirm its identity before trusting it:

```ts
// Check for any brand — "is this one of ours?"
if (Idion.is(unknownValue)) {
  // unknownValue carries some Idion brand
}

// Check for a specific brand — "is this exactly a UserId?"
if (Idion.is(unknownValue, 'UserId')) {
  // TypeScript now knows unknownValue is Idion<'UserId', typeof unknownValue>
  console.log(unknownValue.value)
}
```

### Use symbols as brands for truly private identities

String brands are readable and great for debugging. But if you need a brand that is completely unguessable — one that only code holding a direct reference to the symbol can produce — use a symbol instead:

```ts
const SessionTokenBrand = Symbol('SessionToken')
type SessionToken = Idion<typeof SessionTokenBrand, { raw: string }>

const token = Idion.create({ id: SessionTokenBrand, value: { raw: 's3cr3t' } })

// Nobody outside this module can forge a SessionToken without the symbol.
```

### Inherit multiple brands

An object can hold more than one brand. This is useful when a value naturally belongs to several identities at once — think of a `PremiumUser` that is also, unambiguously, a `User`.

To achieve this, spread or `Object.assign` an existing `Idion` into the value of a new one. The resulting object carries every brand from its ancestors, plus the new one. It has layers. It contains multitudes.

```ts
const user = Idion.create({ id: 'User', value: { id: 'abc-123', name: 'Alice' } })
//    ^? Idion<'User', { id: string; name: string }>

const premiumUser = Idion.create({
  id: 'PremiumUser',
  value: Object.assign({ plan: 'gold' }, user),
})
//    ^? Idion<'PremiumUser', { plan: string } & Idion<'User', { id: string; name: string }>>

Idion.is(premiumUser, 'User')        // true — still very much a User
Idion.is(premiumUser, 'PremiumUser') // true — and proud of it
Idion.is(user, 'PremiumUser')        // false — not everyone gets the upgrade
```

The inheritance is structural: all brand keys from the source object are copied verbatim. There is no magic lineage tracking — just plain objects doing what plain objects do best.

---

## API reference

### `Idion<I, T>`

A type alias for `T & { [Idion.identifier]: I }`. Combines your base shape with a hidden brand property.

| Parameter | Constraint | Description |
|-----------|------------|-------------|
| `I` | `string \| symbol` | The brand that gives the object its identity. |
| `T` | `{}` | The base object shape carrying the actual data. |

### `Idion.create({ id, value })`

Stamps `id` onto `value` and returns it as a fully typed `Idion<I, T>`. The original reference is mutated in place.

### `Idion.is(value, id?)`

Type guard that narrows `value` to `Idion<I, T>`. Without `id`, confirms any brand is present. With `id`, also confirms the brand matches exactly.

### `Idion.identifier`

The well-known symbol (`Symbol.for('@herodot-app/idion/identifier')`) used as the property key for the brand. Consistent across module boundaries and bundler shenanigans.
