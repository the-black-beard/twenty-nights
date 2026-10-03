# TN-A2 · Remote and automation

**Goal:** the repo lives on GitHub, CI runs, the game has a permanent public URL,
and automated committing has a safety net under it.

## Steps

1. **Authenticate.** `gh` 2.102 is installed and has never been logged in. The
   login is interactive, so the human runs it:
   ```bash
   gh auth login --web --scopes repo,workflow
   ```
2. **Create and push.** Public — decided deliberately, see "Why public" below.
   ```bash
   gh repo create the-black-beard/twenty-nights --public --source=. --push \
     --description "Build by day, hold the night. A woods survival game by ig-b-dynamix (8) and his dad."
   ```
3. **Confirm CI went green** on the first run (`gh run watch`). Four checks: the
   220 assertions, the twenty-day playthrough, a full rebuild from index.html
   alone, and the ADR-0004 guard that fails if an inline SVG or `data:` URI
   returns to the artifact build.
4. **Turn on GitHub Pages**, serving `dist/`. A Pages workflow should run
   `node tools/build.js` and publish `dist/`, so the public URL always matches
   `main`. That URL — roughly `the-black-beard.github.io/twenty-nights/` — is
   what ig-b-dynamix sends his friends from now on, instead of an artifact link.
5. **Add the git guardrails** (`git-guardrails-claude-code`) before any
   automated committing begins, not after. It blocks `push --force`,
   `reset --hard`, `clean`, `branch -D` and friends.

## Why public

No secrets in the repo, the account is pseudonymous, and Pages on the free tier
gives a permanent sign-in-free URL — which is the thing six days of artifact
sharing never managed. He is credited as ig-b-dynamix, the codename he chose himself; his
real first name appears nowhere. No surname, location, photo or contact details
appear either — but note that git AUTHOR METADATA is not file content and was
initially missed: the first attempt set a pseudonymous commit email while
leaving the real full name in `user.name`, so all seven commits carried it until
the history was rebuilt. The repo-local identity is now "The Black Beard".

## Done when

A friend can open a URL with no account and play, and a push that breaks the
game goes red before anyone notices.
