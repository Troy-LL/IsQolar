import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { app } from "./server.js";
import { getStore } from "./store.js";
import type { AddressInfo } from "node:net";
import type { GuardianStatus } from "./contract.js";

function startServer(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

describe("GET /api/guardian/:code", () => {
  let url: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    await getStore().reset();
    ({ url, close } = await startServer());
  });

  afterEach(async () => {
    await close();
  });

  it("returns GuardianStatus for the printed ticket code", async () => {
    const joinRes = await fetch(`${url}/api/tickets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ana Reyes", course: "BSCS" }),
    });
    assert.equal(joinRes.status, 201);
    const ticket = await joinRes.json() as { id: string; code: string; station: string };

    const res = await fetch(`${url}/api/guardian/${ticket.code}`);
    assert.equal(res.status, 200);
    const body = await res.json() as GuardianStatus;
    assert.deepEqual(body, {
      ticketId: ticket.id,
      station: "checkin",
      label: "Waiting at checkin",
    });

    const missing = await fetch(`${url}/api/guardian/0000`);
    assert.equal(missing.status, 404);
  });
});
