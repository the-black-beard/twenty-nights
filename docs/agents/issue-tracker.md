# Issue tracker: GitHub

Issues and specs live in `the-black-beard/twenty-nights`. Use the existing `gh` CLI connection and pass `-R the-black-beard/twenty-nights` explicitly for repository-scoped issue/PR commands.

- Read: `gh issue view NUMBER --comments -R the-black-beard/twenty-nights`.
- List: `gh issue list --state open --json number,title,body,labels -R the-black-beard/twenty-nights`.
- Create, comment, label or close only within the authorized task scope. For multiline text, write the exact body to a temporary file and use `--body-file`; do not interpolate shell substitutions.
- When a skill says publish to the issue tracker, create a GitHub issue after that action is authorized.
- When a skill says fetch a ticket, read its body, labels, dependencies and latest handover comments.
- Use native blocking dependencies where supported; otherwise record `Blocked by: #N` in the body. Do not claim a ticket until its blockers are complete.
- Later pull requests default to draft. PRs as a request surface: **no**.

Do not create labels or external tickets merely to finish this recovery. `docs/THREADS.md` is the recovered phase register; the private controller ledger is recovery status only, not an invented product decision source.
