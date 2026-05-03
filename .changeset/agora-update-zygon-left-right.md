---
"@herodot-app/agora": patch
---

Update internal Zygon usage to Left/Right API

Follows the breaking rename in `@herodot-app/zygon`: replaces all references to `dexion`/`skaion`/`isDexion`/`isSkaion` with `left`/`right`/`isLeft`/`isRight`. Also renames the exported type `KeryssoSkaion` → `KeryssoRight`.
