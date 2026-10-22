import { describe,expect,it } from "vitest";
import {
  ABJAD_CYCLE_TABLES,
  compareAbjadNames,
  executeAbjadName,
  readAbjadCycle
} from "../src/core/abjadMethodPack";

describe("abjad method pack",()=>{
  it("executes Musa with declared one-based cycle semantics",()=>{
    const result=executeAbjadName("موسى");
    expect(result.total).toBe(116);

    const element=result.readings.find((item)=>item.tableId==="OMEGA_ELEMENT_EDUCATIONAL_4")!;
    const zodiac=result.readings.find((item)=>item.tableId==="OMEGA_ZODIAC_COMMON_12")!;
    const weekday=result.readings.find((item)=>item.tableId==="OMEGA_WEEKDAY_SATURN_FIRST_7")!;

    expect(element.index).toBe(4);
    expect(element.member.english).toBe("Earth");
    expect(zodiac.index).toBe(8);
    expect(zodiac.member.english).toBe("Scorpio");
    expect(weekday.index).toBe(4);
    expect(weekday.member.english).toBe("Tuesday");
    expect(weekday.member.metadata?.planetEnglish).toBe("Mars");
  });

  it("maps zero remainder to the final one-based member",()=>{
    const table=ABJAD_CYCLE_TABLES.OMEGA_ZODIAC_COMMON_12;
    const result=readAbjadCycle(156,table);
    expect(result.arithmetic.rawRemainder).toBe(0);
    expect(result.index).toBe(12);
    expect(result.member.english).toBe("Pisces");
    expect(result.arithmetic.check).toBe(156);
  });

  it("does not invent compatibility meaning for two names",()=>{
    const relation=compareAbjadNames("موسى","احمد");
    expect(relation.interpretation).toBe("UNASSIGNED");
    expect(relation.note).toContain("No favorable/unfavorable compatibility judgment");
    expect(relation.structural.totalSum).toBeGreaterThan(0);
  });
});
