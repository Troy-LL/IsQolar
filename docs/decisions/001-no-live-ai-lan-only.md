# 001 — No live AI; offline LAN by default, optional online deploy on day 2

**Status:** Accepted

## Context

The app runs at a venue where internet access is unreliable or unavailable.
Students, staff, and coordinators all operate on the venue LAN or a single laptop.
Using a live AI API would require an outbound internet connection and introduce latency, cost, and a dependency on an external service.

## Decision

**Default (day 1):** the app runs entirely on localhost or the venue LAN.
The app itself makes no outbound calls — no AI APIs, no external services, no internet required.
Bob (the AI coding assistant) is used only during development, never at runtime.

**Optional (day 2):** the same server may be deployed to Vercel for broader access.
Even when deployed online, the app makes no outbound calls and uses no live AI at runtime.
See the day-2 tasks in [docs/plan.md](../plan.md) and the forthcoming ADR 005 for deployment details.

## Consequences

- The app works with no internet signal inside the venue.
- Guests with phones on mobile data can still open `http://<laptop-ip>:3000` if they are on the LAN.
- An optional Vercel deploy (day 2) allows access from outside the venue without changing this decision.
- Guardian outbound sync (G2) — sharing a student's status to a phone outside the venue — is deferred to a future release because it requires an outbound connection.
- No AI-generated content or AI-driven logic appears to users at runtime.
