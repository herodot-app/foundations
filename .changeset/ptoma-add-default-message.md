---
"@herodot-app/ptoma": minor
---

Add `defaultMessage` parameter to `Ptoma.create`

- New optional `defaultMessage` parameter sets a fallback message for when the error is instantiated without an explicit message
- Useful for providing sensible defaults in error definitions
- Updated TSDoc and README documentation
