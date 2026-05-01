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

