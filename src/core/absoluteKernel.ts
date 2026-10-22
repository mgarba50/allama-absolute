import { executeAbjadName, compareAbjadNames, type AbjadNameExecution, type AbjadRelation } from "./abjadMethodPack";
import { runStructuralFormula, type StructuralFormulaResult } from "./formulaKernel";
import { executeRamlCore, type RamlCoreJudgment } from "./ramlMethodPack";

export interface AbsoluteKernelInput {
  question:string;
  subjectName?:string;
  motherName?:string;
  otherParty?:string;
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
  unresolvedMethodNeeds:readonly string[];
  audit:{
    formulaTrace:StructuralFormulaResult["trace"];
    ramlRules:RamlCoreJudgment["execution"]["matchedRules"];
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
  unresolvedMethodNeeds.push(
    "Ṭūkhī-specific precedence/formulas are not active until they are extracted from an identifiable source text."
  );

  const notes=[
    "The Raml decision is house-first and records every matched rule in precedence order.",
    "Abjad calculations are mechanically reproducible and table-scoped.",
    "No Abjad correspondence is converted into a favorable/unfavorable judgment without a sourced interpretation rule."
  ];

  return {
    input:{...input},
    structural,
    raml,
    abjad:{subject,mother,otherParty,subjectToOtherParty},
    unresolvedMethodNeeds,
    audit:{
      formulaTrace:structural.trace,
      ramlRules:raml.execution.matchedRules,
      notes
    }
  };
}
