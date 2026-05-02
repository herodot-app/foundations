import { Idion } from '@herodot-app/idion'
import { Zygon } from '@herodot-app/zygon'

/**
 * An **Agora** (ἀγορά) is a typed event bus — a pub/sub channel where citizens
 * gather to shout things at each other in an orderly fashion.
 *
 * In ancient Greece, the agora was the bustling public square at the heart of
 * every city-state: a place for commerce, politics, philosophy, and the
 * occasional dramatic monologue. Here, it serves a similar purpose — minus the
 * olives — as a meeting point between message producers and consumers.
 *
 * The generic parameter `T` is the shape of the **payload** carried by each
 * herald through the square. When `T` is `undefined`, heralds roam freely and
 * announce nothing in particular (yet still feel very important about it).
 *
 * @typeParam T - The payload type broadcast across the agora. Defaults to
 *   `undefined` for heralds with nothing to say but a lot of energy.
 *
 * @see {@link Agora.create} to summon a new agora into existence
 * @see {@link Agora.akouo} to register a citizen ready to listen
 * @see {@link Agora.kerysso} to have a herald make an announcement
 */
export type Agora<T = undefined> = Idion<
  Agora.Identifier,
  {
    readonly keryssos: Set<T>
    readonly citizens: Set<Agora.Akouo<T>>
  }
>

/**
 * The **Agora** namespace gathers all the functions and types needed to manage
 * your very own digital city-square.
 *
 * The naming conventions borrow from classical Greek because, frankly, the
 * Greeks already had a word for everything — and their vocabulary for public
 * discourse maps surprisingly well onto event-driven architecture.
 */
export namespace Agora {
  /**
   * The unique brand {@link Symbol} that identifies an `Agora` instance at
   * runtime. Think of it as the city's official seal stamped on every decree.
   */
  export const identifier = Symbol.for('@herodot-app/agora')

  /**
   * The TypeScript type of {@link Agora.identifier}.
   * Useful when you need to refer to the symbol's type without holding the
   * value itself — bureaucracy at the type level.
   */
  export type Identifier = typeof identifier

  /**
   * An **Akouo** (ἀκούω — "to hear, to listen") is the callback type for a
   * citizen subscribed to an agora.
   *
   * The conditional type ensures that:
   * - When `T` is `undefined`, the payload argument is **optional** — the
   *   citizen will listen even if the herald arrives with nothing to say.
   * - When `T` is a concrete type, the payload is **required** — the herald
   *   must deliver the goods or stay home.
   *
   * @typeParam T - The payload type the citizen expects to receive.
   */
  export type Akouo<T = undefined> = [undefined] extends [T]
    ? (payload?: T) => void
    : (payload: T) => void

  /**
   * An **Apotasso** (ἀποτάσσω — "to say farewell, to take leave") is the
   * unsubscribe function returned by {@link Agora.akouo}.
   *
   * Call it when a citizen has heard enough and wishes to quietly slip out of
   * the agora before the next herald arrives. No hard feelings.
   */
  export type Apotasso = () => void

  /**
   * Extracts the payload type `T` from a concrete {@link Agora} type.
   *
   * Useful when you have an `Agora<T>` and need its `T` — for instance, when
   * writing generic utilities that operate on arbitrary agora instances.
   *
   * @typeParam A - An `Agora` type to extract the payload from.
   *
   * @example
   * ```ts
   * const loginAgora = Agora.create<User>()
   * type Payload = Agora.InferPayload<typeof loginAgora>
   * //   ^? User
   * ```
   */
  // biome-ignore lint: we want any here since it can be any Agora instance
  export type InferPayload<A extends Agora<any>> =
    A extends Agora<infer T> ? T : never

  /**
   * Creates a new, empty **Agora** — a blank public square with no citizens
   * and no pending announcements.
   *
   * @typeParam T - The type of payload this agora will broadcast.
   * @returns A freshly minted {@link Agora} instance, ready for civic life.
   *
   * @example
   * ```ts
   * // An agora for string announcements
   * const townSquare = Agora.create<string>()
   *
   * // An agora with no particular payload — pure signal
   * const bell = Agora.create()
   * ```
   */
  export function create<T = undefined>(): Agora<T> {
    return Idion.create({
      id: identifier,
      value: {
        keryssos: new Set(),
        citizens: new Set(),
      },
    })
  }

  /**
   * Registers an **Akouo** listener — a citizen who takes up residence in the
   * agora and promises to react whenever a herald makes an announcement.
   *
   * The name comes from **ἀκούω** ("to hear"), because a citizen who does not
   * listen is just a tourist.
   *
   * Returns an {@link Agora.Apotasso} function. Call it to remove the citizen
   * from the agora — useful when the citizen moves to a different city-state or
   * simply grows tired of the noise.
   *
   * @param agora  - The agora to subscribe to.
   * @param akouo  - The listener callback to register.
   * @returns An unsubscribe function that removes the listener when called.
   *
   * @example
   * ```ts
   * const apotasso = Agora.akouo(townSquare, (name) => {
   *   console.log(`Welcome to the agora, ${name}!`)
   * })
   *
   * // Later, when the citizen has had enough philosophy for one day:
   * apotasso()
   * ```
   */
  export function akouo<T = undefined>(
    agora: Agora<T>,
    akouo: Agora.Akouo<T>,
  ): Agora.Apotasso {
    agora.citizens.add(akouo)

    return () => {
      agora.citizens.delete(akouo)
    }
  }

  /**
   * The raw array of errors collected when a herald's announcement causes
   * one or more citizens to throw. Each entry is an `unknown` error — because
   * citizens can be unpredictable.
   */
  export type KeryssoSkaion = Array<unknown>

  /**
   * The {@link Zygon} result type for a single {@link Agora.kerysso} call.
   * It succeeds (`dexion`) when all citizens behave, and fails (`skaion`) when
   * at least one of them throws a tantrum.
   */
  export type KeryssoZygon = Zygon<true, KeryssoSkaion>

  /**
   * The {@link Zygon} result type for {@link Agora.diangelo}, which replays
   * all queued announcements at once. The failure payload is an array of
   * {@link KeryssoSkaion} arrays — one per offending announcement.
   */
  export type DiangeloZygon = Zygon<true, Array<KeryssoSkaion>>

  /**
   * @internal Resolves to an empty tuple when `T` is `undefined` (no payload
   * required) or to `[T]` when a concrete type is expected. This allows
   * {@link Agora.kerysso} and {@link Agora.katatasso} to accept their payload
   * argument only when it is actually meaningful.
   */
  type GuessKeryssoPayload<T> = [undefined] extends [T] ? [] : [T]

  /**
   * Sends a **Kerysso** (κήρυξ — "herald") through the agora, broadcasting a
   * payload to every registered citizen in turn.
   *
   * The herald visits each citizen exactly once. If a citizen throws an error,
   * the herald notes it, keeps walking, and visits the next citizen anyway —
   * because good heralds finish their rounds regardless of the reception.
   *
   * Returns a {@link KeryssoZygon}:
   * - **`Zygon.dexion`** (success) when all citizens listened without incident.
   * - **`Zygon.skaion`** (failure) carrying the collected errors when one or
   *   more citizens threw.
   *
   * @param agora    - The agora to broadcast into.
   * @param payloads - The payload to deliver (omit when `T` is `undefined`).
   * @returns A {@link KeryssoZygon} reflecting whether all citizens behaved.
   *
   * @example
   * ```ts
   * const result = Agora.kerysso(townSquare, 'Socrates')
   *
   * if (Zygon.isDexion(result)) {
   *   // Every citizen greeted Socrates without incident
   * } else {
   *   // Someone had philosophical objections
   * }
   * ```
   */
  export function kerysso<T>(
    agora: Agora<T>,
    ...payloads: GuessKeryssoPayload<T>
  ): KeryssoZygon {
    const payload = payloads[0] as T
    const skaions = []

    for (const akouo of agora.citizens) {
      try {
        akouo(payload)
      } catch (err: unknown) {
        skaions.push(err)
      }
    }

    if (skaions.length === 0) {
      return Zygon.dexion(true) as KeryssoZygon
    }

    return Zygon.skaion(skaions) as KeryssoZygon
  }

  /**
   * Queues a payload into the agora's **keryssos** buffer — enqueuing an
   * announcement for later delivery rather than broadcasting it immediately.
   *
   * The name **Katatasso** (κατατάσσω — "to arrange, to register") reflects the
   * act of placing a herald in the queue rather than sending them out right
   * away. Think of it as handing your message to the waiting-room heralds.
   *
   * Queued payloads are held until {@link Agora.diangelo} is called, at which
   * point every pending herald is dispatched in one sweep.
   *
   * @param agora    - The agora whose queue receives the payload.
   * @param payloads - The payload to queue (omit when `T` is `undefined`).
   *
   * @example
   * ```ts
   * // Queue several announcements before any citizen has arrived
   * Agora.katatasso(townSquare, 'Plato')
   * Agora.katatasso(townSquare, 'Aristotle')
   *
   * // Register a citizen and immediately replay everything they missed
   * Agora.akouo(townSquare, greet)
   * Agora.diangelo(townSquare)
   * ```
   */
  export function katatasso<T>(
    agora: Agora<T>,
    ...payloads: GuessKeryssoPayload<T>
  ): void {
    const payload = payloads[0] as T

    agora.keryssos.add(payload)
  }

  /**
   * Replays all queued announcements — **Diangelo** (διαγγέλλω — "to announce
   * in all directions, to proclaim") dispatches every herald waiting in the
   * keryssos buffer to every registered citizen, then clears the queue.
   *
   * This is the mechanism for *catch-up*: citizens who joined the agora after
   * some announcements were made can receive those missed messages the moment
   * `diangelo` is called.
   *
   * Once the sweep is complete the keryssos buffer is emptied regardless of
   * outcome — the heralds have done their duty and retire.
   *
   * Returns a {@link DiangeloZygon}:
   * - **`Zygon.dexion`** when every citizen processed every queued payload
   *   without complaint.
   * - **`Zygon.skaion`** carrying a nested array of errors — one
   *   {@link KeryssoSkaion} per announcement that produced failures — when
   *   things went sideways.
   *
   * @param agora - The agora whose queued announcements will be replayed.
   * @returns A {@link DiangeloZygon} summarising the outcome.
   *
   * @example
   * ```ts
   * const result = Agora.diangelo(townSquare)
   *
   * if (Zygon.isDexion(result)) {
   *   // All catch-up announcements delivered successfully
   * }
   * ```
   */
  export function diangelo<T>(
    agora: Agora<T>,
  ): Zygon<true, Array<KeryssoSkaion>> {
    const cache = []

    for (const kerysso of agora.keryssos) {
      const skaions = []

      for (const akouo of agora.citizens) {
        try {
          akouo(kerysso)
        } catch (err: unknown) {
          skaions.push(err)
        }
      }

      if (skaions.length > 0) {
        cache.push(skaions)
      }
    }

    agora.keryssos.clear()

    if (cache.length === 0) {
      return Zygon.dexion(true) as DiangeloZygon
    }

    return Zygon.skaion(cache) as DiangeloZygon
  }

  /**
   * Dissolves the agora entirely — **Dialyo** (διαλύω — "to dissolve, to
   * disband") clears both the citizen registry and the keryssos queue in one
   * decisive act.
   *
   * After calling `dialyo`, the agora is technically still alive but utterly
   * empty: no citizens will receive future announcements, and no queued heralds
   * remain. It is the polite equivalent of everyone quietly leaving and turning
   * off the lights.
   *
   * @param agora - The agora to dissolve.
   *
   * @example
   * ```ts
   * // Clean up when the component / service is destroyed
   * Agora.dialyo(townSquare)
   * ```
   */
  export function dialyo<T>(agora: Agora<T>): void {
    agora.citizens.clear()
    agora.keryssos.clear()
  }

  /**
   * A snapshot of an agora's current population and pending announcements.
   *
   * - `citizens` — how many listeners are currently registered.
   * - `keryssos` — how many payloads are queued and awaiting {@link Agora.diangelo}.
   */
  export type Plethos = {
    citizens: number
    keryssos: number
  }

  /**
   * Returns a **Plethos** (πλῆθος — "multitude, crowd") census of the agora:
   * how many citizens are listening and how many heralds are waiting in the
   * queue.
   *
   * Handy for debugging, observability, or simply satisfying your curiosity
   * about how populated your digital city-state has become.
   *
   * @param agora - The agora to census.
   * @returns A {@link Plethos} with `citizens` and `keryssos` counts.
   *
   * @example
   * ```ts
   * const { citizens, keryssos } = Agora.plethos(townSquare)
   * console.log(`${citizens} citizens, ${keryssos} heralds waiting`)
   * ```
   */
  export function plethos<T>(agora: Agora<T>): Plethos {
    return {
      citizens: agora.citizens.size,
      keryssos: agora.keryssos.size,
    }
  }

  /**
   * Type-guard that returns `true` when `value` is an {@link Agora} instance
   * — specifically, when it carries the `Agora.identifier` brand stamped by
   * {@link Agora.create}.
   *
   * Delegates to `Idion.is` under the hood so the check is safe across module
   * boundaries and does not rely on `instanceof`.
   *
   * @typeParam T - The expected payload type of the agora. Defaults to
   *   `unknown` so the guard is usable when the payload type is not yet known.
   * @param value - The value to inspect.
   * @returns `true` if `value` is an `Agora<T>`, narrowing the type
   *   accordingly; `false` otherwise.
   *
   * @example
   * ```ts
   * if (Agora.is(maybeAgora)) {
   *   // maybeAgora is Agora<unknown> here
   *   Agora.kerysso(maybeAgora)
   * }
   *
   * // With a concrete payload type
   * if (Agora.is<string>(maybeAgora)) {
   *   Agora.kerysso(maybeAgora, 'hello')
   * }
   * ```
   */
  export function is<T = unknown>(value: unknown): value is Agora<T> {
    // biome-ignore lint: This is needed to satisfy the Idion.is guard
    return Idion.is(value as {}, identifier)
  }
}
