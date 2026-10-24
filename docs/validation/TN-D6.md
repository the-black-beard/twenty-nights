# TN-D6 comparison lab — validation receipt

2026-10-24. Baseline: `44dc6a7fa99a266ab863348a3bd6035983a05f5b`.

## Delivered behavior

Five illustrated A/B pairs with optional custom mixes, separate retained attempts and feedback, export of all comparison notes, pinch zoom, two-finger look-ahead with a 450 ms cubic Bezier return, full-canvas overview without a minimap overlay, two nearby corridor threat cues and a hero-facing chevron. Committed rush keeps 8.2 tiles/second and locks its route at warning. Optional cracked walls take .9 seconds; every other unlocked material remains breakable in 1.8 seconds.

The source lives on `feature/nether-comparison-lab`, separately from the original woods and preserved D3/D4/D5 candidates. `main` is not promoted. `tools/package-comparison.py` verifies the exact bytes of all three prior published games and adds `comparison-lab.html`.

## Validation

- 43 focused public API, saved-Continue, UI, audio, input, geometry and history tests pass.
- 280 differential route checks, overview/close inverse coordinates, map gutters/edge clamps and finite rendering coordinates pass.
- Original woods: 220 checks and the 20-day playthrough pass.
- Single-file artifact build and immutable comparison packaging pass.
- Three action-only full escapes pass, each with two lives, four cores, ten released monsters, a physical hammer hit, portal charging and return to woods. Middle rush with Dodge on: 94.25s; all goofy with Dodge on: 101.95s; default middle committed with Dodge off: 91.85s. These are successful recipes, not win-rate measurements. Some timing recipes lose before the hammer.
- Browser at 1024 x 768: illustrated menu, start/continue/pause, full playfield without floating map, and browser-dispatched two-touch pinch inspected. Zoom visibly enlarges the maze after release without moving the hero. Simulated pointer tests additionally verify bounded zoom, return easing, cancellation, reduced motion and no accidental mining/turns.
- Independent Standards and Spec reviews cleared their reviewed scopes. Three defects found and fixed with regressions: swipe escape from auto-mining, export retention under quota failure, and honest recovery/flush of earlier unsaved attempts. Root separately reviewed the art changes authored by the Spec reviewer.

## Limits and next playtest

Real iPad gesture latency, Safari audio, fun and fairness need human play. Touch movement commits on release so a second finger can safely start camera gestures. Compare A then B within one category, record a memorable moment, and export all comparisons. Start with Moving, then Fast brains B. Keep the same display preferences if judging a pair; changes are recorded.

Maze-shape variants and nonrectangular continuous layer boundaries remain the next layout investigation. This first slice deliberately uses the same authored maze for interpretable controls/chase comparisons.

Matt route: ask-matt → implement with focused tdd → code-review. Loaded source wrapper: `~/.agents/skills/ask-matt/SKILL.md`. Browser/headless evidence does not establish human acceptance or justify main promotion.
