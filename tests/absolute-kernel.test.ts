import { describe,expect,it } from "vitest";
import { runAbsoluteKernel } from "../src/core/absoluteKernel";

describe("absolute kernel",()=>{
  it("combines the house-first Raml pack and sourced Abjad calculations without inventing missing rules",()=>{
    const result=runAbsoluteKernel({
      question:"Will this business partnership succeed?",
      subjectName:"موسى",
      motherName:"فاطمة",
      otherParty:"احمد"
    });

    expect(result.raml.primaryHouse).toBe(7);
    expect(["YES","NO","CONDITIONAL","UNRESOLVED"]).toContain(result.raml.decision);
    expect(result.abjad.subject?.total).toBe(116);
    expect(result.abjad.subjectToOtherParty?.interpretation).toBe("UNASSIGNED");
    expect(result.unresolvedMethodNeeds.some((item)=>item.includes("Ṭūkhī"))).toBe(true);
    expect(result.audit.ramlRules[0].ruleId).toBe("RAML-HOUSE-PRIMARY");
  });
});
