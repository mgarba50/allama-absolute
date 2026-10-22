import { calculateAbjad, type ArabicNormalizationOptions, DEFAULT_NORMALIZATION } from "./abjad";
import { cycleIndex } from "./formulaKernel";

export type AbjadTableId =
  | "OMEGA_ELEMENT_EDUCATIONAL_4"
  | "OMEGA_ZODIAC_COMMON_12"
  | "OMEGA_WEEKDAY_SATURN_FIRST_7";

export interface AbjadCycleMember {
  index:number;
  arabic:string;
  english:string;
  metadata?:Readonly<Record<string,string>>;
}

export interface AbjadCycleTable {
  id:AbjadTableId;
  title:string;
  cycle:number;
  school:string;
  source:string;
  interpretiveStatus:"educational-example"|"common-order"|"declared-traditional-table";
  warning:string;
  members:readonly AbjadCycleMember[];
}

export const ABJAD_CYCLE_TABLES:Readonly<Record<AbjadTableId,AbjadCycleTable>> = {
  OMEGA_ELEMENT_EDUCATIONAL_4:{
    id:"OMEGA_ELEMENT_EDUCATIONAL_4",
    title:"Four-Cycle Element Mapping — educational order",
    cycle:4,
    school:"Later-manual educational example",
    source:"ALLAMA Omega Raml/Abjad Masterbook — extract-element",
    interpretiveStatus:"educational-example",
    warning:"The source explicitly says element order is not globally standardized. Use this table only when this exact order is intentionally selected.",
    members:[
      {index:1,arabic:"نار",english:"Fire"},
      {index:2,arabic:"هواء",english:"Air"},
      {index:3,arabic:"ماء",english:"Water"},
      {index:4,arabic:"تراب",english:"Earth"}
    ]
  },
  OMEGA_ZODIAC_COMMON_12:{
    id:"OMEGA_ZODIAC_COMMON_12",
    title:"Twelve-Cycle Zodiac Mapping — common order",
    cycle:12,
    school:"Later remainder-based zodiac indexing convention",
    source:"ALLAMA Omega Raml/Abjad Masterbook — extract-zodiac",
    interpretiveStatus:"common-order",
    warning:"This is a numerological indexing convention, not astronomical birth-sign calculation. The source warns against attributing it to Abu Maʿshar or another author without a specific text.",
    members:[
      {index:1,arabic:"الحمل",english:"Aries"},
      {index:2,arabic:"الثور",english:"Taurus"},
      {index:3,arabic:"الجوزاء",english:"Gemini"},
      {index:4,arabic:"السرطان",english:"Cancer"},
      {index:5,arabic:"الأسد",english:"Leo"},
      {index:6,arabic:"العذراء",english:"Virgo"},
      {index:7,arabic:"الميزان",english:"Libra"},
      {index:8,arabic:"العقرب",english:"Scorpio"},
      {index:9,arabic:"القوس",english:"Sagittarius"},
      {index:10,arabic:"الجدي",english:"Capricorn"},
      {index:11,arabic:"الدلو",english:"Aquarius"},
      {index:12,arabic:"الحوت",english:"Pisces"}
    ]
  },
  OMEGA_WEEKDAY_SATURN_FIRST_7:{
    id:"OMEGA_WEEKDAY_SATURN_FIRST_7",
    title:"Sevenfold Weekday / Planet Table — Saturday first",
    cycle:7,
    school:"Declared seven-day planetary table",
    source:"ALLAMA Omega Raml/Abjad Masterbook — extract-planet",
    interpretiveStatus:"declared-traditional-table",
    warning:"A seven-cycle index is meaningless until the starting point and order are fixed. This table explicitly starts on Saturday/Saturn.",
    members:[
      {index:1,arabic:"السبت",english:"Saturday",metadata:{planetArabic:"زحل",planetEnglish:"Saturn"}},
      {index:2,arabic:"الأحد",english:"Sunday",metadata:{planetArabic:"الشمس",planetEnglish:"Sun"}},
      {index:3,arabic:"الاثنين",english:"Monday",metadata:{planetArabic:"القمر",planetEnglish:"Moon"}},
      {index:4,arabic:"الثلاثاء",english:"Tuesday",metadata:{planetArabic:"المريخ",planetEnglish:"Mars"}},
      {index:5,arabic:"الأربعاء",english:"Wednesday",metadata:{planetArabic:"عطارد",planetEnglish:"Mercury"}},
      {index:6,arabic:"الخميس",english:"Thursday",metadata:{planetArabic:"المشتري",planetEnglish:"Jupiter"}},
      {index:7,arabic:"الجمعة",english:"Friday",metadata:{planetArabic:"الزهرة",planetEnglish:"Venus"}}
    ]
  }
};

export interface AbjadCycleReading {
  tableId:AbjadTableId;
  index:number;
  member:AbjadCycleMember;
  arithmetic:{
    total:number;
    divisor:number;
    quotient:number;
    rawRemainder:number;
    oneBasedIndex:number;
    check:number;
  };
  source:string;
  warning:string;
}

export interface AbjadNameExecution {
  original:string;
  normalized:string;
  total:number;
  letterSteps:readonly {letter:string;value:number}[];
  normalizationPolicy:ArabicNormalizationOptions;
  readings:readonly AbjadCycleReading[];
  trace:readonly string[];
}

export function readAbjadCycle(total:number,table:AbjadCycleTable):AbjadCycleReading {
  const rawRemainder=((total % table.cycle)+table.cycle)%table.cycle;
  const quotient=Math.floor(total/table.cycle);
  const oneBasedIndex=cycleIndex(total,table.cycle);
  const member=table.members.find((item)=>item.index===oneBasedIndex);
  if (!member) throw new Error(`Table ${table.id} has no member for index ${oneBasedIndex}.`);
  return {
    tableId:table.id,
    index:oneBasedIndex,
    member,
    arithmetic:{
      total,
      divisor:table.cycle,
      quotient,
      rawRemainder,
      oneBasedIndex,
      check:table.cycle*quotient+rawRemainder
    },
    source:table.source,
    warning:table.warning
  };
}

export function executeAbjadName(
  text:string,
  tableIds:readonly AbjadTableId[]=[
    "OMEGA_ELEMENT_EDUCATIONAL_4",
    "OMEGA_ZODIAC_COMMON_12",
    "OMEGA_WEEKDAY_SATURN_FIRST_7"
  ],
  normalizationPolicy:ArabicNormalizationOptions=DEFAULT_NORMALIZATION
):AbjadNameExecution {
  const calculation=calculateAbjad(text,normalizationPolicy);
  const readings=tableIds.map((id)=>readAbjadCycle(calculation.total,ABJAD_CYCLE_TABLES[id]));
  const trace=[
    `RAW=${calculation.original}`,
    `NORMALIZED=${calculation.normalized}`,
    ...calculation.steps.map((step)=>`${step.letter}=${step.value}`),
    `TOTAL=${calculation.total}`,
    ...readings.map((reading)=>`${reading.tableId}: ${reading.arithmetic.total} = ${reading.arithmetic.divisor}×${reading.arithmetic.quotient} + ${reading.arithmetic.rawRemainder}; one-based member=${reading.index} (${reading.member.english})`)
  ];
  return {
    original:calculation.original,
    normalized:calculation.normalized,
    total:calculation.total,
    letterSteps:calculation.steps,
    normalizationPolicy:{...normalizationPolicy},
    readings,
    trace
  };
}

export interface AbjadRelation {
  left:AbjadNameExecution;
  right:AbjadNameExecution;
  structural:{
    totalDifference:number;
    totalSum:number;
    sameElementIndex:boolean;
    sameZodiacIndex:boolean;
    sameWeekdayPlanetIndex:boolean;
  };
  interpretation:"UNASSIGNED";
  note:string;
}

export function compareAbjadNames(left:string,right:string):AbjadRelation {
  const a=executeAbjadName(left);
  const b=executeAbjadName(right);
  const read=(execution:AbjadNameExecution,id:AbjadTableId)=>execution.readings.find((item)=>item.tableId===id)!;
  return {
    left:a,
    right:b,
    structural:{
      totalDifference:Math.abs(a.total-b.total),
      totalSum:a.total+b.total,
      sameElementIndex:read(a,"OMEGA_ELEMENT_EDUCATIONAL_4").index===read(b,"OMEGA_ELEMENT_EDUCATIONAL_4").index,
      sameZodiacIndex:read(a,"OMEGA_ZODIAC_COMMON_12").index===read(b,"OMEGA_ZODIAC_COMMON_12").index,
      sameWeekdayPlanetIndex:read(a,"OMEGA_WEEKDAY_SATURN_FIRST_7").index===read(b,"OMEGA_WEEKDAY_SATURN_FIRST_7").index
    },
    interpretation:"UNASSIGNED",
    note:"These are structural comparisons only. No favorable/unfavorable compatibility judgment is assigned because the current source pack does not supply a rule that interprets equality or difference in these cycles."
  };
}
