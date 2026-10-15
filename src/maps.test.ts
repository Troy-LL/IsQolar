import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";

const MAX_BYTES = 1024 * 1024;

async function assertFloorImage(path: string): Promise<void> {
  const info = await stat(path);
  assert.equal(info.isFile(), true);
  assert.ok(info.size < MAX_BYTES, `${path} is ${info.size} bytes`);
}

describe("tonight floor images", () => {
  it("public/maps/main-1f-lobby.jpg exists and is under 1 MB", async () => {
    await assertFloorImage("public/maps/main-1f-lobby.jpg");
  });

  it("public/maps/main-4f.jpg exists and is under 1 MB", async () => {
    await assertFloorImage("public/maps/main-4f.jpg");
  });

  it("public/maps/main-5f.jpg exists and is under 1 MB", async () => {
    await assertFloorImage("public/maps/main-5f.jpg");
  });
});
