# 005 — Online mode runs on Render

**Status:** Accepted

## Context

Day 2 adds an online mode so a guardian or student outside the venue LAN can open the app.
Serverless hosts (Vercel, Cloudflare Workers) run short-lived functions, so the in-memory store would be lost between requests and we would need Redis or Durable Objects.
That adds a second service and a store adapter we do not have time to build well.

## Decision

We deploy the same Express server to a Render free web service as one long-lived Node process.
`MemoryStore` works unchanged. No Redis, no second service.
Build `npm ci --include=dev`, start `npm start`, port from `PORT`. Config lives in `render.yaml`.
Render auto-deploys on every merge to main.

## Consequences

- Online mode is one deploy and a public `onrender.com` URL.
- The free instance sleeps after about 15 minutes idle and takes up to a minute to wake. Open the URL before any demo.
- State resets on each redeploy or restart. Fine for a demo; persistence stays with the hub (H1).
- The hub and the online deploy are separate instances with separate state. Pick one per demo beat.
- The app still makes no outbound calls and runs no live AI (ADR 001).
