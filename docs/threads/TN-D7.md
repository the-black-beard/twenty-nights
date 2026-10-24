# TN-D7 — Maze shape comparisons

Baseline `4e45a6b9663267c3330690130b08f437ea18482e`. User authorized the next maze-shape comparison, rectangular overall board, Pac-Man-like pathways, continuous maze-shaped layer boundaries, and preservation of the current version. Existing standing delivery authority covers feature branch, reviewed integration merge, recovery tag and separate private Site update. Main stays unchanged pending human play.

## Acceptance

- Preserve the exact D6 published game at comparison-lab.html, alongside older D3/D4/D5 versions. Add maze-shapes.html with separate save, preferences and woods namespaces.
- Same 45 by 37 rectangular outer board, four upgrade-gated layers, ten monsters, four cores, dormant hammer, three lives and retained return state.
- Pathway set: current narrow loops, Pac-Man-like loop islands, winding snake race. Boundary set: rectangular islands, stepped islands, castle islands. Actual map previews and clear instructions help the player compare. The winding boundary investigation remains optional future work.
- Stepped/castle coloured walls form continuous nested closed boundaries. No accidental pre-breach access across layers. Next pickaxe lies before its wall; cores/hammer and monsters lie in the correct chamber. Each chamber stays connected and predominantly one cell wide with useful loop escape choices. All earned material walls remain mineable.
- Named shape presets hold control, speed, brains, roster, lives, mining, warning and hammer rules constant. Geometry changes path lengths, junctions and tactical choices; never claim equal difficulty. Custom settings remain explicitly recorded.
- Save/Continue, history and note exports bind each attempt to its own authored map. Switching maps cannot discard another map's progress or mislabel breaches. Invalid map identities reject without erasure.
- Audio intensity follows actual physical chamber depth, including concave boundaries; patrol goals and weak spots come from the selected map. Preserve pinch zoom, two-finger look-ahead, bounded threat cues and funny monsters.

## Matt route and evidence

Installed ask-matt router → implement with tdd at already accepted public NetherTrial/saved-Continue/UI seams and the layout catalogue → parallel Standards and Spec review. FAST_DEVELOPMENT for bounded implementation, FULL_GOVERNED delivery checks. No new permission loop or design interview is needed for these authorized variants.

Validate independent topology/reachability, cross-map return state, camera/input regression, actual full public-action escape routes, original woods tests and build. Browser visuals at iPad dimensions complement headless tests. Human iPad fun, music and input acceptance remain playtest questions.
