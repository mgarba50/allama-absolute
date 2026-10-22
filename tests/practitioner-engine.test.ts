import { describe,expect,it } from "vitest";
import { runPractitionerEngine } from "../src/core/practitionerEngine";

describe("practitioner engine",()=>{
  it("returns a direct source-gated answer without numeric confidence camouflage",()=>{
    const result=runPractitionerEngine({
      question:"Will this business partnership succeed?",
      subjectName:"موسى",
      motherName:"فاطمة",
      otherParty:"احمد"
    });

    expect(["YES","NO","CONDITIONAL","UNRESOLVED"]).toContain(result.response.verdict);
    expect(["STRONG","MODERATE","MIXED","WEAK","UNRESOLVED"]).toContain(result.response.strength);
    expect(result.response.directAnswer.length).toBeGreaterThan(20);
    expect(result.response.methodStatus.raml).toBe("ACTIVE");
    expect(result.response.methodStatus.tukhi).toBe("VERIFIED_RULES_ACTIVE");
    expect(result.kernel.toukhi.activation.active).toBe(false);
    expect(result.kernel.toukhi.activation.logicalPages).toBe(252);
    expect(result.kernel.toukhi.verifiedRules.some((rule)=>rule.status==="VERIFIED_ACTIVE")).toBe(true);
    expect(result.synthesis.audit.noInventedWeights).toBe(true);
    expect(result.synthesis.audit.methodRelevanceRouting).toBe(true);
    expect(result.synthesis.evidence.some((item)=>item.role==="DECISIVE")).toBe(true);
  });

  it("lets a directly relevant verified Toukhi year rule become primary",()=>{
    const result=runPractitionerEngine({
      question:"Is the year 1952 traditionally fortunate or unfortunate for this person?",
      subjectName:"موسى",
      birthYear:1920,
      targetYear:1952
    });

    expect(result.kernel.toukhi.annualParity?.digitSum).toBe(22);
    expect(result.kernel.toukhi.decisionDirection).toBe(-1);
    expect(result.kernel.toukhi.decisionRuleId).toBe("TK-YEAR-PARITY-006");
    expect(result.synthesis.evidence[0].layer).toBe("TOUKHI");
    expect(["NO","CONDITIONAL"]).toContain(result.response.verdict);
  });
});
