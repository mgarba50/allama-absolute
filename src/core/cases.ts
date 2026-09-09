export interface CaseState {
  id: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "resolved" | "archived";
  castIds: readonly string[];
  timeline: readonly { at:string; type:string; detail:string }[];
}

export interface CastRecord {
  id: string;
  caseId: string;
  createdAt: string;
  motherIds: readonly string[];
  mode: "manual-tap" | "paper" | "direct" | "entropy";
  supersedesCastId?: string;
  recastReason?: string;
}

export interface CaseRepository {
  listCases(): CaseState[];
  getCase(id: string): CaseState | null;
  saveCase(record: CaseState): void;
  listCasts(caseId: string): CastRecord[];
  saveCast(record: CastRecord): void;
}

export class BrowserCaseRepository implements CaseRepository {
  constructor(private namespace = "allama-absolute") {}

  private key(kind: string): string {
    return this.namespace + ":" + kind;
  }

  private read<T>(kind: string): T[] {
    const raw = localStorage.getItem(this.key(kind));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  }

  private write<T>(kind: string, records: readonly T[]): void {
    localStorage.setItem(this.key(kind),JSON.stringify(records));
  }

  listCases(): CaseState[] {
    return this.read<CaseState>("cases").sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getCase(id: string): CaseState | null {
    return this.listCases().find((record) => record.id === id) ?? null;
  }

  saveCase(record: CaseState): void {
    const records = this.read<CaseState>("cases").filter((item) => item.id !== record.id);
    records.push(record);
    this.write("cases",records);
  }

  listCasts(caseId: string): CastRecord[] {
    return this.read<CastRecord>("casts")
      .filter((record) => record.caseId === caseId)
      .sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  }

  saveCast(record: CastRecord): void {
    const previous = this.listCasts(record.caseId);
    if (previous.length > 0 && !record.recastReason) {
      throw new Error("A previous cast exists for this case. A recast reason is required.");
    }
    const records = this.read<CastRecord>("casts").filter((item) => item.id !== record.id);
    records.push(record);
    this.write("casts",records);
  }
}

export function newCase(question: string, now = new Date().toISOString()): CaseState {
  const id = "ABS-" + now.replace(/[-:.TZ]/g,"").slice(0,14);
  return {
    id,
    question:question.trim(),
    createdAt:now,
    updatedAt:now,
    status:"open",
    castIds:[],
    timeline:[{ at:now, type:"created", detail:"Case created" }]
  };
}
