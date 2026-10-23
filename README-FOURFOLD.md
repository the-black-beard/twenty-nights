This document describes the preserved D4 checkpoint. For the current Storm Hammer revision, see `docs/nether/STORM-HAMMER.md` and `README-STORM-HAMMER.md`.

# Fourfold Maze — playable rectangular Nether

Open Fourfold-Maze.html in a browser. Offline, self-contained. Candidate 2 is ready for private playtesting; publication remains a separate step.

- Four rectangular layers; predominantly single-cell looping corridors.
- Copper, crystal, iron and obsidian upgrades; permanent shared breaches.
- Cumulative monster counts: 2 → 4 → 7 → 10, released by actual connected openings.
- Three lives; retained upgrades, cores, openings and monster state.
- Four cores unlock the exit; you must reach it on foot.
- Goofy regular is the recommended first run. Tracking rush is the harder experimental comparison; rush speed remains 8.2 tiles/s against the hero's 4.6.
- A visible 12-second chase / 4-second patrol rhythm offers mining opportunities. Contact is still dangerous during patrol. No countdown, life refill or timed release.
- Close view starts on. Use Overview to plan; tap or drag to move. Tap a numbered wall to mine. Watch for patrol windows and make alternate openings before entering crowded layers.
- Save & menu retains the adventure. Download notes before replacing it with another chase.

## Evidence and limits

16 focused tests, 280 differential routing cases and camera/render checks, 220 woods checks, 20-day woods simulation, build and exact source-ZIP rebuild passed. Standards and Spec reviewers have no outstanding findings. A clean action-only Goofy replay collected all four upgrades/cores, released all ten monsters and physically escaped with two lives left after 112.25 simulated seconds. This establishes a complete route, not human enjoyment.

Tracking rush did not complete in 96 additional scripted timing trials; some reached every core. Its difficulty remains experimental. No browser or physical iPad touch validation was run in this iteration. Offline Canvas previews are not browser screenshots. Igby's feedback should decide the final feel and balance.

The original woods' 31 recorded files and D3 candidate2 are unchanged. D2/D3 browser saves remain isolated. Candidate1 Fourfold was an unpublished local QA version; exact-build validation does not Continue a candidate1 Fourfold save. This candidate is the first intended private Fourfold playtest.

## Rebuild

Extract source.zip and run `python3 assemble.py`. Expected HTML SHA-256: ba8f623bd3da9aa1bae1d2afe935f0291a6021f2008400503caf282e4c5591c6.

Checks: `node --test tools/maze-tests.js tools/runner-tests.js tools/comparison-notes-tests.js`; `node tools/winning-route.js`; `node tools/route-camera-checks.js`; `node tools/tests.js`; `node tools/playthrough.js`; `node tools/build.js`.
