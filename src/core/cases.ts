export interface CaseTimelineEntry {
  at: string;
  type: string;
  detail: string;
}

export interface CaseState {
  id: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "resolved" | "archived";
  castIds: readonly string[];
  timeline: readonly CaseTimelineEntry[];
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
  saveCase(record: CaseState): Promise<void>;
  listCasts(caseId: string): CastRecord[];
  saveCast(record: CastRecord): Promise<void>;
}

/**
 * SQLite is the authoritative practitioner store.
 * Legacy browser-localStorage persistence was deliberately removed so there is
 * only one long-term case repository implementation.
 */
export function newCase(question: string, now = new Date().toISOString()): CaseState {
  const cleaned = question.trim();
  if (!cleaned) throw new Error("Case question cannot be empty.");
  const id = "ABS-" + now.replace(/\D/g,"");
  return {
    id,
    question:cleaned,
    createdAt:now,
    updatedAt:now,
    status:"open",
    castIds:[],
    timeline:[{ at:now, type:"created", detail:"Case created" }]
  };
}

export function appendCaseTimeline(
  record: CaseState,
  type: string,
  detail: string,
  at = new Date().toISOString()
): CaseState {
  if (!type.trim() || !detail.trim()) throw new Error("Timeline entries require type and detail.");
  return {
    ...record,
    updatedAt:at,
    timeline:[...record.timeline,{ at,type:type.trim(),detail:detail.trim() }]
  };
}
