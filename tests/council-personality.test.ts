import { describe, expect, it } from "vitest";
import {
  SYSTEM_PERSONALITY_DIRECTIVE,
  hundredAnalyticalLenses,
  responseStyleViolations,
  runAbsoluteAnalysis,
  runDeepSearch,
  runHundredPerspectiveCouncil
} from "../src/core";

describe("100-perspective council and personality contract",()=>{
  it("creates exactly 100 computational perspectives without claiming historical authorities",()=>{
    const lenses=hundredAnalyticalLenses();
    expect(lenses).toHaveLength(100);
    expect(new Set(lenses.map((x)=>x.id)).size).toBe(100);
    expect(lenses.every((x)=>x.description.includes("not a claimed historical authority"))).toBe(true);
  });
  it("deliberates all 100 perspectives over the same structured evidence",()=>{
    const analysis=runAbsoluteAnalysis({question:"Will this contract proceed?",motherIds:["via","populus","fortuna-major","conjunctio"],timestamp:"2026-09-10T10:00:00Z"});
    const deep=runDeepSearch({analysis});
    const result=runHundredPerspectiveCouncil(analysis,deep);
    expect(result.perspectives).toHaveLength(100);
    expect(result.consensus).toContain("/100");
  });
  it("requires confirmation-bias resistance and blocks explicit theatrical certainty phrases",()=>{
    expect(SYSTEM_PERSONALITY_DIRECTIVE).toMatch(/confirmation bias/i);
    expect(responseStyleViolations("The universe has chosen this. 100% guaranteed.")).toContain("mystical-filler");
    expect(responseStyleViolations("The evidence is mixed; the strongest objection remains X.")).toEqual([]);
  });
});
