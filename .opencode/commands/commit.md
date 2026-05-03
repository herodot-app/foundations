---
description: Perform a git commit and automatically generate a changeset
---

Perform a git commit and automatically generate a changeset from the commit message. If the user provided a message as $ARGUMENTS, use it. Otherwise run `git diff --staged` and draft a conventional-commit message that accurately describes the changes (e.g. `feat(idion): add Foo`, `fix(idion): correct Bar`).

Either way, review the message and silently correct any typos or awkward phrasing — keep the intent and style intact, just fix the language.

## Steps

### 1. Check for affected packages

Run `git diff --staged --name-only` and check if any files under `packages/` are staged.

If no files under `packages/` are staged, skip changeset creation entirely and jump straight to the commit step.

### 2. Generate the changeset

Run `bun changeset` from the monorepo root. This is an interactive command — the user will be prompted to:
- Select which packages are affected
- Choose the bump type (patch / minor / major)
- Write a summary

Wait for the command to complete before proceeding.

### 3. Stage the new changeset file

Run `git add .changeset/` to stage the newly generated changeset file.

### 4. Create the commit

Commit all currently staged files (including the new changeset) with the commit message, ending with:

```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Use a HEREDOC to pass the message so formatting is preserved.

### 5. Confirm

Tell the user:
- The commit hash and message
- The changeset file that was created (list the new file under `.changeset/`)
