# Workflow Rules

## Plan Mode

- Enter plan mode for **any non-trivial task** (3+ steps or architectural decisions)
- Write detailed specs upfront to reduce ambiguity
- Use plan mode for verification steps, not just building
- If something goes sideways, **stop and re-plan immediately** — do not keep pushing

## Task Management

1. **Plan first**: write plan to `docs/plans/<task-name>.md` with checkable items
2. **Verify plan**: check in before starting implementation
3. **Track progress**: mark items complete as you go
4. **Explain changes**: high-level summary at each step
5. **Document results**: add review section to the plan file in `docs/plans/`
6. **Capture lessons**: update `tasks/lessons.md` after corrections

## Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## Self-Improvement Loop

- After **any correction** from the user: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake from recurring
- At session start: read `tasks/lessons.md` for prior lessons
- Ruthlessly iterate until mistake rate drops

## Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

## Autonomous Bug Fixing

- When given a bug report: fix it — do not ask for hand-holding
- Point at logs, errors, failing tests, then resolve them
- Fix failing CI tests without being told how
