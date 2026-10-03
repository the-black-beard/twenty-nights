# TN-B1 · Grill: stakes and the gate

**Goal:** settle two design decisions. Both reverse an existing ADR, so neither
should be implemented until it has been argued properly.

Run `/grill-with-docs`. This thread produces **decisions**, recorded as ADRs —
no game code.

## Decision 1 · Real failure

Dad wants: three hits to Home before game over on Normal, unlimited on Easy (as
today), none on Hard. Plus a failure screen that makes you want to play again.

**This reverses ADR-0001, the forgiving contract** — the day always advances,
Home is the only real loss, you never lose everything. That promise is from
ig-b-dynamix's original brief, when he was six.

Things to press on:
- It is his game. Has *ig-b-dynamix* been asked whether he wants to be able to lose?
  He plays on Normal, so he is the one this lands on.
- "None on Hard" means one hit ends a run, against Night-20 waves of 32 with a
  Wild Night on top. Is that a difficulty or a wall?
- Dad rates the game "slightly easy" where ig-b-dynamix says "just right". The two of
  you are not calibrated, and this decision is exactly where that bites.
- A failure screen that encourages replaying is a different artefact from the
  win screen. What does it show — how far you got, what killed you, one thing to
  try differently?

## Decision 2 · The sealed maze

An adult playtester found it frustrating that a wall ring cannot be closed. It
is the obvious move, the game refuses it, and the refusal feels arbitrary.

**ADR-0002 says Home can never be sealed**, and that invariant is what every
other mechanic rests on. Do not trade it away. The question is how to make the
refusal *legible* instead of arbitrary.

The option I'd take in first: **a Gate.** You *can* complete the ring, and the
last tile becomes a gate that stands open at dusk — because your fort needs a
way for *you* to get in and out. The invariant is untouched, the refusal becomes
a feature, and it hands the player a real strategic choice they currently never
make: *where* the way in goes. Dad's other candidates — a fast monster that
knocks a hole, a reward too good to refuse, trapping them deliberately — are all
worth putting against it.

## Done when

Two ADRs exist. One supersedes or amends 0001; one extends 0002 with the chosen
answer. TN-B2 then implements them.
