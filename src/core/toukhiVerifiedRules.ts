export type ToukhiVerifiedRuleFamily =
  | "YEAR_PARITY"
  | "ELEMENTAL_LETTERS"
  | "LETTER_BALANCE"
  | "NAME_RELATION"
  | "REDUCED_NAME_NUMBER"
  | "FULL_NAME_LINEAGE";

export interface ToukhiVerifiedRuleRecord {
  id:string;
  family:ToukhiVerifiedRuleFamily;
  title:string;
  pages:readonly number[];
  verificationScope:"RULE_ONLY";
  executable:boolean;
  decisionEligible:boolean;
  notes:readonly string[];
}

export const TOUKHI_VERIFIED_RULES:readonly ToukhiVerifiedRuleRecord[] = [
  {
    id:"TK-VR-001",
    family:"YEAR_PARITY",
    title:"Annual year/age parity procedure",
    pages:[6,7],
    verificationScope:"RULE_ONLY",
    executable:true,
    decisionEligible:false,
    notes:["Worked examples were checked against the scan; the result remains a traditional classification rather than scientific prediction."]
  },
  {
    id:"TK-VR-002",
    family:"ELEMENTAL_LETTERS",
    title:"Four elemental letter groups, dominance, gender-nature and friend/enemy matrix",
    pages:[9,10,11,12,13,14,15],
    verificationScope:"RULE_ONLY",
    executable:true,
    decisionEligible:false,
    notes:["The four seven-letter groups and the explicit friendship/enmity pairings were checked directly in the scan."]
  },
  {
    id:"TK-VR-003",
    family:"LETTER_BALANCE",
    title:"Ordinal-over-seven letter balance",
    pages:[16,17,18,19],
    verificationScope:"RULE_ONLY",
    executable:true,
    decisionEligible:false,
    notes:["Letter ordinal positions and elemental subtotal comparison were verified from the worked name examples."]
  },
  {
    id:"TK-VR-004",
    family:"NAME_RELATION",
    title:"Interpersonal name-balance comparison structure",
    pages:[20,21,22],
    verificationScope:"RULE_ONLY",
    executable:true,
    decisionEligible:false,
    notes:["The source applies name balances to relationship comparison; only the structural layer is generalized until all decision branches are transcribed."]
  },
  {
    id:"TK-VR-005",
    family:"REDUCED_NAME_NUMBER",
    title:"Repeating 1-9 letter-value name reduction",
    pages:[24,25,26],
    verificationScope:"RULE_ONLY",
    executable:true,
    decisionEligible:false,
    notes:["The مصطفى example verifies the arithmetic. Zero-remainder handling remains deliberately unresolved for this exact method."]
  },
  {
    id:"TK-VR-006",
    family:"FULL_NAME_LINEAGE",
    title:"Full-name balance with declared mother/father lineage policy",
    pages:[30,31],
    verificationScope:"RULE_ONLY",
    executable:true,
    decisionEligible:false,
    notes:["The source records a school disagreement over mother versus father naming and requires methodological consistency."]
  }
] as const;

export function toukhiVerifiedRulePages():readonly number[] {
  return [...new Set(TOUKHI_VERIFIED_RULES.flatMap((rule)=>rule.pages))].sort((a,b)=>a-b);
}

export function toukhiVerifiedExecutableRuleCount():number {
  return TOUKHI_VERIFIED_RULES.filter((rule)=>rule.executable).length;
}
