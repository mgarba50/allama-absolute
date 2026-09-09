import { describe, expect, it } from "vitest";
import { evaluateRule } from "../src/core";

describe("Versioned rule engine", () => {
  it("evaluates traceable field conditions", () => {
    const result = evaluateRule({
      id:"rule-1",
      name:"Judge favors completion",
      version:1,
      enabled:true,
      weight:2,
      school:"test",
      conditions:[{ path:"shield.judge.quality", operator:"eq", value:"favorable" }],
      result:{ direction:1, label:"support" }
    },{ shield:{ judge:{ quality:"favorable" } } });
    expect(result.matched).toBe(true);
    expect(result.contribution).toBe(2);
  });
});
