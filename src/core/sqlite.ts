import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import schema from "../../database/schema.sql?raw";
import { figureFromId } from "./figures";
import { generateShield } from "./raml";
import type { CaseRepository, CaseState, CastRecord } from "./cases";

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
    database.run(schema);
    const repository = new SqliteCaseRepository(database,store,SQL);
    repository.migrate();
    await repository.flush();
    return repository;
  }

  private migrate(): void {
    const columns = new Set(
      queryRows(this.database,"PRAGMA table_info(cases)").map((row) => String(row.name))
    );

    if (!columns.has("updated_at")) this.database.run("ALTER TABLE cases ADD COLUMN updated_at TEXT");
    if (!columns.has("timeline_json")) this.database.run("ALTER TABLE cases ADD COLUMN timeline_json TEXT NOT NULL DEFAULT '[]'");
    if (!columns.has("metadata_json")) this.database.run("ALTER TABLE cases ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'");
    this.database.run("UPDATE cases SET updated_at = COALESCE(updated_at,created_at)");
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

  saveCase(record: CaseState): void {
    this.database.run(
      "INSERT INTO cases(id,question_original,created_at,updated_at,status,timeline_json) VALUES(?,?,?,?,?,?) " +
      "ON CONFLICT(id) DO UPDATE SET question_original=excluded.question_original,updated_at=excluded.updated_at," +
      "status=excluded.status,timeline_json=excluded.timeline_json",
      [record.id,record.question,record.createdAt,record.updatedAt,record.status,JSON.stringify(record.timeline)]
    );
    void this.flush();
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

  saveCast(record: CastRecord): void {
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
        record.recastReason ?? null
      ]
    );
    void this.flush();
  }

  exportDatabase(): Uint8Array {
    return this.database.export();
  }

  integrityCheck(): string {
    const result = queryRows(this.database,"PRAGMA integrity_check");
    const first = result[0];
    if (!first) return "unknown";
    const value = Object.values(first)[0];
    return String(value);
  }

  async replaceDatabase(bytes: Uint8Array): Promise<void> {
    const replacement = new this.SQL.Database(bytes);
    const check = queryRows(replacement,"PRAGMA integrity_check");
    const value = check[0] ? String(Object.values(check[0])[0]) : "unknown";
    if (value !== "ok") {
      replacement.close();
      throw new Error("Imported SQLite file failed integrity check: " + value);
    }

    replacement.run(schema);
    this.database.close();
    this.database = replacement;
    this.migrate();
    await this.flush();
  }

  async persist(): Promise<void> {
    await this.flush();
  }

  close(): void {
    this.database.close();
  }
}
