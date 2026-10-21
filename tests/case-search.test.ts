import { describe, expect, it } from "vitest";
import { newCase, searchCases, similarCases } from "../src/core";

describe("case retrieval", () => {
  it("searches and finds similar cases by normalized token overlap", () => {
    const debt = newCase("Will the debtor repay the outstanding money?","2026-01-01T00:00:00.000Z");
    const debt2 = { ...newCase("Will this client repay my debt?","2026-01-02T00:00:00.000Z"), id:"ABS-2" };
    const travel = { ...newCase("Will the journey be delayed?","2026-01-03T00:00:00.000Z"), id:"ABS-3" };
    const cases = [debt,debt2,travel];
    expect(searchCases(cases,"repay debt money",1)[0].case.id).toBe(debt.id);
    expect(similarCases(cases,debt,1)[0].case.id).toBe("ABS-2");
  });
});
