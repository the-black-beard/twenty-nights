# TN-C1 · Prototype: chase control

**Goal:** answer one question before any Nether work is specified.

> Does tap-to-move evasion actually feel good?

Run `/prototype`. Throwaway code, its own directory, outside this repo —
somewhere like `~/DevelopmentProjects/tn-proto-chase`. Hand the findings back as
a written file and link it from TN-D1.

## Why this blocks the Nether

Twenty Nights moves the hero by tapping a destination and pathfinding there.
That is right for build-and-defend. The Nether as ig-b-dynamix describes it is a
Pac-Man chase — "quick decision and evasion", monsters released as you open the
maze — and tap-to-path may feel terrible for that: laggy, imprecise, panicky in
the wrong way.

If it does feel bad, the Nether needs a different control scheme, and that
cascades into the Swarm finale too, which is also real-time. Finding that out in
an afternoon is worth a great deal more than finding it out after a month of
building the maze.

## What to build

The smallest thing that answers it. A grid, a hero, three or four monsters that
chase, some walls. No art, no sound, no scoring.

Then two more questions while the harness exists, both cheap to add:
- **Does it hold up at swarm scale?** The finale wants monsters from all
  directions on Canvas 2D with per-monster faces. Find the number where the
  frame rate gives out.
- **Would direct control feel better?** A drag or a virtual stick, as a
  comparison. ig-b-dynamix should try both and say which is more fun — he is the test.

## Done when

A written answer: tap-to-move is fine, or it is not and here is what replaces
it, plus the monster count the renderer can carry.
