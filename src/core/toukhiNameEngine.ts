import { DEFAULT_NORMALIZATION, normalizeArabic, type ArabicNormalizationOptions } from "./abjad";

export type ToukhiElement = "FIRE"|"EARTH"|"AIR"|"WATER";
export type ToukhiGenderNature = "MASCULINE"|"FEMININE";
export type ToukhiElementRelation = "SAME"|"FRIEND"|"ENEMY";

export interface ToukhiLetterProfile {
  letter:string;
  ordinal:number;
  element:ToukhiElement;
  genderNature:ToukhiGenderNature;
  weightNumerator:number;
  weightDenominator:7;
}

export interface ToukhiElementAggregate {
  element:ToukhiElement;
  count:number;
  weightNumerator:number;
  weightDenominator:7;
  weight:number;
}

export interface ToukhiNameProfile {
  original:string;
  normalized:string;
  letters:readonly ToukhiLetterProfile[];
  elementCounts:Readonly<Record<ToukhiElement,number>>;
  elementWeights:Readonly<Record<ToukhiElement,ToukhiElementAggregate>>;
  dominantByCount:readonly ToukhiElement[];
  dominantByWeight:readonly ToukhiElement[];
  masculineCount:number;
  feminineCount:number;
  presentElements:readonly ToukhiElement[];
  pairRelations:readonly {
    left:ToukhiElement;
    right:ToukhiElement;
    relation:ToukhiElementRelation;
  }[];
  internalState:"SINGLE_NATURE"|"FRIENDLY_BLEND"|"CONFLICTING_BLEND"|"MIXED";
  source:{
    pages:readonly [9,10,11,12,13,14,15,16,17,18,19];
    status:"VISUALLY_VERIFIED";
    note:string;
  };
  decisionEligible:false;
}

export interface ToukhiNameComparison {
  left:ToukhiNameProfile;
  right:ToukhiNameProfile;
  dominantRelation:"SAME"|"FRIEND"|"ENEMY"|"MIXED";
  sharedElements:readonly ToukhiElement[];
  weightDifferences:Readonly<Record<ToukhiElement,number>>;
  source:{
    pages:readonly [20,21,22];
    status:"VISUALLY_VERIFIED_STRUCTURE";
    note:string;
  };
  recommendation:null;
  decisionEligible:false;
}

export const TOUKHI_ABJAD_ORDINAL:Readonly<Record<string,number>> = {
  "ا":1,"ب":2,"ج":3,"د":4,"ه":5,"و":6,"ز":7,"ح":8,"ط":9,
  "ي":10,"ك":11,"ل":12,"م":13,"ن":14,"س":15,"ع":16,"ف":17,"ص":18,
  "ق":19,"ر":20,"ش":21,"ت":22,"ث":23,"خ":24,"ذ":25,"ض":26,"ظ":27,"غ":28
};

export const TOUKHI_ELEMENT_LETTERS:Readonly<Record<ToukhiElement,readonly string[]>> = {
  FIRE:["ا","ه","ط","م","ف","ش","ذ"],
  EARTH:["ب","و","ي","ن","ص","ت","ض"],
  AIR:["ج","ز","ك","س","ق","ث","ظ"],
  WATER:["د","ح","ل","ع","ر","خ","غ"]
};

const ELEMENT_ORDER:readonly ToukhiElement[]=["FIRE","EARTH","AIR","WATER"];

const TOUKHI_ELEMENT_BY_LETTER:Readonly<Record<string,ToukhiElement>> = Object.freeze(
  Object.fromEntries(
    ELEMENT_ORDER.flatMap((element)=>TOUKHI_ELEMENT_LETTERS[element].map((letter)=>[letter,element] as const))
  ) as Record<string,ToukhiElement>
);

const TOUKHI_GENDER_BY_ELEMENT:Readonly<Record<ToukhiElement,ToukhiGenderNature>> = {
  FIRE:"MASCULINE",
  AIR:"MASCULINE",
  EARTH:"FEMININE",
  WATER:"FEMININE"
};

const FRIEND_KEYS=new Set(["AIR|FIRE","EARTH|WATER"]);
const ENEMY_KEYS=new Set(["EARTH|FIRE","AIR|WATER","FIRE|WATER","AIR|EARTH"]);

function pairKey(a:ToukhiElement,b:ToukhiElement):string {
  return [a,b].sort().join("|");
}

export function toukhiElementRelation(a:ToukhiElement,b:ToukhiElement):ToukhiElementRelation {
  if (a===b) return "SAME";
  const key=pairKey(a,b);
  if (FRIEND_KEYS.has(key)) return "FRIEND";
  if (ENEMY_KEYS.has(key)) return "ENEMY";
  throw new Error(`No Toukhi element relation registered for ${a}/${b}.`);
}

const TOUKHI_NAME_NORMALIZATION:ArabicNormalizationOptions = {
  ...DEFAULT_NORMALIZATION,
  taMarbutaAsHa:true
};

function maxKeys(values:Readonly<Record<ToukhiElement,number>>):ToukhiElement[] {
  const max=Math.max(...ELEMENT_ORDER.map((element)=>values[element]));
  return ELEMENT_ORDER.filter((element)=>values[element]===max && max>0);
}

export function analyzeToukhiName(name:string):ToukhiNameProfile {
  const normalized=normalizeArabic(name,TOUKHI_NAME_NORMALIZATION);
  const letters:ToukhiLetterProfile[]=[];

  for (const letter of normalized) {
    const ordinal=TOUKHI_ABJAD_ORDINAL[letter];
    const element=TOUKHI_ELEMENT_BY_LETTER[letter];
    if (!ordinal || !element) continue;
    letters.push({
      letter,
      ordinal,
      element,
      genderNature:TOUKHI_GENDER_BY_ELEMENT[element],
      weightNumerator:ordinal,
      weightDenominator:7
    });
  }

  if (!letters.length) throw new Error("Name contains no letters from the verified 28-letter Toukhi table.");

  const counts:Record<ToukhiElement,number>={FIRE:0,EARTH:0,AIR:0,WATER:0};
  const numerators:Record<ToukhiElement,number>={FIRE:0,EARTH:0,AIR:0,WATER:0};

  for (const item of letters) {
    counts[item.element]+=1;
    numerators[item.element]+=item.ordinal;
  }

  const weights=Object.fromEntries(
    ELEMENT_ORDER.map((element)=>[
      element,
      {
        element,
        count:counts[element],
        weightNumerator:numerators[element],
        weightDenominator:7 as const,
        weight:numerators[element]/7
      }
    ])
  ) as Record<ToukhiElement,ToukhiElementAggregate>;

  const presentElements=ELEMENT_ORDER.filter((element)=>counts[element]>0);
  const pairRelations:{left:ToukhiElement;right:ToukhiElement;relation:ToukhiElementRelation}[]=[];
  for (let i=0;i<presentElements.length;i+=1) {
    for (let j=i+1;j<presentElements.length;j+=1) {
      pairRelations.push({
        left:presentElements[i],
        right:presentElements[j],
        relation:toukhiElementRelation(presentElements[i],presentElements[j])
      });
    }
  }

  const hasEnemy=pairRelations.some((pair)=>pair.relation==="ENEMY");
  const allFriendlyOrSame=pairRelations.every((pair)=>pair.relation!=="ENEMY");
  const internalState =
    presentElements.length===1 ? "SINGLE_NATURE"
    : hasEnemy ? "CONFLICTING_BLEND"
    : allFriendlyOrSame ? "FRIENDLY_BLEND"
    : "MIXED";

  const masculineCount=letters.filter((item)=>item.genderNature==="MASCULINE").length;
  const feminineCount=letters.length-masculineCount;

  return {
    original:name,
    normalized,
    letters,
    elementCounts:{...counts},
    elementWeights:weights,
    dominantByCount:maxKeys(counts),
    dominantByWeight:maxKeys(numerators),
    masculineCount,
    feminineCount,
    presentElements,
    pairRelations,
    internalState,
    source:{
      pages:[9,10,11,12,13,14,15,16,17,18,19],
      status:"VISUALLY_VERIFIED",
      note:"Element groups, friendly/enemy relations, masculine/feminine natures, dominant-element counting and the letter-balance ordinal/7 method were visually verified in the scan. The ة→ه normalization is explicit in this implementation so the 28-letter table remains closed."
    },
    decisionEligible:false
  };
}

function uniqueDominant(profile:ToukhiNameProfile):ToukhiElement|null {
  return profile.dominantByWeight.length===1 ? profile.dominantByWeight[0] : null;
}

export function compareToukhiNames(leftName:string,rightName:string):ToukhiNameComparison {
  const left=analyzeToukhiName(leftName);
  const right=analyzeToukhiName(rightName);
  const leftDominant=uniqueDominant(left);
  const rightDominant=uniqueDominant(right);

  const dominantRelation =
    leftDominant && rightDominant
      ? toukhiElementRelation(leftDominant,rightDominant)
      : "MIXED";

  const sharedElements=ELEMENT_ORDER.filter(
    (element)=>left.elementCounts[element]>0 && right.elementCounts[element]>0
  );

  const weightDifferences=Object.fromEntries(
    ELEMENT_ORDER.map((element)=>[
      element,
      left.elementWeights[element].weight-right.elementWeights[element].weight
    ])
  ) as Record<ToukhiElement,number>;

  return {
    left,
    right,
    dominantRelation,
    sharedElements,
    weightDifferences,
    source:{
      pages:[20,21,22],
      status:"VISUALLY_VERIFIED_STRUCTURE",
      note:"The scan explicitly applies the name-balance framework to interpersonal comparison. This implementation exposes the structural comparison only; the worked recommendation logic is not generalized into a verdict until the complete corpus rule set is transcribed."
    },
    recommendation:null,
    decisionEligible:false
  };
}


export interface ToukhiReducedLetterValue {
  letter:string;
  ordinal:number;
  reducedValue:number;
}

export interface ToukhiReducedNameNumber {
  original:string;
  normalized:string;
  letters:readonly ToukhiReducedLetterValue[];
  total:number;
  divisor:9;
  quotient:number;
  rawRemainder:number;
  interpretationKey:1|2|3|4|5|6|7|8|9|null;
  zeroRemainderStatus:"NOT_APPLICABLE"|"SOURCE_RULE_NOT_YET_VERIFIED";
  source:{
    pages:readonly [24,25,26];
    status:"VISUALLY_VERIFIED";
    note:string;
  };
  decisionEligible:false;
}

export function toukhiReducedLetterValue(letter:string):number {
  const ordinal=TOUKHI_ABJAD_ORDINAL[letter];
  if (!ordinal) throw new Error(`Letter ${letter} is not in the verified 28-letter Toukhi table.`);
  return ((ordinal-1)%9)+1;
}

/**
 * Page 24 gives a 1-9 repeating value table for the 28 Arabic letters and
 * demonstrates summing a name, dividing the sum by 9, discarding complete
 * nine-cycles and retaining the remainder as the name's numerical state.
 * Pages 25-26 list the traditional properties of states 1-9.
 *
 * Zero remainder is intentionally NOT converted to 9 here because the
 * zero-remainder convention has not yet been independently verified for this
 * exact source method.
 */
export function analyzeToukhiReducedNameNumber(name:string):ToukhiReducedNameNumber {
  const normalized=normalizeArabic(name,TOUKHI_NAME_NORMALIZATION);
  const letters:ToukhiReducedLetterValue[]=[...normalized]
    .filter((letter)=>TOUKHI_ABJAD_ORDINAL[letter]!==undefined)
    .map((letter)=>{
      const ordinal=TOUKHI_ABJAD_ORDINAL[letter];
      return {letter,ordinal,reducedValue:toukhiReducedLetterValue(letter)};
    });

  if (!letters.length) throw new Error("Name contains no letters from the verified 28-letter Toukhi table.");

  const total=letters.reduce((sum,item)=>sum+item.reducedValue,0);
  const quotient=Math.floor(total/9);
  const rawRemainder=((total%9)+9)%9;
  const interpretationKey=rawRemainder===0
    ? null
    : rawRemainder as 1|2|3|4|5|6|7|8|9;

  return {
    original:name,
    normalized,
    letters,
    total,
    divisor:9,
    quotient,
    rawRemainder,
    interpretationKey,
    zeroRemainderStatus:rawRemainder===0 ? "SOURCE_RULE_NOT_YET_VERIFIED" : "NOT_APPLICABLE",
    source:{
      pages:[24,25,26],
      status:"VISUALLY_VERIFIED",
      note:"Page 24 contains the repeating 1-9 letter table and the مصطفى worked example; pages 25-26 enumerate the traditional properties for numerical states 1-9. Detailed keyword transcription is kept separate until checked line-by-line."
    },
    decisionEligible:false
  };
}


export type ToukhiLineagePolicy = "MOTHER"|"FATHER";

export interface ToukhiFullNameProfile {
  subjectName:string;
  lineageName:string;
  lineagePolicy:ToukhiLineagePolicy;
  compositeInput:string;
  elemental:ToukhiNameProfile;
  reducedNumber:ToukhiReducedNameNumber;
  methodologicalRule:{
    schoolVariant:true;
    consistentPolicyRequired:true;
    note:string;
  };
  source:{
    pages:readonly [30,31];
    status:"VISUALLY_VERIFIED";
    note:string;
  };
  decisionEligible:false;
}

/**
 * Pages 30-31 discuss موازنة الاسم الكامل and explicitly preserve a school
 * disagreement over appending the mother's name versus the father's name.
 * The source warns that comparisons must not mix those policies.
 */
export function analyzeToukhiFullName(
  subjectName:string,
  lineageName:string,
  lineagePolicy:ToukhiLineagePolicy
):ToukhiFullNameProfile {
  if (!subjectName.trim() || !lineageName.trim()) {
    throw new Error("Subject name and lineage name are both required for full-name analysis.");
  }
  const compositeInput=`${subjectName} ${lineageName}`;
  return {
    subjectName,
    lineageName,
    lineagePolicy,
    compositeInput,
    elemental:analyzeToukhiName(compositeInput),
    reducedNumber:analyzeToukhiReducedNameNumber(compositeInput),
    methodologicalRule:{
      schoolVariant:true,
      consistentPolicyRequired:true,
      note:"The source reports disagreement over mother-name versus father-name composition. The selected policy must be declared and kept identical across any comparison."
    },
    source:{
      pages:[30,31],
      status:"VISUALLY_VERIFIED",
      note:"Full-name balancing and the parent-name school variant were visually verified in the scan. No claim is made that one lineage policy is universally authoritative."
    },
    decisionEligible:false
  };
}
