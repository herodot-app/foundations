# @herodot-app/agora

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/agora.webp?raw=true" alt="agora" />
</p>

> From Ancient Greek **ἀγορά** (*agorá*) — "gathering place, marketplace, public square". Every Greek city-state had one: the beating civic heart where citizens came to trade goods, exchange ideas, debate philosophy, and occasionally heckle the wrong person.
> An `Agora` is where your modules go to talk to each other without needing to know who is listening.

Agora is a typed pub/sub event bus. Modules announce things into it; other modules hear those things. Nobody needs to import anyone. The square does the work — minus the olives.

---

## Why?

Components and modules often need to react to each other's events. The straightforward solution is direct coupling: module A imports module B and calls it directly.

```ts
// auth.ts
import { analytics } from './analytics'
import { notifications } from './notifications'
import { cache } from './cache'

function onLogin(user: User) {
  analytics.track('login', user)
  notifications.greet(user)
  cache.warm(user.id)
  // auth.ts now knows about every module that cares about logins.
  // Add one more consumer and you edit this file. Again.
}
```

This works until it doesn't. Every new consumer requires a new import. Every import is a dependency that the compiler will complain about when you try to move things around. The producer has become the world's least willing event router.

The classic fix — a global event emitter — trades compile-time safety for runtime chaos. You fire a `'login'` string into the void and hope whoever is listening on the other end actually expects a `User`. TypeScript cannot help you. Typos in event names are runtime bugs. The payload type is `any` wearing a trench coat.

Agora gives you the pub/sub pattern with the type safety intact:

```ts
import { Agora } from '@herodot-app/agora'

// Declare the channel once, type and all.
export const loginAgora = Agora.create<User>()

// In auth.ts — the producer has no idea who is listening.
Agora.publish(loginAgora, user)

// In analytics.ts — the consumer has no idea where the event came from.
Agora.listen(loginAgora, (user) => analytics.track('login', user))

// In notifications.ts
Agora.listen(loginAgora, (user) => notifications.greet(user))
```

The agora is the dependency, not the other modules. Add a consumer without touching the producer. Remove one without breaking the others. The type follows the channel — TypeScript knows exactly what payload each listener will receive.

And if a listener throws? The broadcast keeps going. The other citizens still get their announcement. Errors are collected and surfaced as a typed `Zygon` rather than silently swallowed or allowed to interrupt the broadcast.

---

## When to use it

Use Agora when:

- You have an event that multiple unrelated consumers need to react to, and you do not want the producer to know or care who those consumers are.
- You are decoupling modules across feature boundaries and direct imports would create circular dependencies or uncomfortable knowledge.
- You want robust error handling baked into your event bus — knowing which listeners failed without losing the rest of the broadcast.
- You need deferred delivery: queue announcements before listeners exist, then replay them when the consumers are ready. Useful for initialisation sequences where order is awkward and nobody wants to coordinate it manually.
- You want an easy teardown path — a single `clear` call that empties the square and leaves no listeners behind to cause memory leaks.
- You need to temporarily pause broadcasts during reconfiguration or teardown — `freeze` blocks announcements without losing state, and `unfreeze` restores normal operation.

---

## Installation

```bash
bun add @herodot-app/agora
```

Agora depends on `@herodot-app/idion` for the branded identity layer and `@herodot-app/zygon` for typed error handling. It requires TypeScript 5+.

---

## How to use it

### Create an agora

Use `Agora.create` to summon a new, empty public square. Supply a type parameter for the payload your listeners will receive. Omit it for a signal-only channel with no payload:

```ts
import { Agora } from '@herodot-app/agora'

// An agora that broadcasts User objects
const loginAgora = Agora.create<User>()
//    ^? Agora<User>

// An agora with no payload — pure signal, maximum gravitas
const shutdownAgora = Agora.create()
//    ^? Agora<undefined>
```

Each call produces an independent instance. Two agorae do not share citizens or queues — the city is large enough for everyone.

### Subscribe a citizen with `listen`

Use `Agora.listen` to register a listener — a citizen who will be called every time a payload is published.

```ts
const unlisten = Agora.listen(loginAgora, (user) => {
  console.log(`Welcome, ${user.name}!`)
})
```

`listen` returns an **Unlistener** function. Call it when the citizen has had enough and wishes to quietly exit before the next announcement:

```ts
// The citizen leaves. No hard feelings.
unlisten()
```

Multiple citizens can register independently. Each gets their own unlistener and each unsubscribes only themselves:

```ts
const stop1 = Agora.listen(loginAgora, analytics.track)
const stop2 = Agora.listen(loginAgora, notifications.greet)
const stop3 = Agora.listen(loginAgora, cache.warm)

// Stop only analytics without disturbing the others
stop1()
```

### Broadcast with `publish`

Use `Agora.publish` to broadcast a payload to every registered citizen.

```ts
import { Zygon } from '@herodot-app/zygon'

const result = Agora.publish(loginAgora, user)

if (Zygon.isLeft(result)) {
  // Every citizen received the announcement without incident
}

if (Zygon.isRight(result)) {
  // One or more citizens threw — result.right contains the collected errors
  console.error('Some citizens had objections:', result.right)
}
```

The broadcast visits each citizen exactly once. If a citizen throws, the error is noted and the next citizen is visited anyway. All errors are collected and returned as a `PublishZygon`.

For a signal-only agora (`T` is `undefined`), the payload argument is optional:

```ts
Agora.publish(shutdownAgora)            // no payload needed
Agora.publish(shutdownAgora, undefined) // also fine, if you feel strongly about it
```

### Queue an announcement with `register`

Use `Agora.register` to enqueue a payload for later delivery rather than broadcasting it immediately. You are placing a message in the waiting room, not sending it into the square yet.

```ts
// Queue some announcements before any citizens have arrived
Agora.register(loginAgora, adminUser)
Agora.register(loginAgora, regularUser)

// Citizens registered *after* the announcements were queued
Agora.listen(loginAgora, notifyWelcomeService)
```

Nothing is delivered yet. The payloads are waiting patiently.

### Replay queued announcements with `dispatch`

Use `Agora.dispatch` to deliver every payload in the registry to every currently registered citizen.

```ts
// All queued payloads are now delivered to all registered citizens
const result = Agora.dispatch(loginAgora)

if (Zygon.isLeft(result)) {
  // Every queued announcement was delivered cleanly
}

if (Zygon.isRight(result)) {
  // result.right is an array of error arrays — one per announcement that caused failures
  console.error('Some heralds had a rough day:', result.right)
}
```

Once the sweep completes, the queue is emptied regardless of outcome. A subsequent `dispatch` on an empty queue is a no-op — and returns a `Zygon.left`, because zero failures is still a success.

This pair of `register` + `dispatch` is the mechanism for *catch-up delivery*: produce events before consumers exist, then replay them the moment listeners are ready.

### Clear the agora with `clear`

Use `Agora.clear` to remove all citizens and empty the registry queue in one act.

```ts
// Clean up when a component or service is destroyed
Agora.clear(loginAgora)
```

After `clear`, the agora is technically still alive but utterly empty. Future `publish` calls will visit zero citizens and return a `Zygon.left` — because broadcasting to nobody is technically flawless. Future `register` calls will queue normally. The agora is not destroyed, just vacated — like a city square after a very successful public holiday.

### Inspect the agora with `inspect`

Use `Agora.inspect` to get a snapshot of the agora's current state.

```ts
const { citizens, registry, frozen } = Agora.inspect(loginAgora)

console.log(`${citizens} citizens listening, ${registry} payloads queued, frozen: ${frozen}`)
```

Useful for debugging, observability dashboards, or satisfying curiosity about how busy your digital city-state has become.

### Freeze the agora with `freeze`

Use `Agora.freeze` to temporarily block all announcements. While frozen, calls to `publish` and `dispatch` immediately return a `FrozenAgoraPtoma` error without notifying any citizens.

```ts
Agora.freeze(loginAgora)

Agora.publish(loginAgora, user) // returns FrozenAgoraPtoma — no citizens are notified
```

This is useful when you need to pause the agora during teardown, reconfiguration, or any period where announcements should be suppressed without losing the registered citizens or queued payloads.

### Unfreeze the agora with `unfreeze`

Use `Agora.unfreeze` to reopen the agora after it has been frozen. Citizens will resume receiving announcements normally.

```ts
Agora.freeze(loginAgora)

// ... some work happens while the square is closed ...

Agora.unfreeze(loginAgora)

// Citizens are back in business
Agora.publish(loginAgora, user) // delivered normally
```

Queued payloads registered while frozen are preserved and can be dispatched once the agora is unfrozen. Calling `unfreeze` on an already-unfrozen agora is safe and has no effect.

---

## API reference

### `Agora<T>`

The type of a typed pub/sub channel. Under the hood it is an `Idion` branded with `Agora.identifier`, which means every agora is uniquely identifiable at runtime.

| Parameter | Description |
|-----------|-------------|
| `T` | The payload type broadcast across the agora. Defaults to `undefined` for signal-only channels. |

### `Agora.Listener<T>`

The callback type for a subscribed citizen. When `T` is `undefined`, the payload argument is optional — the citizen listens even if the herald arrives with nothing to say. When `T` is a concrete type, the payload is required.

```ts
type UserListener = Agora.Listener<User>
//   ^? (payload: User) => void

type SignalListener = Agora.Listener
//   ^? (payload?: undefined) => void
```

### `Agora.Unlistener`

The unsubscribe function returned by `Agora.listen`. A parameterless `() => void` that removes its specific citizen from the agora when called.

### `Agora.PublishRight`

The failure payload for a single `publish` call — an `Array<unknown>` of errors thrown by citizens during that broadcast.

### `Agora.PublishZygon`

The return type of `Agora.publish`. A `Zygon<true, PublishRight>` — either a `Zygon.left` of `true` (everyone behaved) or a `Zygon.right` carrying the collected errors.

### `Agora.DispatchZygon`

The return type of `Agora.dispatch`. A `Zygon<true, Array<PublishRight>>` — either a `Zygon.left` of `true` or a `Zygon.right` carrying a nested array of errors, one `PublishRight` per announcement that triggered failures.

### `Agora.Snapshot`

A census snapshot of an agora.

| Property | Description |
|----------|-------------|
| `citizens` | Number of currently registered listeners. |
| `registry` | Number of payloads waiting in the queue for `dispatch`. |
| `frozen` | Whether the agora is currently frozen — `true` means `publish` and `dispatch` are blocked. |

### `Agora.create<T>()`

Creates a new, empty agora with no citizens and no queued announcements. `T` defaults to `undefined`.

```ts
const agora = Agora.create<string>()
//    ^? Agora<string>
```

### `Agora.listen(agora, listener)`

Registers `listener` as a citizen of `agora`. Returns an `Unlistener` function.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to subscribe to. |
| `listener` | The `Listener<T>` callback to call on each announcement. |

### `Agora.publish(agora, payload?)`

Broadcasts `payload` to all currently registered citizens. Returns a `PublishZygon`. The payload argument is required when `T` is a concrete type and optional when `T` is `undefined`.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to broadcast into. |
| `payload` | The value to deliver to each citizen (omit when `T` is `undefined`). |

### `Agora.register(agora, payload?)`

Enqueues `payload` into the agora's registry without delivering it immediately. Returns `void`. The payload is held until `Agora.dispatch` is called.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora whose queue receives the payload. |
| `payload` | The value to enqueue (omit when `T` is `undefined`). |

### `Agora.dispatch(agora)`

Replays every payload in the registry to every currently registered citizen, then clears the queue. Returns a `DispatchZygon`. Always empties the queue, regardless of whether any citizens threw.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora whose queue will be replayed. |

### `Agora.clear(agora)`

Clears both the citizen registry and the payload queue. The agora remains usable — it is vacated, not destroyed. Returns `void`.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to clear. |

### `Agora.inspect(agora)`

Returns a `Snapshot` of the agora's current state: how many citizens are registered, how many payloads are queued, and whether the agora is frozen.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to inspect. |

### `Agora.freeze(agora)`

Freezes an agora, preventing any new announcements from being published or dispatched. Returns `void`.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to freeze. |

### `Agora.unfreeze(agora)`

Unfreezes a frozen agora, allowing announcements to resume normally. Returns `void`.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to unfreeze. |

### `Agora.FrozenAgoraPtoma`

A `Ptoma` error thrown when attempting to `publish` or `dispatch` on a frozen agora. Extends `Error` and carries the name `@herodot-app/agora/frozen-agora-ptoma`.

```ts
const result = Agora.publish(frozenAgora, user)

if (result.right instanceof Agora.FrozenAgoraPtoma) {
  console.error('Cannot publish — the agora is frozen')
}
```

### `Agora.is<T>(value)`

Type-guard that returns `true` when `value` is an `Agora` instance — i.e. it carries the `Agora.identifier` brand. Delegates to `Idion.is` so the check works safely across module boundaries without relying on `instanceof`.

```ts
if (Agora.is(maybeAgora)) {
  // maybeAgora is Agora<unknown> here
}

// Narrow to a specific payload type
if (Agora.is<string>(maybeAgora)) {
  Agora.publish(maybeAgora, 'hello')
}
```

| Parameter | Description |
|-----------|-------------|
| `value` | The value to inspect. |

### `Agora.InferPayload<A>`

Utility type that extracts the payload type `T` from a concrete `Agora<T>` type. Useful when writing generic code that works with arbitrary agora instances.

```ts
const loginAgora = Agora.create<User>()
type Payload = Agora.InferPayload<typeof loginAgora>
//   ^? User
```

### `Agora.identifier`

The well-known symbol (`Symbol.for('@herodot-app/agora')`) used to brand every agora instance. Consistent across module boundaries — one square, one seal.

---

## License

MIT
