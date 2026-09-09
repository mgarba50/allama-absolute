import { accuracySummary } from "./calibration";
import type { CastRecord } from "./cases";
import { figureFromId } from "./figures";
import { generateShield } from "./raml";
import type { ResearchCase } from "./research";

export interface ResolvedResearchRecord {
  id:string;
  category:string;
  predicted:boolean;
  actual:boolean;
  confidence:number;
  resolvedAt:string;
}

export interface CalibrationBin {
  low:number;
  high:number;
  sampleSize:number;
  meanConfidence:number;
  accuracy:number;
}

export function confidenceCalibration(records:readonly ResolvedResearchRecord[],binSize=10):CalibrationBin[] {
  if(!Number.isInteger(binSize) || binSize<1 || binSize>100) throw new Error("Calibration bin size must be 1..100.");
  const bins:CalibrationBin[]=[];
  for(let low=0;low<100;low+=binSize){
    const high=Math.min(100,low+binSize);
    const rows=records.filter((r)=>r.confidence>=low && (high===100 ? r.confidence<=high : r.confidence<high));
    if(!rows.length) continue;
    bins.push({
      low,high,sampleSize:rows.length,
      meanConfidence:rows.reduce((s,r)=>s+r.confidence,0)/rows.length,
      accuracy:rows.filter((r)=>r.predicted===r.actual).length/rows.length
    });
  }
  return bins;
}

export function questionCategoryPerformance(records:readonly ResolvedResearchRecord[]) {
  const groups=new Map<string,ResolvedResearchRecord[]>();
  for(const record of records) {
    const rows=groups.get(record.category) ?? [];
    rows.push(record); groups.set(record.category,rows);
  }
  return [...groups.entries()].map(([category,rows])=>({
    category,...accuracySummary(rows.map((r)=>({id:r.id,predicted:r.predicted,actual:r.actual})))
  })).sort((a,b)=>b.sampleSize-a.sampleSize || b.accuracy-a.accuracy);
}

export function historicalAccuracy(records:readonly ResolvedResearchRecord[]) {
  const sorted=[...records].sort((a,b)=>a.resolvedAt.localeCompare(b.resolvedAt));
  let correct=0;
  return sorted.map((record,index)=>{
    if(record.predicted===record.actual) correct++;
    return {index:index+1,id:record.id,resolvedAt:record.resolvedAt,accuracy:correct/(index+1)};
  });
}

export function figureFrequencies(casts:readonly CastRecord[]) {
  const counts=new Map<string,{id:string;latin:string;count:number}>();
  for(const cast of casts){
    if(cast.motherIds.length!==4) continue;
    const shield=generateShield(cast.motherIds.map(figureFromId));
    const figures=[...shield.mothers,...shield.daughters,...shield.nieces,shield.rightWitness,shield.leftWitness,shield.judge,shield.reconciler];
    for(const fig of figures){
      const current=counts.get(fig.id) ?? {id:fig.id,latin:fig.latin,count:0};
      current.count++; counts.set(fig.id,current);
    }
  }
  const total=[...counts.values()].reduce((s,r)=>s+r.count,0);
  return [...counts.values()].map((row)=>({...row,frequency:total?row.count/total:0})).sort((a,b)=>b.count-a.count);
}

export function subsystemContribution(records:readonly ResearchCase[]) {
  const modules=[...new Set(records.flatMap((r)=>Object.keys(r.moduleVotes)))];
  const baseline=accuracySummary(records.map((r)=>{
    const score=Object.values(r.moduleVotes).reduce((s,v)=>s+v,0);
    return {id:r.id,predicted:score>=0,actual:r.actual};
  }));
  return modules.map((module)=>{
    const ablated=accuracySummary(records.map((r)=>{
      const score=Object.entries(r.moduleVotes).filter(([m])=>m!==module).reduce((s,[,v])=>s+v,0);
      return {id:r.id,predicted:score>=0,actual:r.actual};
    }));
    return {module,baseline:baseline.accuracy,ablated:ablated.accuracy,delta:baseline.accuracy-ablated.accuracy,sampleSize:records.length};
  }).sort((a,b)=>b.delta-a.delta);
}
