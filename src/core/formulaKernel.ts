import { calculateAbjad, moduloAnalysis, normalizeArabic } from "./abjad";
import { housePlacements } from "./chart";
import { classifyQuestion } from "./question";
import { entropyMothers, generateShield, validateShield } from "./raml";
import type { GeomanticFigure, Shield } from "./types";

export type FormulaOp =
  | "NORMALIZE_ARABIC"
  | "ABJAD_SUM"
  | "MOD_CYCLE"
  | "DIVIDE"
  | "ROUND"
  | "QUESTION_ROUTE"
  | "RAML_ENTROPY_CAST"
  | "HOUSE_FIGURE";

export interface FormulaTraceStep {
  index:number;
  op:FormulaOp;
  input:unknown;
  output:unknown;
  note?:string;
}

export function cycleIndex(value:number,cycle:number):number {
  if (!Number.isFinite(value) || !Number.isFinite(cycle) || cycle <= 0) throw new Error("cycleIndex requires finite value and positive cycle.");
  const remainder=((Math.trunc(value)%Math.trunc(cycle))+Math.trunc(cycle))%Math.trunc(cycle);
  return remainder===0 ? Math.trunc(cycle) : remainder;
}

export interface NameFormulaResult {
  raw:string;
  normalized:string;
  abjadTotal:number;
  elementCycle4:number;
  zodiacCycle12:number;
  planetCycle7:number;
  residues:Record<number,number>;
}

export function runNameFormula(raw:string):NameFormulaResult {
  const normalized=normalizeArabic(raw);
  const abjad=calculateAbjad(raw);
  return {
    raw,
    normalized,
    abjadTotal:abjad.total,
    elementCycle4:cycleIndex(abjad.total,4),
    zodiacCycle12:cycleIndex(abjad.total,12),
    planetCycle7:cycleIndex(abjad.total,7),
    residues:moduloAnalysis(abjad.total,[4,7,12])
  };
}

export interface StructuralFormulaInput {
  question:string;
  subjectName?:string;
  motherName?:string;
  otherParty?:string;
}

export interface StructuralFormulaResult {
  question:ReturnType<typeof classifyQuestion>;
  shield:Shield;
  validationErrors:readonly string[];
  primaryHouse:number;
  primaryHouseFigure:GeomanticFigure;
  relevantHouses:readonly {
    house:number;
    figure:GeomanticFigure;
    source:string;
  }[];
  witnesses:{
    right:GeomanticFigure;
    left:GeomanticFigure;
  };
  judge:GeomanticFigure;
  reconciler:GeomanticFigure;
  names:{
    subject?:NameFormulaResult;
    mother?:NameFormulaResult;
    otherParty?:NameFormulaResult;
  };
  trace:readonly FormulaTraceStep[];
}

export function runStructuralFormula(input:StructuralFormulaInput):StructuralFormulaResult {
  const trace:FormulaTraceStep[]=[];
  const question=classifyQuestion(input.question);
  trace.push({index:trace.length+1,op:"QUESTION_ROUTE",input:input.question,output:{
    domain:question.domain,houses:question.houses,modules:question.modules
  }});

  const mothers=entropyMothers();
  const shield=generateShield(mothers);
  const validationErrors=validateShield(shield);
  trace.push({index:trace.length+1,op:"RAML_ENTROPY_CAST",input:"16 cryptographic parity states",output:{
    motherIds:mothers.map((figure)=>figure.id),
    judge:shield.judge.id,
    validationErrors
  },note:"Mothers are generated once; Daughters, Nieces, Witnesses and Judge are deterministic descendants."});

  const placements=housePlacements(shield);
  const primaryHouse=question.houses[0] ?? 1;
  const primaryHouseFigure=placements[primaryHouse-1]?.figure ?? placements[0].figure;
  const relevantHouses=question.houses
    .map((house)=>placements[house-1])
    .filter((item):item is NonNullable<typeof item>=>Boolean(item));
  trace.push({index:trace.length+1,op:"HOUSE_FIGURE",input:{primaryHouse,relevantHouses:question.houses},output:{
    primary:{house:primaryHouse,figure:primaryHouseFigure.id},
    relevant:relevantHouses.map((item)=>({house:item.house,figure:item.figure.id,source:item.source}))
  }});

  const names:StructuralFormulaResult["names"]={};
  for (const [key,value] of [
    ["subject",input.subjectName],
    ["mother",input.motherName],
    ["otherParty",input.otherParty]
  ] as const) {
    if (!value?.trim()) continue;
    const result=runNameFormula(value);
    names[key]=result;
    trace.push({index:trace.length+1,op:"ABJAD_SUM",input:value,output:{
      normalized:result.normalized,
      total:result.abjadTotal
    }});
    trace.push({index:trace.length+1,op:"MOD_CYCLE",input:{total:result.abjadTotal},output:{
      cycle4:result.elementCycle4,
      cycle12:result.zodiacCycle12,
      cycle7:result.planetCycle7
    },note:"Zero remainder is mapped to the last member of the declared cycle."});
  }

  return {
    question,shield,validationErrors,primaryHouse,primaryHouseFigure,relevantHouses,
    witnesses:{right:shield.rightWitness,left:shield.leftWitness},
    judge:shield.judge,
    reconciler:shield.reconciler,
    names,
    trace
  };
}

export interface MethodRule {
  id:string;
  source:string;
  school:string;
  description:string;
  priority:number;
  evaluate:(state:StructuralFormulaResult)=>null | {
    direction:-1|0|1;
    statement:string;
    facts:readonly string[];
  };
}

export interface MethodPack {
  id:string;
  name:string;
  version:number;
  rules:readonly MethodRule[];
}

export interface MethodExecution {
  pack:{id:string;name:string;version:number};
  structural:StructuralFormulaResult;
  matchedRules:readonly {
    ruleId:string;
    source:string;
    school:string;
    priority:number;
    direction:-1|0|1;
    statement:string;
    facts:readonly string[];
  }[];
}

export function executeMethodPack(pack:MethodPack,structural:StructuralFormulaResult):MethodExecution {
  const matchedRules=pack.rules
    .map((rule)=>{
      const result=rule.evaluate(structural);
      return result ? {
        ruleId:rule.id,source:rule.source,school:rule.school,priority:rule.priority,
        direction:result.direction,statement:result.statement,facts:result.facts
      } : null;
    })
    .filter((item):item is NonNullable<typeof item>=>Boolean(item))
    .sort((a,b)=>b.priority-a.priority || a.ruleId.localeCompare(b.ruleId));
  return {pack:{id:pack.id,name:pack.name,version:pack.version},structural,matchedRules};
}
