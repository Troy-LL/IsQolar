import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MemoryStore, type Store, type StoredTicket } from "./store.js";

// Compile-time check: MemoryStore satisfies the Store interface.
const _typeCheck: Store = new MemoryStore();
void _typeCheck;

describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(async () => {
    store = new MemoryStore();
    // Seed one BSCS stall so the stall station can be reached.
    await store.setStall({
      id: "BSCS-1",
      name: "BS Computer Science - Stall 1",
      department: "IT & CS",
      activeInterviewers: 1,
      queueLength: 0,
      nowServing: null,
    });
  });

  it("satisfies Store interface (runtime check)", () => {
    const methods: Array<keyof Store> = [
      "reset",
      "seed",
      "nextCode",
      "getTickets",
      "getTicket",
      "setTicket",
      "getStalls",
      "getStall",
      "setStall",
      "nextStation",
      "recordCompletion",
      "avgServiceMin",
      "stallQueueLength",
      "ticketPositionAtStall",
      "pickStallForCourse",
    ];
    for (const m of methods) {
      assert.ok(m in store, `MemoryStore missing method: ${m}`);
    }
  });

  it("create-ticket → call-next → mark-done round trip", async () => {
    // 1. Create a ticket
    const code = await store.nextCode();
    const ticket: StoredTicket = {
      id: "test-id-1",
      code,
      name: "Ana Reyes",
      course: "BSCS",
      station: "checkin",
      stall: null,
      status: "waiting",
      simulated: false,
      createdAt: new Date().toISOString(),
      calledAt: null,
      previous: null,
      completedAt: null,
    };
    await store.setTicket(ticket);

    // Advance checkin → docs → validation → main → stall
    let current: StoredTicket = ticket;
    for (let i = 0; i < 4; i++) {
      const next = store.nextStation(current.station);
      assert.ok(next !== null, `nextStation returned null at ${current.station}`);
      let assignedStall: string | null = current.stall;
      if (next === "stall") {
        const stallObj = await store.pickStallForCourse(current.course);
        assert.ok(stallObj !== null, "pickStallForCourse returned null");
        assignedStall = stallObj.id;
      }
      const advanced: StoredTicket = { ...current, station: next, stall: assignedStall, previous: null };
      await store.setTicket(advanced);
      current = advanced;
    }

    assert.equal(current.station, "stall");
    assert.equal(current.stall, "BSCS-1");

    // 2. Call-next: mark ticket as "called"
    const called = { ...current, status: "called" as const, calledAt: new Date().toISOString() };
    await store.setTicket(called);
    const fetched = await store.getTicket("test-id-1");
    assert.ok(fetched !== undefined);
    assert.equal(fetched.status, "called");
    assert.ok(fetched.calledAt !== null);

    // 3. Mark-done: record completion and advance to "enrolled"
    const duration = 90_000; // 90 seconds
    await store.recordCompletion("BSCS-1", duration);
    const avg = await store.avgServiceMin("BSCS-1");
    assert.equal(avg, 2); // ceil(90000 / 60000) = 2

    const next = store.nextStation("stall");
    assert.equal(next, "enrolled");
    const done = { ...called, station: next!, status: "waiting" as const, completedAt: new Date().toISOString() };
    await store.setTicket(done);
    const enrolled = await store.getTicket("test-id-1");
    assert.ok(enrolled !== undefined);
    assert.equal(enrolled.station, "enrolled");
  });
});
