import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
  stdio: "inherit",
  env: { ...process.env, SEED: "1" },
});

child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
