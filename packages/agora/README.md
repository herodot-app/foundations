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
Agora.kerysso(loginAgora, user)

// In analytics.ts — the consumer has no idea where the event came from.
Agora.akouo(loginAgora, (user) => analytics.track('login', user))

// In notifications.ts
Agora.akouo(loginAgora, (user) => notifications.greet(user))
```

The agora is the dependency, not the other modules. Add a consumer without touching the producer. Remove one without breaking the others. The type follows the channel — TypeScript knows exactly what payload each listener will receive.

And if a listener throws? The herald keeps walking. The other citizens still get their announcement. Errors are collected and surfaced as a typed `Zygon` rather than silently swallowed or allowed to interrupt the broadcast.

---

## When to use it

Use Agora when:

- You have an event that multiple unrelated consumers need to react to, and you do not want the producer to know or care who those consumers are.
- You are decoupling modules across feature boundaries and direct imports would create circular dependencies or uncomfortable knowledge.
- You want robust error handling baked into your event bus — knowing which listeners failed without losing the rest of the broadcast.
- You need deferred delivery: queue announcements before listeners exist, then replay them when the consumers are ready. Useful for initialisation sequences where order is awkward and nobody wants to coordinate it manually.
- You want an easy teardown path — a single `dialyo` call that empties the square and leaves no listeners behind to cause memory leaks.

---

## Installation

```bash
bun add @herodot-app/agora
```

Agora depends on `@herodot-app/idion` for the branded identity layer and `@herodot-app/zygon` for typed error handling. It requires TypeScript 5+.

---

## How to use it

### Create an agora

Use `Agora.create` to summon a new, empty public square. Supply a type parameter for the payload your heralds will carry. Omit it for a signal-only channel with no payload:

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

### Subscribe a citizen with `akouo`

Use `Agora.akouo` to register a listener — a citizen who will be called every time a herald makes an announcement. The name comes from **ἀκούω**: "to hear". A citizen who does not listen is just a tourist.

```ts
const apotasso = Agora.akouo(loginAgora, (user) => {
  console.log(`Welcome, ${user.name}!`)
})
```

`akouo` returns an **Apotasso** function — from **ἀποτάσσω**: "to take one's leave". Call it when the citizen has had enough and wishes to quietly exit before the next herald arrives:

```ts
// The citizen leaves. No hard feelings.
apotasso()
```

Multiple citizens can register independently. Each gets their own `apotasso` and each unsubscribes only themselves:

```ts
const stop1 = Agora.akouo(loginAgora, analytics.track)
const stop2 = Agora.akouo(loginAgora, notifications.greet)
const stop3 = Agora.akouo(loginAgora, cache.warm)

// Stop only analytics without disturbing the others
stop1()
```

### Broadcast with `kerysso`

Use `Agora.kerysso` to send a herald through the agora and deliver a payload to every registered citizen. The name comes from **κήρυξ**: "herald".

```ts
import { Zygon } from '@herodot-app/zygon'

const result = Agora.kerysso(loginAgora, user)

if (Zygon.isDexion(result)) {
  // Every citizen received the announcement without incident
}

if (Zygon.isSkaion(result)) {
  // One or more citizens threw — result.left contains the collected errors
  console.error('Some citizens had objections:', result.left)
}
```

The herald visits each citizen exactly once. If a citizen throws, the herald notes the error, keeps walking, and visits the next citizen anyway. Good heralds finish their rounds regardless of the philosophical reception. All errors are collected and returned as a `KeryssoZygon`.

For a signal-only agora (`T` is `undefined`), the payload argument is optional:

```ts
Agora.kerysso(shutdownAgora)         // no payload needed
Agora.kerysso(shutdownAgora, undefined) // also fine, if you feel strongly about it
```

### Queue an announcement with `katatasso`

Use `Agora.katatasso` to enqueue a payload for later delivery rather than broadcasting it immediately. The name comes from **κατατάσσω**: "to arrange, to register" — you are placing a herald in the waiting room, not sending them into the square yet.

```ts
// Queue some announcements before any citizens have arrived
Agora.katatasso(loginAgora, adminUser)
Agora.katatasso(loginAgora, regularUser)

// Citizens registered *after* the announcements were queued
Agora.akouo(loginAgora, notifyWelcomeService)
```

Nothing is delivered yet. The heralds are waiting patiently.

### Replay queued announcements with `diangelo`

Use `Agora.diangelo` to dispatch every herald waiting in the queue to every currently registered citizen. The name comes from **διαγγέλλω**: "to announce in all directions, to proclaim throughout".

```ts
// All queued payloads are now delivered to all registered citizens
const result = Agora.diangelo(loginAgora)

if (Zygon.isDexion(result)) {
  // Every queued announcement was delivered cleanly
}

if (Zygon.isSkaion(result)) {
  // result.left is an array of error arrays — one per announcement that caused failures
  console.error('Some heralds had a rough day:', result.left)
}
```

Once the sweep completes, the queue is emptied regardless of outcome. The heralds have done their duty and retire. A subsequent `diangelo` on an empty queue is a no-op — and returns a `dexion`, because zero failures is still a success.

This pair of `katatasso` + `diangelo` is the mechanism for *catch-up delivery*: produce events before consumers exist, then replay them the moment listeners are ready.

### Dissolve the agora with `dialyo`

Use `Agora.dialyo` to clear both the citizen registry and the keryssos queue in one decisive act. The name comes from **διαλύω**: "to dissolve, to disband".

```ts
// Clean up when a component or service is destroyed
Agora.dialyo(loginAgora)
```

After `dialyo`, the agora is technically still alive but utterly empty. Future `kerysso` calls will visit zero citizens and return a `dexion` — because broadcasting to nobody is technically flawless. Future `katatasso` calls will queue normally. The agora is not destroyed, just vacated — like a city square after a very successful public holiday.

### Take a census with `plethos`

Use `Agora.plethos` to inspect the current population of an agora. The name comes from **πλῆθος**: "multitude, crowd".

```ts
const { citizens, keryssos } = Agora.plethos(loginAgora)

console.log(`${citizens} citizens listening, ${keryssos} heralds in the queue`)
```

Useful for debugging, observability dashboards, or satisfying curiosity about how busy your digital city-state has become.

---

## API reference

### `Agora<T>`

The type of a typed pub/sub channel. Under the hood it is an `Idion` branded with `Agora.identifier`, which means every agora is uniquely identifiable at runtime.

| Parameter | Description |
|-----------|-------------|
| `T` | The payload type broadcast across the agora. Defaults to `undefined` for signal-only channels. |

### `Agora.Akouo<T>`

The callback type for a subscribed citizen. When `T` is `undefined`, the payload argument is optional — the citizen listens even if the herald arrives with nothing to say. When `T` is a concrete type, the payload is required.

```ts
type UserListener = Agora.Akouo<User>
//   ^? (payload: User) => void

type SignalListener = Agora.Akouo
//   ^? (payload?: undefined) => void
```

### `Agora.Apotasso`

The unsubscribe function returned by `Agora.akouo`. A parameterless `() => void` that removes its specific citizen from the agora when called.

### `Agora.KeryssoSkaion`

The failure payload for a single `kerysso` call — an `Array<unknown>` of errors thrown by citizens during that broadcast.

### `Agora.KeryssoZygon`

The return type of `Agora.kerysso`. A `Zygon<true, KeryssoSkaion>` — either a `dexion` of `true` (everyone behaved) or a `skaion` carrying the collected errors.

### `Agora.DiangeloZygon`

The return type of `Agora.diangelo`. A `Zygon<true, Array<KeryssoSkaion>>` — either a `dexion` of `true` or a `skaion` carrying a nested array of errors, one `KeryssoSkaion` per announcement that triggered failures.

### `Agora.Plethos`

A census snapshot of an agora.

| Property | Description |
|----------|-------------|
| `citizens` | Number of currently registered listeners. |
| `keryssos` | Number of payloads waiting in the queue for `diangelo`. |

### `Agora.create<T>()`

Creates a new, empty agora with no citizens and no queued announcements. `T` defaults to `undefined`.

```ts
const agora = Agora.create<string>()
//    ^? Agora<string>
```

### `Agora.akouo(agora, listener)`

Registers `listener` as a citizen of `agora`. Returns an `Apotasso` unsubscribe function.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to subscribe to. |
| `listener` | The `Akouo<T>` callback to call on each announcement. |

### `Agora.kerysso(agora, payload?)`

Broadcasts `payload` to all currently registered citizens. Returns a `KeryssoZygon`. The payload argument is required when `T` is a concrete type and optional when `T` is `undefined`.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to broadcast into. |
| `payload` | The value to deliver to each citizen (omit when `T` is `undefined`). |

### `Agora.katatasso(agora, payload?)`

Enqueues `payload` into the agora's keryssos buffer without delivering it immediately. Returns `void`. The payload is held until `Agora.diangelo` is called.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora whose queue receives the payload. |
| `payload` | The value to enqueue (omit when `T` is `undefined`). |

### `Agora.diangelo(agora)`

Replays every payload in the keryssos queue to every currently registered citizen, then clears the queue. Returns a `DiangeloZygon`. Always empties the queue, regardless of whether any citizens threw.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora whose queue will be replayed. |

### `Agora.dialyo(agora)`

Clears both the citizen registry and the keryssos queue. The agora remains usable — it is vacated, not destroyed. Returns `void`.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to dissolve. |

### `Agora.plethos(agora)`

Returns a `Plethos` census of the agora's current state: how many citizens are registered and how many payloads are queued.

| Parameter | Description |
|-----------|-------------|
| `agora` | The agora to census. |

### `Agora.identifier`

The well-known symbol (`Symbol.for('@herodot-app/agora')`) used to brand every agora instance. Consistent across module boundaries — one square, one seal.

---

## License

MIT
