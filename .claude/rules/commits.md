# Commit and PR Rules

After completing any task that changes files, Claude must automatically:

1. Create a new branch (if not already on a feature branch)
2. Stage and commit with a meaningful message — never leave it blank
3. Push the branch to remote
4. Open a PR targeting `testing` with a filled-in Summary + Test plan

Do not wait to be asked. This is part of completing the task.

## Commit Message Format

- Format: `type: short description` (e.g. `docs:`, `fix:`, `feat:`, `ci:`)
- Body lines explain *why*, not *what* — the diff shows what changed

## PR Rules

- PR description must use the Summary + Test plan format — never submit an empty template
- PRs always target `dev` as base branch — never `main` directly
- Never push directly to `main` or `dev`
