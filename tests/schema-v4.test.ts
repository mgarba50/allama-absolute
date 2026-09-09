import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { SqliteCaseRepository, type SqliteByteStore } from "../src/core";

class Store implements SqliteByteStore {
  constructor(public bytes:Uint8Array|null=null){}
  async load(){return this.bytes?new Uint8Array(this.bytes):null;}
  async save(bytes:Uint8Array){this.bytes=new Uint8Array(bytes);}
}

describe("schema v4 migration",()=>{
  it("adds v4 settings and seeds practitioner reference tables on an existing v3-style database",async()=>{
    const SQL=await initSqlJs({locateFile:()=>wasmUrl});
    const db=new SQL.Database();
    db.run(`
      PRAGMA user_version=3;
      CREATE TABLE cases(id TEXT PRIMARY KEY,question_original TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',blind_mode INTEGER NOT NULL DEFAULT 0,timeline_json TEXT NOT NULL DEFAULT '[]',metadata_json TEXT NOT NULL DEFAULT '{}');
      INSERT INTO cases VALUES('C1','Preserve this case','2026-09-01','2026-09-01','open',0,'[]','{}');
    `);
    const store=new Store(db.export());
    db.close();
    const repo=await SqliteCaseRepository.open(store);
    expect(repo.databaseHealth().userVersion).toBe(4);
    expect(repo.getCase("C1")?.question).toBe("Preserve this case");
    expect(repo.referenceDataCounts()).toEqual(expect.objectContaining({figures:16,houses:12,abjad_methods:1,correspondence_tables:29}));
    await repo.saveSetting("language","ar");
    expect(repo.getSetting("language","en")).toBe("ar");
    expect(repo.integrityCheck()).toBe("ok");
    repo.close();
  });
});
