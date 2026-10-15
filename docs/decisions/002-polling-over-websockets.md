# 002 — Polling over WebSockets

**Status:** Accepted

## Context

The student ticket page and the stall board need to show updates as staff call and complete tickets.
The two main options for delivering updates to browsers are polling (the client requests on a timer) and WebSockets (a persistent bidirectional connection).
The team has five people, a single day to build, and a Node 20 + Express stack with no framework.

## Decision

We will use polling at a 2-second interval.
Every page that needs live data calls the relevant GET endpoint every 2 seconds and re-renders.

## Consequences

- No WebSocket server, connection lifecycle code, or reconnection logic is needed.
- Any page that is open gets reasonably fresh data within 2 seconds.
- Under 300 concurrent clients polling every 2 seconds, the server handles at most 150 requests per second — manageable for a LAN app with no internet traffic.
- Updates are not instantaneous. A student may see a delay of up to 2 seconds after staff take an action.
- If a client's browser tab is backgrounded, the browser may throttle the interval. This is acceptable for the MVP.
