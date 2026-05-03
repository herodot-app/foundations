# foundations

<p align="center">
  <img src="https://github.com/herodot-app/foundations/blob/main/assets/foundations.webp?raw=true" alt="foundations" />
</p>

Foundations is a monorepo containing all open source projects for the Herodot App, making
typescript a better place to work with.

---

## Packages

### [@herodot-app/idion](./packages/idion)

> TypeScript's structural type system is powerful — and also a bit naive about identity.

Idion gives your domain objects a proper identity at both the type and runtime level, so a `UserId` and a `PostId` stop pretending they're the same thing just because they both have a `value: string`. No wrapper classes. No ceremony. Just objects that finally know who they are.

### [@herodot-app/rheon](./packages/rheon)

> You cannot step into the same river twice. A rheon is how you represent that river in TypeScript.

Rheon is a typed, mutable reactive container for values that change over time. It makes the intent explicit in the type system — so mutable state stops sneaking around like a `let` variable with ambition.

### [@herodot-app/ptoma](./packages/ptoma)

> From Ancient Greek *πτῶμα* — "a fall". The Greeks used it for anything that had collapsed beyond recovery. We use it for errors.

Ptoma is a standard way of representing domain-specific errors in TypeScript. It gives every failure a typed name and an optional structured payload — so when something falls in your program, you know exactly what fell, why, and what it was carrying. Without breaking the JavaScript error system.

### [@herodot-app/zygon](./packages/zygon)

> From Ancient Greek *ζυγόν* — "yoke", the bar that joins two oxen so they pull as one. A `Zygon` yokes two possible worlds: the path where things went right, and the path where they very much did not.

Zygon is a typed Result/Either type for TypeScript. It makes your codebase safe to work with by forcing both the success path and the failure path to be first-class, typed values in every function signature — so exceptions stop escaping silently, and deploying on Friday becomes merely a calendar choice rather than an act of courage.

### [@herodot-app/agora](./packages/agora)

> From Ancient Greek *ἀγορά* — "gathering place, public square". The beating civic heart of every Greek city-state, where citizens came to trade goods, exchange ideas, and occasionally heckle the wrong person.

Agora is a typed pub/sub event bus. Modules announce things into it; other modules hear those things. Nobody needs to import anyone. The square does the work — with full TypeScript safety, resilient error collection, and a deferred delivery queue for the moments when your consumers arrive fashionably late.

### [@herodot-app/sema](./packages/sema)

> From Ancient Greek *σῆμα* — "sign, signal, mark". The root of semaphore and semantic. A sema is a landmark so travellers know where they have been.

Sema gives you reactive, observable values with derived slices, batched updates, and deep equality out of the box. Every sema is identifiable at runtime, every derivation is a sema itself, and writes use structural equality to suppress redundant updates — reactive programming without the PhD in FRP.

### [@herodot-app/eidos](./packages/eidos)

> From Ancient Greek *εἶδος* — "form", "shape", "essence". In Plato's philosophy, the Eidos is the ideal blueprint that real-world things are imperfect shadows of. Your runtime object is just a loose collection of bits hoping to be considered a `User`. The Eidos is the Form it must live up to.

Eidos lets you name your data shapes, validate them at runtime against any Standard Schema-compatible library (Zod, Valibot, Arktype — take your pick), and handle failures as typed, structured values. Shape your own data, with consistency, using any tools you want.
