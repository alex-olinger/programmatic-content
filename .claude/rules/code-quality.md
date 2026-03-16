# Code Quality Rules

## Core Principles

- **Simplicity first**: make every change as simple as possible; minimal code impact
- **No laziness**: find root causes; no temporary fixes; senior developer standards
- **Minimal impact**: only touch what is necessary; avoid introducing bugs

## Anti-Over-Engineering

A 500-line flat module is better than 1500 lines across 3–4 layers unless the layering is explicitly justified.

- **Flat before layered.** Write the simplest direct implementation first. No abstraction layers for hypothetical future needs.
- **No speculative generalization.** No base classes, generic factories, plugin systems, or strategy patterns unless more than one concrete use case exists *right now*.
- **Line count smell check.** If an implementation exceeds 2× a direct equivalent, stop and justify each layer. If you can't justify it, flatten it.
- **One layer of indirection is usually enough.** Service → DB call. Handler → Service. Do not stack Repository + UnitOfWork + AbstractBaseRepository on top of a pooled client.
- **No framework scaffolding for app code.** Apps are not frameworks.
- **Ask before adding an interface/abstract class.** If it has exactly one implementation and no test double requires it, don't create it.

### Check before presenting code

1. Could this be written with one fewer layer? If yes — write that version.
2. Is every abstraction boundary justified by something that exists today, not "we might need it"?
3. Would a new team member understand this without reading three other files first?

If any answer is "no," refactor before presenting.

## Demand Elegance

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip for simple, obvious fixes — do not over-engineer
