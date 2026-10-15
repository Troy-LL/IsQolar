# Workflow
- Never commit to main. Start every task on a new branch named <your-name>/<short-task>, for example ayen/join-page.
- When a task is done, commit, push, and open a pull request into main with the GitHub CLI: gh pr create --fill --base main.
- PR title: what changed, in plain words. PR body: what changed, how to test it, and which PRD item or ticket it covers.
- One task per PR. Keep it small enough to review in five minutes.
- Before opening the PR, append one line to docs/bob-log.md: time, your name, the task, and the PR link.
- Never merge your own PR. Troy merges.
- Never change src/contract.ts after 11:15 unless you are Troy. do this
