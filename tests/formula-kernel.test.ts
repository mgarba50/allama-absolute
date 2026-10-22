import { describe,expect,it } from "vitest";
import { cycleIndex,runNameFormula,runStructuralFormula } from "../src/core/formulaKernel";

describe("absolute formula kernel",()=>{
  it("uses declared cycle semantics where zero means the final member",()=>{
    expect(cycleIndex(84,12)).toBe(12);
    expect(cycleIndex(116,4)).toBe(4);
    expect(cycleIndex(116,12)).toBe(8);
    expect(cycleIndex(116,7)).toBe(4);
  });

  it("executes reproducible name arithmetic",()=>{
    const result=runNameFormula("موسى");
    expect(result.abjadTotal).toBe(116);
    expect(result.elementCycle4).toBe(4);
    expect(result.zodiacCycle12).toBe(8);
    expect(result.planetCycle7).toBe(4);
  });

  it("routes the question before reading the primary house",()=>{
    const result=runStructuralFormula({
      question:"Will this business partnership succeed?",
      subjectName:"موسى",
      otherParty:"أحمد"
    });
    expect(result.question.domain).toBe("Business");
    expect(result.primaryHouse).toBe(1);
    expect(result.relevantHouses.map((item)=>item.house)).toEqual([1,2,7,10]);
    expect(result.validationErrors).toEqual([]);
    expect(result.trace.some((step)=>step.op==="QUESTION_ROUTE")).toBe(true);
    expect(result.trace.some((step)=>step.op==="HOUSE_FIGURE")).toBe(true);
    expect(result.trace.filter((step)=>step.op==="ABJAD_SUM")).toHaveLength(2);
  });
});
