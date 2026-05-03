# @herodot-app/zygon

## 1.0.0

### Major Changes

- 83485e4: Rename Dexion/Skaion to Left/Right — align with standard Either convention

  `Zygon.dexion` → `Zygon.left`, `Zygon.skaion` → `Zygon.right`, `isDexion` → `isLeft`, `isSkaion` → `isRight`, `unwrapRight` → `unwrapLeft`, `unwrapLeft` → `unwrapRight`. Type parameters renamed from `<D, S>` to `<L, R>`.

### Minor Changes

- 8fc30ae: Add `Zygon.InferLeft` and `Zygon.InferRight` utility types

  Compile-time utilities to extract the `L` or `R` type from a `Zygon` without repeating type annotations. Resolves to `never` when the requested side is absent.

## 0.2.1

### Patch Changes

- c9ca542: Add lint script combining biome and tsc
- Updated dependencies [c735d22]
  - @herodot-app/idion@0.1.3

## 0.2.0

### Minor Changes

- a7c8f7b: Introduce the zygon package
