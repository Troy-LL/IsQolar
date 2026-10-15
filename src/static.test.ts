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

describe("static pages", () => {
  let url: string;
  let close: () => Promise<void>;

  before(async () => {
    await getStore().reset();
    ({ url, close } = await startServer());
  });

  after(async () => {
    await close();
  });

  it("GET /staff.html returns 200", async () => {
    const res = await fetch(`${url}/staff.html`);
    assert.equal(res.status, 200);
  });

  it("GET /phone.html returns 200", async () => {
    const res = await fetch(`${url}/phone.html`);
    assert.equal(res.status, 200);
  });

  it("GET /board.html returns 200", async () => {
    const res = await fetch(`${url}/board.html`);
    assert.equal(res.status, 200);
  });
});
