# TN-D7 maze shapes — validation receipt

2026-10-24. Baseline: `4e45a6b9663267c3330690130b08f437ea18482e`.

## Delivered behavior

Five selectable maps share a rectangular 45 by 37 outer board. The pathways comparison offers Current loops, Loop islands and Snake race. The boundaries comparison reuses Loop islands as its rectangular baseline, then offers Stepped islands and Castle islands. Cards draw the actual playable geometry and objects.

All named presets retain the same speeds, committed rush brains, two middle rush layers, ten monsters, three lives, upgrade requirements, permanent openings, hammer rules and fixed gameplay seed. Different geometry changes route length and tactical choices, so equal difficulty is not assumed. Optional custom dials, pinch zoom, two-finger look-ahead, bounded danger cues and full-canvas Map remain available.

Each saved adventure, note export and audio depth belongs to its selected map. D7 uses separate save/preferences/history and woods namespaces. Packaging verifies D3, D4, D5 and D6 against their immutable source bytes; the new game is `maze-shapes.html` and D6 remains `comparison-lab.html`.

## Validation

- 49 geometry checks pass: exact original map and object placement, closed continuous separators, five connected chambers, upgrades before their walls, correctly placed rewards and enemies, multiple usable breaches, narrow lanes and two refuge exits.
- 51 focused API, UI, input, saved-return, history and audio checks pass. The inward bays of stepped/castle walls remain at the outer music depth. Actual SVG geometry, map selection, custom settings and retained cross-map feedback are checked.
- 280 differential route checks plus overview/close coordinates, rectangular gutters, edge clamps and finite drawing coordinates pass.
- Original woods: 220 checks, the 20-day playthrough and single-file build pass.
- Current-map action-only escape recipes remain identical: middle rush/Dodge on 94.25s, goofy/Dodge on 101.95s and default committed middle/Dodge off 91.85s, each with two lives and earned charged-hammer return to woods.
- New-map complete public-action escapes: Snake race 163.2s and Stepped islands 166.15s, each with one life, four cores, charged hammer and actual return to woods. These two recipes explicitly enable optional Dodge. No teleports, granted upgrades or edited monsters are used.
- Bounded non-winning diagnostics: Loop islands collected all four cores and hammer but lost on the return; Castle reached upgrade four but did not collect the hammer. Castle's first-pickaxe route took 29.35s. These observations do not prove impossibility or human difficulty; full escapes for these maps and new-map default Dodge-off balance remain unverified.
- Browser inspection at 1024 x 768 and 768 x 1024: graphical comparisons, stepped launch, pause, overview, portrait playfield and saved-map Continue menu. No captured browser errors/warnings. The unchanged gesture handling also passes pointer regression tests; this is not physical iPad/Safari testing.
- Independent Standards and Spec reviews cleared their scopes after fixes. Patrol targets were moved to reachable outer floor; original patrol and weak spots were restored exactly; numeric start/portal cells are now reserved during placement. Root visually reviewed the UI authored by the Standards reviewer.

## Playtest and delivery boundary

Start Current loops → Loop islands, then Rectangle islands → Stepped islands. Use the same settings within each comparison. Record where a corner helped, where a trap felt unfair, and whether the hammer return felt possible. Download all comparisons afterward. Castle pacing and the return challenge are explicit investigations.

Game source is `feature/nether-maze-shapes`, with reviewed integration and recovery checkpoint under the existing Git authority. Private Site publication is a separate operation. Original main remains unchanged pending human play; automated evidence is not acceptance.

Matt route: `~/.agents/skills/ask-matt/SKILL.md` → implement with focused tdd → two-axis code-review. The existing public NetherTrial, saved-Continue and UI seams were reused; layout tests cover the new pure-data catalogue.
