import { executeAbjadName, compareAbjadNames, type AbjadNameExecution, type AbjadRelation } from "./abjadMethodPack";
import { runStructuralFormula, type StructuralFormulaResult } from "./formulaKernel";
import { executeRamlCore, type RamlCoreJudgment } from "./ramlMethodPack";
import { executeFalakiCore, type FalakiCoreExecution } from "./falakiMethodPack";

export interface AbsoluteKernelInput {
  question:string;
  subjectName?:string;
  motherName?:string;
  otherParty?:string;
  timing?:{
    moment:Date;
    latitude:number;
    longitude:number;
  };
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
  unresolvedMethodNeeds:readonly string[];
  audit:{
    formulaTrace:StructuralFormulaResult["trace"];
    ramlRules:RamlCoreJudgment["execution"]["matchedRules"];
    abjadTraces:readonly string[];
    falakiTrace:readonly string[];
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

  const unresolvedMethodNeeds:string[]=[];
  if (subjectToOtherParty) {
    unresolvedMethodNeeds.push(
      "A sourced rule pack is still required to interpret name-to-name Abjad relations. The kernel records the arithmetic but does not assign compatibility from equality/difference alone."
    );
  }
  if (input.motherName?.trim()) {
    unresolvedMethodNeeds.push(
      "A sourced method is still required before mother-name arithmetic can alter a verdict. The kernel calculates it but does not invent a weighting."
    );
  }
  if (falaki) {
    unresolvedMethodNeeds.push(
      "A separate sourced Falaki interpretation pack is required before planetary hours, zodiac positions, or lunar mansions can change a verdict. Falaki Core currently computes facts only."
    );
  }
  unresolvedMethodNeeds.push(
    "Ṭūkhī-specific precedence/formulas are not active until they are extracted from an identifiable source text."
  );

  const notes=[
    "The Raml decision is house-first and records every matched rule in precedence order.",
    "Abjad calculations are mechanically reproducible and table-scoped.",
    "Falaki calculations use real local solar boundaries and verified unequal planetary hours when timing coordinates are supplied.",
    "No Abjad or Falaki correspondence is converted into a favorable/unfavorable judgment without a sourced interpretation rule."
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
    unresolvedMethodNeeds,
    audit:{
      formulaTrace:structural.trace,
      ramlRules:raml.execution.matchedRules,
      abjadTraces,
      falakiTrace:falaki?.trace ?? [],
      notes
    }
  };
}
