# Domain docs

Layout: single-context. Before exploring a change, read `CONTEXT.md` and the ADRs touching that area in `docs/adr/`, then the phase brief in `docs/threads/`.

Use the glossary's names: Home, Night, Portal, Route, Neighbour, Doorway and Heart. Do not substitute gate for Doorway or confuse Hearts with the Home tile. B2 must rename the existing HEART tile identifier to HOME before introducing the Heart pool.

ADR-0007 amends the original forgiving contract: Easy retains the prior behavior; Normal/Hard share three Hearts across the run. ADR-0008 adds a walkable Doorway and leaves every Portal-to-Home Route invariant intact. A conflict with an ADR must be surfaced and resolved explicitly, not silently implemented.

Existing accepted ADRs are primary design sources. New unresolved meanings/decisions belong in the domain workflow; do not treat old chat recommendations as current authorization.
