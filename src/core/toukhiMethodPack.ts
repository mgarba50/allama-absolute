import { normalizeArabic } from "./abjad";
import { toukhiActivationReport, type ToukhiActivationReport } from "./toukhiCorpus";

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
  decisionEligible:false;
}

export interface ToukhiWafqKeyResult {
  total:number;
  subtraction:number;
  divisor:number;
  adjusted:number;
  quotient:number;
  remainder:number;
  exact:boolean;
  sourceItemId:"WQF-051";
  sourcePage:150;
  sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED";
}

export interface ToukhiTaksirResult {
  original:string;
  normalized:string;
  rounds:readonly string[];
  source:{
    itemId:"TAK-042";
    page:135;
    status:"RECOVERED_NOT_VISUALLY_VERIFIED";
  };
  interpretation:null;
}

export interface ToukhiCandidateExecution {
  activation:ToukhiActivationReport;
  annualParity?:ToukhiAnnualParityResult;
  wafq5?:ToukhiWafqKeyResult;
  taksir?:ToukhiTaksirResult;
  decisionDirection:null;
  notes:readonly string[];
}

function positiveRemainder(value:number,divisor:number):number {
  return ((value%divisor)+divisor)%divisor;
}

function decimalDigitSum(value:number):number {
  return [...String(Math.abs(Math.trunc(value)))]
    .filter((char)=>/\d/.test(char))
    .reduce((sum,char)=>sum+Number(char),0);
}

/**
 * Pages 6-7 of the scanned source visibly describe this year/age procedure:
 * age in the target year is added to the target year; the decimal digits of
 * that combined number are summed once; odd/even is then given a traditional
 * rise/happiness vs decline/unlucky classification. This function preserves
 * that source logic without claiming scientific predictive validity.
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
      note:"Traditional rule visibly present across PDF pages 6-7; interpretation is recorded as source tradition, not scientific fact."
    },
    decisionEligible:false
  };
}

/**
 * Legacy archive compatibility guard. The old database attributed this formula
 * to page 4, but page 4 was visually checked and does not contain it.
 */
export function executeRecoveredNameMotherNine(_personName:string,_motherName:string):never {
  throw new Error("FRM-001 is quarantined: its legacy page-4 attribution failed visual source checking.");
}

/**
 * Legacy archive compatibility guard. The old database attributed this rule
 * to page 39, but page 39 was visually checked and does not contain it.
 */
export function executeRecoveredWafq4Key(_total:number):never {
  throw new Error("FRM-012 is quarantined: its legacy page-39 attribution failed visual source checking.");
}

export function executeRecoveredWafq5Key(total:number):ToukhiWafqKeyResult {
  if (!Number.isFinite(total)) throw new Error("Wafq total must be finite.");
  const adjusted=total-60;
  const remainder=positiveRemainder(adjusted,5);
  return {
    total,subtraction:60,divisor:5,adjusted,
    quotient:Math.floor(adjusted/5),
    remainder,
    exact:remainder===0,
    sourceItemId:"WQF-051",
    sourcePage:150,
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED"
  };
}

export function executeRecoveredTaksirTailHead(text:string):ToukhiTaksirResult {
  const normalized=normalizeArabic(text);
  const chars=[...normalized].filter((char)=>char.trim().length>0);
  const rounds:string[]=[chars.join("")];
  let current=[...chars];

  for (let round=0;round<Math.max(0,chars.length-1);round+=1) {
    const next:string[]=[];
    let left=0;
    let right=current.length-1;
    while (left<=right) {
      if (right>=left) next.push(current[right]);
      if (left<right) next.push(current[left]);
      left+=1;
      right-=1;
    }
    const value=next.join("");
    if (rounds.includes(value)) break;
    rounds.push(value);
    current=next;
  }

  return {
    original:text,
    normalized,
    rounds,
    source:{itemId:"TAK-042",page:135,status:"RECOVERED_NOT_VISUALLY_VERIFIED"},
    interpretation:null
  };
}

export function executeToukhiCandidate(input:{
  birthYear?:number;
  targetYear?:number;
  wafqTarget?:number;
  taksirText?:string;
  verifiedPages?:readonly number[];
}):ToukhiCandidateExecution {
  const activation=toukhiActivationReport(input.verifiedPages ?? []);
  const notes:string[]=[
    "The legacy page-4 name+mother÷9 claim and page-39 4x4-key claim are quarantined and are not executed.",
    "Pages 6-7 contain a visually verified annual year/age parity calculation; it remains decision-ineligible until the complete 1-252 corpus gate passes.",
    "Recovered-but-unverified calculations may run only for arithmetic testing and never influence a practitioner verdict.",
    "A numerical remainder or correspondence never receives a favorable/unfavorable meaning without its explicit verified interpretation rule."
  ];

  const annualParity=Number.isInteger(input.birthYear) && Number.isInteger(input.targetYear)
    ? executeVerifiedAnnualYearParity(input.birthYear!,input.targetYear!)
    : undefined;

  const wafq5=typeof input.wafqTarget==="number" ? executeRecoveredWafq5Key(input.wafqTarget) : undefined;
  const taksir=input.taksirText?.trim() ? executeRecoveredTaksirTailHead(input.taksirText) : undefined;

  return {
    activation,
    annualParity,
    wafq5,
    taksir,
    decisionDirection:null,
    notes
  };
}
