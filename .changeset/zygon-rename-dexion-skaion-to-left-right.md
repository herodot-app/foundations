---
"@herodot-app/zygon": major
---

Rename Dexion/Skaion to Left/Right — align with standard Either convention

`Zygon.dexion` → `Zygon.left`, `Zygon.skaion` → `Zygon.right`, `isDexion` → `isLeft`, `isSkaion` → `isRight`, `unwrapRight` → `unwrapLeft`, `unwrapLeft` → `unwrapRight`. Type parameters renamed from `<D, S>` to `<L, R>`.
