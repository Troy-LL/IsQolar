import { randomUUID } from "node:crypto";
import { reset, setStall, setTicket, nextCode } from "./store.js";
import type { StoredTicket } from "./store.js";

reset();

setStall({ id: "BSCS-1", name: "BS Computer Science — Stall 1", department: "IT & CS", activeInterviewers: 1, queueLength: 0, nowServing: null });
setStall({ id: "BSIT-1", name: "BS Information Technology — Stall 1", department: "IT & CS", activeInterviewers: 1, queueLength: 0, nowServing: null });
setStall({ id: "BSEE-1", name: "BS Electrical Engineering — Stall 1", department: "Engineering", activeInterviewers: 1, queueLength: 0, nowServing: null });

const students = [
  { name: "Ana Reyes", course: "BSCS" },
  { name: "Ben Santos", course: "BSIT" },
  { name: "Cara Lim", course: "BSCS" },
  { name: "Dan Cruz", course: "BSEE" },
  { name: "Eva Tan", course: "BSIT" },
];

for (const s of students) {
  const ticket: StoredTicket = {
    id: randomUUID(),
    code: nextCode(),
    name: s.name,
    course: s.course,
    station: "checkin",
    stall: null,
    status: "waiting",
    simulated: true,
    createdAt: new Date().toISOString(),
    calledAt: null,
    previous: null,
    completedAt: null,
  };
  setTicket(ticket);
}

console.log("Seed complete: 3 stalls, 5 tickets.");
