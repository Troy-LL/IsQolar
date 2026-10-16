import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileStore, type StoredTicket } from "./store.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "isqolar-hubfile-test-"));
}

const stall = {
  id: "BSCS-1",
  name: "BS Computer Science - Stall 1",
  department: "IT & CS",
  activeInterviewers: 1,
  queueLength: 0,
  nowServing: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FileStore", () => {
  const dirs: string[] = [];

  after(() => {
    for (const d of dirs) {
      try { rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });

  it("new FileStore on a missing file has loadedFromFile false", () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const store = new FileStore(join(dir, "hub-state.json"));
    assert.equal(store.loadedFromFile, false);
  });

  it("second FileStore on an existing file restores all state", async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const path = join(dir, "hub-state.json");

    // Build state in the first store.
    const store1 = new FileStore(path);
    assert.equal(store1.loadedFromFile, false);

    await store1.setStall(stall);

    const code = await store1.nextCode();
    const ticket: StoredTicket = {
      id: "t1",
      code,
      name: "Ana Reyes",
      course: "BSCS",
      station: "stall",
      stall: "BSCS-1",
      status: "called",
      simulated: false,
      createdAt: new Date().toISOString(),
      calledAt: new Date().toISOString(),
      previous: {
        id: "t1",
        code,
        name: "Ana Reyes",
        course: "BSCS",
        station: "main",
        stall: null,
        status: "waiting",
        simulated: false,
        createdAt: new Date().toISOString(),
        calledAt: null,
      },
      completedAt: null,
    };
    await store1.setTicket(ticket);
    await store1.recordCompletion("BSCS-1", 120_000); // 2 minutes

    // Second store loads the file.
    const store2 = new FileStore(path);
    assert.equal(store2.loadedFromFile, true);

    // Tickets survive including status and previous.
    const tickets = await store2.getTickets();
    assert.equal(tickets.length, 1);
    assert.equal(tickets[0].status, "called");
    assert.ok(tickets[0].previous !== null);
    assert.equal(tickets[0].previous!.station, "main");

    // Stalls survive.
    const stalls = await store2.getStalls();
    assert.equal(stalls.length, 1);
    assert.equal(stalls[0].id, "BSCS-1");

    // avgServiceMin survives.
    const avg = await store2.avgServiceMin("BSCS-1");
    assert.equal(avg, 2); // ceil(120000 / 60000)

    // Next code continues (not reset to 0001).
    const nextCode = await store2.nextCode();
    assert.notEqual(nextCode, "0001");
    assert.equal(nextCode, "0002"); // counter was 1, so next is 2
  });

  it("broken JSON gives loadedFromFile false and leaves a .bad file", () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const path = join(dir, "hub-state.json");
    writeFileSync(path, "{ not valid json !!!", "utf8");

    const store = new FileStore(path);
    assert.equal(store.loadedFromFile, false);

    // The bad file must be renamed, not deleted.
    assert.equal(existsSync(path), false, "original file should be gone");
    assert.equal(existsSync(path + ".bad"), true, ".bad file should exist");
  });

  it("valid JSON with missing completionTimes gives loadedFromFile false and leaves a .bad file", async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const path = join(dir, "hub-state.json");
    // Valid JSON, correct version/counter/arrays, but completionTimes is absent.
    writeFileSync(
      path,
      JSON.stringify({ version: 1, ticketCounter: 3, tickets: [], stalls: [] }),
      "utf8"
    );

    const store = new FileStore(path);
    assert.equal(store.loadedFromFile, false);

    // The bad file must be renamed, not deleted.
    assert.equal(existsSync(path), false, "original file should be gone");
    assert.equal(existsSync(path + ".bad"), true, ".bad file should exist");

    // Store must be empty — no half-loaded state.
    const tickets = await store.getTickets();
    assert.equal(tickets.length, 0);
  });
});
