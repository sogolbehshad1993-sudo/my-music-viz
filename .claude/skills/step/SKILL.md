---
name: step
description: Commit, undo, restore, compare or favourite steps of an experiment with git. Use when the designer says undo that, go back, bring back the earlier version, compare with before, or keep this one.
---

# Steps

Every step is a commit and nothing is ever reset or rewritten, so any earlier look can come back. Commits are pre-approved in this repo; pushing is not.

- **Commit a step:** `git add -A && git commit -m "feat(<scene>): <what changed>"`. Add a body with the designer's words when they explained why. Baked panel values: `tune(<scene>): keep panel values`.
- **Undo the last step:** `git revert --no-edit HEAD`.
- **Undo an older step:** find it with `git log --oneline -15 -- src/scenes/<scene>.ts`, then `git revert --no-edit <sha>`. If later steps touched the same lines, resolve by hand, and ask when the intent is unclear.
- **Go back to an earlier look:** `git checkout <sha> -- src/scenes/<scene>.ts`, then commit `revert(<scene>): back to <sha or tag>`.
- **Compare A/B:** `git show <sha>:src/scenes/<scene>.ts > src/scenes/<scene>-was.ts`. The designer flips between the two with the scene dropdown. Delete the copy once they decide.
- **Favourite:** `git tag <scene>/<label>` (for example `orb/blue-glow`) and note it in `memory/experiments.md`. List them with `git tag -l '<scene>/*'`.
- **Two directions at once:** only when the designer wants both to keep evolving, offer a branch per direction (ask first).
