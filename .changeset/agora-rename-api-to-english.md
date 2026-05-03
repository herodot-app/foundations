---
"@herodot-app/agora": major
---

Rename Greek method names to English equivalents

`Agora.akouo` → `Agora.listen`, `Agora.kerysso` → `Agora.publish`, `Agora.katatasso` → `Agora.register`, `Agora.diangelo` → `Agora.dispatch`, `Agora.dialyo` → `Agora.clear`, `Agora.plethos` → `Agora.inspect`. Type renames: `Akouo` → `Listener`, `Apotasso` → `Unlistener`, `KeryssoRight` → `PublishRight`, `KeryssoZygon` → `PublishZygon`, `DiangeloZygon` → `DispatchZygon`, `Plethos` → `Snapshot`. Internal field `keryssos` → `registry`.
