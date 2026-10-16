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

const roomCodes = new Set<string>();
collectCodes(loadJson("../data/paths.json"), roomCodes);
const demoQa = (loadJson("../public/chat/demo-qa.json") as DemoQa[] | null) ?? [];

export function knownRoomCodes(): Set<string> {
  return roomCodes;
}

export function buildSystemPrompt(): string {
  const qa = demoQa
    .map((q) => `Q (${q.feature}): ${q.question}\nA: ${q.answer}${q.link ? `\nLink: ${q.link}` : ""}`)
    .join("\n\n");
  return [
    "You are the IsQolar assistant for students at PUP Manila (Polytechnic University of the Philippines, Sta. Mesa).",
    "IsQolar has three features: this FAQ chatbot, the Room TBA map (/map.html), and the queue (/checkin.html to get a ticket).",
    "Answer briefly (under 80 words), in the same language mix the student uses (English or Taglish). Plain text, no markdown tables.",
    "Ground every answer in the reference Q&A below. If the answer is not there, say you are not sure and suggest asking the relevant PUP office. Never invent rooms, offices, fees, schedules or locations.",
    "Room links: only write /map.html?room=CODE when CODE is in this list of known rooms: " + [...roomCodes].sort().join(", ") + ". For any other place, link /map.html.",
    "For queue or line questions, link /checkin.html.",
    "Do not use em dashes.",
    "",
    "Reference Q&A:",
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
    ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
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
      if (!res.ok) return { status: 502, body: { error: "upstream error" } };
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) return { status: 502, body: { error: "upstream error" } };
      return { status: 200, body: { reply: sanitizeLinks(reply) } };
    }
    return { status: 502, body: { error: "upstream error" } };
  } catch {
    return { status: 502, body: { error: "upstream error" } };
  }
}
