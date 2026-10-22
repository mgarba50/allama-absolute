export type ToukhiScreenClass =
  | "PROSE"
  | "MIXED"
  | "ARITHMETIC"
  | "LETTER_TABLES"
  | "NUMERICAL_TABLES"
  | "AWFAQ"
  | "DIAGRAMS"
  | "WORKED_CALCULATIONS";

export interface ToukhiScreenRange {
  start:number;
  end:number;
  classes:readonly ToukhiScreenClass[];
  priority:"NORMAL"|"HIGH"|"CRITICAL";
  note:string;
}

/**
 * Low-resolution visual screening map of the complete logical 1-252 corpus.
 * This is a discovery/prioritization map only. It does NOT mark pages verified
 * and it contains no interpretive claims.
 */
export const TOUKHI_SCREENING_MAP:readonly ToukhiScreenRange[] = [
  {start:1,end:5,classes:["PROSE"],priority:"NORMAL",note:"Opening material and early names/letters discussion; page 4 disproves a legacy formula attribution."},
  {start:6,end:7,classes:["ARITHMETIC","WORKED_CALCULATIONS"],priority:"CRITICAL",note:"Year/age arithmetic with worked historical examples; first independently re-verified executable rule."},
  {start:8,end:15,classes:["MIXED"],priority:"HIGH",note:"Mixed explanatory material with numerical content and at least one compact table."},
  {start:16,end:24,classes:["LETTER_TABLES","NUMERICAL_TABLES"],priority:"CRITICAL",note:"Multiple compact correspondence/value tables requiring cell-accurate extraction."},
  {start:25,end:36,classes:["MIXED","ARITHMETIC","LETTER_TABLES"],priority:"CRITICAL",note:"Worked numerical passages and tables; page 35 is letter-number material, not planetary-hour arithmetic."},
  {start:37,end:84,classes:["LETTER_TABLES","NUMERICAL_TABLES","WORKED_CALCULATIONS"],priority:"CRITICAL",note:"Long, exceptionally dense run of numerical/letter tables and transformations."},
  {start:85,end:96,classes:["MIXED","LETTER_TABLES"],priority:"HIGH",note:"Transition from tables into prose-heavy explanations with retained computational material."},
  {start:97,end:120,classes:["MIXED","ARITHMETIC","DIAGRAMS"],priority:"CRITICAL",note:"Several arithmetic layouts, small matrices, and geometric/relationship diagrams."},
  {start:121,end:166,classes:["AWFAQ","NUMERICAL_TABLES","WORKED_CALCULATIONS"],priority:"CRITICAL",note:"Major awfaq/magic-square construction block with many worked grids and variants."},
  {start:167,end:180,classes:["MIXED","DIAGRAMS"],priority:"HIGH",note:"Diagrammatic and prose material, including circular/geometric layouts."},
  {start:181,end:205,classes:["NUMERICAL_TABLES","DIAGRAMS"],priority:"CRITICAL",note:"Long tabular correspondence sequence with large repeated matrices."},
  {start:206,end:216,classes:["MIXED","NUMERICAL_TABLES","DIAGRAMS"],priority:"CRITICAL",note:"Tables, circular diagrams, and compact numerical procedures."},
  {start:217,end:228,classes:["ARITHMETIC","WORKED_CALCULATIONS"],priority:"CRITICAL",note:"Repeated vertical arithmetic/reduction workings embedded in explanatory text."},
  {start:229,end:244,classes:["NUMERICAL_TABLES","LETTER_TABLES"],priority:"CRITICAL",note:"Dense multi-page table sequence; must be captured structurally rather than summarized."},
  {start:245,end:252,classes:["PROSE","MIXED"],priority:"HIGH",note:"Prose-dominant closing part of this five-volume logical corpus; still requires full verification for hidden rules."}
] as const;

export function toukhiScreeningPagesCovered():number {
  const pages=new Set<number>();
  for (const range of TOUKHI_SCREENING_MAP) {
    for (let page=range.start;page<=range.end;page+=1) pages.add(page);
  }
  return pages.size;
}

export function toukhiCriticalScreenRanges():readonly ToukhiScreenRange[] {
  return TOUKHI_SCREENING_MAP.filter((range)=>range.priority==="CRITICAL");
}
