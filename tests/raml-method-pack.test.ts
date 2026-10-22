import { describe,expect,it } from "vitest";
import { runStructuralFormula } from "../src/core/formulaKernel";
import { executeRamlCore,selectRamlHouses } from "../src/core/ramlMethodPack";
import { classifyQuestion } from "../src/core/question";

describe("raml method pack",()=>{
  it("routes partnership questions to House 7",()=>{
    const profile=classifyQuestion("Will this business partnership succeed?");
    const selection=selectRamlHouses(profile);
    expect(selection.primary).toBe(7);
    expect(selection.supporting).toContain(10);
    expect(selection.supporting).toContain(2);
  });

  it("routes business profit questions to House 2",()=>{
    const profile=classifyQuestion("Will this business make profit and increase revenue?");
    const selection=selectRamlHouses(profile);
    expect(selection.primary).toBe(2);
  });

  it("produces a house-first judgment with traceable rationale",()=>{
    const state=runStructuralFormula({
      question:"Will this business partnership succeed?",
      subjectName:"موسى",
      otherParty:"أحمد"
    });
    const result=executeRamlCore(state);

    expect(result.primaryHouse).toBe(7);
    expect(["YES","NO","CONDITIONAL","UNRESOLVED"]).toContain(result.decision);
    expect(result.rationale[0]).toContain("House 7");
    expect(result.execution.matchedRules[0].ruleId).toBe("RAML-HOUSE-PRIMARY");
    expect(result.execution.matchedRules.some((rule)=>rule.ruleId==="RAML-JUDGE")).toBe(true);
  });
});
