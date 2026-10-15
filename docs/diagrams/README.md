# Diagrams

The mermaid source in this folder is the picture. `img/` is where a rendered copy will go later. A rendered image has to match the mermaid file with the same name. `img/` is empty until those renders exist.

| File | What it shows | Source of truth |
|---|---|---|
| [task-graph.md](task-graph.md) | Every queue task and every RT task, who owns it, and what it waits on. Tonight and tomorrow morning are separate bands. Milestone nodes mark 11:00, 12:30, and 2:00. Held tasks are dashed. | Task text, owners, and clocks: [../delegation.md](../delegation.md). Original task list: [../plan.md](../plan.md) and [../plan-room-tba.md](../plan-room-tba.md). Where those disagree, delegation.md wins. |
| [system.md](system.md) | Pages, endpoints, the store, static location files, the LAN hub, Render, and 2 second polling. | [../architecture.md](../architecture.md), [../../src/contract.ts](../../src/contract.ts), [../../src/server.ts](../../src/server.ts), [../../src/store.ts](../../src/store.ts), [../../public/poll.js](../../public/poll.js), [../../render.yaml](../../render.yaml). Pages and JSON files that are not in the repo yet are labeled with the task that adds them. |
| [user-flow.md](user-flow.md) | A freshman from check-in through each station to the enrolled line, then Find your classes, then a Room TBA search, then a pin. | Station order and endpoints: [../architecture.md](../architecture.md) and [../../src/contract.ts](../../src/contract.ts). The enrolled sentence is `BRAND.enrolledFinal`. The map steps are RT8, RT3, and RT5 in [../delegation.md](../delegation.md). |

The same task graph is also in [../delegation.md](../delegation.md). If the two mermaid blocks differ, fix task-graph.md to match delegation.md.
