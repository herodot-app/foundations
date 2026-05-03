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
 * @see {@link Agora.listen} to register a citizen ready to listen
 * @see {@link Agora.publish} to have a herald make an announcement
 */
export type Agora<T = undefined> = Idion<
  Agora.Identifier,
  {
    readonly registry: Set<T>
    readonly citizens: Set<Agora.Listener<T>>
  }
>

/**
 * The **Agora** namespace gathers all the functions and types needed to manage
 * your very own digital city-square.
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
   * The callback type for a citizen subscribed to an agora.
   *
   * The conditional type ensures that:
   * - When `T` is `undefined`, the payload argument is **optional** — the
   *   citizen will listen even if the herald arrives with nothing to say.
   * - When `T` is a concrete type, the payload is **required** — the herald
   *   must deliver the goods or stay home.
   *
   * @typeParam T - The payload type the citizen expects to receive.
   */
  export type Listener<T = undefined> = [undefined] extends [T]
    ? (payload?: T) => void
    : (payload: T) => void

  /**
   * The unsubscribe function returned by {@link Agora.listen}.
   *
   * Call it when a citizen has heard enough and wishes to quietly slip out of
   * the agora before the next herald arrives. No hard feelings.
   */
  export type Unlistener = () => void

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
        registry: new Set(),
        citizens: new Set(),
      },
    })
  }

  /**
   * Registers a listener — a citizen who takes up residence in the agora and
   * promises to react whenever a herald makes an announcement.
   *
   * Returns an {@link Agora.Unlistener} function. Call it to remove the citizen
   * from the agora — useful when the citizen moves to a different city-state or
   * simply grows tired of the noise.
   *
   * @param agora    - The agora to subscribe to.
   * @param listener - The listener callback to register.
   * @returns An unsubscribe function that removes the listener when called.
   *
   * @example
   * ```ts
   * const unlisten = Agora.listen(townSquare, (name) => {
   *   console.log(`Welcome to the agora, ${name}!`)
   * })
   *
   * // Later, when the citizen has had enough philosophy for one day:
   * unlisten()
   * ```
   */
  export function listen<T = undefined>(
    agora: Agora<T>,
    akouo: Agora.Listener<T>,
  ): Agora.Unlistener {
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
  export type PublishRight = Array<unknown>

  /**
   * The {@link Zygon} result type for a single {@link Agora.publish} call.
   * It succeeds (left) when all citizens behave, and fails (right) when at
   * least one of them throws a tantrum.
   */
  export type PublishZygon = Zygon<true, PublishRight>

  /**
   * The {@link Zygon} result type for {@link Agora.dispatch}, which replays
   * all queued announcements at once. The failure payload is an array of
   * {@link PublishRight} arrays — one per offending announcement.
   */
  export type DispatchZygon = Zygon<true, Array<PublishRight>>

  /**
   * @internal Resolves to an empty tuple when `T` is `undefined` (no payload
   * required) or to `[T]` when a concrete type is expected. This allows
   * {@link Agora.publish} and {@link Agora.register} to accept their payload
   * argument only when it is actually meaningful.
   */
  type GuessPublishPayload<T> = [undefined] extends [T] ? [] : [T]

  /**
   * Broadcasts a payload to every registered citizen in turn.
   *
   * Each citizen is visited exactly once. If a citizen throws an error, the
   * broadcast notes it, keeps walking, and visits the next citizen anyway —
   * because good heralds finish their rounds regardless of the reception.
   *
   * Returns a {@link PublishZygon}:
   * - **`Zygon.left`** (success) when all citizens listened without incident.
   * - **`Zygon.right`** (failure) carrying the collected errors when one or
   *   more citizens threw.
   *
   * @param agora    - The agora to broadcast into.
   * @param payloads - The payload to deliver (omit when `T` is `undefined`).
   * @returns A {@link PublishZygon} reflecting whether all citizens behaved.
   *
   * @example
   * ```ts
   * const result = Agora.publish(townSquare, 'Socrates')
   *
   * if (Zygon.isRight(result)) {
   *   // Someone had philosophical objections
   * } else {
   *   // Every citizen greeted Socrates without incident
   * }
   * ```
   */
  export function publish<T>(
    agora: Agora<T>,
    ...payloads: GuessPublishPayload<T>
  ): PublishZygon {
    const payload = payloads[0] as T
    const errors = []

    for (const listener of agora.citizens) {
      try {
        listener(payload)
      } catch (err: unknown) {
        errors.push(err)
      }
    }

    if (errors.length === 0) {
      return Zygon.left(true) as PublishZygon
    }

    return Zygon.right(errors) as PublishZygon
  }

  /**
   * Enqueues a payload for later delivery rather than broadcasting it
   * immediately. Think of it as placing a message in the waiting room — the
   * heralds are ready but not yet sent.
   *
   * Queued payloads are held until {@link Agora.dispatch} is called, at which
   * point every pending payload is dispatched in one sweep.
   *
   * @param agora    - The agora whose queue receives the payload.
   * @param payloads - The payload to queue (omit when `T` is `undefined`).
   *
   * @example
   * ```ts
   * // Queue several announcements before any citizen has arrived
   * Agora.register(townSquare, 'Plato')
   * Agora.register(townSquare, 'Aristotle')
   *
   * // Register a citizen and immediately replay everything they missed
   * Agora.listen(townSquare, greet)
   * Agora.dispatch(townSquare)
   * ```
   */
  export function register<T>(
    agora: Agora<T>,
    ...payloads: GuessPublishPayload<T>
  ): void {
    const payload = payloads[0] as T

    agora.registry.add(payload)
  }

  /**
   * Dispatches every payload in the registry queue to every currently
   * registered citizen, then clears the queue.
   *
   * This is the mechanism for *catch-up delivery*: citizens who joined the
   * agora after some announcements were made can receive those missed messages
   * the moment `dispatch` is called.
   *
   * Once the sweep is complete the registry is emptied regardless of outcome —
   * the queued payloads have been delivered and are retired.
   *
   * Returns a {@link DispatchZygon}:
   * - **`Zygon.left`** when every citizen processed every queued payload
   *   without complaint.
   * - **`Zygon.right`** carrying a nested array of errors — one
   *   {@link PublishRight} per announcement that produced failures — when
   *   things went sideways.
   *
   * @param agora - The agora whose queued announcements will be replayed.
   * @returns A {@link DispatchZygon} summarising the outcome.
   *
   * @example
   * ```ts
   * const result = Agora.dispatch(townSquare)
   *
   * if (Zygon.isRight(result)) {
   *   // Some citizens had objections — result.right contains the errors
   * }
   * ```
   */
  export function dispatch<T>(
    agora: Agora<T>,
  ): Zygon<true, Array<PublishRight>> {
    const cache = []

    for (const payload of agora.registry) {
      const errors = []

      for (const listener of agora.citizens) {
        try {
          listener(payload)
        } catch (err: unknown) {
          errors.push(err)
        }
      }

      if (errors.length > 0) {
        cache.push(errors)
      }
    }

    agora.registry.clear()

    if (cache.length === 0) {
      return Zygon.left(true) as DispatchZygon
    }

    return Zygon.right(cache) as DispatchZygon
  }

  /**
   * Clears both the citizen registry and the payload queue in one decisive act.
   *
   * After calling `clear`, the agora is technically still alive but utterly
   * empty: no citizens will receive future announcements, and no queued payloads
   * remain. It is the polite equivalent of everyone quietly leaving and turning
   * off the lights.
   *
   * @param agora - The agora to clear.
   *
   * @example
   * ```ts
   * // Clean up when the component / service is destroyed
   * Agora.clear(townSquare)
   * ```
   */
  export function clear<T>(agora: Agora<T>): void {
    agora.citizens.clear()
    agora.registry.clear()
  }

  /**
   * A snapshot of an agora's current population and pending announcements.
   *
   * - `citizens` — how many listeners are currently registered.
   * - `registry` — how many payloads are queued and awaiting {@link Agora.dispatch}.
   */
  export type Snapshot = {
    citizens: number
    registry: number
  }

  /**
   * Returns a {@link Snapshot} of the agora: how many citizens are listening
   * and how many payloads are waiting in the registry queue.
   *
   * Handy for debugging, observability, or simply satisfying your curiosity
   * about how busy your digital city-state has become.
   *
   * @param agora - The agora to inspect.
   * @returns A {@link Snapshot} with `citizens` and `registry` counts.
   *
   * @example
   * ```ts
   * const { citizens, registry } = Agora.inspect(townSquare)
   * console.log(`${citizens} citizens listening, ${registry} payloads queued`)
   * ```
   */
  export function inspect<T>(agora: Agora<T>): Snapshot {
    return {
      citizens: agora.citizens.size,
      registry: agora.registry.size,
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
   *   Agora.publish(maybeAgora)
   * }
   *
   * // With a concrete payload type
   * if (Agora.is<string>(maybeAgora)) {
   *   Agora.publish(maybeAgora, 'hello')
   * }
   * ```
   */
  export function is<T = unknown>(value: unknown): value is Agora<T> {
    // biome-ignore lint: This is needed to satisfy the Idion.is guard
    return Idion.is(value as {}, identifier)
  }
}
