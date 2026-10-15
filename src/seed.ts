import { getStore } from "./store.js";

export async function seed(): Promise<void> {
  await getStore().seed();
}

// When run directly (npm run seed), POST to the running server.
if (process.argv[1] && new URL(import.meta.url).pathname === new URL(process.argv[1], "file:").pathname) {
  const res = await fetch("http://localhost:3000/api/admin/seed", { method: "POST" });
  if (!res.ok) {
    console.error(`Seed failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const body = await res.json();
  console.log("Seed via server:", JSON.stringify(body));
}
