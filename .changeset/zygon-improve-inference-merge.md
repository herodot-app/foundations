---
"@herodot-app/zygon": minor
---

improve type inference and add Promise support to lift types

- Change `Zygon.left<T>()` return type from `Zygon<T, unknown>` to `Zygon<T, never>` for better type inference when composing zygons
- Change `Zygon.right<T>()` return type from `Zygon<unknown, T>` to `Zygon<never, T>` for better type inference when composing zygons
- Add `Promise` unwrapping support to `Zygon.LiftLeft` type for handling async zygon types
- Add `Promise` unwrapping support to `Zygon.LiftRight` type for handling async zygon types
- Add `Deep` generic parameter to `Zygon.LiftRight` to properly track nesting depth and return innermost values