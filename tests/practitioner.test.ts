import { describe,expect,it } from "vitest";
import { buildPractitionerAnswer } from "../src/core/practitioner";
import { buildFinalVerdict } from "../src/core/finalVerdict";
import { runAbsoluteAnalysis } from "../src/core/analysis";
import { runDeepSearch } from "../src/core/deepSearch";
import { runHundredPerspectiveCouncil } from "../src/core/council";

describe("practitioner answer",()=>{
  it("compresses the internal engine into an executive answer",()=>{
    const analysis=runAbsoluteAnalysis({
      question:"Will this business agreement succeed?",
      motherIds:["via","populus","fortuna-major","conjunctio"],
      timestamp:"2026-10-22T10:00:00Z",
      abjadTexts:["موسى","فاطمة"]
    });
    const deep=runDeepSearch({analysis,currentQuestion:analysis.question.raw});
    const council=runHundredPerspectiveCouncil(analysis,deep);
    const verdict=buildFinalVerdict(analysis,{deepSearch:deep,council});
    const answer=buildPractitionerAnswer(analysis,deep,council,verdict);

    expect(answer.directAnswer.length).toBeGreaterThan(20);
    expect(answer.action.length).toBeGreaterThan(20);
    expect(answer.finalJudgment).toContain("Confidence");
    expect(["YES","NO","CONDITIONAL","UNRESOLVED"]).toContain(answer.verdict);
  });
});
