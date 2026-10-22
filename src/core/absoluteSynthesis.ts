import type { AbsoluteKernelExecution } from "./absoluteKernel";

export type AbsoluteDecision = "YES"|"NO"|"CONDITIONAL"|"UNRESOLVED";
export type EvidenceStrength = "STRONG"|"MODERATE"|"MIXED"|"WEAK"|"UNRESOLVED";

export interface DecisionEvidence {
  id:string;
  layer:"RAML"|"ABJAD"|"FALAKI"|"TOUKHI"|"SOURCE-GATE";
  role:"DECISIVE"|"SUPPORTING"|"CONTEXT"|"BLOCKER";
  direction:-1|0|1;
  statement:string;
  source:string;
}

export interface AbsoluteSynthesis {
  decision:AbsoluteDecision;
  strength:EvidenceStrength;
  answer:string;
  decisiveBasis:string;
  evidence:readonly DecisionEvidence[];
  unresolved:readonly string[];
  audit:{
    noInventedWeights:true;
    noUnsourcedAbjadDirection:true;
    noUnsourcedFalakiDirection:true;
    sourceGated:true;
    methodRelevanceRouting:true;
  };
}

function directionToDecision(direction:-1|0|1):AbsoluteDecision {
  if (direction>0) return "YES";
  if (direction<0) return "NO";
  return "UNRESOLVED";
}

function ramlDirection(execution:AbsoluteKernelExecution):-1|0|1 {
  if (execution.raml.decision==="YES") return 1;
  if (execution.raml.decision==="NO") return -1;
  return 0;
}

function ramlStrength(execution:AbsoluteKernelExecution):EvidenceStrength {
  const r=execution.raml;
  if (r.decision==="UNRESOLVED") return "UNRESOLVED";
  if (r.decision==="CONDITIONAL") return "MIXED";

  const primary=r.primaryDirection;
  const witnesses=r.witnessAgreement;
  const judge=r.judgeDirection;

  if (primary!==0 && witnesses===primary && judge===primary) return "STRONG";
  if (primary!==0 && (witnesses===primary || judge===primary)) return "MODERATE";
  if (primary!==0) return "WEAK";
  if (witnesses!==0 && witnesses===judge) return "MODERATE";
  return "WEAK";
}

function directRamlAnswer(decision:AbsoluteDecision,strength:EvidenceStrength):string {
  if (decision==="YES") {
    return strength==="STRONG"
      ? "Yes. The house-first Raml testimony is concordant across the decisive layers."
      : "Yes. The primary house gives a favorable direction, though the later testimony is not fully concordant.";
  }
  if (decision==="NO") {
    return strength==="STRONG"
      ? "No. The house-first Raml testimony is concordantly unfavorable across the decisive layers."
      : "No. The primary house gives an unfavorable direction, though the later testimony is not fully concordant.";
  }
  if (decision==="CONDITIONAL") {
    return "Conditional. The primary question-house testimony gives a direction, but later Raml testimony materially contradicts it.";
  }
  return "Unresolved. The executed Raml method does not produce a reliable direction and no other verified method has supplied one.";
}

function synthesizeDecision(execution:AbsoluteKernelExecution):{
  decision:AbsoluteDecision;
  strength:EvidenceStrength;
  answer:string;
  basis:string;
} {
  const td=execution.toukhi.decisionDirection;
  const rd=ramlDirection(execution);
  const rs=ramlStrength(execution);

  // A verified Toukhi rule becomes primary only when its own router fired for
  // the actual question. This is method relevance, not numeric weighting.
  if (td!==null && td!==0) {
    const tDecision=directionToDecision(td);
    const label=execution.toukhi.annualParity?.traditionalLabel ?? "verified source classification";
    const rule=execution.toukhi.decisionRuleId ?? "verified Toukhi rule";

    if (rd!==0 && rd!==td) {
      return {
        decision:"CONDITIONAL",
        strength:"MIXED",
        answer:`Conditional. The directly relevant Ṭūkhī rule classifies the matter as ${label}, while the house-first Raml cross-check points the other way. The engine preserves the conflict instead of averaging it away.`,
        basis:`${rule} is primary because it directly matches the annual/timing question; Raml is retained as a contradictory cross-check.`
      };
    }

    return {
      decision:tDecision,
      strength:rd===td ? "STRONG" : "MODERATE",
      answer:tDecision==="YES"
        ? `Yes, under the verified Ṭūkhī annual rule: the calculation is classed ${label}.${rd===td?" The Raml cross-check agrees.":""}`
        : `No, under the verified Ṭūkhī annual rule: the calculation is classed ${label}.${rd===td?" The Raml cross-check agrees.":""}`,
      basis:`${rule} is the directly relevant sourced method for the annual/timing question${rd===td?", with Raml concordance":""}.`
    };
  }

  const decision:AbsoluteDecision=execution.raml.decision;
  return {
    decision,
    strength:rs,
    answer:directRamlAnswer(decision,rs),
    basis:`Primary House ${execution.raml.primaryHouse} / ${execution.raml.primaryFigure}, followed by witness and Judge precedence under ${execution.raml.execution.pack.name}.`
  };
}

export function synthesizeAbsolute(execution:AbsoluteKernelExecution):AbsoluteSynthesis {
  const evidence:DecisionEvidence[]=[];
  const r=execution.raml;

  const primaryRule=r.execution.matchedRules.find((rule)=>rule.ruleId==="RAML-HOUSE-PRIMARY");
  if (primaryRule) {
    evidence.push({
      id:primaryRule.ruleId,
      layer:"RAML",
      role:execution.toukhi.decisionDirection!==null ? "SUPPORTING" : "DECISIVE",
      direction:primaryRule.direction,
      statement:primaryRule.statement,
      source:primaryRule.source
    });
  }

  for (const rule of r.execution.matchedRules) {
    if (rule.ruleId==="RAML-HOUSE-PRIMARY") continue;
    evidence.push({
      id:rule.ruleId,
      layer:"RAML",
      role:rule.ruleId.startsWith("RAML-HOUSE-SUPPORT") || rule.ruleId==="RAML-JUDGE" || rule.ruleId.startsWith("RAML-WITNESS")
        ? "SUPPORTING"
        : "CONTEXT",
      direction:rule.direction,
      statement:rule.statement,
      source:rule.source
    });
  }

  if (execution.toukhi.decisionDirection!==null && execution.toukhi.decisionStatement) {
    evidence.unshift({
      id:execution.toukhi.decisionRuleId ?? "TOUKHI-VERIFIED",
      layer:"TOUKHI",
      role:"DECISIVE",
      direction:execution.toukhi.decisionDirection,
      statement:execution.toukhi.decisionStatement,
      source:"عبد الفتاح السيد الطوخي، البداية والنهاية — scan pages 6-7"
    });
  }

  if (execution.toukhi.subjectName) {
    evidence.push({
      id:"TOUKHI-NAME-ELEMENTS",
      layer:"TOUKHI",
      role:"CONTEXT",
      direction:0,
      statement:`Ṭūkhī elemental name balance computed for the subject; dominant-by-weight: ${execution.toukhi.subjectName.dominantByWeight.join(", ") || "tie"}.`,
      source:"البداية والنهاية — scan pages 9-19"
    });
  }

  if (execution.toukhi.nameComparison) {
    evidence.push({
      id:"TOUKHI-NAME-COMPARISON",
      layer:"TOUKHI",
      role:"CONTEXT",
      direction:0,
      statement:`Ṭūkhī interpersonal elemental comparison computed; dominant relation: ${execution.toukhi.nameComparison.dominantRelation}. It remains context-only until the worked recommendation logic is fully generalized from the source.`,
      source:"البداية والنهاية — scan pages 20-22"
    });
  }

  const nameExecutions=[
    ["subject",execution.abjad.subject],
    ["mother",execution.abjad.mother],
    ["otherParty",execution.abjad.otherParty]
  ] as const;
  for (const [label,item] of nameExecutions) {
    if (!item) continue;
    evidence.push({
      id:`ABJAD-${label.toUpperCase()}`,
      layer:"ABJAD",
      role:"CONTEXT",
      direction:0,
      statement:`${label} Abjad total = ${item.total}; declared cycle readings were computed and retained in the audit trace.`,
      source:"ALLAMA Omega Raml/Abjad Masterbook — declared arithmetic/cycle tables"
    });
  }

  if (execution.falaki) {
    evidence.push({
      id:"FALAKI-CURRENT-HOUR",
      layer:"FALAKI",
      role:"CONTEXT",
      direction:0,
      statement:`Current planetary hour = ${execution.falaki.currentHour.planet}, ordinal ${execution.falaki.currentHour.ordinal}; solar-boundary verification passed=${execution.falaki.verification.dayPass&&execution.falaki.verification.nightPass}.`,
      source:execution.falaki.source.method
    });
  }

  for (const unresolved of execution.unresolvedMethodNeeds) {
    evidence.push({
      id:`SOURCE-GATE-${evidence.filter((item)=>item.layer==="SOURCE-GATE").length+1}`,
      layer:"SOURCE-GATE",
      role:"BLOCKER",
      direction:0,
      statement:unresolved,
      source:"Kernel source-gate"
    });
  }

  const synthesized=synthesizeDecision(execution);

  return {
    decision:synthesized.decision,
    strength:synthesized.strength,
    answer:synthesized.answer,
    decisiveBasis:synthesized.basis,
    evidence,
    unresolved:[...execution.unresolvedMethodNeeds],
    audit:{
      noInventedWeights:true,
      noUnsourcedAbjadDirection:true,
      noUnsourcedFalakiDirection:true,
      sourceGated:true,
      methodRelevanceRouting:true
    }
  };
}
