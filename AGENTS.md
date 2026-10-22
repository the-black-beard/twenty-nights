# Twenty Nights agent instructions

## Project and sources

Twenty Nights is an offline woods survival game designed by ig-b-dynamix with Dad. `index.html` is the single game source. Use Canvas 2D and generated/embedded art and WebAudio; preserve the single-file, no-external-request contract.

Read `CONTEXT.md`, `docs/THREADS.md`, the relevant `docs/threads/` brief, and the relevant ADRs before a change. ADR-0007 amends ADR-0001; ADR-0008 preserves ADR-0002. Recovered Claude conversations are historical evidence. Accepted decisions should not be re-grilled unless new evidence contradicts them.

## Coordination and safety

TN0 is the dedicated Codex coordinator. Work one bounded ticket per worker, blockers first, with one owner per writable surface. Independent read-only lanes may run in parallel. Keep grilling, spec and ticket creation together; start implementation tickets with fresh context.

Preserve original Claude checkouts, rescue files and historical branches. Use a separate Codex checkout/worktree for code. Stale pre-rewrite branches may carry private identity metadata: preserve privately and do not merge, cherry-pick or publish them blindly.

Use only the project's pseudonyms in publishable content and Git metadata. Preserve the repository-specific pseudonymous author identity; do not replace it with an account-login email. Existing repository permissions are capabilities, not authority to use them.

Publishing, pushing, merging, deploying, external messages, grants, destructive cleanup and paid Claude usage require the specific authority for that action. Future pull requests default to draft. `main` advances only after someone has actually played the change.

## Verification

Run `node tools/tests.js` and `node tools/playthrough.js` before a commit. Run `node tools/build.js` to produce sendable output. Generated `assets/`, `dist/` and `Twenty Nights.html` remain untracked. Headless checks do not establish browser/touch quality or human acceptance; report those separately.

## Agent skills

### Issue tracker

GitHub Issues in `the-black-beard/twenty-nights`, using existing `gh` authentication. See `docs/agents/issue-tracker.md`. Recovery-only authorization does not include creating issues or labels.

### Triage labels

Use the five default roles. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

### Route

Use `/ask-matt` for flow selection and verify installed sibling skills. Recover existing decisions before starting a new interview. New designs follow `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` per unblocked ticket, with `/tdd` and `/code-review`. Prototypes live separately and hand back findings. Use `/handoff` when crossing harness/directory boundaries; maintain a durable continuation pointer.
