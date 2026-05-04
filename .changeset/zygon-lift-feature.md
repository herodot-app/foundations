---
"@herodot-app/zygon": minor
---

Add lift feature to recursively unwrap nested Zygons

- Add `LiftLeft<T, D>` and `LiftRight<T, D>` type utilities to extract innermost values from nested Zygon types
- Add `unwrapLiftLeft` (aliased as `unwrapLift`) and `unwrapLiftRight` functions for runtime recursive unwrapping
- Add comprehensive TSDoc documentation for all lift types and functions
- Add usage documentation and API reference in README
- Add tests for all lift functionality
