import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "./server.js";
import { getStore } from "./store.js";
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

describe("poll.js static asset", () => {
  let url: string;
  let close: () => Promise<void>;

  before(async () => {
    await getStore().reset();
    ({ url, close } = await startServer());
  });

  after(async () => {
    await close();
  });

  it("GET /poll.js returns 200 with a JavaScript content-type", async () => {
    const res = await fetch(`${url}/poll.js`);
    assert.equal(res.status, 200);
    const ct = res.headers.get("content-type") ?? "";
    assert.ok(
      ct.includes("javascript"),
      `expected content-type to include "javascript", got "${ct}"`
    );
  });
});
