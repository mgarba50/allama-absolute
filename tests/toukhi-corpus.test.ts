import { describe,expect,it } from "vitest";
import {
  RECOVERED_TOUKHI_ITEMS,
  TOUKHI_LOGICAL_PAGE_COUNT,
  buildToukhiCoverage,
  toukhiActivationReport
} from "../src/core/toukhiCorpus";
import {
  executeRecoveredNameMotherNine,
  executeRecoveredWafq4Key,
  executeRecoveredWafq5Key,
  executeToukhiCandidate
} from "../src/core/toukhiMethodPack";

describe("Toukhi corpus gate",()=>{
  it("models the five source parts as 252 logical pages with page 101 overlap",()=>{
    const coverage=buildToukhiCoverage();
    expect(coverage).toHaveLength(252);
    expect(coverage[100].page).toBe(101);
    expect(coverage[100].parts).toEqual(["TK-P2","TK-P3"]);
  });

  it("stays locked while even one logical page is unverified",()=>{
    const allButLast=Array.from({length:251},(_,i)=>i+1);
    const report=toukhiActivationReport(allButLast);
    expect(report.active).toBe(false);
    expect(report.verifiedPages).toBe(251);
    expect(report.unreviewedPages+report.recoveredButUnverifiedPages).toBe(1);
  });

  it("only activates at full 252/252 verification",()=>{
    const all=Array.from({length:TOUKHI_LOGICAL_PAGE_COUNT},(_,i)=>i+1);
    const report=toukhiActivationReport(all);
    expect(report.active).toBe(true);
    expect(report.blockers).toEqual([]);
  });

  it("executes recovered arithmetic without assigning interpretation",()=>{
    const nine=executeRecoveredNameMotherNine("موسى","حواء");
    expect(nine.person.total).toBe(116);
    expect(nine.mother.total).toBe(15);
    expect(nine.combinedTotal).toBe(131);
    expect(nine.rawRemainder).toBe(5);
    expect(nine.interpretation).toBeNull();

    const four=executeRecoveredWafq4Key(134);
    expect(four.quotient).toBe(26);
    expect(four.remainder).toBe(0);
    expect(four.exact).toBe(true);

    const five=executeRecoveredWafq5Key(125);
    expect(five.quotient).toBe(13);
    expect(five.remainder).toBe(0);
    expect(five.exact).toBe(true);
  });

  it("keeps the candidate pack decision-neutral while the corpus is locked",()=>{
    const result=executeToukhiCandidate({
      personName:"موسى",
      motherName:"حواء"
    });
    expect(result.activation.active).toBe(false);
    expect(result.nameMotherNine?.rawRemainder).toBe(5);
    expect(result.decisionDirection).toBeNull();
    expect(RECOVERED_TOUKHI_ITEMS.length).toBeGreaterThan(10);
  });
});
