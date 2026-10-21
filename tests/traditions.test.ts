import { describe, expect, it } from "vitest";
import { analyzeSchools, schoolDisagreements, type VersionedRule } from "../src/core";

describe("multi-school comparison", () => {
  it("preserves disagreement instead of flattening schools", () => {
    const rules: VersionedRule[] = [
      {id:"a",name:"A",version:1,enabled:true,weight:1,school:"east",conditions:[],result:{direction:1,label:"support"}},
      {id:"b",name:"B",version:1,enabled:true,weight:1,school:"west",conditions:[],result:{direction:-1,label:"oppose"}}
    ];
    const analyses = analyzeSchools([
      {id:"east",name:"Eastern School"},
      {id:"west",name:"Western School"}
    ],rules,{});
    expect(schoolDisagreements(analyses).hasDisagreement).toBe(true);
  });
});
