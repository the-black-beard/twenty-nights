# Threads

Work on Twenty Nights is split into threads — one conversation each, named so
that the list sorts into the order the work happens in.

## The prefix

```
TN-<phase><number> · <short name>
```

`TN` for the project, a letter for the phase, a number within it. Alphabetical
order is chronological order, so a sorted list of sessions reads as a plan.

| Phase | What it covers |
|-------|----------------|
| **A** | Foundation — repo, docs, tooling, CI |
| **B** | Finalise v1 — the current feedback round, shipped to friends |
| **C** | Prototypes — throwaway code answering one design question |
| **D** | The Nether — the maze level and the hammer |
| **E** | The Swarm — the finale and the ending |

## The threads

| Thread | Work | State |
|--------|------|-------|
| `TN-A1 · Repo and constitution` | git, GitHub, CI, CONTEXT.md, ADRs | in progress |
| `TN-B1 · Grill: stakes and the gate` | the two decisions that reverse existing ADRs | next |
| `TN-B2 · Finalise v1` | failure screen, difficulty wiring | after B1 |
| `TN-C1 · Prototype: chase control` | does tap-to-move evasion feel good? | after B2 |
| `TN-D1 · Nether: grill and spec` | mechanics for ig-b-dynamix's maze | after C1 |
| `TN-D2…n` | one per ticket, context cleared between | after D1 |
| `TN-E1 · Swarm: grill and spec` | designed with the hammer in hand | after D ships |

## Rules

- **One thread, one phase.** Grilling, spec and tickets stay in a single
  unbroken conversation so they build on the same thinking. Each implementation
  ticket then starts fresh from the ticket.
- **A thread ends when its output is in the repo.** If something is worth
  carrying to the next thread, it belongs in `CONTEXT.md`, an ADR, or a ticket —
  not in conversation history.
- **Prototypes get their own directory**, outside this repo, and hand their
  findings back as a written file.

## Branches and tags

| Pattern | Meaning |
|---------|---------|
| `main` | What friends are playing. Only merged after someone has actually played it. |
| `try/<idea>` | One design variant, built to be played and compared against another. |
| `tn-<phase><n>/<slug>` | Ticket work. |
| `archive/<idea>` *(tag)* | A variant that lost. Kept forever, costs nothing, out of the way. |

A rejected idea is tagged, never deleted. When two variants are in play, publish
each as its own artifact and let ig-b-dynamix play both before anything is merged.
