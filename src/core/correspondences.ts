import { LruCache } from "./cache";

export interface CorrespondenceRecord {
  id:string;
  family:string;
  key:string;
  value:unknown;
  provenance?:string;
  version:number;
}

export class CorrespondenceRegistry {
  private records=new Map<string,CorrespondenceRecord>();
  private cache=new LruCache<CorrespondenceRecord | null>(512);

  upsert(record:CorrespondenceRecord): void {
    if(!record.id || !record.family || !record.key) throw new Error("Correspondence id, family and key are required.");
    this.records.set(record.id,{...record});
    this.cache.clear();
  }

  remove(id:string): void {
    this.records.delete(id);
    this.cache.clear();
  }

  lookup(family:string,key:string): CorrespondenceRecord | null {
    const cacheKey=family.toLowerCase()+"|"+key.toLowerCase();
    const cached=this.cache.get(cacheKey);
    if(cached!==undefined) return cached;
    const found=[...this.records.values()].find((record)=>
      record.family.toLowerCase()===family.toLowerCase() && record.key.toLowerCase()===key.toLowerCase()
    ) ?? null;
    this.cache.set(cacheKey,found);
    return found;
  }

  list(family?:string): CorrespondenceRecord[] {
    const all=[...this.records.values()];
    return family ? all.filter((record)=>record.family.toLowerCase()===family.toLowerCase()) : all;
  }
}
