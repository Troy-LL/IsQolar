import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BRAND } from "./contract.js";

describe("contract", () => {
  it("BRAND.name is IsQolar", () => {
    assert.equal(BRAND.name, "IsQolar");
  });
});
