import { describe, expect, it } from "vitest";
import { confidenceCalibration, figureFrequencies, historicalAccuracy, questionCategoryPerformance, subsystemContribution } from "../src/core";

describe("research metrics",()=>{
  const records=[
    {id:"1",category:"Debt",predicted:true,actual:true,confidence:80,resolvedAt:"2026-01-01"},
    {id:"2",category:"Debt",predicted:false,actual:true,confidence:70,resolvedAt:"2026-01-02"},
    {id:"3",category:"Marriage",predicted:false,actual:false,confidence:90,resolvedAt:"2026-01-03"}
  ];
  it("computes empirical calibration/category/history only from supplied resolved records",()=>{
    expect(confidenceCalibration(records).reduce((s,b)=>s+b.sampleSize,0)).toBe(3);
    expect(questionCategoryPerformance(records)[0].sampleSize).toBe(2);
    expect(historicalAccuracy(records)).toHaveLength(3);
  });
  it("computes figure frequencies from deterministic saved casts",()=>{
    const f=figureFrequencies([{id:"c",caseId:"x",createdAt:"2026-01-01",motherIds:["via","populus","fortuna-major","conjunctio"],mode:"direct"}]);
    expect(f.reduce((s,x)=>s+x.count,0)).toBe(16);
  });
  it("measures subsystem ablation contribution from user-supplied module votes",()=>{
    const result=subsystemContribution([
      {id:"a",actual:true,moduleVotes:{raml:1,abjad:-0.2}},
      {id:"b",actual:false,moduleVotes:{raml:-1,abjad:0.1}}
    ]);
    expect(result.map((r)=>r.module).sort()).toEqual(["abjad","raml"]);
  });
});
