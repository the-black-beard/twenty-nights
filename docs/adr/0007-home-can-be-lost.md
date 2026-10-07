# Home can be lost

**Status**: accepted. ig-b-dynamix was asked, and has changed his mind.

Home has three Hearts for the whole run, not three per Night, and they do not
come back at dawn. When the third one goes the run ends, and a failure screen
says how far you got. The mason will mend one Heart, once per run, for stone.
Easy keeps exactly today's behaviour — three hits a Night, healed by morning, a
run that cannot be lost. Normal and Hard share the single pool of three.

## He was asked, and he no longer means it

ADR-0001 required any reversal to be "taken deliberately, with ig-b-dynamix",
so it was. He wants the game a bit harder, and the reason matters more than the
answer: it came from the feedback from his friends. He was six when he asked
never to lose everything, and eight when he watched other people play the thing
he made and decided it was too kind. That is not a grown-up talking a child into
stakes; it is a designer reading his own playtest.

This also closes the calibration gap TN-B1 was told to press on. Dad rated the
game "slightly easy" where ig-b-dynamix said "just right". He moved to Dad's
reading on his own, on evidence, which is a better outcome than either of them
winning the argument.

## Why this amends ADR-0001 rather than betraying it

ADR-0001's reasoning is not a principle. It is a prediction: *"a seven-year-old
who loses twenty minutes of work stops playing"*. The promise was made when he
was six, the justification was written about sevens, and the player is now
eight — most of his remembered life. A principle needs an argument to overturn.
A prediction only needs to have expired.

Half of ADR-0001 survives intact and should be quoted back at anyone who tries
to take it: **the day always advances**. Night 21 still arrives unless Home is
gone. A bad Night still costs a Pip and some rebuilding. What goes is only
*"you never lose everything"*.

## Considered options

- **Per-Night pool, healed at dawn** — today's behaviour. Declines the proposal.
- **Three lost Nights across the run**, counting the red Pips. Rejected on
  evidence from play: Home actually falling inside a single Night is rare enough
  that the rule would almost never fire, so it would look like stakes without
  being stakes.
- **Per-Night pool, but Home falling at all ends the run.** Rejected: one
  collapsed Night is survivable in every other respect, and this makes the
  cheapest mistake in the game terminal.
- **One pool of three for the whole run.** Chosen. It is the only option that
  actually changes how the game is played, because it makes a hit on Night 3
  still cost something on Night 18.

## Hard keeps three

The original proposal was none on Hard. Rejected for three reasons. ADR-0006
says difficulty comes from attention, not from the threat of losing, and the
threat of losing is precisely what this would be. Hard already turns six other
dials — `day:1, night:3, mobs:3, res:1, reach:1, mend:true` — so it burns the
same three Hearts far faster without needing fewer of them. And a single hit
from a Night-20 wave of forty or more, on a long blood-moon night, two hours
into a run, is a coin-flip at the finish line rather than a difficulty.

One number for the whole game — *"Home has three Hearts, for all twenty
nights"* — is also a sentence an eight-year-old can hold in his head.

Noted in passing: Hard's `res:1` (Scarce) already contradicts ADR-0006's
"avoid raising costs or shrinking supply". That is not this decision's problem,
but it should not be cited as evidence that Hard is well calibrated.

## A Heart can be won back, once, from the mason

One Heart, once per run, paid in stone, and only if you walk to the Village by
daylight. Every part of that is doing a job:

- **Stone**, because the mason is the stone Neighbour, and because stone is what
  walls are made of. Mending Home therefore costs you wall you wanted. That is
  a decision, not a tax.
- **Once per run** — not once per Night, and not a price that climbs. A cap is
  one rule a child can hold; an escalating price is arithmetic. It also creates
  the real choice: spend it early and be safe but spent, or hold it and risk
  losing before you use it.
- **You go to him, by day.** He does not come to you, and nothing is mended at
  night. The cost is a day not spent building, which is attention rather than
  scarcity, so this sits inside ADR-0006 rather than against it.
- **An angry Village will not mend.** `S.angry` already exists — stealing from
  the Neighbours leaves them cross for a number of days — so stealing now
  carries a late-run consequence it never had before. This needs no new code and
  should not be softened. It is the best thing the mend gives the Village.

The pool is therefore three Hearts, or four if you work for it. That keeps this
ADR harder than what it replaced while removing the one thing that would have
made it miserable: a careless Night 3 leaving the heart cracked and shivering
for seventeen more Nights with no way back.

Price it so it visibly costs a stretch of wall you wanted. The exact number is
a play-testing question, not a decision.

## Consequences

- **The heart's art changes meaning and has to carry more.** The cracks below
  three Hearts, the shiver at one, and the `"peril"` music currently say
  *tonight is going badly*. They will say *your run is nearly over*.
- **The red Pip is re-pointed.** It currently means "Home fell tonight, morning
  came anyway". It now means "this is the Night the run ended", so there is at
  most one per run and it is always the last filled square. The Brag Card
  therefore tells the story by itself: a row of golds and bronzes ending in red.
- **The failure screen is a different artefact from the win screen.** Its job is
  three things and not a fourth: how far you got, what finally did it, and one
  concrete thing to try differently. It must not rank, score or scold. The data
  it needs already exists — the Pip strip, `tn.far`, the kill and build counts,
  and the Night it happened on.
- **The feedback form cannot currently see any of this.** `FB_HARD` asks "too
  easy / just right / too hard" and has no way to report that losing felt bad.
  It needs a question about it, or the next round of playtests will not measure
  the thing this ADR changed.
- **`tools/playthrough.js` asserts the game is completable.** A game that can
  now be lost must still prove that, so the harness has to play well enough not
  to die. If that turns out to be hard to write, that is information about the
  difficulty, not about the harness.
- **This is the first change aimed at his friends rather than at him.** He is
  calibrating on other players now, which means the feedback form matters more
  than it did and "ig-b-dynamix says just right" is no longer the whole test.
