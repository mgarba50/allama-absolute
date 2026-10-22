import { toukhiActivationReport, type ToukhiActivationReport } from "./toukhiCorpus";
import {
  analyzeToukhiFullName,
  analyzeToukhiName,
  analyzeToukhiReducedNameNumber,
  compareToukhiNames,
  type ToukhiFullNameProfile,
  type ToukhiNameComparison,
  type ToukhiNameProfile,
  type ToukhiReducedNameNumber
} from "./toukhiNameEngine";

export type ToukhiDecisionDirection = -1|0|1;

export interface ToukhiAnnualParityResult {
  birthYear:number;
  targetYear:number;
  ageByYearSubtraction:number;
  combined:number;
  digitSum:number;
  parity:"ODD"|"EVEN";
  traditionalLabel:"سعادة/صعود"|"نحس/نزول";
  source:{
    pages:readonly [6,7];
    status:"VISUALLY_VERIFIED";
    note:string;
  };
  decisionEligible:true;
}

export interface ToukhiVerifiedRule {
  id:string;
  pages:readonly number[];
  status:"VERIFIED_ACTIVE"|"VERIFIED_CONTEXT_ONLY"|"QUARANTINED";
  title:string;
}

export interface ToukhiCandidateExecution {
  activation:ToukhiActivationReport;
  verifiedRules:readonly ToukhiVerifiedRule[];
  annualParity?:ToukhiAnnualParityResult;
  subjectName?:ToukhiNameProfile;
  subjectReducedNumber?:ToukhiReducedNameNumber;
  subjectWithMother?:ToukhiFullNameProfile;
  otherPartyName?:ToukhiNameProfile;
  otherPartyReducedNumber?:ToukhiReducedNameNumber;
  nameComparison?:ToukhiNameComparison;
  decisionDirection:ToukhiDecisionDirection|null;
  decisionRuleId:string|null;
  decisionStatement:string|null;
  notes:readonly string[];
}

function decimalDigitSum(value:number):number {
  return [...String(Math.abs(Math.trunc(value)))]
    .filter((char)=>/\d/.test(char))
    .reduce((sum,char)=>sum+Number(char),0);
}

/**
 * Pages 6-7 visibly describe this traditional year/age procedure.
 * It is preserved as a historical/source computation, not scientific fact.
 */
export function executeVerifiedAnnualYearParity(
  birthYear:number,
  targetYear:number
):ToukhiAnnualParityResult {
  if (!Number.isInteger(birthYear) || !Number.isInteger(targetYear)) {
    throw new Error("Birth year and target year must be whole-number years.");
  }
  if (targetYear<birthYear) {
    throw new Error("Target year must not precede birth year.");
  }
  const ageByYearSubtraction=targetYear-birthYear;
  const combined=targetYear+ageByYearSubtraction;
  const digitSum=decimalDigitSum(combined);
  const parity=digitSum%2===0 ? "EVEN" : "ODD";
  return {
    birthYear,
    targetYear,
    ageByYearSubtraction,
    combined,
    digitSum,
    parity,
    traditionalLabel:parity==="ODD" ? "سعادة/صعود" : "نحس/نزول",
    source:{
      pages:[6,7],
      status:"VISUALLY_VERIFIED",
      note:"Traditional arithmetic rule visually verified on scan pages 6-7: age in target year + target year -> digit sum; odd is classed سعيد/سعد and even نحس."
    },
    decisionEligible:true
  };
}

function quarantinedLegacy(id:string,reason:string):never {
  throw new Error(`${id} is not executable: ${reason}`);
}

export function executeRecoveredNameMotherNine(_personName:string,_motherName:string):never {
  return quarantinedLegacy(
    "FRM-001",
    "legacy page-4 attribution failed visual checking; the claim remains only a discovery hint until independently relocated."
  );
}

export function executeRecoveredWafq4Key(_total:number):never {
  return quarantinedLegacy(
    "FRM-012",
    "legacy page-39 attribution failed visual checking; the claim remains only a discovery hint until independently relocated."
  );
}

export function executeRecoveredWafq5Key(_total:number):never {
  return quarantinedLegacy(
    "WQF-051",
    "the old archive page map is globally unreliable; this recovered formula must be independently relocated before execution."
  );
}

export function executeRecoveredTaksirTailHead(_text:string):never {
  return quarantinedLegacy(
    "TAK-042",
    "the old archive page map is globally unreliable; this recovered algorithm must be independently relocated before execution."
  );
}

function questionRequestsYearFortune(question:string):boolean {
  const q=question.toLowerCase();
  const terms=[
    "year","annual","this year","next year","target year","fortunate","unfortunate",
    "سنة","السنة","عام","العام","سعيد","سعادة","نحس","منحوس","هذه السنة","هذا العام"
  ];
  return terms.some((term)=>q.includes(term));
}

export function executeToukhiCandidate(input:{
  question?:string;
  personName?:string;
  motherName?:string;
  otherParty?:string;
  birthYear?:number;
  targetYear?:number;
  verifiedPages?:readonly number[];
}):ToukhiCandidateExecution {
  const activation=toukhiActivationReport(input.verifiedPages ?? []);

  const verifiedRules:ToukhiVerifiedRule[]=[
    {id:"TK-YEAR-PARITY-006",pages:[6,7],status:"VERIFIED_ACTIVE",title:"Age + target year -> digit-sum parity classification"},
    {id:"TK-NAME-ELEMENTS-009",pages:[9,10,11,12,13,14,15,16,17,18,19],status:"VERIFIED_CONTEXT_ONLY",title:"Elemental letter groups and name balance"},
    {id:"TK-NAME-COMPARE-020",pages:[20,21,22],status:"VERIFIED_CONTEXT_ONLY",title:"Interpersonal elemental-name comparison"},
    {id:"TK-NAME-REDUCE9-024",pages:[24,25,26],status:"VERIFIED_CONTEXT_ONLY",title:"Repeating 1-9 letter-value name reduction"},
    {id:"TK-FULL-NAME-030",pages:[30,31],status:"VERIFIED_CONTEXT_ONLY",title:"Full-name composition and lineage-policy variant"},
    {id:"FRM-001",pages:[4],status:"QUARANTINED",title:"Legacy name+mother÷9 attribution"},
    {id:"FRM-012",pages:[39],status:"QUARANTINED",title:"Legacy 4x4 wafq-key attribution"}
  ];

  const notes:string[]=[
    "Ṭūkhī rules now activate individually after direct page verification; complete-book verification is retained as a corpus-quality metric, not an all-or-nothing execution lock.",
    "Legacy extraction notes remain discovery hints only when their page attributions fail visual checking.",
    "Pages 9-22 elemental/name-balance machinery executes structurally but does not yet become a binary practitioner verdict because the worked examples are more nuanced than a single same/friend/enemy shortcut.",
    "Pages 24-26 reduced 1-9 name-number arithmetic executes structurally; the exact zero-remainder convention for this source remains unassigned.",
    "Pages 30-31 preserve a mother-name/father-name school variant; the selected lineage policy must stay consistent across comparisons."
  ];

  const annualParity=Number.isInteger(input.birthYear) && Number.isInteger(input.targetYear)
    ? executeVerifiedAnnualYearParity(input.birthYear!,input.targetYear!)
    : undefined;

  const subjectName=input.personName?.trim()
    ? analyzeToukhiName(input.personName)
    : undefined;
  const subjectReducedNumber=input.personName?.trim()
    ? analyzeToukhiReducedNameNumber(input.personName)
    : undefined;
  const subjectWithMother=input.personName?.trim() && input.motherName?.trim()
    ? analyzeToukhiFullName(input.personName,input.motherName,"MOTHER")
    : undefined;

  const otherPartyName=input.otherParty?.trim()
    ? analyzeToukhiName(input.otherParty)
    : undefined;
  const otherPartyReducedNumber=input.otherParty?.trim()
    ? analyzeToukhiReducedNameNumber(input.otherParty)
    : undefined;
  const nameComparison=input.personName?.trim() && input.otherParty?.trim()
    ? compareToukhiNames(input.personName,input.otherParty)
    : undefined;

  let decisionDirection:ToukhiDecisionDirection|null=null;
  let decisionRuleId:string|null=null;
  let decisionStatement:string|null=null;

  if (annualParity && questionRequestsYearFortune(input.question ?? "")) {
    decisionDirection=annualParity.parity==="ODD" ? 1 : -1;
    decisionRuleId="TK-YEAR-PARITY-006";
    decisionStatement=`Ṭūkhī year rule: ${annualParity.targetYear} + age ${annualParity.ageByYearSubtraction} = ${annualParity.combined}; digit sum ${annualParity.digitSum} is ${annualParity.parity.toLowerCase()}, classed ${annualParity.traditionalLabel}.`;
  }

  return {
    activation,
    verifiedRules,
    annualParity,
    subjectName,
    subjectReducedNumber,
    subjectWithMother,
    otherPartyName,
    otherPartyReducedNumber,
    nameComparison,
    decisionDirection,
    decisionRuleId,
    decisionStatement,
    notes
  };
}
