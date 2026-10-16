import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_MODEL = "openai/gpt-oss-20b";
export const MAX_MESSAGES = 20;
export const MAX_CHARS = 2000;
export const TIMEOUT_MS = 15000;
export const RETRY_DELAY_MS = 500;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DemoQa {
  id: string;
  feature: string;
  question: string;
  answer: string;
  link?: string;
}

interface RoomEntry {
  building: string;
  floor: string;
  label: string;
  kind: string;
  source: string;
}

interface FloorEntry {
  id: string;
  building: string;
  floor: string;
  label: string;
  hidden?: boolean;
}

function collectCodes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const n of node) collectCodes(n, out);
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "code" && typeof v === "string") out.add(v.toUpperCase());
      else collectCodes(v, out);
    }
  }
}

function loadJson(rel: string): unknown {
  try {
    return JSON.parse(readFileSync(join(__dirname, rel), "utf8"));
  } catch {
    return null;
  }
}

function loadText(rel: string): string {
  try {
    return readFileSync(join(__dirname, rel), "utf8");
  } catch {
    return "";
  }
}

const roomCodes = new Set<string>();
collectCodes(loadJson("../data/paths.json"), roomCodes);
const demoQa = (loadJson("../public/chat/demo-qa.json") as DemoQa[] | null) ?? [];
const roomsData = (loadJson("../docs/floorplans/rooms.json") as RoomEntry[] | null) ?? [];
const floorsData = (loadJson("../data/floors.json") as FloorEntry[] | null) ?? [];

function csvFields(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  const text = line.replace(/\r$/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

function parseCourses(csv: string): string {
  const lines = csv.split("\n").slice(1).filter((l) => l.trim());
  const colleges = new Map<string, { name: string; courses: string[] }>();
  for (const line of lines) {
    const cols = csvFields(line);
    const acronym = cols[1]?.trim();
    const unitName = cols[2]?.trim();
    const courseName = cols[5]?.trim();
    if (!acronym || !unitName || !courseName) continue;
    const college = colleges.get(acronym);
    if (college) college.courses.push(courseName);
    else colleges.set(acronym, { name: unitName, courses: [courseName] });
  }
  return [...colleges.entries()]
    .map(([acr, c]) => `${c.name} (${acr}): ${c.courses.join(", ")}`)
    .join("\n");
}

/** Build compact room reference: code -> label (floor, building). */
function buildRoomReference(): string {
  // Map from short code (e.g. S508) to label and location
  const byCode = new Map<string, { label: string; floor: string; building: string }>();

  // First pass: use rooms.json entries that have a room code in the label
  for (const r of roomsData) {
    const m = /\(([NESW]\d{3}[A-Z]?)\)/.exec(r.label);
    if (m) {
      const code = m[1].toUpperCase();
      if (!byCode.has(code)) {
        byCode.set(code, { label: r.label, floor: r.floor, building: r.building });
      }
    }
    // Also handle plain room labels like "S508", "N412" that ARE the code
    const plain = /^([NESW]\d{3}[A-Z]?)$/.exec(r.label.trim());
    if (plain) {
      const code = plain[1].toUpperCase();
      if (!byCode.has(code)) {
        byCode.set(code, { label: r.label, floor: r.floor, building: r.building });
      }
    }
  }

  const lines: string[] = [];
  for (const code of [...roomCodes].sort()) {
    const info = byCode.get(code);
    if (info) {
      lines.push(`${code}: ${info.label} — ${info.floor}, ${info.building}`);
    } else {
      lines.push(`${code}: room on map`);
    }
  }
  return lines.join("\n");
}

/** Build office directory: list of offices by floor/building. */
function buildOfficeDirectory(): string {
  const offices = roomsData.filter((r) => r.kind === "office" && !r.label.includes("?"));
  const byFloor = new Map<string, string[]>();
  for (const o of offices) {
    const key = `${o.building} — ${o.floor}`;
    if (!byFloor.has(key)) byFloor.set(key, []);
    byFloor.get(key)!.push(o.label);
  }
  return [...byFloor.entries()]
    .map(([floor, labels]) => `${floor}:\n  ${labels.join("\n  ")}`)
    .join("\n");
}

/** Build buildings reference from floors.json. */
function buildBuildingsReference(): string {
  return floorsData
    .filter((f) => !f.hidden)
    .map((f) => `${f.building} — ${f.floor} (floor plan id: ${f.id})`)
    .join("\n");
}

export function knownRoomCodes(): Set<string> {
  return roomCodes;
}

export function buildSystemPrompt(): string {
  const qa = demoQa
    .map((q) => `Q (${q.feature}): ${q.question}\nA: ${q.answer}${q.link ? `\nLink: ${q.link}` : ""}`)
    .join("\n\n");

  const coursesCsv = loadText("../data/courses.csv");
  const coursesRef = parseCourses(coursesCsv);
  const roomRef = buildRoomReference();
  const officeDir = buildOfficeDirectory();
  const buildingsRef = buildBuildingsReference();

  return [
    "You are the IsQolar assistant, a chatbot exclusively for students at PUP Manila (Polytechnic University of the Philippines, Sta. Mesa).",
    "IsQolar has three features: this FAQ chatbot, the Room TBA map (/map.html), and the queue (/checkin.html to get a ticket).",
    "TOPIC RESTRICTION: You ONLY answer questions about PUP Manila — its rooms, offices, enrollment, queues, fees, schedules, campus life, buildings, and courses. If a question is unrelated to PUP Manila or IsQolar, politely redirect and ask if they have a PUP-related question.",
    "Answer briefly (under 80 words), in the same language mix the student uses (English or Taglish). Plain text, no markdown tables.",
    "For room or location questions: look up the room code below and give the floor and building. Always include a map link.",
    "Room links: write /map.html?room=CODE when CODE is in the Known Room Codes list. For offices or buildings not in that list, link /map.html.",
    "For queue or line questions, link /checkin.html.",
    "Do not invent room codes, office names, fees, or schedules not listed below. If unsure, say so and suggest the relevant PUP office.",
    "Do not use em dashes.",
    "",
    "=== KNOWN ROOM CODES (use for /map.html?room=CODE links) ===",
    [...roomCodes].sort().join(", "),
    "",
    "=== ROOM CODE REFERENCE (code: label — floor, building) ===",
    roomRef,
    "",
    "=== OFFICE DIRECTORY (offices by floor) ===",
    officeDir,
    "",
    "=== BUILDINGS WITH FLOOR PLANS ===",
    buildingsRef,
    "",
    "=== COLLEGES AND COURSES ===",
    coursesRef,
    "",
    "=== REFERENCE Q&A ===",
    qa,
  ].join("\n");
}

/** Replace any room link whose code is not a known room with plain /map.html. */
export function sanitizeLinks(text: string): string {
  return text.replace(/\/map\.html\?room=([A-Za-z0-9-]+)/g, (m, code: string) =>
    roomCodes.has(code.toUpperCase()) ? m : "/map.html",
  ).replace(/\u2014/g, ", ");
}

export function validateMessages(body: unknown): ChatMessage[] | string {
  const msgs = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) return "messages must be a non-empty array";
  if (msgs.length > MAX_MESSAGES) return `at most ${MAX_MESSAGES} messages`;
  const out: ChatMessage[] = [];
  for (const m of msgs) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if (role !== "user" && role !== "assistant") return "role must be user or assistant";
    if (typeof content !== "string" || content.trim() === "") return "content must be a non-empty string";
    if (content.length > MAX_CHARS) return `each message at most ${MAX_CHARS} characters`;
    out.push({ role, content });
  }
  return out;
}

export type ChatResult = { status: number; body: { reply?: string; error?: string } };

export async function chat(body: unknown, fetchImpl: typeof fetch = fetch): Promise<ChatResult> {
  const msgs = validateMessages(body);
  if (typeof msgs === "string") return { status: 400, body: { error: msgs } };
  const key = process.env.GROQ_API_KEY;
  if (!key) return { status: 503, body: { error: "chat is not configured" } };
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const deadline = Date.now() + TIMEOUT_MS;
  const payload = JSON.stringify({
    model,
    messages: [{ role: "system", content: buildSystemPrompt() }, ...msgs],
    temperature: 0.3,
    max_tokens: 1024,
  });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left <= 0) break;
      const res = await fetchImpl(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: payload,
        signal: AbortSignal.timeout(left),
      });
      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt === 0 && deadline - Date.now() > RETRY_DELAY_MS + 1000) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`[chat] Groq ${res.status}: ${errBody.slice(0, 400)}`);
        if (retryable && attempt === 0) continue;
        return { status: 502, body: { error: "upstream error" } };
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        console.error("[chat] Groq returned no reply:", JSON.stringify(data).slice(0, 200));
        return { status: 502, body: { error: "upstream error" } };
      }
      return { status: 200, body: { reply: sanitizeLinks(reply) } };
    }
    return { status: 502, body: { error: "upstream error" } };
  } catch (err) {
    console.error("[chat] fetch threw:", err);
    return { status: 502, body: { error: "upstream error" } };
  }
}
