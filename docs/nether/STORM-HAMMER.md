# Storm Hammer playable revision

Feedback source: two-layer candidate 2 notes, escaped on foot in 91 seconds with three lives; player found it fun but too easy and prefers the four-layer maze. Requested refuge use is eight seconds, with fifteen seconds recharge after leaving, without blocking the corner route.

Implement on the preserved four-layer baseline. Keep original games and saves selectable. New build/save namespace; no main merge. Selected tested changes may be committed, pushed and integrated under the user's continuing Git instruction. Deliver as a separate comparison option on the existing owner-private Site.

- Procedural spooky minor-key music with a clear beat; actual inward depth progressively adds tempo and texture. Carrying the prize retains escape tension. Pause, hidden tab, mute and return stop it. No downloaded assets.
- Setup mixes: normal outside with rush enemies in layers 2–3 (recommended), layers 3–4, all normal, or all rush. Earlier monsters remain released. Record mix in notes.
- Match pickaxe heads to wall colours and material patterns; remove numeric tool/wall labels, retain readable material names.
- Refuge shields the hero for at most eight active seconds. Leaving starts fifteen active seconds of recharge, even when some shield time remains. Exhaustion while inside removes protection; leave to recharge. Monsters can route through the corner and refuge; the shield grants temporary contact protection only. Respawn gets a fresh eight-second refuge and existing short recovery grace, never extra lives. Timers persist and stop when paused.
- A distinctive dormant lightning hammer sits at the deepest core in the centre. Collecting it retains it through lives. A deliberate touch/Space swing affects at most one visible monster ahead within 1.35 tiles, briefly stunning it (0.85s), with a 1.1s cooldown. No Nether lightning or kills; an opposite-side monster remains dangerous. Facing is visible and follows movement/aim.
- All four cores plus the hammer open the portal. The portal shows lightning; only reaching it on foot charges the hammer. Explicit return takes the player into this isolated copy's woods, where the charged hammer can fire lightning. No original woods save or canonical source changes.
- Three lives, permanent breaches, retained progress and ten-monster release progression remain. This is a playtest candidate; no claim of child/iPad acceptance from automated checks.

Matt route: wrapper installed `ask-matt/SKILL.md`; selected implement + tdd at the established NetherTrial/Continue/UI seams, followed by code-review Standards and Spec. Loaded/applied implement, tdd, project ADRs and phase-boundary guidance. Separate audio, art and UI file ownership under the existing parent controller. FAST_DEVELOPMENT for local implementation, FULL_GOVERNED for Git/publication.
