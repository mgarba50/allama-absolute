import { describe,expect,it } from "vitest";
import {
  analyzeToukhiFullName,
  analyzeToukhiName,
  analyzeToukhiReducedNameNumber,
  compareToukhiNames,
  toukhiElementRelation
} from "../src/core/toukhiNameEngine";

describe("verified Toukhi name engine",()=>{
  it("implements the verified four elemental letter groups",()=>{
    const fire=analyzeToukhiName("اهطمفشذ");
    expect(fire.presentElements).toEqual(["FIRE"]);
    expect(fire.elementCounts.FIRE).toBe(7);
    expect(fire.internalState).toBe("SINGLE_NATURE");

    const earth=analyzeToukhiName("بوينصتض");
    expect(earth.presentElements).toEqual(["EARTH"]);

    const air=analyzeToukhiName("جزكسقثظ");
    expect(air.presentElements).toEqual(["AIR"]);

    const water=analyzeToukhiName("دحلعرخغ");
    expect(water.presentElements).toEqual(["WATER"]);
  });

  it("reproduces the Ahmad letter-balance example structurally",()=>{
    const profile=analyzeToukhiName("أحمد");
    expect(profile.normalized).toBe("احمد");
    expect(profile.elementCounts.FIRE).toBe(2);
    expect(profile.elementCounts.WATER).toBe(2);
    expect(profile.dominantByCount).toEqual(["FIRE","WATER"]);
    expect(profile.elementWeights.FIRE.weightNumerator).toBe(14);
    expect(profile.elementWeights.WATER.weightNumerator).toBe(12);
    expect(profile.elementWeights.FIRE.weight).toBe(2);
    expect(profile.dominantByWeight).toEqual(["FIRE"]);
    expect(profile.internalState).toBe("CONFLICTING_BLEND");
  });

  it("reproduces Salim as a four-nature name with air strongest by ordinal/7 balance",()=>{
    const profile=analyzeToukhiName("سليم");
    expect(profile.presentElements).toEqual(["FIRE","EARTH","AIR","WATER"]);
    expect(profile.elementWeights.AIR.weightNumerator).toBe(15);
    expect(profile.elementWeights.WATER.weightNumerator).toBe(12);
    expect(profile.elementWeights.EARTH.weightNumerator).toBe(10);
    expect(profile.elementWeights.FIRE.weightNumerator).toBe(13);
    expect(profile.dominantByWeight).toEqual(["AIR"]);
  });

  it("implements the explicitly stated friendship and enmity matrix",()=>{
    expect(toukhiElementRelation("FIRE","AIR")).toBe("FRIEND");
    expect(toukhiElementRelation("EARTH","WATER")).toBe("FRIEND");
    expect(toukhiElementRelation("FIRE","EARTH")).toBe("ENEMY");
    expect(toukhiElementRelation("AIR","WATER")).toBe("ENEMY");
    expect(toukhiElementRelation("FIRE","WATER")).toBe("ENEMY");
    expect(toukhiElementRelation("AIR","EARTH")).toBe("ENEMY");
    expect(toukhiElementRelation("FIRE","FIRE")).toBe("SAME");
  });

  it("recognizes a fire-air blend as friendly without inventing a relationship verdict",()=>{
    const profile=analyzeToukhiName("قاسم");
    expect(profile.presentElements).toEqual(["FIRE","AIR"]);
    expect(profile.internalState).toBe("FRIENDLY_BLEND");

    const comparison=compareToukhiNames("أحمد","سليم");
    expect(["SAME","FRIEND","ENEMY","MIXED"]).toContain(comparison.dominantRelation);
    expect(comparison.recommendation).toBeNull();
    expect(comparison.decisionEligible).toBe(false);
  });

  it("uses an explicit closed 28-letter policy for ta marbuta",()=>{
    const profile=analyzeToukhiName("نبوية");
    expect(profile.normalized.endsWith("ه")).toBe(true);
    expect(profile.letters.every((item)=>item.ordinal>=1 && item.ordinal<=28)).toBe(true);
  });

  it("reproduces the page-24 Mustafa reduced-number example",()=>{
    const result=analyzeToukhiReducedNameNumber("مصطفى");
    expect(result.normalized).toBe("مصطفي");
    expect(result.letters.map((item)=>item.reducedValue)).toEqual([4,9,9,8,1]);
    expect(result.total).toBe(31);
    expect(result.quotient).toBe(3);
    expect(result.rawRemainder).toBe(4);
    expect(result.interpretationKey).toBe(4);
    expect(result.zeroRemainderStatus).toBe("NOT_APPLICABLE");
  });

  it("does not guess that zero remainder means state 9",()=>{
    const result=analyzeToukhiReducedNameNumber("ط");
    expect(result.total).toBe(9);
    expect(result.rawRemainder).toBe(0);
    expect(result.interpretationKey).toBeNull();
    expect(result.zeroRemainderStatus).toBe("SOURCE_RULE_NOT_YET_VERIFIED");
  });

  it("keeps the mother-name full-name policy explicit and reproducible",()=>{
    const full=analyzeToukhiFullName("موسى","فاطمة","MOTHER");
    expect(full.lineagePolicy).toBe("MOTHER");
    expect(full.compositeInput).toBe("موسى فاطمة");
    expect(full.methodologicalRule.schoolVariant).toBe(true);
    expect(full.methodologicalRule.consistentPolicyRequired).toBe(true);
    expect(full.elemental.letters.length).toBeGreaterThan(0);
    expect(full.reducedNumber.total).toBeGreaterThan(0);
    expect(full.decisionEligible).toBe(false);
  });
});
