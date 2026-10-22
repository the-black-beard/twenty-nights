# Fourfold Maze — rectangular Nether candidate

Open Fourfold-Maze.html in a browser. Offline/self-contained. Publication is separate; this file is not yet the version at the existing iPad URL.

Four rectangular layers; permanent upgraded breaches; four cores; 2, 4, 7, then 10 active monsters; three total lives and retained progress. Default Goofy regular; compare Tracking rush with the same geometry. Close view starts on, Overview shows all four layers. Before entering the deepest loop, open two ways through and lure monsters toward one. All four cores must reach the green exit on foot. Save & menu retains the attempt; download its notes before starting a comparison.

Original woods and D3 candidate2 are preserved. Older browser saves remain in their own namespaces; this larger map begins a new adventure.

## Rebuild and checks

Extract source.zip, then run `python3 assemble.py`. This must reproduce HTML SHA-256 98d2add5633234f56c655c19dc416b58e3124e48938f601e48647cf6161fdf69.

Run `node --test tools/maze-tests.js tools/runner-tests.js tools/comparison-notes-tests.js`, `node tools/route-camera-checks.js`, `node tools/tests.js`, `node tools/playthrough.js`, `node tools/build.js`.

15 focused checks, 280 differential routes/camera/render checks, 220 woods checks, 20-day woods simulation and build passed. Independent Standards and Spec review have no unresolved findings. Canvas images are offline artwork previews, not browser screenshots. Browser/iPad touch and enjoyment are not verified. Full-run balance audition is recorded separately; a geometric/state pass is not proof that ten monsters feel fair.
