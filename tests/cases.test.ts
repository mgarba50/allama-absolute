import { describe, expect, it } from "vitest";
import { newCase } from "../src/core";

describe("case identity", () => {
  it("creates timestamped immutable identity fields", () => {
    const record = newCase("Will this contract proceed?","2026-09-09T12:00:00.000Z");
    expect(record.id).toMatch(/^ABS-/);
    expect(record.status).toBe("open");
    expect(record.timeline[0].type).toBe("created");
  });
});
