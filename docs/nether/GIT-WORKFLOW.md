# Nether prototype Git workflow

The seven checkpoint commits reconstruct preserved source archives on 2026-10-23. They are not the original development chronology. Each checkpoint records the archive and HTML SHA-256 and the checks rerun during recovery.

`main` retains the original woods game at `65157e6dd4e61950d1656b90f8ff0283e89b9a53`. `integration/nether` combines the experimental Nether milestones. Candidate 1 alternatives remain selectable on their own branches and tags; candidate 2 descends from candidate 1. Integration is not human acceptance or publication.

This workflow supplies no new authority. Apply the user’s existing scoped Git authorization and repository rules; obtain separate authorization for actions outside that scope. A chosen remote or completed playtest alone is not authority to publish or advance main.

For each subsequent logical change:

1. Create a feature branch from the intended checkpoint or integration branch in a separate worktree. Record the ticket and intended behavior.
2. Implement and run focused tests, original woods regression checks, the 20-day playthrough (`node tools/playthrough.js`), and build. Obtain Standards and Spec review before committing.
3. Commit with a meaningful behavior description, push the branch to the approved remote, and preserve playable alternatives on separate branches.
4. Merge the reviewed change with `--no-ff` into `integration/nether`; push that branch. Tag each playable checkpoint. Do not merge every experiment into the selected game.
5. Advance original `main` only after actual human playtesting satisfies the project gate. The inherited Pages workflow publishes on pushes to `main`: pushing `main` is therefore a deployment-triggering action requiring publication authorization before that push. Site publication also remains separately authorized.

To compare an older version without altering current work:

```sh
git worktree add ../nether-comparison checkpoint/tn-d3-two-layer-candidate-2
```

To develop a different option:

```sh
git worktree add -b feature/alternative ../nether-alternative checkpoint/tn-d4-rectangular-candidate-2
```

Reverse changes with a reviewed revert commit, preserving history. For a merge, inspect its parents before selecting the mainline parent. Never force-push or reset shared history. Deployment rollback must separately select and publish the desired checkpoint.

Latest recovered HTML is Fourfold Maze candidate 2, SHA-256 `ba8f623bd3da9aa1bae1d2afe935f0291a6021f2008400503caf282e4c5591c6`. Its separately deployed Site source commit is `593b849ec383c195b32a54ba66bb6daf5c49e55f`. Physical iPad acceptance remains pending.

`checkpoints.json` records exact recovery commits, tags, hashes and validation. The user selected the recommended original repository on 2026-10-23. Recovery branches and checkpoint tags were pushed to `https://github.com/the-black-beard/twenty-nights.git`; verify remote SHAs when reporting later delivery. See `PLAY-COMPARISON.md` for playable locations and continuing Git authority.
