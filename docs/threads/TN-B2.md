# TN-B2 · Finalise v1

**Goal:** implement ADR-0007 and ADR-0008, then ship v1 to his friends.

TN-B1 produced both decisions and both are **accepted**. The arguments are in
the ADRs and do not need rerunning — read `docs/adr/0007-home-can-be-lost.md`
and `docs/adr/0008-the-doorway.md`, then build what they say.

Nothing here is blocked. ig-b-dynamix was asked the ADR-0001 question and has
changed his mind: he wants it a bit harder, after the feedback from his friends.

## Order of work

Each of these is a ticket. Start a fresh session per ticket, from the ticket.

1. **The Doorway** (ADR-0008). A new walk-over tile in the `isFloor` family, a
   new material in the build sheet, and a rewritten bark. `sealsHeart` and
   `canPlace` should need no new logic — if they do, something has gone wrong,
   because `canPlace` already returns early for walkable materials. Ship this
   one first: it is the smallest, it is the one an adult playtester actually
   asked for, and it is independent of everything below.
2. **Rename `HEART` to `HOME` in the code.** `CONTEXT.md` says Home, the code
   says `HEART`, and ADR-0007 introduces three *Hearts* that Home can lose.
   Those two meanings cannot share a word. Mechanical rename, and it must land
   before the Heart pool, not after.
3. **The Heart pool** (ADR-0007). `S.heartHP` stops resetting at dawn
   (`index.html:2544`), `badNight()` stops calling `dawn(false)`, and the third
   hit ends the run instead of the Night.
4. **The failure screen.** Three things, not a fourth: how far you got, what
   finally did it, one thing to try. See ADR-0007 for what not to do.
5. **The mason's mend** (ADR-0007). One Heart, once per run, for stone, at the
   Village, by day, and never while `S.angry` is set.
6. **The difficulty wiring.** Easy unlimited, Normal and Hard three. Note that
   `PRESETS` booleans are matched exhaustively by `presetName()`, so a new key
   has to be added to that list or every preset silently becomes "mine".
7. **A feedback question about losing.** `FB_HARD` currently cannot see the
   thing this release changes, and he is calibrating on his friends now.

## Glossary additions

Add to `CONTEXT.md`. The Doorway entry goes next to **Portal** so the two are
read together; the Heart entry goes next to **Home**.

```
**Doorway**:
The walk-over tile that completes a wall. Your fort needs a way for you to get
in and out, so the Route runs through it and the monsters use it too. It can
never be closed.
_Avoid_: gate, door, gateway, entrance

**Heart**:
One of the three hits Home can take before it is lost for good. Spent across the
whole run, not per Night. The mason will mend one, once, for stone.
_Avoid_: life, HP, health
```

## How this gets played before it is merged

`main` is only ever updated after someone has actually played it, per
`docs/THREADS.md`. This release changes how losing feels, which is not something
the 220 assertions can judge.

Build the Heart pool on `try/real-failure` and publish it as its own artifact
alongside an unchanged build, then let him play both. That is cheaper and more
honest than a throwaway prototype, because the game is already one file with no
build step — the real thing *is* the prototype.

## Done when

All seven tickets are landed or explicitly dropped, `node tools/tests.js` and
`node tools/playthrough.js` are green, and he has played it.
