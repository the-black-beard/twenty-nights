# The headless harness is the source of truth, not the browser

`tools/harness.js` boots the real `index.html` in Node with a stubbed DOM,
canvas, storage and audio, and `tools/tests.js` asserts against it. This is the
gate, not anything observed in a browser preview.

The preview pane caches aggressively and will happily serve a build from twenty
minutes ago, strips query strings and fragments from file URLs, serves pages as
`data:` URLs where `localStorage` throws outright, and intermittently times out
on synthetic clicks while showing a stale frame. Every one of those cost real
debugging time before the harness existed.

**Consequences**: a change is not verified because it looked right. Run the
suite. The browser is still essential for the things assertions cannot see —
whether a wall is visible, whether a tree reads against grass, whether a tutorial
slide teaches — and three real bugs were caught that way that no test would have
found. Use it to *look*, not to *prove*.
