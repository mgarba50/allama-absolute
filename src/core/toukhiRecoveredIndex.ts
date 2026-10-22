export interface ToukhiRecoveredModuleIndexEntry {
  moduleId:string;
  title:string;
  startPage:number;
  endPage:number;
  family:
    | "ABJAD"
    | "FALAKI"
    | "WAFQ"
    | "RITUAL_ARCHIVE"
    | "LUNAR_MANSIONS"
    | "TAKSIR"
    | "ZODIAC"
    | "DIVINATION_ARCHIVE"
    | "INVOCATION_ARCHIVE";
  executionPolicy:"ANALYTICAL_CANDIDATE"|"ARCHIVE_ONLY";
}

export const TOUKHI_RECOVERED_MODULE_INDEX:readonly ToukhiRecoveredModuleIndexEntry[] = [
  {moduleId:"MOD-001",title:"حساب الجمل وأسرار الحروف",startPage:3,endPage:5,family:"ABJAD",executionPolicy:"ANALYTICAL_CANDIDATE"},
  {moduleId:"MOD-011",title:"الساعات الفلكية والكواكب",startPage:35,endPage:38,family:"FALAKI",executionPolicy:"ANALYTICAL_CANDIDATE"},
  {moduleId:"MOD-012",title:"الوفق المربع وخواصه",startPage:39,endPage:42,family:"WAFQ",executionPolicy:"ANALYTICAL_CANDIDATE"},
  {moduleId:"MOD-021",title:"شروط الأعمال الروحانية",startPage:75,endPage:78,family:"RITUAL_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-022",title:"الخاتم السليماني المثلث",startPage:79,endPage:82,family:"RITUAL_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-031",title:"شروط الخلوة وفسادها",startPage:102,endPage:105,family:"RITUAL_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-032",title:"الخاتم المتداخل للتحصين",startPage:106,endPage:109,family:"RITUAL_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-041",title:"منازل القمر وتأثيراتها",startPage:130,endPage:134,family:"LUNAR_MANSIONS",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-042",title:"علم التكسير واستخراج الأملاك",startPage:135,endPage:139,family:"TAKSIR",executionPolicy:"ANALYTICAL_CANDIDATE"},
  {moduleId:"MOD-051",title:"الوفق المخمس وخواصه",startPage:150,endPage:153,family:"WAFQ",executionPolicy:"ANALYTICAL_CANDIDATE"},
  {moduleId:"MOD-052",title:"التحصين والإصراف",startPage:154,endPage:157,family:"RITUAL_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-061",title:"شروط الرياضة الجلالية",startPage:180,endPage:184,family:"RITUAL_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-062",title:"أعداد التلاوة",startPage:185,endPage:188,family:"RITUAL_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-071",title:"طبائع البروج الاثنا عشر",startPage:210,endPage:214,family:"ZODIAC",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-072",title:"فتح المندل النفسي",startPage:215,endPage:220,family:"DIVINATION_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"},
  {moduleId:"MOD-081",title:"دعوة البرهتية الكبرى",startPage:240,endPage:245,family:"INVOCATION_ARCHIVE",executionPolicy:"ARCHIVE_ONLY"}
] as const;

export interface PageRange {
  start:number;
  end:number;
}

function mergeRanges(ranges:readonly PageRange[]):PageRange[] {
  const sorted=[...ranges].sort((a,b)=>a.start-b.start || a.end-b.end);
  const merged:PageRange[]=[];
  for (const range of sorted) {
    const last=merged[merged.length-1];
    if (!last || range.start>last.end+1) {
      merged.push({...range});
    } else {
      last.end=Math.max(last.end,range.end);
    }
  }
  return merged;
}

export function toukhiRecoveredRanges():readonly PageRange[] {
  return mergeRanges(
    TOUKHI_RECOVERED_MODULE_INDEX.map((module)=>({
      start:Math.max(1,module.startPage),
      end:Math.min(252,module.endPage)
    }))
  );
}

export function toukhiRecoveredGapRanges():readonly PageRange[] {
  const covered=toukhiRecoveredRanges();
  const gaps:PageRange[]=[];
  let cursor=1;
  for (const range of covered) {
    if (cursor<range.start) gaps.push({start:cursor,end:range.start-1});
    cursor=Math.max(cursor,range.end+1);
  }
  if (cursor<=252) gaps.push({start:cursor,end:252});
  return gaps;
}

export function toukhiRecoveredPageCount():number {
  return toukhiRecoveredRanges().reduce((total,range)=>total+(range.end-range.start+1),0);
}
