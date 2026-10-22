import { calculateAbjad, normalizeArabic } from "./abjad";
import { toukhiActivationReport, type ToukhiActivationReport } from "./toukhiCorpus";

export interface ToukhiNameMotherNineResult {
  person:{
    raw:string;
    normalized:string;
    total:number;
  };
  mother:{
    raw:string;
    normalized:string;
    total:number;
  };
  combinedTotal:number;
  divisor:9;
  quotient:number;
  rawRemainder:number;
  source:{
    itemId:"FRM-001";
    page:4;
    status:"RECOVERED_NOT_VISUALLY_VERIFIED";
  };
  interpretation:null;
}

export interface ToukhiWafqKeyResult {
  total:number;
  subtraction:number;
  divisor:number;
  adjusted:number;
  quotient:number;
  remainder:number;
  exact:boolean;
  sourceItemId:"FRM-012"|"WQF-051";
  sourcePage:39|150;
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
  nameMotherNine?:ToukhiNameMotherNineResult;
  wafq4?:ToukhiWafqKeyResult;
  wafq5?:ToukhiWafqKeyResult;
  taksir?:ToukhiTaksirResult;
  decisionDirection:null;
  notes:readonly string[];
}

function positiveRemainder(value:number,divisor:number):number {
  return ((value%divisor)+divisor)%divisor;
}

export function executeRecoveredNameMotherNine(personName:string,motherName:string):ToukhiNameMotherNineResult {
  const person=calculateAbjad(personName);
  const mother=calculateAbjad(motherName);
  const combinedTotal=person.total+mother.total;
  const rawRemainder=positiveRemainder(combinedTotal,9);
  return {
    person:{raw:personName,normalized:person.normalized,total:person.total},
    mother:{raw:motherName,normalized:mother.normalized,total:mother.total},
    combinedTotal,
    divisor:9,
    quotient:Math.floor(combinedTotal/9),
    rawRemainder,
    source:{itemId:"FRM-001",page:4,status:"RECOVERED_NOT_VISUALLY_VERIFIED"},
    interpretation:null
  };
}

export function executeRecoveredWafq4Key(total:number):ToukhiWafqKeyResult {
  if (!Number.isFinite(total)) throw new Error("Wafq total must be finite.");
  const adjusted=total-30;
  const remainder=positiveRemainder(adjusted,4);
  return {
    total,subtraction:30,divisor:4,adjusted,
    quotient:Math.floor(adjusted/4),
    remainder,
    exact:remainder===0,
    sourceItemId:"FRM-012",
    sourcePage:39
  };
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
    sourcePage:150
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
  personName?:string;
  motherName?:string;
  wafqTarget?:number;
  taksirText?:string;
  verifiedPages?:readonly number[];
}):ToukhiCandidateExecution {
  const activation=toukhiActivationReport(input.verifiedPages ?? []);
  const notes:string[]=[
    "Recovered calculations are executable for arithmetic verification only.",
    "No recovered Toukhi calculation may influence a practitioner verdict until the 1-252 corpus activation gate passes.",
    "Even after corpus activation, a numerical remainder does not receive a favorable/unfavorable meaning without its explicit source interpretation table."
  ];

  const nameMotherNine=input.personName?.trim() && input.motherName?.trim()
    ? executeRecoveredNameMotherNine(input.personName,input.motherName)
    : undefined;

  const wafq4=typeof input.wafqTarget==="number" ? executeRecoveredWafq4Key(input.wafqTarget) : undefined;
  const wafq5=typeof input.wafqTarget==="number" ? executeRecoveredWafq5Key(input.wafqTarget) : undefined;
  const taksir=input.taksirText?.trim() ? executeRecoveredTaksirTailHead(input.taksirText) : undefined;

  return {
    activation,
    nameMotherNine,
    wafq4,
    wafq5,
    taksir,
    decisionDirection:null,
    notes
  };
}
