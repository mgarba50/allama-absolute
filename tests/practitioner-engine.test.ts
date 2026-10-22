import { describe,expect,it } from "vitest";
import { runPractitionerEngine } from "../src/core/practitionerEngine";

const forbiddenDefaultTerms = [
  "raml",
  "abjad",
  "ṭūkhī",
  "toukhi",
  "house ",
  "figure",
  "planetary",
  "witness",
  "testimony",
  "remainder",
  "matrix",
  "weighting",
  "source-gated",
  "method status",
  "confidence score",
  "calculation chain"
];

function visibleReadingText(result:ReturnType<typeof runPractitionerEngine>):string {
  const c=result.conversation;
  return [
    c.headline,
    c.verdict,
    ...c.overview,
    ...c.centralThemes,
    ...c.opportunities,
    ...c.cautions,
    c.timingImpression,
    c.practicalGuidance,
    c.closing
  ].join("\n").toLowerCase();
}

describe("practitioner engine",()=>{
  it("returns a human consultation while keeping the analytical machinery internal",()=>{
    const result=runPractitionerEngine({
      question:"Will this business partnership succeed?",
      subjectName:"موسى",
      motherName:"فاطمة",
      otherParty:"احمد"
    });

    expect(["YES","NO","CONDITIONAL","UNRESOLVED"]).toContain(result.response.verdict);
    expect(result.conversation.headline.length).toBeGreaterThan(8);
    expect(result.conversation.verdict.length).toBeGreaterThan(20);
    expect(result.conversation.overview.length).toBeGreaterThanOrEqual(2);
    expect(result.conversation.centralThemes.length).toBeGreaterThan(0);
    expect(result.conversation.opportunities.length).toBeGreaterThan(0);
    expect(result.conversation.cautions.length).toBeGreaterThan(0);
    expect(result.conversation.timingImpression.length).toBeGreaterThan(20);
    expect(result.conversation.practicalGuidance.length).toBeGreaterThan(30);

    const visible=visibleReadingText(result);
    for (const term of forbiddenDefaultTerms) {
      expect(visible, "default reading leaked internal term: " + term).not.toContain(term);
    }

    // The full technical machinery still exists for Expert Audit.
    expect(result.response.methodStatus.raml).toBe("ACTIVE");
    expect(result.kernel.toukhi.verifiedRules.length).toBeGreaterThan(0);
    expect(result.synthesis.evidence.some((item)=>item.role==="DECISIVE")).toBe(true);
  });

  it("uses a verified annual rule internally without naming it in the normal reading",()=>{
    const result=runPractitionerEngine({
      question:"Is the year 1952 traditionally fortunate or unfortunate for this person?",
      subjectName:"موسى",
      birthYear:1920,
      targetYear:1952
    });

    expect(result.kernel.toukhi.decisionRuleId).toBe("TK-YEAR-PARITY-006");
    expect(result.response.methodStatus.tukhi).toBe("VERIFIED_RULE_FIRED");
    expect(["NO","CONDITIONAL"]).toContain(result.response.verdict);

    const visible=visibleReadingText(result);
    expect(visible).not.toContain("ṭūkhī");
    expect(visible).not.toContain("toukhi");
    expect(visible).not.toContain("digit sum");
    expect(visible).not.toContain("parity");
    expect(visible).toContain("period");
  });
});
