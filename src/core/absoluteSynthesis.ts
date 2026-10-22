import type { AbsoluteKernelExecution } from "./absoluteKernel";

export type AbsoluteDecision = "YES"|"NO"|"CONDITIONAL"|"UNRESOLVED";
export type EvidenceStrength = "STRONG"|"MODERATE"|"MIXED"|"WEAK"|"UNRESOLVED";

export interface DecisionEvidence {
  id:string;
  layer:"RAML"|"ABJAD"|"FALAKI"|"SOURCE-GATE";
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
  };
}

function decisionDirection(decision:AbsoluteDecision):-1|0|1 {
  if (decision==="YES") return 1;
  if (decision==="NO") return -1;
  return 0;
}

function strengthFrom(execution:AbsoluteKernelExecution):EvidenceStrength {
  const r=execution.raml;
  if (r.decision==="UNRESOLVED") return "UNRESOLVED";

  const primary=r.primaryDirection;
  const witnesses=r.witnessAgreement;
  const judge=r.judgeDirection;

  if (r.decision==="CONDITIONAL") return "MIXED";
  if (primary!==0 && witnesses===primary && judge===primary) return "STRONG";
  if (primary!==0 && (witnesses===primary || judge===primary)) return "MODERATE";
  if (primary!==0) return "WEAK";
  if (witnesses!==0 && witnesses===judge) return "MODERATE";
  return "WEAK";
}

function directAnswer(decision:AbsoluteDecision,strength:EvidenceStrength):string {
  if (decision==="YES") {
    return strength==="STRONG"
      ? "Yes. The house-first Raml testimony is concordant across the decisive layers."
      : "Yes, but with limited structural support. The primary directional testimony is favorable without full concordance.";
  }
  if (decision==="NO") {
    return strength==="STRONG"
      ? "No. The house-first Raml testimony is concordantly unfavorable across the decisive layers."
      : "No, but with limited structural support. The primary directional testimony is unfavorable without full concordance.";
  }
  if (decision==="CONDITIONAL") {
    return "Conditional. The primary question-house testimony gives a direction, but later testimony materially contradicts it, so the kernel refuses to flatten the conflict into a false yes/no.";
  }
  return "Unresolved. The executed source-gated methods do not yet produce a reliable directional judgment, so the kernel does not force one.";
}

export function synthesizeAbsolute(execution:AbsoluteKernelExecution):AbsoluteSynthesis {
  const evidence:DecisionEvidence[]=[];
  const r=execution.raml;

  const primaryRule=r.execution.matchedRules.find((rule)=>rule.ruleId==="RAML-HOUSE-PRIMARY");
  if (primaryRule) {
    evidence.push({
      id:primaryRule.ruleId,
      layer:"RAML",
      role:"DECISIVE",
      direction:primaryRule.direction,
      statement:primaryRule.statement,
      source:primaryRule.source
    });
  }

  for (const rule of r.execution.matchedRules) {
    if (rule.ruleId==="RAML-HOUSE-PRIMARY") continue;
    const role = rule.ruleId.startsWith("RAML-HOUSE-SUPPORT")
      ? "SUPPORTING"
      : rule.ruleId==="RAML-JUDGE" || rule.ruleId.startsWith("RAML-WITNESS")
        ? "SUPPORTING"
        : "CONTEXT";
    evidence.push({
      id:rule.ruleId,
      layer:"RAML",
      role,
      direction:rule.direction,
      statement:rule.statement,
      source:rule.source
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

  const decision:AbsoluteDecision=r.decision;
  const strength=strengthFrom(execution);
  const answer=directAnswer(decision,strength);
  const decisiveBasis=primaryRule
    ? `Primary House ${r.primaryHouse} / ${r.primaryFigure}, then witness and Judge precedence under ${r.execution.pack.name}.`
    : `No primary directional Raml rule fired under ${r.execution.pack.name}.`;

  return {
    decision,
    strength,
    answer,
    decisiveBasis,
    evidence,
    unresolved:[...execution.unresolvedMethodNeeds],
    audit:{
      noInventedWeights:true,
      noUnsourcedAbjadDirection:true,
      noUnsourcedFalakiDirection:true,
      sourceGated:true
    }
  };
}
