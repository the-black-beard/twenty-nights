# Twenty Nights

A woods survival game, designed by ig-b-dynamix (8) with his dad.

You arrive in the woods one morning with sixteen oak planks, a stone sword and a
map to the village. You have twenty nights. Build by day, hold the night, and
look after your Home — it's the only thing you can really lose.

## Play it

Open `index.html` in a browser. That's the whole thing: one file, no libraries,
no build step, no internet. It works just as well AirDropped to a phone.

## Build the sendable copies

```bash
node tools/build.js
```

Writes `Twenty Nights.html` (the file to send someone), `dist/` (a hostable copy
with icons and link previews) and `assets/` (the generated icon). All of it is
derived from `index.html` and none of it is committed.

## Check it still works

```bash
node tools/tests.js        # 220 assertions against a headless boot of the real game
node tools/playthrough.js  # simulates twenty days and asserts the game is completable
```

Both must pass before anything is committed. Neither can tell you whether the
game is any *good* — only playing does that, which is why `main` is only ever
updated after someone has actually played the change.

## Where things are

| Path | What |
|------|------|
| `index.html` | The game. The single source of truth. |
| `tools/harness.js` | Boots the real game headlessly in Node. |
| `tools/tests.js` | The assertions. |
| `CONTEXT.md` | The shared language. Read this first. |
| `docs/adr/` | Decisions that would otherwise look arbitrary. Read 0002 and 0004 before changing anything. |
| `docs/THREADS.md` | How the work is split up. |
