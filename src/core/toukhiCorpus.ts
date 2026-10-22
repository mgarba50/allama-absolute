export type ToukhiPageStatus = "UNREVIEWED" | "RECOVERED" | "VERIFIED" | "QUARANTINED";

export interface ToukhiSourcePart {
  id:string;
  fileName:string;
  logicalStart:number;
  logicalEnd:number;
  note?:string;
}

export const TOUKHI_SOURCE_PARTS:readonly ToukhiSourcePart[] = [
  {id:"TK-P1",fileName:"البداية والنهاية الطوخي -1-50.pdf",logicalStart:1,logicalEnd:50},
  {id:"TK-P2",fileName:"البداية والنهاية الطوخي -51-101.pdf",logicalStart:51,logicalEnd:101},
  {id:"TK-P3",fileName:"البداية والنهاية الطوخي -101-151.pdf",logicalStart:101,logicalEnd:151,note:"Logical page 101 overlaps the preceding split and must compare identically."},
  {id:"TK-P4",fileName:"البداية والنهاية الطوخي -152-201.pdf",logicalStart:152,logicalEnd:201},
  {id:"TK-P5",fileName:"البداية والنهاية الطوخي -202-252.pdf",logicalStart:202,logicalEnd:252}
] as const;

export const TOUKHI_LOGICAL_PAGE_COUNT = 252;

export interface RecoveredToukhiItem {
  id:string;
  type:"formula"|"constraint"|"table"|"algorithm"|"workflow"|"archive";
  moduleId:string;
  page:number;
  title:string;
  sourceText?:string;
  normalized?:string;
  sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED"|"VERIFIED";
  executable:boolean;
  decisionEligible:boolean;
  safetyClass:"ANALYTICAL"|"ARCHIVE_ONLY"|"HAZARDOUS_ARCHIVE_ONLY";
  notes?:readonly string[];
}

export const RECOVERED_TOUKHI_ITEMS:readonly RecoveredToukhiItem[] = [
  {
    id:"FRM-001",type:"formula",moduleId:"MOD-001",page:4,
    title:"Person name + mother name, reduction by 9",
    sourceText:"يحسب اسم الطالب واسم أمه بحساب الجمل الكبير ويقسم على تسعة",
    normalized:"(abjad(person_name) + abjad(mother_name)) mod 9",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:true,decisionEligible:false,safetyClass:"ANALYTICAL",
    notes:["Recovered from the prior Batch 01 database export; must be page-verified before affecting any practitioner verdict."]
  },
  {
    id:"FRM-011",type:"formula",moduleId:"MOD-011",page:35,
    title:"Planetary hour duration",
    sourceText:"تحسب الدقائق من شروق الشمس إلى غروبها وتقسم على اثني عشر",
    normalized:"day_hour=(sunset-sunrise)/12; night_hour=(next_sunrise-sunset)/12",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:true,decisionEligible:false,safetyClass:"ANALYTICAL"
  },
  {
    id:"FRM-012",type:"formula",moduleId:"MOD-012",page:39,
    title:"4x4 wafq key",
    sourceText:"تطرح من المجموع ثلاثين وتقسم الباقي على أربعة. فالخارج هو المفتاح",
    normalized:"key=(total_value-30)/4",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:true,decisionEligible:false,safetyClass:"ANALYTICAL"
  },
  {
    id:"TAL-012",type:"table",moduleId:"MOD-012",page:40,
    title:"Recovered 4x4 natural square",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"ERR-021-A",type:"constraint",moduleId:"MOD-021",page:75,
    title:"Recovered Saturn/Mars timing prohibition for benevolent work",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY",
    notes:["Traditional ritual constraint; preserved as source metadata, not treated as objective fact."]
  },
  {
    id:"VTAL-022",type:"archive",moduleId:"MOD-022",page:79,
    title:"Recovered circular/triangular seal description",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"ERR-031-FATAL",type:"constraint",moduleId:"MOD-031",page:102,
    title:"Recovered retreat-condition failure rule",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"VTAL-032",type:"archive",moduleId:"MOD-032",page:106,
    title:"Recovered nested protection-seal geometry",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"ERR-041-A",type:"constraint",moduleId:"MOD-041",page:130,
    title:"Recovered first lunar-mansion ritual constraint",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"TAK-042",type:"algorithm",moduleId:"MOD-042",page:135,
    title:"Tail-to-head letter taksir",
    sourceText:"تبسط حروف الجملة، ثم تأخذ الحرف الأخير ثم الأول",
    normalized:"alternate tail/head extraction over normalized letters",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:true,decisionEligible:false,safetyClass:"ANALYTICAL"
  },
  {
    id:"WQF-051",type:"formula",moduleId:"MOD-051",page:150,
    title:"5x5 wafq key",
    sourceText:"تطرح من الجملة ستين، وتقسم الباقي على خمسة",
    normalized:"key=(total_value-60)/5",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:true,decisionEligible:false,safetyClass:"ANALYTICAL"
  },
  {
    id:"ERR-052-A",type:"constraint",moduleId:"MOD-052",page:154,
    title:"Recovered dismissal/closure condition",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"ERR-061-A",type:"constraint",moduleId:"MOD-061",page:180,
    title:"Recovered 21-day retreat-condition rule",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"REP-062",type:"table",moduleId:"MOD-062",page:185,
    title:"Recovered repetition count 313",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"ERR-071-A",type:"constraint",moduleId:"MOD-071",page:210,
    title:"Recovered Aries ritual-intent constraint",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  },
  {
    id:"MND-072",type:"workflow",moduleId:"MOD-072",page:215,
    title:"Recovered mandal workflow",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY",
    notes:["Archived for bibliographic completeness only; not operationalized."]
  },
  {
    id:"TXT-081-01",type:"archive",moduleId:"MOD-081",page:240,
    title:"Recovered Barhatiyya section marker",
    sourceStatus:"RECOVERED_NOT_VISUALLY_VERIFIED",executable:false,decisionEligible:false,safetyClass:"ARCHIVE_ONLY"
  }
] as const;

export interface ToukhiCoverageEntry {
  page:number;
  parts:readonly string[];
  status:ToukhiPageStatus;
  recoveredItemIds:readonly string[];
}

function sourcePartsForPage(page:number):string[] {
  return TOUKHI_SOURCE_PARTS
    .filter((part)=>page>=part.logicalStart && page<=part.logicalEnd)
    .map((part)=>part.id);
}

export function buildToukhiCoverage(verifiedPages:readonly number[]=[]):readonly ToukhiCoverageEntry[] {
  const verified=new Set(verifiedPages);
  return Array.from({length:TOUKHI_LOGICAL_PAGE_COUNT},(_,index)=>{
    const page=index+1;
    const items=RECOVERED_TOUKHI_ITEMS.filter((item)=>item.page===page);
    let status:ToukhiPageStatus="UNREVIEWED";
    if (verified.has(page)) status="VERIFIED";
    else if (items.length) status="RECOVERED";
    return {
      page,
      parts:sourcePartsForPage(page),
      status,
      recoveredItemIds:items.map((item)=>item.id)
    };
  });
}

export interface ToukhiActivationReport {
  active:boolean;
  logicalPages:number;
  verifiedPages:number;
  recoveredButUnverifiedPages:number;
  unreviewedPages:number;
  overlapPages:readonly number[];
  blockers:readonly string[];
}

export function toukhiActivationReport(verifiedPages:readonly number[]=[]):ToukhiActivationReport {
  const coverage=buildToukhiCoverage(verifiedPages);
  const verified=coverage.filter((item)=>item.status==="VERIFIED").length;
  const recovered=coverage.filter((item)=>item.status==="RECOVERED").length;
  const unreviewed=coverage.filter((item)=>item.status==="UNREVIEWED").length;
  const overlapPages=coverage.filter((item)=>item.parts.length>1).map((item)=>item.page);

  const blockers:string[]=[];
  if (verified!==TOUKHI_LOGICAL_PAGE_COUNT) blockers.push(`Only ${verified}/${TOUKHI_LOGICAL_PAGE_COUNT} logical pages are visually verified.`);
  if (recovered>0) blockers.push(`${recovered} page(s) contain recovered material that still require visual source verification.`);
  if (unreviewed>0) blockers.push(`${unreviewed} page(s) remain unreviewed.`);
  if (!overlapPages.includes(101)) blockers.push("Expected split overlap at logical page 101 was not detected.");

  return {
    active:blockers.length===0,
    logicalPages:TOUKHI_LOGICAL_PAGE_COUNT,
    verifiedPages:verified,
    recoveredButUnverifiedPages:recovered,
    unreviewedPages:unreviewed,
    overlapPages,
    blockers
  };
}
