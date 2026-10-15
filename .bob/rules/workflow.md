# Workflow
- Never commit to main. Start every task on a new branch named <your-name>/<short-task>, for example ayen/join-page.
- When a task is done, commit, push, and open a pull request into main with the GitHub CLI: gh pr create --fill --base main.
- PR title: what changed, in plain words. PR body: what changed, how to test it, and which PRD item or ticket it covers.
- One task per PR. Keep it small enough to review in five minutes.
- Never merge your own PR. Troy merges.
- Never change src/contract.ts after 11:15 unless you are Troy. do this

## Checks

- Before opening a PR, run `npm run check`. If it fails, fix it before pushing.
- Every new endpoint or logic function gets at least one test in a `*.test.ts` file next to it.
- After opening a PR, turn on auto-merge: `gh pr merge --auto --squash --delete-branch`
- If CI fails on your PR, read only the failing step's log and fix that one thing. Do not re-review the whole repo.
- Do not run /review on your own PR. CI and Troy review it.
