# TN-D2 local trial

This is an independent snapshot of the real Twenty Nights game, extended with
one playable Nether layer. It has no Git metadata. No publication occurred.

Open index.html and choose Play the Nether layer. See PLAY-FIRST-LAYER.md.
From this folder, reproduce the checks with Node:

    node --test tools/nether-tests.js
    node tools/tests.js
    node tools/playthrough.js
    node tools/build.js

The original source snapshot was main at
65157e6dd4e61950d1656b90f8ff0283e89b9a53. Changed original files: index.html
and tools/harness.js; added tools/nether-tests.js. The copied source's CI files
are retained as source history, not authorization to run publication workflows.

Physical touch, Igby's acceptance and difficulty tuning remain pending.
