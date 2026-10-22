import { describe,expect,it } from "vitest";
import {
  RECOVERED_TOUKHI_ITEMS,
  TOUKHI_LOGICAL_PAGE_COUNT,
  TOUKHI_SCREENED_PAGES,
  buildToukhiCoverage,
  toukhiActivationReport
} from "../src/core/toukhiCorpus";
import {
  executeRecoveredNameMotherNine,
  executeRecoveredWafq4Key,
  executeRecoveredWafq5Key,
  executeToukhiCandidate,
  executeVerifiedAnnualYearParity
} from "../src/core/toukhiMethodPack";
import {
  TOUKHI_RECOVERED_MODULE_INDEX,
  toukhiRecoveredGapRanges,
  toukhiRecoveredPageCount
} from "../src/core/toukhiRecoveredIndex";

describe("Toukhi corpus gate",()=>{
  it("models the five source parts as 252 logical pages with page 101 overlap",()=>{
    const coverage=buildToukhiCoverage();
    expect(coverage).toHaveLength(252);
    expect(coverage[100].page).toBe(101);
    expect(coverage[100].parts).toEqual(["TK-P2","TK-P3"]);
  });

  it("records current visual screening and quarantines false legacy attributions",()=>{
    const report=toukhiActivationReport();
    expect(TOUKHI_SCREENED_PAGES).toEqual([4,6,7,35,39]);
    expect(report.screenedPages).toBe(5);
    expect(report.quarantinedItems).toBe(3);
    expect(report.active).toBe(false);
    expect(RECOVERED_TOUKHI_ITEMS.filter((item)=>item.sourceStatus==="QUARANTINED_BAD_ATTRIBUTION").map((item)=>item.id))
      .toEqual(["FRM-001","FRM-011","FRM-012"]);
  });

  it("stays locked while even one logical page is unverified",()=>{
    const allButLast=Array.from({length:251},(_,i)=>i+1);
    const report=toukhiActivationReport(allButLast);
    expect(report.active).toBe(false);
    expect(report.verifiedPages).toBe(251);
  });

  it("only activates at full 252/252 verification",()=>{
    const all=Array.from({length:TOUKHI_LOGICAL_PAGE_COUNT},(_,i)=>i+1);
    const report=toukhiActivationReport(all);
    expect(report.active).toBe(true);
    expect(report.verifiedPages).toBe(252);
    expect(report.unreviewedPages).toBe(0);
  });

  it("executes the visually verified pages 6-7 annual parity rule",()=>{
    const napoleon=executeVerifiedAnnualYearParity(1769,1804);
    expect(napoleon.ageByYearSubtraction).toBe(35);
    expect(napoleon.combined).toBe(1839);
    expect(napoleon.digitSum).toBe(21);
    expect(napoleon.parity).toBe("ODD");
    expect(napoleon.traditionalLabel).toBe("سعادة/صعود");

    const farouk=executeVerifiedAnnualYearParity(1920,1952);
    expect(farouk.ageByYearSubtraction).toBe(32);
    expect(farouk.combined).toBe(1984);
    expect(farouk.digitSum).toBe(22);
    expect(farouk.parity).toBe("EVEN");
    expect(farouk.traditionalLabel).toBe("نحس/نزول");
  });

  it("refuses to execute disproved legacy page-4 and page-39 formulas",()=>{
    expect(()=>executeRecoveredNameMotherNine("موسى","حواء")).toThrow(/quarantined/i);
    expect(()=>executeRecoveredWafq4Key(134)).toThrow(/quarantined/i);
  });

  it("keeps unverified recovered arithmetic decision-neutral",()=>{
    const five=executeRecoveredWafq5Key(125);
    expect(five.quotient).toBe(13);
    expect(five.remainder).toBe(0);
    expect(five.exact).toBe(true);
    expect(five.sourceStatus).toBe("RECOVERED_NOT_VISUALLY_VERIFIED");

    const result=executeToukhiCandidate({});
    expect(result.activation.active).toBe(false);
    expect(result.decisionDirection).toBeNull();
  });

  it("makes legacy recovered coverage gaps explicit instead of calling the archive complete",()=>{
    expect(TOUKHI_RECOVERED_MODULE_INDEX).toHaveLength(16);
    expect(toukhiRecoveredPageCount()).toBe(71);
    expect(toukhiRecoveredGapRanges()).toEqual([
      {start:1,end:2},
      {start:6,end:34},
      {start:43,end:74},
      {start:83,end:101},
      {start:110,end:129},
      {start:140,end:149},
      {start:158,end:179},
      {start:189,end:209},
      {start:221,end:239},
      {start:246,end:252}
    ]);
  });
});
