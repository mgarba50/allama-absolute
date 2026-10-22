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

export interface ToukhiCandidateExecution {
  activation:ToukhiActivationReport;
  annualParity?:ToukhiAnnualParityResult;
  decisionDirection:null;
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
      note:"Traditional arithmetic rule visually verified on PDF pages 6-7; source interpretation is recorded without scientific endorsement."
    },
    decisionEligible:false
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

export function executeToukhiCandidate(input:{
  birthYear?:number;
  targetYear?:number;
  verifiedPages?:readonly number[];
}):ToukhiCandidateExecution {
  const activation=toukhiActivationReport(input.verifiedPages ?? []);
  const notes:string[]=[
    "All 252 logical pages have been visually screened, but complete source transcription/verification is still gated.",
    "The legacy AlToukhiArchive is used only as a discovery index because multiple page attributions failed direct visual checking.",
    "Only independently re-verified source rules may execute.",
    "The visually verified pages 6-7 annual parity rule remains decision-ineligible until the complete 1-252 corpus gate passes."
  ];

  const annualParity=Number.isInteger(input.birthYear) && Number.isInteger(input.targetYear)
    ? executeVerifiedAnnualYearParity(input.birthYear!,input.targetYear!)
    : undefined;

  return {
    activation,
    annualParity,
    decisionDirection:null,
    notes
  };
}
