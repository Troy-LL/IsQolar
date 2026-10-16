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

  it("GET /phone.html print CSS shows the ticket code and course", async () => {
    const res = await fetch(`${url}/phone.html`);
    const html = await res.text();
    const printCss = html.slice(html.indexOf("@media print"));
    assert.match(printCss, /@media print/);
    assert.match(printCss, /ticket-code/);
    assert.match(printCss, /ticket-course/);
  });

  it("GET /ticket.html is not served", async () => {
    const res = await fetch(`${url}/ticket.html`);
    assert.equal(res.status, 404);
  });

  it("GET /phone.html prints a QR for this ticket phone page", async () => {
    const res = await fetch(`${url}/phone.html`);
    const html = await res.text();
    assert.match(html, /src="\/qrcode\.js"/);
    assert.doesNotMatch(html, /https?:\/\//);
    assert.match(html, /\/phone\.html\?id=/);
    const printCss = html.slice(html.indexOf("@media print"));
    assert.match(printCss, /ticket-qr/);
  });

  it("GET /qrcode.js is served from the hub", async () => {
    const res = await fetch(`${url}/qrcode.js`);
    assert.equal(res.status, 200);
  });

  it("GET /board.html returns 200", async () => {
    const res = await fetch(`${url}/board.html`);
    assert.equal(res.status, 200);
  });

  it("GET /checkin.html returns 200", async () => {
    const res = await fetch(`${url}/checkin.html`);
    assert.equal(res.status, 200);
  });

  it("GET /map.html returns 200 and links Queue and Chat", async () => {
    const res = await fetch(`${url}/map.html`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /href="\/prototype\/#student"/);
    assert.match(html, /href="\/chat\.html"/);
    assert.match(html, /href="\/prototype\/"/);
    assert.match(html, /Home/);
    assert.match(html, /Queue/);
    assert.match(html, /Chat/);
  });
});
