import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import schema from "../../database/schema.sql?raw";
import { figureFromId } from "./figures";
import { generateShield } from "./raml";
import type { CaseRepository, CaseState, CastRecord } from "./cases";
import type { PractitionerNote } from "./notes";
import type { RecordedOutcome } from "./outcomes";
import type { PractitionerOverride } from "./override";
import type { Evidence, Verdict } from "./types";

export interface SqliteByteStore {
  load(): Promise<Uint8Array | null>;
  save(bytes: Uint8Array): Promise<void>;
}

export class IndexedDbSqliteStore implements SqliteByteStore {
  constructor(
    private databaseName = "allama-absolute",
    private objectStore = "files",
    private key = "main.sqlite"
  ) {}

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve,reject) => {
      const request = indexedDB.open(this.databaseName,1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.objectStore)) db.createObjectStore(this.objectStore);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
    });
  }

  async load(): Promise<Uint8Array | null> {
    const db = await this.open();
    return new Promise((resolve,reject) => {
      const transaction = db.transaction(this.objectStore,"readonly");
      const request = transaction.objectStore(this.objectStore).get(this.key);
      request.onsuccess = () => {
        const value = request.result;
        if (value instanceof ArrayBuffer) resolve(new Uint8Array(value));
        else if (value instanceof Uint8Array) resolve(value);
        else resolve(null);
        db.close();
      };
      request.onerror = () => {
        const error = request.error ?? new Error("Unable to read SQLite database.");
        db.close();
        reject(error);
      };
    });
  }

  async save(bytes: Uint8Array): Promise<void> {
    const db = await this.open();
    return new Promise((resolve,reject) => {
      const copy = new Uint8Array(bytes.length);
      copy.set(bytes);
      const transaction = db.transaction(this.objectStore,"readwrite");
      transaction.objectStore(this.objectStore).put(copy.buffer,this.key);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        const error = transaction.error ?? new Error("Unable to persist SQLite database.");
        db.close();
        reject(error);
      };
    });
  }
}

type SqlValue = string | number | null | Uint8Array;
type SqlRow = Record<string,string | number | Uint8Array | null>;

export interface StoredPrediction {
  id: string;
  caseId: string;
  castId?: string;
  methodologyVersion: string;
  verdict: Verdict;
  evidence: readonly Evidence[];
  lockHash?: string;
  createdAt: string;
}

export interface StoredOutcome extends RecordedOutcome {
  id: string;
  predictionId?: string;
}

export interface StoredOverride extends PractitionerOverride {
  caseId: string;
  predictionId?: string;
}

export interface CalibrationRecord {
  id: string;
  methodologyVersion: string;
  scope: string;
  metric: string;
  sampleSize: number;
  value: number;
  computedAt: string;
}

export interface CaseExportBundle {
  format: "allama-absolute-case";
  version: 1;
  exportedAt: string;
  case: CaseState;
  casts: readonly CastRecord[];
  notes: readonly PractitionerNote[];
  predictions: readonly StoredPrediction[];
  outcomes: readonly StoredOutcome[];
  overrides: readonly StoredOverride[];
}

export interface DatabaseHealth {
  integrity: string;
  userVersion: number;
  tables: readonly string[];
  counts: Readonly<Record<string,number>>;
}

function queryRows(database: Database,sql: string,params: readonly SqlValue[] = []): SqlRow[] {
  const statement = database.prepare(sql);
  try {
    statement.bind([...params] as never);
    const output: SqlRow[] = [];
    while (statement.step()) output.push(statement.getAsObject() as SqlRow);
    return output;
  } finally {
    statement.free();
  }
}

function safeJson<T>(value: unknown,fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function tableExists(database: Database,name: string): boolean {
  return queryRows(database,"SELECT name FROM sqlite_master WHERE type='table' AND name=?",[name]).length > 0;
}

function columnsFor(database: Database,table: string): Set<string> {
  if (!tableExists(database,table)) return new Set();
  return new Set(queryRows(database,`PRAGMA table_info(${table})`).map((row) => String(row.name)));
}

export class SqliteCaseRepository implements CaseRepository {
  private constructor(
    private database: Database,
    private store: SqliteByteStore,
    private SQL: Awaited<ReturnType<typeof initSqlJs>>
  ) {}

  static async open(store: SqliteByteStore = new IndexedDbSqliteStore()): Promise<SqliteCaseRepository> {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    const persisted = await store.load();
    const database = persisted ? new SQL.Database(persisted) : new SQL.Database();
    const repository = new SqliteCaseRepository(database,store,SQL);
    repository.prepareLegacySchema();
    database.run(schema);
    repository.migrate();
    await repository.flush();
    return repository;
  }

  private prepareLegacySchema(): void {
    const caseColumns = columnsFor(this.database,"cases");
    if (caseColumns.size) {
      if (!caseColumns.has("updated_at")) this.database.run("ALTER TABLE cases ADD COLUMN updated_at TEXT");
      if (!caseColumns.has("timeline_json")) this.database.run("ALTER TABLE cases ADD COLUMN timeline_json TEXT NOT NULL DEFAULT '[]'");
      if (!caseColumns.has("metadata_json")) this.database.run("ALTER TABLE cases ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'");
      this.database.run("UPDATE cases SET updated_at = COALESCE(updated_at,created_at)");
    }

    const predictionColumns = columnsFor(this.database,"predictions");
    if (predictionColumns.size && !predictionColumns.has("evidence_json")) {
      this.database.run("ALTER TABLE predictions ADD COLUMN evidence_json TEXT NOT NULL DEFAULT '[]'");
    }
  }

  private migrate(): void {
    this.database.run("PRAGMA foreign_keys = ON");
    this.database.run("PRAGMA user_version = 3");
    this.database.run("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(3,datetime('now'))");
  }

  private async flush(): Promise<void> {
    await this.store.save(this.database.export());
  }

  listCases(): CaseState[] {
    const records = queryRows(
      this.database,
      "SELECT id,question_original,created_at,updated_at,status,timeline_json FROM cases ORDER BY updated_at DESC"
    );

    return records.map((row) => {
      const castIds = queryRows(
        this.database,
        "SELECT id FROM casts WHERE case_id = ? ORDER BY created_at",
        [String(row.id)]
      ).map((cast) => String(cast.id));

      return {
        id:String(row.id),
        question:String(row.question_original),
        createdAt:String(row.created_at),
        updatedAt:String(row.updated_at),
        status:String(row.status) as CaseState["status"],
        castIds,
        timeline:safeJson<CaseState["timeline"]>(row.timeline_json,[])
      };
    });
  }

  getCase(id: string): CaseState | null {
    return this.listCases().find((record) => record.id === id) ?? null;
  }

  async saveCase(record: CaseState): Promise<void> {
    this.database.run(
      "INSERT INTO cases(id,question_original,created_at,updated_at,status,timeline_json) VALUES(?,?,?,?,?,?) " +
      "ON CONFLICT(id) DO UPDATE SET question_original=excluded.question_original,updated_at=excluded.updated_at," +
      "status=excluded.status,timeline_json=excluded.timeline_json",
      [record.id,record.question,record.createdAt,record.updatedAt,record.status,JSON.stringify(record.timeline)]
    );
    await this.flush();
  }

  listCasts(caseId: string): CastRecord[] {
    return queryRows(
      this.database,
      "SELECT id,case_id,created_at,mothers_json,mode,supersedes_cast_id,recast_reason FROM casts " +
      "WHERE case_id = ? ORDER BY created_at",
      [caseId]
    ).map((row) => ({
      id:String(row.id),
      caseId:String(row.case_id),
      createdAt:String(row.created_at),
      motherIds:safeJson<string[]>(row.mothers_json,[]),
      mode:String(row.mode) as CastRecord["mode"],
      supersedesCastId:row.supersedes_cast_id ? String(row.supersedes_cast_id) : undefined,
      recastReason:row.recast_reason ? String(row.recast_reason) : undefined
    }));
  }

  async saveCast(record: CastRecord): Promise<void> {
    const previous = this.listCasts(record.caseId);
    if (previous.length > 0 && !record.recastReason?.trim()) {
      throw new Error("A previous cast exists for this case. A recast reason is required.");
    }

    const shield = generateShield(record.motherIds.map(figureFromId));
    const supersedesCastId = record.supersedesCastId ?? previous.at(-1)?.id ?? null;

    this.database.run(
      "INSERT INTO casts(id,case_id,mode,mothers_json,shield_json,created_at,supersedes_cast_id,recast_reason) " +
      "VALUES(?,?,?,?,?,?,?,?)",
      [
        record.id,
        record.caseId,
        record.mode,
        JSON.stringify(record.motherIds),
        JSON.stringify(shield),
        record.createdAt,
        supersedesCastId,
        record.recastReason?.trim() || null
      ]
    );
    await this.flush();
  }

  listNotes(caseId: string): PractitionerNote[] {
    return queryRows(
      this.database,
      "SELECT id,case_id,body,tags_json,created_at FROM practitioner_notes WHERE case_id=? ORDER BY created_at",
      [caseId]
    ).map((row) => ({
      id:String(row.id),
      caseId:String(row.case_id),
      createdAt:String(row.created_at),
      body:String(row.body),
      tags:safeJson<string[]>(row.tags_json,[]),
      private:true
    }));
  }

  async saveNote(note: PractitionerNote): Promise<void> {
    this.database.run(
      "INSERT OR REPLACE INTO practitioner_notes(id,case_id,body,tags_json,private,created_at) VALUES(?,?,?,?,1,?)",
      [note.id,note.caseId,note.body,JSON.stringify(note.tags),note.createdAt]
    );
    await this.flush();
  }

  listPredictions(caseId: string): StoredPrediction[] {
    return queryRows(
      this.database,
      "SELECT id,case_id,cast_id,methodology_version,verdict_json,evidence_json,lock_hash,created_at " +
      "FROM predictions WHERE case_id=? ORDER BY created_at",
      [caseId]
    ).map((row) => ({
      id:String(row.id),
      caseId:String(row.case_id),
      castId:row.cast_id ? String(row.cast_id) : undefined,
      methodologyVersion:String(row.methodology_version),
      verdict:safeJson<Verdict>(row.verdict_json,{
        decision:"UNKNOWN",confidence:0,confidenceClass:"NO RELIABLE VERDICT",supporting:[],contrary:[],score:0
      }),
      evidence:safeJson<Evidence[]>(row.evidence_json,[]),
      lockHash:row.lock_hash ? String(row.lock_hash) : undefined,
      createdAt:String(row.created_at)
    }));
  }

  async savePrediction(record: StoredPrediction): Promise<void> {
    this.database.run(
      "INSERT OR REPLACE INTO predictions(id,case_id,cast_id,methodology_version,verdict_json,evidence_json,lock_hash,created_at) " +
      "VALUES(?,?,?,?,?,?,?,?)",
      [
        record.id,record.caseId,record.castId ?? null,record.methodologyVersion,
        JSON.stringify(record.verdict),JSON.stringify(record.evidence),record.lockHash ?? null,record.createdAt
      ]
    );
    await this.flush();
  }

  listOutcomes(caseId: string): StoredOutcome[] {
    return queryRows(
      this.database,
      "SELECT id,case_id,prediction_id,outcome_json,recorded_at FROM outcomes WHERE case_id=? ORDER BY recorded_at",
      [caseId]
    ).map((row) => ({
      ...safeJson<RecordedOutcome>(row.outcome_json,{
        caseId:String(row.case_id),recordedAt:String(row.recorded_at),resolved:false
      }),
      id:String(row.id),
      caseId:String(row.case_id),
      predictionId:row.prediction_id ? String(row.prediction_id) : undefined,
      recordedAt:String(row.recorded_at)
    }));
  }

  async saveOutcome(record: StoredOutcome): Promise<void> {
    const payload: RecordedOutcome = {
      caseId:record.caseId,
      recordedAt:record.recordedAt,
      resolved:record.resolved,
      binaryOutcome:record.binaryOutcome,
      notes:record.notes,
      evidenceSource:record.evidenceSource
    };
    this.database.run(
      "INSERT OR REPLACE INTO outcomes(id,case_id,prediction_id,outcome_json,recorded_at) VALUES(?,?,?,?,?)",
      [record.id,record.caseId,record.predictionId ?? null,JSON.stringify(payload),record.recordedAt]
    );
    await this.flush();
  }

  listOverrides(caseId: string): StoredOverride[] {
    return queryRows(
      this.database,
      "SELECT id,case_id,prediction_id,practitioner,machine_verdict_json,override_decision,reason,notes,created_at " +
      "FROM practitioner_overrides WHERE case_id=? ORDER BY created_at",
      [caseId]
    ).map((row) => ({
      id:String(row.id),
      caseId:String(row.case_id),
      predictionId:row.prediction_id ? String(row.prediction_id) : undefined,
      createdAt:String(row.created_at),
      practitioner:String(row.practitioner),
      machineVerdict:safeJson<Verdict>(row.machine_verdict_json,{
        decision:"UNKNOWN",confidence:0,confidenceClass:"NO RELIABLE VERDICT",supporting:[],contrary:[],score:0
      }),
      overrideDecision:String(row.override_decision) as Verdict["decision"],
      reason:String(row.reason),
      notes:row.notes ? String(row.notes) : undefined
    }));
  }

  async saveOverride(record: StoredOverride): Promise<void> {
    if (!record.reason.trim()) throw new Error("Practitioner override requires a written reason.");
    this.database.run(
      "INSERT OR REPLACE INTO practitioner_overrides(" +
      "id,case_id,prediction_id,practitioner,machine_verdict_json,override_decision,reason,notes,created_at" +
      ") VALUES(?,?,?,?,?,?,?,?,?)",
      [
        record.id,record.caseId,record.predictionId ?? null,record.practitioner,
        JSON.stringify(record.machineVerdict),record.overrideDecision,record.reason.trim(),record.notes ?? null,record.createdAt
      ]
    );
    await this.flush();
  }

  listCalibration(scope?: string): CalibrationRecord[] {
    const sql = scope
      ? "SELECT * FROM calibration WHERE scope=? ORDER BY computed_at DESC"
      : "SELECT * FROM calibration ORDER BY computed_at DESC";
    return queryRows(this.database,sql,scope ? [scope] : []).map((row) => ({
      id:String(row.id),
      methodologyVersion:String(row.methodology_version),
      scope:String(row.scope),
      metric:String(row.metric),
      sampleSize:Number(row.sample_size),
      value:Number(row.value),
      computedAt:String(row.computed_at)
    }));
  }

  async saveCalibration(record: CalibrationRecord): Promise<void> {
    this.database.run(
      "INSERT OR REPLACE INTO calibration(id,methodology_version,scope,metric,sample_size,value,computed_at) VALUES(?,?,?,?,?,?,?)",
      [record.id,record.methodologyVersion,record.scope,record.metric,record.sampleSize,record.value,record.computedAt]
    );
    await this.flush();
  }

  exportCase(caseId: string,exportedAt = new Date().toISOString()): CaseExportBundle {
    const record = this.getCase(caseId);
    if (!record) throw new Error("Case not found: " + caseId);
    return {
      format:"allama-absolute-case",
      version:1,
      exportedAt,
      case:record,
      casts:this.listCasts(caseId),
      notes:this.listNotes(caseId),
      predictions:this.listPredictions(caseId),
      outcomes:this.listOutcomes(caseId),
      overrides:this.listOverrides(caseId)
    };
  }

  exportDatabase(): Uint8Array {
    return this.database.export();
  }

  integrityCheck(): string {
    const result = queryRows(this.database,"PRAGMA integrity_check");
    const first = result[0];
    if (!first) return "unknown";
    return String(Object.values(first)[0]);
  }

  databaseHealth(): DatabaseHealth {
    const version = queryRows(this.database,"PRAGMA user_version")[0];
    const userVersion = Number(version ? Object.values(version)[0] : 0);
    const tables = queryRows(
      this.database,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).map((row) => String(row.name));
    const countTables = ["cases","casts","predictions","outcomes","practitioner_notes","practitioner_overrides","calibration"];
    const counts = Object.fromEntries(countTables.map((name) => {
      const row = queryRows(this.database,`SELECT COUNT(*) AS count FROM ${name}`)[0];
      return [name,Number(row?.count ?? 0)];
    }));
    return { integrity:this.integrityCheck(),userVersion,tables,counts };
  }

  async replaceDatabase(bytes: Uint8Array): Promise<void> {
    const replacement = new this.SQL.Database(bytes);
    const check = queryRows(replacement,"PRAGMA integrity_check");
    const value = check[0] ? String(Object.values(check[0])[0]) : "unknown";
    if (value !== "ok") {
      replacement.close();
      throw new Error("Imported SQLite file failed integrity check: " + value);
    }

    const previous = this.database;
    this.database = replacement;
    try {
      this.prepareLegacySchema();
      this.database.run(schema);
      this.migrate();
      if (this.integrityCheck() !== "ok") throw new Error("Imported database failed post-migration integrity check.");
      await this.flush();
      previous.close();
    } catch (error) {
      this.database.close();
      this.database = previous;
      throw error;
    }
  }

  async persist(): Promise<void> {
    await this.flush();
  }

  close(): void {
    this.database.close();
  }
}
