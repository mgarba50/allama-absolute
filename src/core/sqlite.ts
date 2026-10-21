import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import schema from "../../database/schema.sql?raw";
import { FIGURES, figureFromId } from "./figures";
import { generateShield } from "./raml";
import type { CaseRepository, CaseState, CastRecord } from "./cases";
import type { PractitionerNote } from "./notes";
import type { RecordedOutcome } from "./outcomes";
import type { PractitionerOverride } from "./override";
import type { Evidence, Verdict } from "./types";
import type { MethodologyProfile } from "./methodology";
import type { ProtocolBookmark } from "./bookmarks";
import type { VersionedRule, RuleCondition, RuleOperator } from "./rules";
import type { TraditionSchool } from "./traditions";
import { HOUSES } from "./houses";
import { ABJAD_KABIR, DEFAULT_NORMALIZATION } from "./abjad";
import { ARABIC_LUNAR_MANSIONS } from "./ephemeris";

export function sqliteWasmLocation(url = wasmUrl): string {
  const runtime = globalThis as typeof globalThis & {
    process?: { cwd?: () => string };
  };
  const cwd = runtime.process?.cwd?.();
  if (cwd && url.startsWith("/")) return cwd.replace(/\\/g,"/") + url;
  return url;
}

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

/** The provenance fields represented by the schema's `sources` table. */
export interface StoredProvenanceSource {
  id: string;
  title: string;
  author?: string;
  dateText?: string;
  locator?: string;
  notes?: string;
}

/** Searchable manuscript/document metadata. Binary contents remain outside SQLite. */
export interface StoredDocument {
  id: string;
  sourceId?: string;
  title: string;
  mimeType?: string;
  checksum?: string;
  metadata: Readonly<Record<string,unknown>>;
  createdAt: string;
}

export interface StoredAnnotation {
  id: string;
  caseId?: string;
  sourceId?: string;
  bodyMd: string;
  private: boolean;
  createdAt: string;
}

export interface AnnotationFilter {
  caseId?: string;
  sourceId?: string;
}

export interface ForeignKeyViolation {
  table: string;
  rowId: number | null;
  parent: string;
  foreignKeyIndex: number;
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

export interface ExperimentTrialRecord {
  id:string;
  experimentId:string;
  caseId?:string;
  predictionLockHash?:string;
  prediction?:unknown;
  reveal?:unknown;
  score?:unknown;
  createdAt:string;
}

export interface DatabaseHealth {
  integrity: string;
  userVersion: number;
  tables: readonly string[];
  counts: Readonly<Record<string,number>>;
  foreignKeyViolations: readonly ForeignKeyViolation[];
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

function safeJsonObject(value: unknown): Readonly<Record<string,unknown>> {
  const parsed = safeJson<unknown>(value,{});
  return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string,unknown>>
    : {};
}

const RULE_OPERATORS = new Set<RuleOperator>(["eq","neq","gt","gte","lt","lte","includes"]);

type ParsedRuleExpression = Pick<VersionedRule,"conditions" | "result"> & { valid:boolean };

function invalidRuleExpression(): ParsedRuleExpression {
  return {valid:false,conditions:[],result:{direction:0,label:""}};
}

function safeRuleExpression(value: unknown): ParsedRuleExpression {
  const parsed = safeJson<unknown>(value,null);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return invalidRuleExpression();
  const expression = parsed as Record<string,unknown>;
  if (!Array.isArray(expression.conditions)) return invalidRuleExpression();
  const conditions: RuleCondition[] = [];
  for (const candidate of expression.conditions) {
    if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
      return invalidRuleExpression();
    }
    const condition = candidate as Record<string,unknown>;
    if (
      typeof condition.path !== "string" || !condition.path.trim() ||
      !RULE_OPERATORS.has(condition.operator as RuleOperator) ||
      !Object.prototype.hasOwnProperty.call(condition,"value")
    ) return invalidRuleExpression();
    conditions.push({path:condition.path,operator:condition.operator as RuleOperator,value:condition.value});
  }
  const rawResult = expression.result;
  if (rawResult === null || typeof rawResult !== "object" || Array.isArray(rawResult)) return invalidRuleExpression();
  const result = rawResult as Record<string,unknown>;
  if (
    result.direction !== -1 && result.direction !== 0 && result.direction !== 1 ||
    typeof result.label !== "string"
  ) return invalidRuleExpression();
  return {
    valid:true,
    conditions,
    result:{direction:result.direction,label:result.label}
  };
}

function requireText(value: string,label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(label + " is required.");
  return normalized;
}

function tableExists(database: Database,name: string): boolean {
  return queryRows(database,"SELECT name FROM sqlite_master WHERE type='table' AND name=?",[name]).length > 0;
}

function columnsFor(database: Database,table: string): Set<string> {
  if (!tableExists(database,table)) return new Set();
  return new Set(queryRows(database,`PRAGMA table_info(${table})`).map((row) => String(row.name)));
}

export class SqliteCaseRepository implements CaseRepository {
  private pendingFlush: Promise<void> = Promise.resolve();

  private constructor(
    private database: Database,
    private store: SqliteByteStore,
    private SQL: Awaited<ReturnType<typeof initSqlJs>>
  ) {}

  static async open(store: SqliteByteStore = new IndexedDbSqliteStore()): Promise<SqliteCaseRepository> {
    const SQL = await initSqlJs({ locateFile: () => sqliteWasmLocation() });
    const persisted = await store.load();
    const database = persisted ? new SQL.Database(persisted) : new SQL.Database();
    const repository = new SqliteCaseRepository(database,store,SQL);
    try {
      repository.prepareLegacySchema();
      database.run(schema);
      repository.migrate();
      repository.seedReferenceData();
      repository.assertHealthyDatabase();
      await repository.flush();
      return repository;
    } catch (error) {
      database.close();
      throw error;
    }
  }

  /** Read historical cases without opening a writer or replacing the persisted SQLite snapshot. */
  static async readCasesSnapshot(store: SqliteByteStore = new IndexedDbSqliteStore()): Promise<CaseState[]> {
    const persisted = await store.load();
    if (!persisted) return [];
    const SQL = await initSqlJs({ locateFile: () => sqliteWasmLocation() });
    const database = new SQL.Database(persisted);
    try {
      return new SqliteCaseRepository(database,store,SQL).listCases();
    } finally {
      database.close();
    }
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
    this.database.run("PRAGMA user_version = 4");
    this.database.run("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(4,datetime('now'))");
  }

  private seedReferenceData(): void {
    this.database.run("BEGIN");
    try {
      for (const figure of FIGURES) {
        this.database.run(
          "INSERT OR REPLACE INTO figures(id,latin_name,arabic_name,pattern,element,planet,quality,payload_json) VALUES(?,?,?,?,?,?,?,?)",
          [figure.id,figure.latin,figure.arabic,figure.pattern.join(""),figure.element,figure.planet,figure.quality,JSON.stringify({keywords:figure.keywords})]
        );
      }
      for (const house of HOUSES) {
        this.database.run(
          "INSERT OR REPLACE INTO houses(id,name_en,name_ar,payload_json) VALUES(?,?,?,?)",
          [house.number,house.name,house.nameAr,JSON.stringify({keywords:house.keywords,keywordsAr:house.keywordsAr})]
        );
      }
      this.database.run(
        "INSERT OR REPLACE INTO abjad_methods(id,name,version,mapping_json,normalization_json) VALUES(?,?,?,?,?)",
        ["kabir-standard","Abjad al-Kabir",1,JSON.stringify(ABJAD_KABIR),JSON.stringify(DEFAULT_NORMALIZATION)]
      );
      ARABIC_LUNAR_MANSIONS.forEach((name,index) => {
        this.database.run(
          "INSERT OR REPLACE INTO correspondence_tables(id,family,key_text,value_json,version) VALUES(?,?,?,?,?)",
          ["lunar-mansion-equal-arc-"+String(index+1).padStart(2,"0"),"lunar-mansion-equal-arc-28",String(index+1),JSON.stringify({arabicName:name,index:index+1}),1]
        );
      });
      this.database.run(
        "INSERT OR REPLACE INTO correspondence_tables(id,family,key_text,value_json,version) VALUES(?,?,?,?,?)",
        ["planetary-hour-order","planetary-hours","chaldean-order",JSON.stringify(["Saturn","Jupiter","Mars","Sun","Venus","Mercury","Moon"]),1]
      );
      this.database.run("COMMIT");
    } catch (error) {
      this.database.run("ROLLBACK");
      throw error;
    }
  }

  referenceDataCounts(): Readonly<Record<string,number>> {
    const names=["figures","houses","abjad_methods","correspondence_tables"];
    return Object.fromEntries(names.map((name)=>{
      const row=queryRows(this.database,`SELECT COUNT(*) AS count FROM ${name}`)[0];
      return [name,Number(row?.count ?? 0)];
    }));
  }

  private exportSnapshot(): Uint8Array {
    const bytes = this.database.export();
    // sql.js export may close and reopen the connection, resetting connection PRAGMAs.
    this.database.run("PRAGMA foreign_keys = ON");
    return bytes;
  }

  private async flush(): Promise<void> {
    const bytes = this.exportSnapshot();
    const save = this.pendingFlush.then(() => this.store.save(bytes));
    this.pendingFlush = save.catch(() => undefined);
    await save;
  }

  private hasRecord(table: "cases" | "schools" | "sources",id: string): boolean {
    return queryRows(this.database,`SELECT 1 AS found FROM ${table} WHERE id=? LIMIT 1`,[id]).length > 0;
  }

  private requireReference(table: "cases" | "schools" | "sources",id: string,label: string): void {
    if (!this.hasRecord(table,id)) throw new Error(label + " does not exist: " + id);
  }

  listSchools(): TraditionSchool[] {
    return queryRows(
      this.database,
      "SELECT id,name,description FROM schools ORDER BY name COLLATE NOCASE,id"
    ).map((row) => ({
      id:String(row.id),
      name:String(row.name),
      description:row.description === null ? undefined : String(row.description)
    }));
  }

  getSchool(id: string): TraditionSchool | null {
    return this.listSchools().find((school) => school.id === id) ?? null;
  }

  async saveSchool(school: TraditionSchool): Promise<void> {
    const id = requireText(school.id,"School id");
    const name = requireText(school.name,"School name");
    this.database.run(
      "INSERT INTO schools(id,name,description) VALUES(?,?,?) " +
      "ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description",
      [id,name,school.description?.trim() || null]
    );
    await this.flush();
  }

  async deleteSchool(id: string): Promise<void> {
    const dependents = queryRows(this.database,"SELECT COUNT(*) AS count FROM rules WHERE school_id=?",[id])[0];
    if (Number(dependents?.count ?? 0) > 0) {
      throw new Error("Cannot delete a school while rules reference it: " + id);
    }
    this.database.run("DELETE FROM schools WHERE id=?",[id]);
    await this.flush();
  }

  listRules(schoolId?: string): VersionedRule[] {
    const sql = schoolId === undefined
      ? "SELECT id,school_id,version,name,expression_json,weight,enabled,provenance_source_id " +
        "FROM rules ORDER BY school_id COLLATE NOCASE,name COLLATE NOCASE,version,id"
      : "SELECT id,school_id,version,name,expression_json,weight,enabled,provenance_source_id " +
        "FROM rules WHERE school_id=? ORDER BY name COLLATE NOCASE,version,id";
    return queryRows(this.database,sql,schoolId === undefined ? [] : [schoolId]).map((row) => {
      const expression = safeRuleExpression(row.expression_json);
      return {
        id:String(row.id),
        name:String(row.name),
        version:Number(row.version),
        enabled:Number(row.enabled) !== 0 && expression.valid,
        weight:Number(row.weight),
        school:row.school_id === null ? "" : String(row.school_id),
        provenance:row.provenance_source_id === null ? undefined : String(row.provenance_source_id),
        conditions:expression.conditions,
        result:expression.result
      };
    });
  }

  getRule(id: string): VersionedRule | null {
    return this.listRules().find((rule) => rule.id === id) ?? null;
  }

  async saveRule(rule: VersionedRule): Promise<void> {
    const id = requireText(rule.id,"Rule id");
    const name = requireText(rule.name,"Rule name");
    const school = requireText(rule.school,"Rule school id");
    if (!Number.isInteger(rule.version) || rule.version < 1) {
      throw new Error("Rule version must be a positive integer.");
    }
    if (!Number.isFinite(rule.weight)) throw new Error("Rule weight must be finite.");
    this.requireReference("schools",school,"Rule school");
    const provenance = rule.provenance?.trim() || undefined;
    if (provenance) this.requireReference("sources",provenance,"Rule provenance source");
    this.database.run(
      "INSERT INTO rules(id,school_id,version,name,expression_json,weight,enabled,provenance_source_id,created_at) " +
      "VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET school_id=excluded.school_id,version=excluded.version," +
      "name=excluded.name,expression_json=excluded.expression_json,weight=excluded.weight,enabled=excluded.enabled," +
      "provenance_source_id=excluded.provenance_source_id",
      [
        id,school,rule.version,name,JSON.stringify({conditions:rule.conditions,result:rule.result}),
        rule.weight,rule.enabled ? 1 : 0,provenance ?? null,new Date().toISOString()
      ]
    );
    await this.flush();
  }

  async deleteRule(id: string): Promise<void> {
    this.database.run("DELETE FROM rules WHERE id=?",[id]);
    await this.flush();
  }

  listSources(): StoredProvenanceSource[] {
    return queryRows(
      this.database,
      "SELECT id,title,author,date_text,locator,notes FROM sources ORDER BY title COLLATE NOCASE,id"
    ).map((row) => ({
      id:String(row.id),
      title:String(row.title),
      author:row.author === null ? undefined : String(row.author),
      dateText:row.date_text === null ? undefined : String(row.date_text),
      locator:row.locator === null ? undefined : String(row.locator),
      notes:row.notes === null ? undefined : String(row.notes)
    }));
  }

  getSource(id: string): StoredProvenanceSource | null {
    return this.listSources().find((source) => source.id === id) ?? null;
  }

  async saveSource(source: StoredProvenanceSource): Promise<void> {
    const id = requireText(source.id,"Source id");
    const title = requireText(source.title,"Source title");
    this.database.run(
      "INSERT INTO sources(id,title,author,date_text,locator,notes) VALUES(?,?,?,?,?,?) " +
      "ON CONFLICT(id) DO UPDATE SET title=excluded.title,author=excluded.author,date_text=excluded.date_text," +
      "locator=excluded.locator,notes=excluded.notes",
      [
        id,title,source.author?.trim() || null,source.dateText?.trim() || null,
        source.locator?.trim() || null,source.notes?.trim() || null
      ]
    );
    await this.flush();
  }

  async deleteSource(id: string): Promise<void> {
    const ruleReferences = queryRows(
      this.database,"SELECT COUNT(*) AS count FROM rules WHERE provenance_source_id=?",[id]
    )[0];
    if (Number(ruleReferences?.count ?? 0) > 0) {
      throw new Error("Cannot delete a provenance source while rules reference it: " + id);
    }
    this.database.run("DELETE FROM sources WHERE id=?",[id]);
    await this.flush();
  }

  listDocuments(sourceId?: string): StoredDocument[] {
    const sql = sourceId === undefined
      ? "SELECT id,source_id,title,mime_type,checksum,metadata_json,created_at " +
        "FROM documents ORDER BY created_at DESC,id"
      : "SELECT id,source_id,title,mime_type,checksum,metadata_json,created_at " +
        "FROM documents WHERE source_id=? ORDER BY created_at DESC,id";
    return queryRows(this.database,sql,sourceId === undefined ? [] : [sourceId]).map((row) => ({
      id:String(row.id),
      sourceId:row.source_id === null ? undefined : String(row.source_id),
      title:String(row.title),
      mimeType:row.mime_type === null ? undefined : String(row.mime_type),
      checksum:row.checksum === null ? undefined : String(row.checksum),
      metadata:safeJsonObject(row.metadata_json),
      createdAt:String(row.created_at)
    }));
  }

  getDocument(id: string): StoredDocument | null {
    return this.listDocuments().find((document) => document.id === id) ?? null;
  }

  async saveDocument(document: StoredDocument): Promise<void> {
    const id = requireText(document.id,"Document id");
    const title = requireText(document.title,"Document title");
    const createdAt = requireText(document.createdAt,"Document creation timestamp");
    const sourceId = document.sourceId?.trim() || undefined;
    if (sourceId) this.requireReference("sources",sourceId,"Document source");
    this.database.run(
      "INSERT INTO documents(id,source_id,title,mime_type,checksum,metadata_json,created_at) VALUES(?,?,?,?,?,?,?) " +
      "ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,title=excluded.title,mime_type=excluded.mime_type," +
      "checksum=excluded.checksum,metadata_json=excluded.metadata_json,created_at=excluded.created_at",
      [
        id,sourceId ?? null,title,document.mimeType?.trim() || null,document.checksum?.trim() || null,
        JSON.stringify(document.metadata ?? {}),createdAt
      ]
    );
    await this.flush();
  }

  async deleteDocument(id: string): Promise<void> {
    this.database.run("DELETE FROM documents WHERE id=?",[id]);
    await this.flush();
  }

  listAnnotations(filter?: string | AnnotationFilter): StoredAnnotation[] {
    const normalized = typeof filter === "string" ? {caseId:filter} : filter;
    const clauses: string[] = [];
    const params: SqlValue[] = [];
    if (normalized?.caseId !== undefined) {
      clauses.push("case_id=?");
      params.push(normalized.caseId);
    }
    if (normalized?.sourceId !== undefined) {
      clauses.push("source_id=?");
      params.push(normalized.sourceId);
    }
    const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
    return queryRows(
      this.database,
      "SELECT id,case_id,source_id,body_md,private,created_at FROM annotations" + where +
      " ORDER BY created_at DESC,id",
      params
    ).map((row) => ({
      id:String(row.id),
      caseId:row.case_id === null ? undefined : String(row.case_id),
      sourceId:row.source_id === null ? undefined : String(row.source_id),
      bodyMd:String(row.body_md),
      private:Number(row.private) !== 0,
      createdAt:String(row.created_at)
    }));
  }

  getAnnotation(id: string): StoredAnnotation | null {
    return this.listAnnotations().find((annotation) => annotation.id === id) ?? null;
  }

  async saveAnnotation(annotation: StoredAnnotation): Promise<void> {
    const id = requireText(annotation.id,"Annotation id");
    const bodyMd = requireText(annotation.bodyMd,"Annotation body");
    const createdAt = requireText(annotation.createdAt,"Annotation creation timestamp");
    const caseId = annotation.caseId?.trim() || undefined;
    const sourceId = annotation.sourceId?.trim() || undefined;
    if (caseId) this.requireReference("cases",caseId,"Annotation case");
    if (sourceId) this.requireReference("sources",sourceId,"Annotation source");
    this.database.run(
      "INSERT INTO annotations(id,case_id,source_id,body_md,private,created_at) VALUES(?,?,?,?,?,?) " +
      "ON CONFLICT(id) DO UPDATE SET case_id=excluded.case_id,source_id=excluded.source_id," +
      "body_md=excluded.body_md,private=excluded.private,created_at=excluded.created_at",
      [id,caseId ?? null,sourceId ?? null,bodyMd,annotation.private ? 1 : 0,createdAt]
    );
    await this.flush();
  }

  async deleteAnnotation(id: string): Promise<void> {
    this.database.run("DELETE FROM annotations WHERE id=?",[id]);
    await this.flush();
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



  listExperimentTrials(experimentId?: string): ExperimentTrialRecord[] {
    const sql=experimentId
      ? "SELECT * FROM experiment_trials WHERE experiment_id=? ORDER BY created_at DESC"
      : "SELECT * FROM experiment_trials ORDER BY created_at DESC";
    return queryRows(this.database,sql,experimentId?[experimentId]:[]).map((row)=>({
      id:String(row.id),experimentId:String(row.experiment_id),
      caseId:row.case_id?String(row.case_id):undefined,
      predictionLockHash:row.prediction_lock_hash?String(row.prediction_lock_hash):undefined,
      prediction:safeJson<unknown>(row.prediction_json,undefined),
      reveal:safeJson<unknown>(row.reveal_json,undefined),
      score:safeJson<unknown>(row.score_json,undefined),
      createdAt:String(row.created_at)
    }));
  }

  async saveExperimentTrial(record: ExperimentTrialRecord): Promise<void> {
    this.database.run(
      "INSERT OR REPLACE INTO experiment_trials(id,experiment_id,case_id,prediction_lock_hash,prediction_json,reveal_json,score_json,created_at) VALUES(?,?,?,?,?,?,?,?)",
      [
        record.id,record.experimentId,record.caseId??null,record.predictionLockHash??null,
        record.prediction===undefined?null:JSON.stringify(record.prediction),
        record.reveal===undefined?null:JSON.stringify(record.reveal),
        record.score===undefined?null:JSON.stringify(record.score),
        record.createdAt
      ]
    );
    await this.flush();
  }

  getMethodologyProfile(id: string): MethodologyProfile | null {
    const row=queryRows(this.database,"SELECT profile_json FROM methodology_profiles WHERE id=?",[id])[0];
    return row ? safeJson<MethodologyProfile>(row.profile_json,null as unknown as MethodologyProfile) : null;
  }

  async saveMethodologyProfile(profile: MethodologyProfile,updatedAt=new Date().toISOString()): Promise<void> {
    this.database.run(
      "INSERT INTO methodology_profiles(id,name,version,profile_json,updated_at) VALUES(?,?,?,?,?) "+
      "ON CONFLICT(id) DO UPDATE SET name=excluded.name,version=excluded.version,profile_json=excluded.profile_json,updated_at=excluded.updated_at",
      [profile.id,profile.name,profile.version,JSON.stringify(profile),updatedAt]
    );
    await this.flush();
  }

  getSetting<T>(key:string,fallback:T):T {
    const row=queryRows(this.database,"SELECT value_json FROM app_settings WHERE key=?",[key])[0];
    return row?safeJson<T>(row.value_json,fallback):fallback;
  }

  async saveSetting(key:string,value:unknown,updatedAt=new Date().toISOString()):Promise<void> {
    if(!key.trim()) throw new Error("Setting key is required.");
    this.database.run("INSERT INTO app_settings(key,value_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at",[key.trim(),JSON.stringify(value),updatedAt]);
    await this.flush();
  }

  listProtocolBookmarks(): ProtocolBookmark[] {
    return queryRows(this.database,"SELECT * FROM protocol_bookmarks ORDER BY updated_at DESC").map((row)=>({
      id:String(row.id),name:String(row.name),protocolId:String(row.protocol_id),
      configuration:safeJson<ProtocolBookmark["configuration"]>(row.configuration_json,{enabledModules:[],weights:{},options:{}}),
      createdAt:String(row.created_at),updatedAt:String(row.updated_at)
    }));
  }

  async saveProtocolBookmark(bookmark: ProtocolBookmark): Promise<void> {
    this.database.run(
      "INSERT INTO protocol_bookmarks(id,name,protocol_id,configuration_json,created_at,updated_at) VALUES(?,?,?,?,?,?) "+
      "ON CONFLICT(id) DO UPDATE SET name=excluded.name,protocol_id=excluded.protocol_id,configuration_json=excluded.configuration_json,updated_at=excluded.updated_at",
      [bookmark.id,bookmark.name,bookmark.protocolId,JSON.stringify(bookmark.configuration),bookmark.createdAt,bookmark.updatedAt]
    );
    await this.flush();
  }

  async deleteProtocolBookmark(id:string):Promise<void> {
    this.database.run("DELETE FROM protocol_bookmarks WHERE id=?",[id]);
    await this.flush();
  }

  exportDatabase(): Uint8Array {
    return this.exportSnapshot();
  }

  integrityCheck(): string {
    const result = queryRows(this.database,"PRAGMA integrity_check");
    const first = result[0];
    if (!first) return "unknown";
    return String(Object.values(first)[0]);
  }

  foreignKeyCheck(): ForeignKeyViolation[] {
    return queryRows(this.database,"PRAGMA foreign_key_check").map((row) => ({
      table:String(row.table),
      rowId:row.rowid === null ? null : Number(row.rowid),
      parent:String(row.parent),
      foreignKeyIndex:Number(row.fkid)
    })).sort((left,right) =>
      left.table.localeCompare(right.table) ||
      (left.rowId ?? -1) - (right.rowId ?? -1) ||
      left.foreignKeyIndex - right.foreignKeyIndex
    );
  }

  private knowledgeReferenceViolations(): string[] {
    const missingSchools = queryRows(
      this.database,
      "SELECT r.id FROM rules r LEFT JOIN schools s ON s.id=r.school_id " +
      "WHERE r.school_id IS NOT NULL AND s.id IS NULL ORDER BY r.id"
    ).map((row) => "rule " + String(row.id) + " references a missing school");
    const missingSources = queryRows(
      this.database,
      "SELECT r.id FROM rules r LEFT JOIN sources s ON s.id=r.provenance_source_id " +
      "WHERE r.provenance_source_id IS NOT NULL AND s.id IS NULL ORDER BY r.id"
    ).map((row) => "rule " + String(row.id) + " references a missing provenance source");
    return [...missingSchools,...missingSources];
  }

  private assertHealthyDatabase(): void {
    const integrity = this.integrityCheck();
    if (integrity !== "ok") throw new Error("SQLite integrity check failed: " + integrity);
    const foreignKeys = this.foreignKeyCheck();
    if (foreignKeys.length) {
      const first = foreignKeys[0];
      throw new Error(
        "SQLite foreign key check failed: " + first.table + " row " + String(first.rowId) +
        " references " + first.parent
      );
    }
    const knowledgeReferences = this.knowledgeReferenceViolations();
    if (knowledgeReferences.length) {
      throw new Error("Practitioner knowledge integrity check failed: " + knowledgeReferences[0]);
    }
  }

  databaseHealth(): DatabaseHealth {
    const version = queryRows(this.database,"PRAGMA user_version")[0];
    const userVersion = Number(version ? Object.values(version)[0] : 0);
    const tables = queryRows(
      this.database,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).map((row) => String(row.name));
    const countTables = [
      "cases","casts","predictions","outcomes","practitioner_notes","practitioner_overrides","calibration",
      "schools","rules","sources","documents","annotations"
    ];
    const counts = Object.fromEntries(countTables.map((name) => {
      const row = queryRows(this.database,`SELECT COUNT(*) AS count FROM ${name}`)[0];
      return [name,Number(row?.count ?? 0)];
    }));
    return {
      integrity:this.integrityCheck(),
      userVersion,
      tables,
      counts,
      foreignKeyViolations:this.foreignKeyCheck()
    };
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
      this.seedReferenceData();
      this.assertHealthyDatabase();
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
