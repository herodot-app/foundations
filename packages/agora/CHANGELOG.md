# @herodot-app/agora

## 1.0.0

### Major Changes

- 5e27e19: Rename Greek method names to English equivalents

  `Agora.akouo` → `Agora.listen`, `Agora.kerysso` → `Agora.publish`, `Agora.katatasso` → `Agora.register`, `Agora.diangelo` → `Agora.dispatch`, `Agora.dialyo` → `Agora.clear`, `Agora.plethos` → `Agora.inspect`. Type renames: `Akouo` → `Listener`, `Apotasso` → `Unlistener`, `KeryssoRight` → `PublishRight`, `KeryssoZygon` → `PublishZygon`, `DiangeloZygon` → `DispatchZygon`, `Plethos` → `Snapshot`. Internal field `keryssos` → `registry`.

## 0.2.1

### Patch Changes

- 6e26d03: Update internal Zygon usage to Left/Right API

  Follows the breaking rename in `@herodot-app/zygon`: replaces all references to `dexion`/`skaion`/`isDexion`/`isSkaion` with `left`/`right`/`isLeft`/`isRight`. Also renames the exported type `KeryssoSkaion` → `KeryssoRight`.

- Updated dependencies [8fc30ae]
- Updated dependencies [83485e4]
  - @herodot-app/zygon@1.0.0

## 0.2.0

### Minor Changes

- 7a14015: Introduce the agora package

### Patch Changes

- c13803e: Add Agora.is type guard and Agora.InferPayload utility type
- Updated dependencies [c735d22]
- Updated dependencies [c9ca542]
  - @herodot-app/idion@0.1.3
  - @herodot-app/zygon@0.2.1
