import { describe,expect,it } from "vitest";
import { runAbsoluteKernel } from "../src/core/absoluteKernel";

describe("absolute kernel",()=>{
  it("combines Raml, Abjad and verified source-gated Toukhi mechanics without inventing missing rules",()=>{
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

    expect(result.toukhi.subjectName?.original).toBe("موسى");
    expect(result.toukhi.subjectReducedNumber?.rawRemainder).toBeGreaterThanOrEqual(0);
    expect(result.toukhi.subjectWithMother?.lineagePolicy).toBe("MOTHER");
    expect(result.toukhi.subjectWithMother?.compositeInput).toBe("موسى فاطمة");
    expect(result.toukhi.otherPartyName?.original).toBe("احمد");
    expect(result.toukhi.nameComparison?.recommendation).toBeNull();
    expect(result.toukhi.activation.active).toBe(false);

    expect(result.unresolvedMethodNeeds.some((item)=>item.includes("Ṭūkhī"))).toBe(true);
    expect(result.audit.ramlRules[0].ruleId).toBe("RAML-HOUSE-PRIMARY");
  });

  it("executes the verified Toukhi annual rule only when year inputs are supplied",()=>{
    const result=runAbsoluteKernel({
      question:"What is the traditional year indication?",
      subjectName:"موسى",
      birthYear:1920,
      targetYear:1952
    });

    expect(result.toukhi.annualParity?.combined).toBe(1984);
    expect(result.toukhi.annualParity?.digitSum).toBe(22);
    expect(result.toukhi.annualParity?.traditionalLabel).toBe("نحس/نزول");
    expect(result.toukhi.annualParity?.decisionEligible).toBe(false);
  });
});
