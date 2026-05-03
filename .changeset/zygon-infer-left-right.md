---
"@herodot-app/zygon": minor
---

Add `Zygon.InferLeft` and `Zygon.InferRight` utility types

Compile-time utilities to extract the `L` or `R` type from a `Zygon` without repeating type annotations. Resolves to `never` when the requested side is absent.
