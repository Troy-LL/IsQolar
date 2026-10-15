# 001 — No live AI, LAN only

**Status:** Accepted

## Context

The app runs at a venue where internet access is unreliable or unavailable.
Students, staff, and coordinators all operate on the venue LAN or a single laptop.
Using a live AI API would require an outbound internet connection and introduce latency, cost, and a dependency on an external service.

## Decision

We will run the app entirely on localhost or the venue LAN with no outbound internet calls.
We will make no live AI API calls at runtime, in any part of the system.
Bob (the AI coding assistant) is used only during development, never at runtime.

## Consequences

- The app works with no internet signal inside the venue.
- Guests with phones on mobile data can still open `http://<laptop-ip>:3000` if they are on the LAN.
- Guardian outbound sync (G2) — sharing a student's status to a phone outside the venue — is deferred to a future release because it requires an outbound connection.
- No AI-generated content or AI-driven logic appears to users at runtime.
