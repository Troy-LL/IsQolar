# 006 — Async Store interface, MemoryStore, and getStore()

**Status:** Accepted

## Context

The server needs to read and write tickets, stalls, and counters.
Multiple store backends are plausible: an in-process map works fine for a LAN day, but the Render deploy described in ADR 005 may eventually need a persistent store (e.g. Upstash Redis) without requiring every route to change.
The store is also a natural boundary for tests: replacing the in-process map with a test double should not require changes outside `store.ts`.

Additionally, a future hub JSON snapshot (task H1) will need to expose queue state from a different source.
That new store must slot into the existing routes without touching them.

## Decision

We define a single async `Store` interface in `src/store.ts`.
Every method that reads or writes data is `async` (returns `Promise<T>`), even when the current implementation is synchronous, so a remote store fits without touching callers.

`MemoryStore` is the concrete implementation used today: an in-process `Map` with no external dependencies.

`getStore()` is a module-level factory that returns the active `Store` singleton.
Routes import only `getStore()` and never construct a store directly.
Switching backends (e.g. `STORE=redis` for the Upstash adapter, task O1) requires a change only inside `store.ts`.

## Consequences

- `src/server.ts` and `src/seed.ts` call `await store.method()` uniformly; no sync/async mismatch.
- `MemoryStore` is fully exercised by `src/store.test.ts` without starting a server.
- The Render deploy (ADR 005) uses the same `MemoryStore` singleton by default; no extra wiring is needed at launch.
- A future hub JSON snapshot store (H1) implements `Store` and is passed to `getStore()` or selected via environment variable; routes are untouched.
- Adding a new store implementation requires: (1) implement the `Store` interface, (2) wire it in `getStore()`. No route changes.
