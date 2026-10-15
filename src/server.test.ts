import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { app } from "./server.js";
import { reset, setStall } from "./store.js";
import type { Stall } from "./contract.js";
import type { AddressInfo } from "node:net";

function startServer(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://localhost:${port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

async function json<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

describe("IsQolar server", () => {
  let url: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    reset();
    setStall({ id: "BSCS-1", name: "BS Computer Science — Stall 1", department: "IT & CS", activeInterviewers: 1, queueLength: 0, nowServing: null });
    ({ url, close } = await startServer());
  });

  it("GET /health returns ok", async () => {
    const res = await fetch(`${url}/health`);
    assert.equal(res.status, 200);
    const body = await json<{ ok: boolean }>(res);
    assert.equal(body.ok, true);
    await close();
  });

  it("full journey: join → done through every station → enrolled", async () => {
    const joinRes = await fetch(`${url}/api/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ana Reyes", course: "BSCS" }),
    });
    assert.equal(joinRes.status, 201);
    const ticket = await json<{ id: string; station: string; code: string }>(joinRes);
    assert.equal(ticket.station, "checkin");
    assert.match(ticket.code, /^\d{4}$/);

    const stations = ["checkin", "docs", "validation", "main", "stall", "enrolled"];
    let id = ticket.id;
    for (let i = 0; i < stations.length - 1; i++) {
      const doneRes = await fetch(`${url}/api/tickets/${id}/done`, { method: "POST" });
      assert.equal(doneRes.status, 200);
      const updated = await json<{ station: string; stall: string | null }>(doneRes);
      assert.equal(updated.station, stations[i + 1]);
      if (stations[i + 1] === "stall") {
        assert.equal(typeof updated.stall, "string");
      }
    }

    await close();
  });

  it("POST /api/stalls/:stall/next calls oldest waiting ticket", async () => {
    const joinRes = await fetch(`${url}/api/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ben Santos", course: "BSCS" }),
    });
    const ticket = await json<{ id: string }>(joinRes);

    const stations = ["checkin", "docs", "validation", "main"];
    for (let i = 0; i < stations.length; i++) {
      await fetch(`${url}/api/tickets/${ticket.id}/done`, { method: "POST" });
    }

    const nextRes = await fetch(`${url}/api/stalls/BSCS-1/next`, { method: "POST" });
    assert.equal(nextRes.status, 200);
    const called = await json<{ status: string; calledAt: string | null }>(nextRes);
    assert.equal(called.status, "called");
    assert.notEqual(called.calledAt, null);

    await close();
  });

  it("POST /api/tickets/:id/undo reverts last move", async () => {
    const joinRes = await fetch(`${url}/api/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Cara Lim", course: "BSCS" }),
    });
    const ticket = await json<{ id: string; station: string }>(joinRes);
    assert.equal(ticket.station, "checkin");

    await fetch(`${url}/api/tickets/${ticket.id}/done`, { method: "POST" });

    const undoRes = await fetch(`${url}/api/tickets/${ticket.id}/undo`, { method: "POST" });
    assert.equal(undoRes.status, 200);
    const reverted = await json<{ station: string }>(undoRes);
    assert.equal(reverted.station, "checkin");

    await close();
  });

  it("POST /api/stalls/:stall/next returns 404 when queue is empty", async () => {
    const res = await fetch(`${url}/api/stalls/BSCS-1/next`, { method: "POST" });
    assert.equal(res.status, 404);
    await close();
  });

  it("estWaitMin defaults to 3 minutes per position when no history", async () => {
    for (let i = 0; i < 3; i++) {
      const joinRes = await fetch(`${url}/api/tickets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: `Student ${i}`, course: "BSCS" }),
      });
      const t = await json<{ id: string }>(joinRes);
      const stationCount = 4;
      for (let j = 0; j < stationCount; j++) {
        await fetch(`${url}/api/tickets/${t.id}/done`, { method: "POST" });
      }
    }

    const listRes = await fetch(`${url}/api/stalls/BSCS-1/queue`);
    const queue = await json<Array<{ id: string }>>(listRes);
    assert.ok(queue.length >= 2);

    const detailRes = await fetch(`${url}/api/tickets/${queue[1].id}`);
    const detail = await json<{ position: number; estWaitMin: number }>(detailRes);
    assert.equal(detail.position, 2);
    assert.equal(detail.estWaitMin, 6);

    await close();
  });
});

describe("POST /api/admin/seed", () => {
  let url: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    reset();
    ({ url, close } = await startServer());
  });

  it("seeds 3 stalls and GET /api/stalls returns them", async () => {
    const seedRes = await fetch(`${url}/api/admin/seed`, { method: "POST" });
    assert.equal(seedRes.status, 200);
    const summary = await json<{ byStation: Record<string, number> }>(seedRes);
    assert.ok("byStation" in summary);

    const stallsRes = await fetch(`${url}/api/stalls`);
    assert.equal(stallsRes.status, 200);
    const stalls = await json<Stall[]>(stallsRes);
    assert.equal(stalls.length, 3);

    await close();
  });
});

describe("POST /api/tickets/:id/done 409 — no stall for course", () => {
  let url: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    reset();
    // No stalls at all — any advance to "stall" station must 409
    ({ url, close } = await startServer());
  });

  it("returns 409 when no stall matches the course", async () => {
    const joinRes = await fetch(`${url}/api/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "No-Stall Student", course: "BSCS" }),
    });
    const ticket = await json<{ id: string }>(joinRes);

    // Advance checkin → docs → validation → main (3 done calls)
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${url}/api/tickets/${ticket.id}/done`, { method: "POST" });
      assert.equal(res.status, 200);
    }

    // Next would be main → stall, but no stall exists → 409
    const doneRes = await fetch(`${url}/api/tickets/${ticket.id}/done`, { method: "POST" });
    assert.equal(doneRes.status, 409);
    const body = await json<{ error: string }>(doneRes);
    assert.equal(body.error, "no stall for course");

    await close();
  });
});
