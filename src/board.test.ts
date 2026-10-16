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

describe("board page", () => {
  let url: string;
  let close: () => Promise<void>;

  before(async () => {
    await getStore().reset();
    ({ url, close } = await startServer());
  });

  after(async () => {
    await close();
  });

  it("GET /board.html includes projector copy and poll targets", async () => {
    const res = await fetch(`${url}/board.html`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /IsQolar Live Board/);
    assert.match(html, /Now serving/);
    assert.match(html, /Tinatawag na/);
    assert.match(html, /Admission/);
    assert.match(html, /College \/ Department/);
    assert.match(html, /Medical/);
    assert.match(html, /Registration Card/);
    assert.match(html, /\/api\/stalls/);
    assert.match(html, /\/poll\.js/);
  });
});
