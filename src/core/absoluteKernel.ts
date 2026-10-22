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
      "A sourced rule pack is still required to interpret name-to-name Abjad relations. The kernel records the arithmetic but does not assign compatibility from equality/difference alone."
    );
  }
  if (input.motherName?.trim()) {
    unresolvedMethodNeeds.push(
      "The verified Toukhi full-name balance can use the mother's name as a declared school variant, but that structural result remains decision-gated until the complete corpus is verified. The old name+mother÷9 shortcut remains quarantined."
    );
  }
  if (falaki) {
    unresolvedMethodNeeds.push(
      "A separate sourced Falaki interpretation pack is required before planetary hours, zodiac positions, or lunar mansions can change a verdict. Falaki Core currently computes facts only."
    );
  }
  if (!toukhi.activation.active) {
    unresolvedMethodNeeds.push(
      `Ṭūkhī corpus is source-gated: ${toukhi.activation.verifiedPages}/${toukhi.activation.logicalPages} logical pages completely verified; ${toukhi.activation.screenedPages} pages screened; ${toukhi.activation.quarantinedItems} legacy item(s) quarantined.`
    );
  }

  const notes=[
    "The Raml decision is house-first and records every matched rule in precedence order.",
    "Abjad calculations are mechanically reproducible and table-scoped.",
    "Falaki calculations use real local solar boundaries and verified unequal planetary hours when timing coordinates are supplied.",
    "Recovered Toukhi material is isolated behind a complete-corpus activation gate.",
    "False legacy page attributions are quarantined rather than executed.",
    "No Abjad, Falaki, or Toukhi correspondence is converted into a favorable/unfavorable practitioner judgment without a verified source rule."
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
