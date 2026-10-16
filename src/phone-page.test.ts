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

describe("phone and guardian pages", () => {
  let url: string;
  let close: () => Promise<void>;

  before(async () => {
    await getStore().reset();
    ({ url, close } = await startServer());
  });

  after(async () => {
    await close();
  });

  it("GET /phone.html contains empty-state and not-found copy", async () => {
    const res = await fetch(`${url}/phone.html`);
    const html = await res.text();
    assert.match(html, /No ticket found\. Check in first\./);
    assert.match(html, /Ticket not found\./);
  });

  it("GET /guardian.html sets readable body colors", async () => {
    const res = await fetch(`${url}/guardian.html`);
    const html = await res.text();
    assert.match(html, /#fff/);
    assert.match(html, /#1F1A1A/);
  });
});
