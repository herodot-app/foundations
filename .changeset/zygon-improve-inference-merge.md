---
"@herodot-app/zygon": minor
---

improve type inference and add Merge utility

- Change `Zygon.left<T>()` return type from `Zygon<T, unknown>` to `Zygon<T, never>` for better type inference when composing zygons
- Change `Zygon.right<T>()` return type from `Zygon<unknown, T>` to `Zygon<never, T>` for better type inference when composing zygons
- Add `Zygon.Merge<A, B, D>` type utility to merge two types, automatically handling Zygon unwrapping for failure types
