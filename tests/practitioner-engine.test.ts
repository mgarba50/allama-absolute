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
    expect(result.response.methodStatus.tukhi).toBe("NOT_ACTIVE_SOURCE_TEXT_REQUIRED");
    expect(result.synthesis.audit.noInventedWeights).toBe(true);
    expect(result.synthesis.evidence.some((item)=>item.role==="DECISIVE")).toBe(true);
  });
});
