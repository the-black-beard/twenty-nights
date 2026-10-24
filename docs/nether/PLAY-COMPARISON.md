# Playable Nether comparisons

The private iPad Site keeps each published game at its own location. The latest experiment is TN-D7 Maze Shapes; the root four-layer game and previous comparison labs remain preserved. Original main is unchanged.

| Play location, relative to the existing Site | Source checkpoint | Meaning |
| --- | --- | --- |
| `/compare.html` | `web/compare.html` | Touch-friendly choice page |
| `/maze-shapes.html` | `checkpoint/tn-d7-maze-shapes-1` | Five maps: current loops, loop islands, snake race, stepped and castle boundaries |
| `/comparison-lab.html` | `checkpoint/tn-d6-comparison-lab-1` | Preserved controls, chase and camera comparisons |
| `/storm-hammer.html` | `checkpoint/tn-d5-storm-hammer-1` | Preserved Storm Hammer feedback revision |
| `/index.html` or `/` | `checkpoint/tn-d4-rectangular-candidate-2` | Preserved four-layer game |
| `/two-layer.html` | `checkpoint/tn-d3-two-layer-candidate-2` | Preserved two-layer candidate |

Build with `python3 assemble.py`, then `python3 tools/package-comparison.py`. The command verifies all four prior games against immutable Git commits and recorded hashes, then adds Maze Shapes and the chooser in `dist/comparison/`. Use the native Sites source and deployment workflow for the existing Site, preserving its identity and audience. Do not commit generated output to this game repository.

The versions use distinct save namespaces. Switching versions does not reset either save. Browser Back returns to the choice page. Match monster settings for a useful comparison; existing route layouts and balance differ, so this is not an experiment isolating only layer count.

Human playtest: try both on iPad, report favorite, unfair traps and chase pressure. Automated checks do not establish touch quality or human acceptance.

Git destination: `https://github.com/the-black-beard/twenty-nights.git`. Game source lives on feature/prototype branches; selected reviewed changes merge to `integration/nether`. Original `main` remains the woods baseline. Private Site Git tracks deployment output separately.

The user approved the recommended Git workflow on 2026-10-23: commit and push tested changes, preserve alternatives and merge selected reviewed changes. Continue using Ask Matt for routing; publication and original-main advancement retain their documented scope and gates.


For Maze Shapes, compare Current loops with Loop islands first. Then compare Rectangle islands (the same Loop islands map) with Stepped islands. Snake race and Castle islands investigate longer lanes and wall recesses. All named shape presets share the same speeds, brains and rules; geometry changes journey length and tactical choices, so equal difficulty is not assumed. Pinch zoom, two-finger look-ahead, optional custom dials and downloadable notes remain available. See `docs/validation/TN-D7.md` for the evidence and playtest limits.
