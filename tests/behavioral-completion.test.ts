import { describe, expect, it } from "vitest";
import {
  MUSA_ALLAMA_METHOD,
  analyzeClientChaos,
  architectureTestCases,
  blindAiMessages,
  buildFinalVerdict,
  createDontTellAbsoluteSession,
  decryptMethodologyProfile,
  encryptMethodologyProfile,
  preRevealPayload,
  renderDirectResponse,
  revealDontTellAbsoluteSession,
  runAbsoluteAnalysis,
  runAnalyticalCouncil,
  runDeepSearch,
  validateArchitectureTestCorpus
} from "../src/core";

describe("behavioral completion engines", () => {
  it("keeps blind reveal data out of the pre-reveal analysis payload", async () => {
    const sealed=await createDontTellAbsoluteSession("BLIND-1",{
      motherIds:["via","populus","fortuna-major","conjunctio"],
      timestamp:"2026-09-10T03:00:00.000Z"
    });
    const messages=blindAiMessages(sealed);
    expect(JSON.stringify(messages)).not.toContain("stolen");
    const revealed=await revealDontTellAbsoluteSession(sealed,{
      question:"Did the person take the stolen object?",claim:"stolen",revealedAt:"2026-09-10T04:00:00.000Z"
    });
    expect(revealed.integrityVerified).toBe(true);
    expect(JSON.stringify(preRevealPayload(revealed))).not.toContain("stolen");
    expect(revealed.reveal.claim).toBe("stolen");
  });

  it("separates narrative, alleged facts, emotion and the operative client question", () => {
    const result=analyzeClientChaos("This useless man has wasted my week. He says the bank delayed him. The money was due Monday. Will he pay the debt this week?");
    expect(result.emotionalClaims.length).toBeGreaterThan(0);
    expect(result.allegedFacts.length).toBeGreaterThan(0);
    expect(result.actualQuestion).toMatch(/will he pay/i);
  });

  it("builds every required final verdict field and all direct response modes", () => {
    const analysis=runAbsoluteAnalysis({question:"Will this debtor repay me?",motherIds:["via","populus","fortuna-major","conjunctio"],timestamp:"2026-09-10T05:00:00.000Z"});
    const deep=runDeepSearch({analysis});
    const council=runAnalyticalCouncil(analysis,deep);
    const final=buildFinalVerdict(analysis,{deepSearch:deep,council});
    expect(final).toEqual(expect.objectContaining({
      verdictClass:expect.any(String),verdictText:expect.any(String),confidence:expect.any(Number),
      primaryEvidence:expect.any(Array),contraryEvidence:expect.any(Array),contradictionSeverity:expect.any(String),
      relevantHouses:expect.any(Array),decisiveRules:expect.any(Array),supportingSchools:expect.any(Array),
      dataQualityScore:expect.any(Number)
    }));
    for (const mode of ["SOVEREIGN","SCHOLAR","CLIENT","MUSA","RESEARCHER"] as const) {
      expect(renderDirectResponse(mode,final,analysis).length).toBeGreaterThan(5);
    }
  });

  it("encrypts and restores the private Musa Allama methodology profile", async () => {
    const encrypted=await encryptMethodologyProfile(MUSA_ALLAMA_METHOD,"test-password");
    const restored=await decryptMethodologyProfile(encrypted,"test-password");
    expect(restored.id).toBe("musa-allama-method");
    expect(restored.practitioner).toBe("Musa Allama");
  });

  it("turns all 777 architecture test records into executable module expectations", () => {
    expect(validateArchitectureTestCorpus()).toEqual([]);
    const cases=architectureTestCases();
    expect(cases).toHaveLength(777);
    expect(cases.every((item)=>item.protocolFamily!=="MISSING")).toBe(true);
    expect(cases.every((item)=>item.expected_modules.length>0)).toBe(true);
  });
});
