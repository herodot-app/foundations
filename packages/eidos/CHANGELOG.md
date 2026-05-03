# @herodot-app/eidos

## 1.0.0

### Major Changes

- 53928e7: Rename `horismos`/`genesis` API to `define`/`create`

  `Eidos.horismos` → `Eidos.define`, `Eidos.genesis` → `Eidos.create`, `Eidos.GenesisPtoma` → `Eidos.CreatePtoma`, `Eidos.genesisPtomaIdentifier` → `Eidos.createPtomaIdentifier`, `Eidos.GenesisPtomaIdentifier` → `Eidos.CreatePtomaIdentifier`. The Greek names were philosophically satisfying; the English names are findable by autocomplete.

### Minor Changes

- 116ae82: Add `Eidos.Infer`, `Eidos.InferInput`, and `Eidos.InferName` utility types

  Compile-time helpers to extract the output type, input type, and name literal from an `Eidos` without repeating type annotations. Particularly useful when the schema performs a transform and input/output types differ.

## 0.2.1

### Patch Changes

- Updated dependencies [8fc30ae]
- Updated dependencies [83485e4]
  - @herodot-app/zygon@1.0.0

## 0.2.0

### Minor Changes

- 5581f9c: Introduce the eidos package
