import { describe, expect, it } from "vitest";
import { classifyQuestion, recommendProtocol } from "../src/core";

describe("automatic protocol selection", () => {
  it("selects business protocol for debt workflow", () => {
    const protocol = recommendProtocol(classifyQuestion("Will my debtor repay the debt?"));
    expect(protocol.id).toBe("business");
    expect(protocol.modules).toContain("contradictions");
  });
});
