import { describe, expect, it } from "vitest";
import {
  CORE_ANALYTICAL_LENSES,
  resolveTestimonyCollisions,
  runAbsoluteAnalysis,
  runAnalyticalCouncil,
  runDeepSearch
} from "../src/core";

describe("testimony collision and deep-search orchestration", () => {
  it("penalizes correlated evidence instead of blindly counting it twice", () => {
    const evidence = [
      {id:"a",source:"traditional" as const,direction:1 as const,weight:1,reliability:1,label:"A"},
      {id:"b",source:"traditional" as const,direction:1 as const,weight:1,reliability:1,label:"B"},
      {id:"c",source:"traditional" as const,direction:-1 as const,weight:1,reliability:1,label:"C"}
    ];
    const result = resolveTestimonyCollisions(evidence,{independenceGroup:{a:"same",b:"same",c:"other"}});
    const a=result.ranked.find((item)=>item.evidence.id==="a")!;
    const b=result.ranked.find((item)=>item.evidence.id==="b")!;
    expect(Math.min(a.correlationPenalty,b.correlationPenalty)).toBeLessThan(1);
    expect(result.explanation).toContain("outranked");
  });

  it("searches structural dimensions and returns provenance-ranked findings", () => {
    const analysis = runAbsoluteAnalysis({
      question:"Will this debtor repay me?",
      motherIds:["via","via","fortuna-major","conjunctio"],
      timestamp:"2026-09-10T12:00:00.000Z",
      latitude:11.8333,longitude:13.15,
      abjadTexts:["موسى","محمد"]
    });
    const deep=runDeepSearch({analysis});
    expect(deep.findings.length).toBeGreaterThan(10);
    expect(deep.findings.some((item)=>item.category==="repetition")).toBe(true);
    expect(deep.findings.every((item)=>item.provenance.length>0)).toBe(true);
    expect(deep.summary.independentSignalCount).toBeGreaterThan(0);
  });

  it("implements the ten named analytical lenses without invented authorities", () => {
    expect(CORE_ANALYTICAL_LENSES.map((item)=>item.label)).toEqual([
      "Traditionalist","House Master","Elementalist","Numerist","Celestial Analyst",
      "Pattern Hunter","Skeptic","Minimalist","Historian","Empiricist"
    ]);
    const analysis=runAbsoluteAnalysis({
      question:"Is this business contract favorable?",
      motherIds:["via","populus","fortuna-major","conjunctio"],
      timestamp:"2026-09-10T12:00:00.000Z"
    });
    const deep=runDeepSearch({analysis});
    const council=runAnalyticalCouncil(analysis,deep);
    expect(council.perspectives).toHaveLength(10);
    expect(council.consensus).toContain("/10");
    const historian=council.perspectives.find((item)=>item.id==="historian")!;
    expect(historian.rationale).toMatch(/No applicable evidence|sourced rules|source precedent/i);
  });
});
