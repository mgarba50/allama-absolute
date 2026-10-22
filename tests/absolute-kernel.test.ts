import { describe,expect,it } from "vitest";
import { runAbsoluteKernel } from "../src/core/absoluteKernel";

describe("absolute kernel",()=>{
  it("combines source-gated method packs without inventing missing rules",()=>{
    const result=runAbsoluteKernel({
      question:"Will this business partnership succeed?",
      subjectName:"موسى",
      motherName:"فاطمة",
      otherParty:"احمد"
    });

    expect(result.raml.primaryHouse).toBe(7);
    expect(["YES","NO","CONDITIONAL","UNRESOLVED"]).toContain(result.raml.decision);
    expect(result.abjad.subject?.total).toBe(116);
    expect(result.toukhi.subjectName?.original).toBe("موسى");
    expect(result.toukhi.verifiedRules.some((rule)=>rule.id==="TK-NAME-ELEMENTS-009")).toBe(true);
    expect(result.audit.ramlRules[0].ruleId).toBe("RAML-HOUSE-PRIMARY");
  });

  it("activates the verified annual arithmetic rule for an annual question",()=>{
    const result=runAbsoluteKernel({
      question:"What is the traditional indication for the year 1952?",
      subjectName:"موسى",
      birthYear:1920,
      targetYear:1952
    });

    expect(result.toukhi.annualParity?.combined).toBe(1984);
    expect(result.toukhi.annualParity?.digitSum).toBe(22);
    expect(result.toukhi.annualParity?.decisionEligible).toBe(true);
    expect(result.toukhi.decisionDirection).toBe(-1);
    expect(result.toukhi.decisionRuleId).toBe("TK-YEAR-PARITY-006");
  });
});
