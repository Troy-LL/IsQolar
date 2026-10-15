# 003 — Contract freezes at 11:15

**Status:** Accepted

## Context

Five people are building separate tracks simultaneously against the same data shapes and endpoints.
If any person changes the contract mid-build, other tracks break silently.
The contract is defined in [src/contract.ts](../../src/contract.ts).
The original PRD referenced `docs/contract.md`; that file is superseded and was never created.
The single authoritative contract is `src/contract.ts`.

## Decision

We will freeze `src/contract.ts` at 11:15 on October 15, 2026.
After 11:15, only the project manager (Troy) may make changes to `src/contract.ts`.
Any proposed change must be communicated to the full team before it is applied.

## Consequences

- All five tracks can build against stable types and endpoint shapes from 11:15 onward.
- A post-freeze change requires the project manager to notify every track and check for breakage.
- Bob agents must not edit `src/contract.ts` after 11:15 unless they are acting as the project manager. See [AGENTS.md](../../AGENTS.md).
