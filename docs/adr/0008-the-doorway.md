# The Doorway

You may now complete a ring. The last gap is filled with a **Doorway** — a thing
you walk over, not into — so the wall closes and the Route still runs through it.

**ADR-0002 is not relaxed, amended or special-cased.** With a Doorway in the
wall there genuinely is a Route from every Portal to Home, so `sealsHeart` keeps
returning the literal truth. The code already has the category this needs:
`isFloor` marks walkable structures, and `canPlace` already short-circuits with
*"floor traps never block, so never seal"*. A Doorway is a new member of that
family. The invariant is enforced by the same arithmetic as before.

## Why the name is Doorway

Not **Gate**: `CONTEXT.md` already lists "gate" under **Portal**'s _Avoid_, and
the hole monsters come out of must never share a word with the hole they come in
through. That is the one confusion this game cannot afford.

Not **Door**: a door is a thing that shuts. Naming it Door sets up the exact
expectation ADR-0002 forbids forever, and the first question would be "can I
close mine?".

A doorway is by definition something that cannot be closed, so the noun teaches
the rule. The player it has to teach plays Minecraft, where the hero is also
called Steve, and already knows that a walled base has a way in and that things
come through it.

## Considered options

- **Refuse the placement** — today's behaviour, and the games industry's
  standard "anti-block" rule for maze defence. Rejected: it is the reported
  frustration, and the current bark makes it worse by blaming the monsters
  (*"Monsters need one path!"*), so the game appears to be refusing on their
  behalf rather than for the player's own good.
- **Let monsters walk through the weakest wall as if it were open ground** — the
  other standard anti-block implementation. Rejected: it collides head-on with
  Chewers, whose entire job is eating walls, and "I built a wall and they
  ignored it" reads as a bug to a child rather than as a rule.
- **A gate that shuts against monsters**, as in Factorio, where gates open for
  the player and stay closed to enemies so no defensive power is lost. Rejected:
  this is sealing with extra steps, and it is the precise thing ADR-0002 exists
  to prevent. Expect it to be requested anyway. The answer is no, permanently.
- **A fast monster that knocks a hole in a sealed ring**, or **a reward too good
  to refuse**, or **letting the player trap themselves deliberately**. Rejected:
  the first two turn the single invariant the design rests on into a spawn-rate
  balance problem, where one creature failing to appear breaks the whole game.
  The third teaches the lesson once, at the cost of a run, and on Easy there is
  no run to cost.
- **Name the gap that already exists** and change no mechanics. Cheapest, and
  strictly the most truthful, since the gap is already load-bearing. Rejected
  because it does not let the player close the ring, which was the complaint.

## Consequences

- **The refusal does not disappear. It moves** — from the last tile of a ring,
  where it is arbitrary, to the player's own Doorway when it is the only one,
  where it is obvious. *"That's your only way in"* is a refusal a child accepts.
  This is what ADR-0002 meant by making the refusal legible.
- **The fiction is literally true, not a cover story.** `walkable` excludes
  walls and the hero paths over the same predicate, so Steve really is shut out
  by his own ring. Without a Doorway he is walled away from the trees, the
  berries and the Village — and the Village is the only place to trade.
- **It hands the player a decision they currently never make**: where the way in
  goes. That is the strategic gain, and it is the reason to prefer this over
  simply naming the existing gap.
- **No limit on how many you build.** More Doorways means a shorter Route, which
  is punishment enough without a rule.
- **A Chewer flattens a Doorway in one bite**, as it does other walk-over
  structures, leaving grass behind — still walkable, still no seal. Nothing
  downstream needs a special case.
- **The bark has to change.** It must describe the player's own need, not the
  monsters'. Something in the shape of *"That's your way in — they can use it
  too."*
