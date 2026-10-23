# Storm Hammer

A four-layer playable revision based on the latest player feedback. Open `index.html`, or choose Storm Hammer on the private iPad comparison page. The previous four-layer and two-layer versions remain intact.

Start with **Middle rush**: normal monsters outside, fast monsters in the middle two layers. Deep rush, Goofy and Rush everywhere are alternatives. Match the pickaxe's colour and pattern to the wall. The refuge shields you for eight seconds; leaving starts a fifteen-second recharge. Monsters can pass around and through its corner.

Collect the sleeping hammer at the centre. Move or aim to face a direction; tap **Swing** or press **Space** to stun one monster ahead. A swing cannot protect your back. Lightning stays dormant until you carry the hammer and all four cores through the exit. Then choose **Take the lightning hammer into the woods**; it automatically fires at nearby monsters in this isolated woods copy.

Spooky music changes with physical depth, with extra tension while carrying the prize. Sound is enabled by your first interaction; use Settings to mute. Pause and hidden tabs silence the score. Material patterns, high contrast and reduced motion remain available.

## Validation

27 focused gameplay/audio/save checks; 280 differential route checks and camera/render checks; 220 original woods checks; 20-day woods simulation; offline build. Full public-action escapes: Middle rush at 123.4 seconds with one life, Goofy at 104.9 seconds with two. Both earned and charged the hammer and returned to the woods. Standards and Spec reviews found no outstanding blocker. Local browser start/pause/UI and canvas visuals inspected; listening preference and physical iPad touch quality remain human playtest checks. Deep rush and Rush everywhere have not received full winning-route verification in this iteration.

## Build and check

```sh
python3 assemble.py
node --test tools/storm-tests.js tools/maze-tests.js tools/runner-tests.js tools/comparison-notes-tests.js tools/storm-audio-tests.js
node tools/storm-playthrough.js
node tools/route-camera-checks.js
node tools/tests.js
node tools/playthrough.js
node tools/build.js
python3 tools/package-comparison.py
```

The comparison package preserves the exact older HTML checkpoints. New saves use `tn.d5.storm.v1`; isolated woods saves use `tn.stormtrial1.`. Original-game saves are untouched. See `docs/nether/STORM-HAMMER.md` for scope and `docs/nether/GIT-WORKFLOW.md` for branch/recovery rules.
