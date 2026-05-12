---
"@herodot-app/ptoma": minor
---

add Ptoma.match type guard function

- Add `Ptoma.match(subject, SubjectClass)` type guard that checks if a value is an instance of a specific Ptoma subclass
- Combines both the Ptoma brand check and instanceof for precise type narrowing
- Add comprehensive TSDoc documentation explaining the difference between match and Ptoma.is
- Add tests for the new match function
- Update README to use class syntax instead of const for error definitions