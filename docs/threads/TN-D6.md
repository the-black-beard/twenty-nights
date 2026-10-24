# TN-D6 — Playable comparison lab

Build a separate single-file candidate from TN-D5. Preserve D3, D4 and D5 as exact independent games, saves and publication routes. Do not promote main before human play.

## Acceptance

- Five graphical A/B pairs on the same four-layer rectangular maze, fixed seed and three lives. Compare tap destinations/buffered swipes; tracking/committed rush; equal mining/marked faster weak spots; one/two middle rush layers; nearby threat cues off/on. Each pair changes exactly one dial. Dodge defaults off for these trials. Custom mix permits all normal, one middle, two middle, two deep, three inner or all rush layers.
- Committed rush keeps the 8.2 burst speed, .7 warning, 1.1 burst and 1.3 recovery. It commits to a short route at the warning and cannot track a new hero position through the burst. Goofy faces and wrong turns remain.
- Every unlocked coloured wall remains mineable in 1.8 seconds. Optional visible weak spots take .9 seconds. No additional gates or difficulty compensation.
- Swipe queues a legal cardinal turn at the next junction, continues straight until blocked, supports reversing, and a floor tap stops. Wall taps still route to and mine the selected wall.
- Remove the floating minimap. Full-canvas Map / Close view toggle uses existing HUD space. Two-finger dragging pans, pinch zoom persists from overview to 3.2x; pan alone eases home over roughly 450 ms after release. Multi-touch must not accidentally command movement. Reduced motion returns immediately. Pause, blur and cancellation safely clear contacts.
- Nearby cues are bounded by corridor distance, at most two, with a visible hero attack-facing indication. Preserve surprise rather than exposing every monster.
- Save every started attempt independently. Starting B retains A. Resume selected attempts paused, retain hammer/upgrades/breaches/cores/monsters, export all run notes including chosen settings and feedback. Report unavailable storage honestly.
- Retain spooky layered audio, dormant directional hammer, portal lightning activation, and woods reward from D5.

## Scope and route

This is the first playable comparison set. Loop-island mazes and continuous stepped/castle boundaries remain subsequent layout investigations after controls settle; no invented verdict on those options.

Matt route: `~/.agents/skills/ask-matt/SKILL.md` wrapper, implement with tdd at the existing public NetherTrial/saved-Continue/input seams, then code-review Standards and Spec against `44dc6a7fa99a266ab863348a3bd6035983a05f5b`. Separate feature branch, non-fast-forward integration and recovery tag under the user's standing Git authority. Private Site update is a separate delivery action; retain earlier paths.

## Evidence boundary

Headless behavior, simulated gestures and browser visuals are separate evidence. Real iPad touch, audio and fun/fairness acceptance remain playtest questions.
