import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load .env file if present (for local development)
const env = { ...process.env, SEED: "1" };
try {
  const lines = readFileSync(resolve(root, ".env"), "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) env[key] = val;
  }
} catch {
  // .env not present — that's fine
}

const child = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
  stdio: "inherit",
  env,
});

child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
