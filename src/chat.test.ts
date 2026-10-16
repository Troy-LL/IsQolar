import { describe, it, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { buildSystemPrompt, chat, sanitizeLinks, GROQ_URL } from "./chat.js";
import { app } from "./server.js";

const KEY = "gsk_test_secret_value_123";
const ok = { messages: [{ role: "user", content: "Saan yung S508?" }] };

function mockFetch(status: number, payload: unknown, seen?: { url?: string; auth?: string }): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    if (seen) {
      seen.url = String(url);
      seen.auth = (init?.headers as Record<string, string>).Authorization;
    }
    return new Response(JSON.stringify(payload), { status });
  }) as typeof fetch;
}

describe("chat", () => {
  const saved = process.env.GROQ_API_KEY;
  afterEach(() => {
    if (saved === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = saved;
  });

  it("200 returns the reply and sends the key only upstream", async () => {
    process.env.GROQ_API_KEY = KEY;
    const seen: { url?: string; auth?: string } = {};
    const out = await chat(ok, mockFetch(200, { choices: [{ message: { content: "Open /map.html?room=S508" } }] }, seen));
    assert.equal(out.status, 200);
    assert.equal(out.body.reply, "Open /map.html?room=S508");
    assert.equal(seen.url, GROQ_URL);
    assert.equal(seen.auth, `Bearer ${KEY}`);
    assert.ok(!JSON.stringify(out).includes(KEY));
  });

  it("503 when the key is missing", async () => {
    delete process.env.GROQ_API_KEY;
    const out = await chat(ok, mockFetch(200, {}));
    assert.equal(out.status, 503);
  });

  it("400 on bad input", async () => {
    process.env.GROQ_API_KEY = KEY;
    const f = mockFetch(200, {});
    assert.equal((await chat({}, f)).status, 400);
    assert.equal((await chat({ messages: [{ role: "system", content: "x" }] }, f)).status, 400);
    assert.equal((await chat({ messages: [{ role: "user", content: "a".repeat(2001) }] }, f)).status, 400);
    const many = Array.from({ length: 21 }, () => ({ role: "user", content: "hi" }));
    assert.equal((await chat({ messages: many }, f)).status, 400);
  });

  it("502 on upstream failure without leaking the key", async () => {
    process.env.GROQ_API_KEY = KEY;
    const out = await chat(ok, mockFetch(500, { error: { message: `bad key ${KEY}` } }));
    assert.equal(out.status, 502);
    assert.ok(!JSON.stringify(out).includes(KEY));
    const thrown = await chat(ok, (async () => { throw new Error(KEY); }) as typeof fetch);
    assert.equal(thrown.status, 502);
    assert.ok(!JSON.stringify(thrown).includes(KEY));
  });

  it("retries once on 429 or 5xx, then gives up", async () => {
    process.env.GROQ_API_KEY = KEY;
    const seq = (statuses: number[]) => {
      let i = 0;
      const f = (async () => {
        const st = statuses[Math.min(i++, statuses.length - 1)];
        return new Response(JSON.stringify(st === 200 ? { choices: [{ message: { content: "ok" } }] } : {}), { status: st });
      }) as typeof fetch;
      return { f, calls: () => i };
    };
    const a = seq([429, 200]);
    assert.equal((await chat(ok, a.f)).status, 200);
    assert.equal(a.calls(), 2);
    const b = seq([503, 500, 200]);
    assert.equal((await chat(ok, b.f)).status, 502);
    assert.equal(b.calls(), 2);
    const c = seq([401, 200]);
    assert.equal((await chat(ok, c.f)).status, 502);
    assert.equal(c.calls(), 1);
  });

  it("drops room links for unknown codes", () => {
    assert.equal(sanitizeLinks("/map.html?room=Z999"), "/map.html");
    assert.equal(sanitizeLinks("/map.html?room=S508"), "/map.html?room=S508");
  });
});

describe("chat page", () => {
  let url: string;
  let server: ReturnType<typeof app.listen>;
  before(async () => {
    await new Promise<void>((r) => { server = app.listen(0, () => r()); });
    url = `http://localhost:${(server.address() as AddressInfo).port}`;
  });
  after(async () => { await new Promise((r) => server.close(() => r(null))); });

  it("GET /chat.html returns 200", async () => {
    const res = await fetch(`${url}/chat.html`);
    assert.equal(res.status, 200);
  });

  it("POST /api/chat without a key returns 503", async () => {
    const saved = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    const res = await fetch(`${url}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ok) });
    if (saved !== undefined) process.env.GROQ_API_KEY = saved;
    assert.equal(res.status, 503);
  });

  it("names courses from quoted college names and skips hidden floors", () => {
    const prompt = buildSystemPrompt();
    assert.match(prompt, /Interior Design/);
    assert.match(prompt, /Tourism Management/);
    assert.match(prompt, /Transportation Management/);
    assert.doesNotMatch(prompt, /Psychology Building/);
  });
});
