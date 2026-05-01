Open a pull request against main with a conventional title and a description that captures what the PR does — with a light touch of humour.

## Steps

### 1. Gather context

Run these in parallel:
- `git log main..HEAD --oneline` — list the commits in this branch
- `git diff main...HEAD --stat` — get a feel for the scope of changes
- `git diff main...HEAD` — read the full diff to understand what changed

Also grab the current branch name with `git branch --show-current`.

### 2. Draft the PR title

Write a conventional-commit style title:

```
<type>(<scope>): <short imperative description>
```

- **type**: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`
- **scope**: the affected package or area (e.g. `idion`, `cli`, `config`) — omit if it spans the whole repo
- Keep it under 72 characters

If the user passed an argument, use it as-is (after silently fixing any typos).

### 3. Write the description

Structure the PR body as follows:

```markdown
## What's in the box

<2–4 bullet points summarising the key changes. Be accurate and concrete.>

## Why

<1–2 sentences on the motivation or problem being solved.>

## Notes

<Any caveats, follow-ups, or things reviewers should pay attention to. Skip this section if there's nothing worth flagging.>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Tone:** informative and precise, but let one or two genuinely funny observations slip in — a witty bullet point, a self-aware aside, or a dry comment on the code that was removed. Keep the humour subtle and tasteful; the PR should still read as professional.

### 4. Push the branch

If the current branch has no upstream, push it with:

```bash
git push -u origin HEAD
```

### 5. Open the pull request

Run:

```bash
gh pr create --base main --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

### 6. Confirm

Return the PR URL and the title to the user.
