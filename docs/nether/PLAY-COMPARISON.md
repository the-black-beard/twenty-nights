# Current four-layer maze versus preserved two-layer candidate

Scope: provide both existing playable versions through the existing private iPad Site. Preserve the root four-layer game exactly and add `compare.html` plus `two-layer.html`. No gameplay redesign or original-main merge is included.

| Play location, relative to the existing Site | Source checkpoint | Meaning |
| --- | --- | --- |
| `/compare.html` | `web/compare.html` | Touch-friendly choice page |
| `/index.html` or `/` | `checkpoint/tn-d4-rectangular-candidate-2` | Current four-layer game |
| `/two-layer.html` | `checkpoint/tn-d3-two-layer-candidate-2` | Preserved two-layer candidate |

Build with `python3 tools/package-comparison.py`. The command extracts pinned Git commits and checks their recorded HTML hashes before writing `dist/comparison/`. Copy those three generated HTML files into the existing Site's `dist/`, then use the native Sites source and deployment workflow. Keep the existing Site identity and audience. Do not commit generated output to this game repository.

The versions use distinct save namespaces. Switching versions does not reset either save. Browser Back returns to the choice page. Match monster settings for a useful comparison; existing route layouts and balance differ, so this is not an experiment isolating only layer count.

Human playtest: try both on iPad, report favorite, unfair traps and chase pressure. Automated checks do not establish touch quality or human acceptance.

Git destination: `https://github.com/the-black-beard/twenty-nights.git`. Game source lives on feature/prototype branches; selected reviewed changes merge to `integration/nether`. Original `main` remains the woods baseline. Private Site Git tracks deployment output separately.

The user approved the recommended Git workflow on 2026-10-23: commit and push tested changes, preserve alternatives and merge selected reviewed changes. Continue using Ask Matt for routing; publication and original-main advancement retain their documented scope and gates.


Storm Hammer update: `/storm-hammer.html` is the new four-layer feedback revision described in `STORM-HAMMER.md`. `/compare.html` presents it first while preserving both prior games. Package all four generated HTML files after `python3 assemble.py`. The latest two modes with action-only full escape evidence are Middle rush and Goofy; physical iPad and music preference remain open for human feedback.
