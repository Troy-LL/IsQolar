# Bob Metaprompt Template

A simple, fill-in-the-blank workflow for building a product with IBM Bob. Fill in the `[brackets]` and paste each prompt into Bob in order.

The workflow:

1. Research the problem and gather data online.
2. Give Bob the context, idea and vision of the product.
3. Build the MVP first, core features only.
4. Have Bob split the work by feature into subagents that run at the same time.
5. Keep Bob inside the feature scope so it does not build extras.
6. Ask Bob for a step-by-step deploy and full-stack walkthrough of each member's part.

---

## Step 1: Research (you do this before talking to Bob)

Write down what you found. Prompts 1 and 2 use these notes.

```
PROBLEM: [who is hurting, what goes wrong, how often]
DATA / SOURCES: [facts, numbers, links you found]
EXISTING SOLUTIONS: [what people use today and why it falls short]
USERS: [main user types, e.g. student, staff, parent]
```

---

## Prompt 1: Context and vision (Step 2)

```
You are building [PRODUCT NAME] for [EVENT / CLIENT].

PROBLEM: [1-3 sentences from your research]
WHO IT IS FOR: [user types and what each one needs]
VISION: [one sentence: what the finished product does for them]
RESEARCH NOTES: [key facts and data from Step 1]
TECH STACK: [e.g. Node + Express, plain HTML, deployed on Render]
REPO / FOLDER: [path], work only on branch [branch name]

Read this, then reply with a short summary of the problem and vision in
your own words, and list any questions. Do not write code yet.
```

---

## Prompt 2: MVP plan, subagents and scope (Steps 3, 4 and 5)

```
Build the MVP first. Only these core features:

1. [Feature A]: done when [what the user can do / test that passes]
2. [Feature B]: done when [...]
3. [Feature C]: done when [...]

OUT OF SCOPE (do not build): [nice-to-haves, extra pages, login, etc.]

How to work:
- Split the work by feature and create one subagent per feature.
- Subagent A: Feature A, files [list]
- Subagent B: Feature B, files [list]
- Subagent C: Feature C, files [list]
- Run them at the same time. Each subagent edits only its own files.
  Shared files ([e.g. styles.css, api contract]) are edited only by you,
  the main agent.

Scope rules:
- Build only what is listed above. Do not add features, pages, settings,
  or libraries that are not asked for.
- If something seems missing, stop and ask me instead of building it.
- Do not commit, push, or start a server unless I say so.

When all subagents finish: run [npm run check / tests], fix what fails,
then report in 5 lines: files changed, what each feature does, test
result, anything left undone, and "Waiting for review".
```

---

## Prompt 3: Deploy and full-stack walkthrough (Step 6)

```
Write a step-by-step tutorial for our team on how this product works
and how to deploy it. Plain words, numbered steps, one section per part:

1. [Part / Feature A], built by [member]: what it does, which files,
   how the frontend talks to the backend, how to run and test it locally.
2. [Part / Feature B], built by [member]: same.
3. [Part / Feature C], built by [member]: same.
4. Full stack flow: what happens from the user's click to the server
   and back, for one main action.
5. Deploy: exact steps to deploy on [Render / Vercel / etc.], env
   variables needed, how to check it is live, and common errors and fixes.

Do not change any code while writing this.
```

---

## Tips

- Keep the "done when" lines in Prompt 2 testable. That is what stops Bob from over-building.
- Do not type `@` in a prompt by accident. In Bob it attaches files as context.
- Run `/clear` before starting a new feature so Bob's old context does not mix in.
