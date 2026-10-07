# TN-C1 · Does tap-to-move evasion feel good?

Findings from the throwaway prototype at `~/DevelopmentProjects/tn-proto-chase`,
captured there as its own git repository. The harness is playable on a touch
device at <https://claude.ai/artifact/WGe1qDPtcqi8r2oFd8wuz5> — a private link
that only the account which published it can open, so it is here for Dad rather
than for anyone reading the repo.

**The short answer**: tap-to-move is not laggy, and the thing the brief was
afraid of turns out not to exist. There is a real problem with tap-to-move in a
chase, but it is a different problem, it is cheaper to fix than replacing the
control scheme, and the half of the question that is actually about fun is
still open, because that half is ig-b-dynamix's.

## What was built

One maze, four control schemes, the real game's constants — 20x20, `TILE` 32,
4-way BFS, hero 4.6 tiles/sec, caught at 0.55 tiles, monsters stepping cell to
cell on `prog` exactly as `updateMonsters()` does.

- **A · Tap to path** — what Twenty Nights ships.
- **B · Virtual stick** — drag or WASD, free movement, off the grid.
- **C · Swipe to turn** — he never stops, you only choose the turn. Arcade Pac-Man.
- **D · Follow the finger** — hold and drag, route recomputed ten times a second.

Four chasers with four different ideas (direct, ambush, flank, and a fast one
that loses its nerve up close), monsters let out of a pen one at a time, and a
swarm stress mode. The logic blocks are booted headless by `sim.js` and measured
there; the browser was only used to look, per ADR-0005.

## What the measurements say

### Tap-to-path is not laggy. Grid-locking is, and it is not tap-to-path's fault

Told to reverse while running, at eight different sub-tile offsets, every scheme
turns him round in **one frame, 17 ms, with zero wrong-way travel**. `heroBFSTo`
starts the search from `Math.round(hero.fx)`, so the first waypoint of a new
route can be the tile *behind* him, and he turns on the spot. The hypothesis that
tap-to-path commits you to the tile ahead is simply wrong.

The lag that does exist is in turning across the grid, and it is a property of
the maze rather than of the input:

| | reverse | turn 90 degrees | worst turn |
|---|---|---|---|
| A · tap to path | 17 ms | 226 ms | 533 ms |
| B · virtual stick | 17 ms | **17 ms** | **17 ms** |
| C · swipe to turn | 17 ms | 277 ms | 683 ms |
| D · follow the finger | 17 ms | 184 ms | 483 ms |

The authentic arcade scheme (C) is **as laggy as the one we have**, and slightly
worse. Swapping tap-to-path for real Pac-Man controls buys nothing in
responsiveness. Only leaving the grid entirely (B) does.

### The real cost is that BFS does not know monsters exist

A route is correct when you tap it and stale a second later. Measured with a
patrol that re-aims every 0.45 s — roughly a child's reaction time — and
identical targets in every condition:

| | a monster is standing on his committed route |
|---|---|
| A, routes as shipped | **23.3%** of the time |
| A, routes that avoid monsters | 19.0% |
| D, hold and re-path ten times a second | **14.9%** |

That is what would read as "imprecise". Not input latency — a route that was
right when you asked for it. Nearly a quarter of the time you are walking a path
with something standing on it.

Two cheap levers, neither of which is a new control scheme. Making tiles near a
monster cost more to walk is the same trick `computeField()` already plays with
firelight, about ten lines against the existing BFS, and it takes a quarter off.
Holding your finger instead of tapping takes a third off, and needs no new code
at all beyond keeping the pointer down.

### A quirk that is invisible today and visible in a chase

A tapped route cannot express "move half a tile". BFS starts from the rounded
tile, so tapping the square you are nearly standing on returns an empty path and
he stops, up to half a tile short, for no reason the player can see. Walking over
to chop a tree, nobody will ever notice. Being chased, he stops dead. The
prototype walks the last fraction directly; **the shipped game has this
behaviour** and the Nether will need the same patch whichever scheme wins.

### Four greedy chasers are one monster

Mean gap between chasers, over thirty seconds:

- four personalities — **5.01 tiles**
- four running the same policy — **1.18 tiles**

Four monsters all walking the shortest path to you are a single blob you outrun;
there is nothing to evade and no decision to make. If the Nether is a chase, the
four have to disagree with each other. This is ADR-0006 in a new costume:
difficulty from being wanted in several directions at once.

### The speed table decides the answer, and today's numbers cannot produce a chase

The hero moves at 4.6. A Chewer moves at 1.35 — he is **3.4 times faster than the
thing chasing him**, and the fastest monster in the game, the Rusher at 2.6, is
still only 0.57x. At shipped speeds you stroll away from anything and every
control scheme tests as fine, because there is no chase to control.

The prototype defaults to monsters at 0.80x the hero, which is roughly Pac-Man.
**The Nether needs its own speed table**, and that is a decision TN-D1 has to
make before the control question can even be asked properly. Worth knowing that
a prototype run at game speeds would have cheerfully declared everything fine.

### Going off the grid costs 10%

Corner to corner on the same route: tap-to-path 7.85 s, virtual stick 7.12 s.
B cuts corners instead of touching every tile centre, so it is about a tenth
faster across the maze. Small enough not to force a retune of everything, big
enough to mention if B wins.

## The swarm, for the finale

### The AI is free, and the architecture is right

Four shared flow fields rebuilt ten times a second, every monster walking the
gradient down — `scanStep`, exactly as the game does it:

| monsters | ai per frame | share of a 60fps frame |
|---|---|---|
| 100 | ~0.011 ms | 0.1% |
| 400 | ~0.016 ms | 0.1% |
| 800 | ~0.024 ms | 0.1% |

Figures settle within about 0.005 ms across repeated runs and never crossed 0.2%
of a frame in any of them. Monster count does not threaten the AI and will not,
because the cost sits in the fields and there are four of those however many
monsters there are. Whatever gives out in the Swarm, it is not pathfinding.

### Canvas 2D gives out at about 500, and the faces are the entire reason

On this Mac — DPR 2, a 1280px canvas, Chromium — holding each count for 2.4 s and
taking the median frame time:

| monsters | live faces | bodies only | faces from a sprite atlas |
|---|---|---|---|
| 460 | 60 | 60 | 60 |
| 520 | 58 | 60 | 60 |
| 700 | 30 | 60 | 60 |
| 900 | 30 | 60 | 60 |
| 1200 | 29 | — | 55 |
| 1600 | 20 | — | 30 |

**Roughly 500 monsters with a live face each; 60fps past 900 if the faces are
baked.** Bodies alone never became the problem. Each face is six small arc fills,
and at five hundred of those the rasteriser gives up — note that the page's own
`drawMs` only reached 2.5 ms, because timing Canvas 2D calls measures queueing
them, not drawing them. The fix is standard: pre-render the face once per colour,
look direction, blink and mood into a 128-sprite atlas and `drawImage` it. That
roughly doubles the ceiling and is worth doing before the Swarm is specified
rather than after.

**These are one machine's numbers.** The game is played on whatever ig-b-dynamix plays
on. The harness has a copy button; run the stress test there and paste the result
back before anyone sizes a Wave around 500.

## What is still open

Which one is more fun. That is not measurable here and was never going to be —
every number above says the schemes are closer than expected, which makes the
taste question the whole decision rather than a tiebreak.

Worth putting in front of him at `chase .80x`, A and B back to back, since those
are the two real options and they differ most.

## What I would do

**Try D first.** It keeps the input idiom ig-b-dynamix already knows, keeps the existing
pathfinding, needs no new motor skill from an eight-year-old, and takes the
route-staleness problem down by a third on its own. Add the monster-cost field
and it goes further. That is a small change to a system that already works.

**B is the only scheme that is genuinely more responsive**, and it is a real
change: a new movement system off the grid, collision that is no longer tile
based, and a Nether speed table that accounts for the 10%. Worth it only if ig-b-dynamix
plays both and the stick is obviously more fun, which is exactly the thing the
harness exists to find out.

**C is not worth it.** It is as laggy as what we have, it needs a new input
vocabulary, and it buys only authenticity.

Whichever wins, two things come along: patch the half-tile stop, and give the
Nether's monsters four different ideas, or there is nothing to evade.

## Loose ends worth carrying into TN-D1

- The Nether needs its own speed table. Shipped speeds cannot make a chase.
- A monster that reaches its target tile freezes if all it ever does is walk a
  gradient down: nothing adjacent is closer, so `scanStep` returns no step. Twenty
  Nights never hits this because every field targets Home, and a monster that
  arrives at Home is removed in the same frame. The moment the Nether gives a
  monster a target it can arrive at *and survive* — an ambush tile, a patrol
  corner — it will stand there looking broken. The prototype keeps it moving:
  anything but a U-turn, and a U-turn only if there is nothing else.
- The light-cost trick in `computeField()` generalises neatly to "tiles near a
  monster cost more". It is the cheapest fix found here and it fits the existing
  code.
