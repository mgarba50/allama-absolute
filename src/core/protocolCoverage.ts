import type { UniverseQuestion } from "./universe";

export const VALID_DIFFICULTIES = [
  "STANDARD/ADVANCED","HARD","HARDER","HARDEST","OMEGA EDGE","OMEGA-CLASS","ABSOLUTE-CLASS"
] as const;

export const EXECUTABLE_MODULES = [
  "raml","houses","turned-houses","significators","contradictions","question-autopsy",
  "abjad","celestial","timing","migration","mirrors","reverse-judge","remote-lab",
  "comparison","calibration","research","rules","schools","case-search","manuscripts"
] as const;

export type ExecutableModule = typeof EXECUTABLE_MODULES[number];
export type ProtocolFamilyId =
  | "debt-finance"
  | "relationship-family"
  | "business-contract"
  | "employment-authority"
  | "travel-return"
  | "location-lost-remote"
  | "truth-claim"
  | "timing-electional"
  | "comparison-competition"
  | "health-symbolic"
  | "legal-conflict"
  | "abjad-numeric"
  | "research-meta"
  | "open-set";

export type ProtocolOutputShape =
  | "binary"
  | "ranked-hypotheses"
  | "timing-windows"
  | "comparison"
  | "diagnostic"
  | "research"
  | "open";

export interface ProtocolFamily {
  id: ProtocolFamilyId;
  requiredModules: readonly ExecutableModule[];
  optionalModules: readonly ExecutableModule[];
  excludedModules: readonly ExecutableModule[];
  houses: readonly number[];
  turnedHouseRequirements: readonly string[];
  significatorRules: readonly string[];
  outputShape: ProtocolOutputShape;
}

export interface QuestionProtocolCoverage extends ProtocolFamily {
  questionId: string;
  contradictionRequired: boolean;
  falsePremiseCheck: boolean;
  blindModeEligible: boolean;
  reasons: readonly string[];
}

export const PROTOCOL_FAMILIES: Readonly<Record<ProtocolFamilyId,ProtocolFamily>> = {
  "debt-finance":{
    id:"debt-finance",requiredModules:["raml","houses","significators","contradictions"],
    optionalModules:["timing","celestial","case-search","calibration"],excludedModules:[],
    houses:[1,2,7,8],turnedHouseRequirements:["debtor resources from the debtor significator when required"],
    significatorRules:["querent=H1","money/resources=H2","counterparty=H7","counterparty resources=turned H2 from H7"],
    outputShape:"binary"
  },
  "relationship-family":{
    id:"relationship-family",requiredModules:["raml","houses","significators","contradictions"],
    optionalModules:["abjad","timing","case-search","calibration"],excludedModules:[],
    houses:[1,5,7],turnedHouseRequirements:["derive partner/child houses only when the question names that relation"],
    significatorRules:["querent=H1","partner=H7","children/expansion=H5"],outputShape:"binary"
  },
  "business-contract":{
    id:"business-contract",requiredModules:["raml","houses","significators","contradictions"],
    optionalModules:["timing","celestial","comparison","case-search","calibration"],excludedModules:[],
    houses:[1,2,7,10],turnedHouseRequirements:["derive counterparty resources/authority when controlling actor is indirect"],
    significatorRules:["querent=H1","resources=H2","counterparty=H7","authority/outcome=H10"],outputShape:"diagnostic"
  },
  "employment-authority":{
    id:"employment-authority",requiredModules:["raml","houses","significators","contradictions"],
    optionalModules:["timing","celestial","case-search"],excludedModules:[],
    houses:[1,6,10],turnedHouseRequirements:["derive sponsor/gatekeeper houses when authority is delegated"],
    significatorRules:["querent=H1","service/work=H6","office/authority=H10"],outputShape:"diagnostic"
  },
  "travel-return":{
    id:"travel-return",requiredModules:["raml","houses","significators","timing","contradictions"],
    optionalModules:["celestial","migration","case-search"],excludedModules:[],
    houses:[1,3,9],turnedHouseRequirements:["destination or absent-person houses may be derived from the named relationship"],
    significatorRules:["querent=H1","movement/messages=H3","long journey=H9"],outputShape:"timing-windows"
  },
  "location-lost-remote":{
    id:"location-lost-remote",requiredModules:["raml","houses","significators","contradictions"],
    optionalModules:["remote-lab","migration","mirrors","reverse-judge","case-search"],excludedModules:[],
    houses:[1,2,4,7,9],turnedHouseRequirements:["derive the subject house from relationship before deriving possessions/location"],
    significatorRules:["querent=H1","movable property=H2","place/root=H4","other person=H7","distance/journey=H9"],
    outputShape:"ranked-hypotheses"
  },
  "truth-claim":{
    id:"truth-claim",requiredModules:["raml","houses","contradictions","question-autopsy"],
    optionalModules:["significators","case-search","calibration"],excludedModules:[],
    houses:[1,3,7],turnedHouseRequirements:["derive claimant/claimed actor houses when roles differ"],
    significatorRules:["querent=H1","statement/evidence=H3","other party=H7"],outputShape:"ranked-hypotheses"
  },
  "timing-electional":{
    id:"timing-electional",requiredModules:["timing","celestial","raml","contradictions"],
    optionalModules:["houses","significators","case-search"],excludedModules:[],
    houses:[1],turnedHouseRequirements:[],significatorRules:["action subject defaults to H1 unless protocol supplies another house"],
    outputShape:"timing-windows"
  },
  "comparison-competition":{
    id:"comparison-competition",requiredModules:["raml","houses","comparison","contradictions"],
    optionalModules:["significators","timing","case-search"],excludedModules:[],
    houses:[1,7,10],turnedHouseRequirements:["each candidate receives an independent stable significator mapping"],
    significatorRules:["querent=H1","opposition/counterpart=H7","result/rank=H10"],outputShape:"comparison"
  },
  "health-symbolic":{
    id:"health-symbolic",requiredModules:["raml","houses","contradictions"],
    optionalModules:["significators","timing","case-search"],excludedModules:["remote-lab"],
    houses:[1,6,8],turnedHouseRequirements:[],
    significatorRules:["subject=H1 or derived relationship house","traditional illness symbolism=H6"],
    outputShape:"diagnostic"
  },
  "legal-conflict":{
    id:"legal-conflict",requiredModules:["raml","houses","significators","contradictions"],
    optionalModules:["timing","case-search"],excludedModules:[],
    houses:[1,7,9,10],turnedHouseRequirements:["derive opposing party and authority chains where needed"],
    significatorRules:["querent=H1","opponent=H7","law/process=H9","authority/judgment=H10"],outputShape:"diagnostic"
  },
  "abjad-numeric":{
    id:"abjad-numeric",requiredModules:["abjad","contradictions"],
    optionalModules:["raml","houses","comparison","calibration","research"],excludedModules:[],
    houses:[],turnedHouseRequirements:[],significatorRules:[],outputShape:"diagnostic"
  },
  "research-meta":{
    id:"research-meta",requiredModules:["research","calibration","contradictions"],
    optionalModules:["rules","schools","case-search","manuscripts","raml","abjad","celestial"],excludedModules:[],
    houses:[],turnedHouseRequirements:[],significatorRules:[],outputShape:"research"
  },
  "open-set":{
    id:"open-set",requiredModules:["raml","question-autopsy","contradictions"],
    optionalModules:["houses","significators","comparison","case-search","research"],excludedModules:[],
    houses:[1],turnedHouseRequirements:["derive houses only after actor/relationship classification"],
    significatorRules:["do not invent a significator before the question/actor model is resolved"],outputShape:"open"
  }
};

const FAMILY_RULES: readonly { family:ProtocolFamilyId; terms:readonly string[] }[] = [
  {family:"abjad-numeric",terms:["abjad","orthographic","name ambiguity","numer"]},
  {family:"research-meta",terms:["absolute ","benchmark","calibration","method ","model ","prediction ","recast ","out-of-sample","overfit","overfitting","rule ","practitioner","research","meta-","meta ","self-","confidence ","base rate","source contamination","cross-case"]},
  {family:"health-symbolic",terms:["health","pregnancy"]},
  {family:"debt-finance",terms:["debt","money","financial","wealth","investment"]},
  {family:"relationship-family",terms:["marriage","relationship","family","children","partner","partnership","reconciliation"]},
  {family:"business-contract",terms:["business","contract","trade","shipment","agreement","property","tenant","land"]},
  {family:"employment-authority",terms:["employment","career","leadership","authority","examiner"]},
  {family:"travel-return",terms:["travel","journey","return"]},
  {family:"location-lost-remote",terms:["remote","location","lost object","missing person","scene","current activity","environment reconstruction","object direction","object recovery"]},
  {family:"timing-electional",terms:["timing","electional","planetary hour","multiple clocks","start times","deadline"]},
  {family:"comparison-competition",terms:["comparison","candidate","competition","rival","multiple choice","option ranking","contest"]},
  {family:"legal-conflict",terms:["legal","enemy","opposition","conflict","dispute"]},
  {family:"truth-claim",terms:["truth","claim","bluff","deception","false ","decoy","narrative","reliability","memory","premise","adversarial"]}
];

function corpusText(entry: UniverseQuestion): string {
  return [entry.category,entry.question,...entry.core_burden].join(" ").toLowerCase();
}

function inferFamily(entry: UniverseQuestion): {family:ProtocolFamilyId;reason:string} {
  const text = corpusText(entry);
  for (const rule of FAMILY_RULES) {
    const hit = rule.terms.find((term) => text.includes(term));
    if (hit) return {family:rule.family,reason:`matched protocol term "${hit}"`};
  }
  return {family:"open-set",reason:"no narrower deterministic family rule matched; explicit open-set protocol used"};
}

export function protocolCoverageForQuestion(entry: UniverseQuestion): QuestionProtocolCoverage {
  const text = corpusText(entry);
  const inferred = inferFamily(entry);
  const family = PROTOCOL_FAMILIES[inferred.family];
  const contradictionRequired = /contradict|collision|conflict|competing|oppos|diverg|split|disagreement|reversal/.test(text);
  const falsePremiseCheck = /false|premise|bluff|decoy|adversarial|claim|misident|wrong|assumption|deception|narrative/.test(text);
  const blindModeEligible = /blind|remote|unknown|open set|open-set|no-name|without story|current activity|scene/.test(text);
  const optional = new Set<ExecutableModule>(family.optionalModules);

  if (/turned|derived|relationship|actor/.test(text)) optional.add("turned-houses");
  if (/judge|witness|ancestry|root cause/.test(text)) optional.add("reverse-judge");
  if (/migrat|repeated figure|figure repetition/.test(text)) optional.add("migration");
  if (/abjad|name/.test(text) && family.id !== "abjad-numeric") optional.add("abjad");
  if (/planet|lunar|celestial|solar|time/.test(text) && !family.requiredModules.includes("celestial")) optional.add("celestial");
  if (/manuscript|historical school|source precedent/.test(text)) optional.add("manuscripts");
  if (/calibrat|performance|accuracy|empir/.test(text)) optional.add("calibration");
  if (/school|rule/.test(text)) optional.add("schools");

  return {
    ...family,
    optionalModules:[...optional],
    questionId:entry.id,
    contradictionRequired,
    falsePremiseCheck,
    blindModeEligible,
    reasons:[inferred.reason]
  };
}

export function validateProtocolCoverage(entries: readonly UniverseQuestion[]): string[] {
  const errors: string[] = [];
  const moduleSet = new Set<string>(EXECUTABLE_MODULES);
  const difficulties = new Set<string>(VALID_DIFFICULTIES);
  const ids = new Set<string>();

  for (const entry of entries) {
    if (ids.has(entry.id)) errors.push("Duplicate question id: " + entry.id);
    ids.add(entry.id);
    if (!difficulties.has(entry.difficulty)) errors.push(`Invalid difficulty ${entry.difficulty} on ${entry.id}`);
    if (!entry.category.trim()) errors.push("Missing category on " + entry.id);
    const coverage = protocolCoverageForQuestion(entry);
    if (!PROTOCOL_FAMILIES[coverage.id]) errors.push("Unknown protocol family on " + entry.id);
    for (const module of [...coverage.requiredModules,...coverage.optionalModules,...coverage.excludedModules]) {
      if (!moduleSet.has(module)) errors.push(`Unknown module ${module} on ${entry.id}`);
    }
    for (const house of coverage.houses) {
      if (!Number.isInteger(house) || house < 1 || house > 12) errors.push(`Invalid house ${house} on ${entry.id}`);
    }
  }
  return errors;
}
