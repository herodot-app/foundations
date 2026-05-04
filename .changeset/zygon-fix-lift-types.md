---
"@herodot-app/zygon": patch
---

fix(zygon): correct LiftLeft and LiftRight type handling

- Fix LiftLeft to pass D parameter through recursion  
- Fix LiftRight to handle void, never, and unknown edge cases