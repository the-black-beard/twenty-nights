# No inline SVG inside a data: URI

The page must not embed a raw `<svg>` document inside an attribute, as in
`<link rel="icon" href="data:image/svg+xml,<svg ...>">`. Use a base64 PNG
instead.

An emoji favicon written that way sat in the file from the first build. It is
invisible in normal use and the game worked perfectly — but it made the artifact
**impossible to share publicly**, because SVG can carry script and the
public-share check refuses the whole page over it. Finding this took six days
and a controlled experiment, after wrongly suspecting the file size, the
clipboard code, the form fields, the runtime capabilities and the artifact
itself. A trivial 1KB control page shared fine; a 1.2KB page whose only feature
was this favicon did not.

**Consequences**: `tools/build-artifact.js` strips `<link rel="icon">` from the
artifact build entirely and fails the build if one survives. An emoji favicon is
an obvious, tempting thing to add back. Don't.
