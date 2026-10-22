import { executeAbjadName, compareAbjadNames, type AbjadNameExecution, type AbjadRelation } from "./abjadMethodPack";
import { runStructuralFormula, type StructuralFormulaResult } from "./formulaKernel";
import { executeRamlCore, type RamlCoreJudgment } from "./ramlMethodPack";
import { executeFalakiCore, type FalakiCoreExecution } from "./falakiMethodPack";
import { executeToukhiCandidate, type ToukhiCandidateExecution } from "./toukhiMethodPack";

export interface AbsoluteKernelInput {
  question:string;
  subjectName?:string;
  motherName?:string;
  otherParty?:string;
  birthYear?:number;
  targetYear?:number;
  timing?:{
    moment:Date;
    latitude:number;
    longitude:number;
  };
  /** Internal/source-audit control. Normal UI should not populate this. */
  toukhiVerifiedPages?:readonly number[];
}

export interface AbsoluteKernelExecution {
  input:AbsoluteKernelInput;
  structural:StructuralFormulaResult;
  raml:RamlCoreJudgment;
  abjad:{
    subject?:AbjadNameExecution;
    mother?:AbjadNameExecution;
    otherParty?:AbjadNameExecution;
    subjectToOtherParty?:AbjadRelation;
  };
  falaki?:FalakiCoreExecution;
  toukhi:ToukhiCandidateExecution;
  unresolvedMethodNeeds:readonly string[];
  audit:{
    formulaTrace:StructuralFormulaResult["trace"];
    ramlRules:RamlCoreJudgment["execution"]["matchedRules"];
    abjadTraces:readonly string[];
    falakiTrace:readonly string[];
    toukhiBlockers:readonly string[];
    notes:readonly string[];
  };
}

export function runAbsoluteKernel(input:AbsoluteKernelInput):AbsoluteKernelExecution {
  const structural=runStructuralFormula(input);
  const raml=executeRamlCore(structural);

  const subject=input.subjectName?.trim() ? executeAbjadName(input.subjectName) : undefined;
  const mother=input.motherName?.trim() ? executeAbjadName(input.motherName) : undefined;
  const otherParty=input.otherParty?.trim() ? executeAbjadName(input.otherParty) : undefined;
  const subjectToOtherParty=input.subjectName?.trim() && input.otherParty?.trim()
    ? compareAbjadNames(input.subjectName,input.otherParty)
    : undefined;

  const falaki=input.timing ? executeFalakiCore({
    moment:input.timing.moment,
    latitude:input.timing.latitude,
    longitude:input.timing.longitude
  }) : undefined;

  const toukhi=executeToukhiCandidate({
    question:input.question,
    personName:input.subjectName,
    motherName:input.motherName,
    otherParty:input.otherParty,
    birthYear:input.birthYear,
    targetYear:input.targetYear,
    verifiedPages:input.toukhiVerifiedPages ?? []
  });

  const unresolvedMethodNeeds:string[]=[];
  if (subjectToOtherParty) {
    unresolvedMethodNeeds.push(
      "Generic Abjad name-to-name equality/difference remains context-only. Ṭūkhī pages 20-22 provide a richer elemental-balance comparison that is being kept separate rather than collapsed into a generic compatibility shortcut."
    );
  }
  if (input.motherName?.trim()) {
    unresolvedMethodNeeds.push(
      "Ṭūkhī pages 30-31 verify a full-name lineage variant using the mother's or father's name, but the source treats lineage choice as a school variant; the selected policy must remain consistent across comparisons. The old name+mother÷9 shortcut remains quarantined."
    );
  }
  if (falaki) {
    unresolvedMethodNeeds.push(
      "Falaki Core computes solar boundaries and planetary hours, but no favorable/unfavorable Falaki direction is assigned without a separately verified interpretive rule."
    );
  }
  if (!toukhi.activation.active) {
    unresolvedMethodNeeds.push(
      `Ṭūkhī full-corpus transcription remains incomplete (${toukhi.activation.verifiedPages}/${toukhi.activation.logicalPages} pages fully verified), but individually verified rules may execute by page provenance; ${toukhi.activation.quarantinedItems} legacy item(s) remain quarantined.`
    );
  }

  const notes=[
    "The Raml decision is house-first and records every matched rule in precedence order.",
    "Abjad calculations are mechanically reproducible and table-scoped.",
    "Falaki calculations use real local solar boundaries and verified unequal planetary hours when timing coordinates are supplied.",
    "Ṭūkhī rules activate individually after direct page verification; whole-book coverage is a quality metric, not an all-or-nothing lock.",
    "False legacy page attributions are quarantined rather than executed.",
    "No Abjad, Falaki, or Ṭūkhī correspondence is converted into a practitioner direction without a verified rule that actually supplies direction."
  ];

  const abjadTraces=[
    ...(subject?.trace ?? []),
    ...(mother?.trace ?? []),
    ...(otherParty?.trace ?? [])
  ];

  return {
    input:{...input},
    structural,
    raml,
    abjad:{subject,mother,otherParty,subjectToOtherParty},
    falaki,
    toukhi,
    unresolvedMethodNeeds,
    audit:{
      formulaTrace:structural.trace,
      ramlRules:raml.execution.matchedRules,
      abjadTraces,
      falakiTrace:falaki?.trace ?? [],
      toukhiBlockers:toukhi.activation.blockers,
      notes
    }
  };
}
