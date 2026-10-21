export class LruCache<T> {
  private values=new Map<string,T>();
  constructor(readonly maxEntries=256) {
    if (!Number.isInteger(maxEntries) || maxEntries<1) throw new Error("LRU cache size must be a positive integer.");
  }
  get(key:string): T | undefined {
    const value=this.values.get(key);
    if (value===undefined) return undefined;
    this.values.delete(key);
    this.values.set(key,value);
    return value;
  }
  set(key:string,value:T): void {
    if (this.values.has(key)) this.values.delete(key);
    this.values.set(key,value);
    while(this.values.size>this.maxEntries) {
      const oldest=this.values.keys().next().value as string | undefined;
      if(oldest===undefined) break;
      this.values.delete(oldest);
    }
  }
  clear(): void { this.values.clear(); }
  get size(): number { return this.values.size; }
}
