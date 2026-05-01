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

