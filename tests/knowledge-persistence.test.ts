import { describe,expect,it } from "vitest";
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import {
  SqliteCaseRepository,
  evaluateRule,
  sqliteWasmLocation,
  type SqliteByteStore,
  type VersionedRule
} from "../src/core";

class MemoryByteStore implements SqliteByteStore {
  constructor(public bytes: Uint8Array | null = null) {}

  async load(): Promise<Uint8Array | null> {
    return this.bytes ? new Uint8Array(this.bytes) : null;
  }

  async save(bytes: Uint8Array): Promise<void> {
    this.bytes = new Uint8Array(bytes);
  }
}

class ReorderingByteStore extends MemoryByteStore {
  saveCount = 0;

  override async save(bytes: Uint8Array): Promise<void> {
    this.saveCount += 1;
    if (this.saveCount === 2) await new Promise((resolve) => setTimeout(resolve,25));
    this.bytes = new Uint8Array(bytes);
  }
}

class SaveForbiddenByteStore extends MemoryByteStore {
  saveCount = 0;

  override async save(_bytes: Uint8Array): Promise<void> {
    this.saveCount += 1;
    throw new Error("A read-only snapshot must not call store.save.");
  }
}

const SOURCE = {
  id:"SRC-ZABUR",
  title:"Kitab al-Raml",
  author:"Attributed tradition",
  dateText:"undated",
  locator:"folio 12r",
  notes:"Catalogued practitioner source"
};

const RULE: VersionedRule = {
  id:"RULE-JUDGE-V2",
  name:"Judge quality",
  version:2,
  enabled:true,
  weight:1.25,
  school:"school-west",
  provenance:SOURCE.id,
  conditions:[{path:"shield.judge.quality",operator:"eq",value:"favorable"}],
  result:{direction:1,label:"Favorable judge"}
};

describe("SQLite practitioner knowledge persistence",() => {
  it("round-trips schools, rules, sources, document metadata, and annotations deterministically",async() => {
    const store = new MemoryByteStore();
    const repository = await SqliteCaseRepository.open(store);

    await repository.saveSchool({id:"school-west",name:"Western school",description:"Primary lineage"});
    await repository.saveSchool({id:"school-east",name:"Eastern school"});
    await repository.saveSource(SOURCE);
    await repository.saveRule({...RULE,id:"RULE-Z",name:"Zodiacal testimony"});
    await repository.saveRule(RULE);
    await repository.saveDocument({
      id:"DOC-B",sourceId:SOURCE.id,title:"Scan B",mimeType:"application/pdf",checksum:"sha256:b",
      metadata:{language:"ar",folios:24,tags:["raml","manuscript"]},createdAt:"2026-09-10T10:00:00.000Z"
    });
    await repository.saveDocument({
      id:"DOC-A",sourceId:SOURCE.id,title:"Scan A",mimeType:"image/tiff",checksum:"sha256:a",
      metadata:{language:"ar",folios:12},createdAt:"2026-09-10T10:00:00.000Z"
    });
    await repository.saveAnnotation({
      id:"ANN-B",sourceId:SOURCE.id,bodyMd:"Second note",private:false,
      createdAt:"2026-09-10T11:00:00.000Z"
    });
    await repository.saveAnnotation({
      id:"ANN-A",sourceId:SOURCE.id,bodyMd:"**Witness** terminology differs.",private:true,
      createdAt:"2026-09-10T11:00:00.000Z"
    });

    expect(repository.listSchools().map((school) => school.id)).toEqual(["school-east","school-west"]);
    expect(repository.listRules("school-west").map((rule) => rule.id)).toEqual(["RULE-JUDGE-V2","RULE-Z"]);
    expect(repository.listDocuments(SOURCE.id).map((document) => document.id)).toEqual(["DOC-A","DOC-B"]);
    expect(repository.listAnnotations({sourceId:SOURCE.id}).map((annotation) => annotation.id)).toEqual(["ANN-A","ANN-B"]);
    expect(repository.getRule(RULE.id)).toEqual(RULE);
    expect(repository.getDocument("DOC-B")?.metadata).toEqual({language:"ar",folios:24,tags:["raml","manuscript"]});
    expect(repository.databaseHealth()).toEqual(expect.objectContaining({
      integrity:"ok",
      foreignKeyViolations:[],
      counts:expect.objectContaining({schools:2,rules:2,sources:1,documents:2,annotations:2})
    }));

    const exported = repository.exportDatabase();
    repository.close();

    const reopened = await SqliteCaseRepository.open(new MemoryByteStore(exported));
    expect(reopened.getSchool("school-west")?.description).toBe("Primary lineage");
    expect(reopened.getSource(SOURCE.id)).toEqual(SOURCE);
    expect(reopened.getRule(RULE.id)).toEqual(RULE);
    expect(reopened.getAnnotation("ANN-A")).toEqual(expect.objectContaining({
      sourceId:SOURCE.id,bodyMd:"**Witness** terminology differs.",private:true
    }));

    const imported = await SqliteCaseRepository.open(new MemoryByteStore());
    await imported.replaceDatabase(reopened.exportDatabase());
    expect(imported.listDocuments(SOURCE.id)).toHaveLength(2);
    expect(imported.listAnnotations({sourceId:SOURCE.id})).toHaveLength(2);
    expect(imported.foreignKeyCheck()).toEqual([]);
    imported.close();
    reopened.close();
  });

  it("keeps foreign keys enabled across durable exports and rejects missing knowledge references",async() => {
    const repository = await SqliteCaseRepository.open(new MemoryByteStore());
    await repository.saveSchool({id:"school-west",name:"Western school"});
    await repository.saveSource(SOURCE);
    await repository.saveDocument({
      id:"DOC-1",sourceId:SOURCE.id,title:"Bound scan",metadata:{},createdAt:"2026-09-10T10:00:00.000Z"
    });

    await expect(repository.saveRule({...RULE,school:"missing-school"})).rejects.toThrow(/school.*does not exist/i);
    await expect(repository.saveRule({...RULE,provenance:"missing-source"})).rejects.toThrow(/source.*does not exist/i);
    await expect(repository.saveDocument({
      id:"DOC-2",sourceId:"missing-source",title:"Orphan",metadata:{},createdAt:"2026-09-10T10:01:00.000Z"
    })).rejects.toThrow(/source.*does not exist/i);
    await expect(repository.deleteSource(SOURCE.id)).rejects.toThrow(/foreign key/i);

    expect(repository.getSource(SOURCE.id)).not.toBeNull();
    expect(repository.foreignKeyCheck()).toEqual([]);
    repository.close();
  });

  it("falls back safely when imported rule expressions or document metadata contain malformed JSON",async() => {
    const repository = await SqliteCaseRepository.open(new MemoryByteStore());
    await repository.saveSchool({id:"school-west",name:"Western school"});
    await repository.saveSource(SOURCE);
    await repository.saveRule(RULE);
    await repository.saveDocument({
      id:"DOC-1",sourceId:SOURCE.id,title:"Scan",metadata:{language:"ar"},createdAt:"2026-09-10T10:00:00.000Z"
    });
    const bytes = repository.exportDatabase();
    repository.close();

    const SQL = await initSqlJs({locateFile:() => sqliteWasmLocation(wasmUrl)});
    const raw = new SQL.Database(bytes);
    raw.run("UPDATE rules SET expression_json='{broken' WHERE id=?",[RULE.id]);
    raw.run("UPDATE documents SET metadata_json='[]' WHERE id='DOC-1'");
    const corruptedJson = raw.export();
    raw.close();

    const reopened = await SqliteCaseRepository.open(new MemoryByteStore(corruptedJson));
    expect(reopened.getRule(RULE.id)).toEqual(expect.objectContaining({
      enabled:false,conditions:[],result:{direction:0,label:""}
    }));
    expect(reopened.getDocument("DOC-1")?.metadata).toEqual({});
    expect(reopened.integrityCheck()).toBe("ok");
    reopened.close();
  });

  it("disables an entire imported rule when one condition is malformed",async() => {
    const repository = await SqliteCaseRepository.open(new MemoryByteStore());
    await repository.saveSchool({id:"school-west",name:"Western school"});
    await repository.saveSource(SOURCE);
    await repository.saveRule(RULE);
    const bytes = repository.exportDatabase();
    repository.close();

    const SQL = await initSqlJs({locateFile:() => sqliteWasmLocation(wasmUrl)});
    const raw = new SQL.Database(bytes);
    raw.run("UPDATE rules SET expression_json=? WHERE id=?",[
      JSON.stringify({
        conditions:[
          {path:"shield.judge.quality",operator:"eq",value:"favorable"},
          {path:"shield.judge.element",operator:"unsupported",value:"fire"}
        ],
        result:{direction:1,label:"Favorable judge"}
      }),
      RULE.id
    ]);
    const partiallyCorrupted = raw.export();
    raw.close();

    const reopened = await SqliteCaseRepository.open(new MemoryByteStore(partiallyCorrupted));
    const importedRule = reopened.getRule(RULE.id);
    expect(importedRule).toEqual(expect.objectContaining({
      enabled:false,conditions:[],result:{direction:0,label:""}
    }));
    expect(evaluateRule(importedRule!,{shield:{judge:{quality:"favorable"}}}).contribution).toBe(0);
    reopened.close();
  });

  it("reads historical cases without saving or migrating the SQLite snapshot",async() => {
    const repository = await SqliteCaseRepository.open(new MemoryByteStore());
    await repository.saveCase({
      id:"CASE-HISTORY",question:"Will the shipment arrive?",status:"open",castIds:[],timeline:[],
      createdAt:"2026-09-10T10:00:00.000Z",updatedAt:"2026-09-10T10:00:00.000Z"
    });
    const bytes = repository.exportDatabase();
    repository.close();

    const store = new SaveForbiddenByteStore(bytes);
    const cases = await SqliteCaseRepository.readCasesSnapshot(store);
    expect(cases).toEqual([expect.objectContaining({id:"CASE-HISTORY",question:"Will the shipment arrive?"})]);
    expect(store.saveCount).toBe(0);
    expect(store.bytes?.byteLength).toBe(bytes.byteLength);

    const emptyStore = new SaveForbiddenByteStore();
    expect(await SqliteCaseRepository.readCasesSnapshot(emptyStore)).toEqual([]);
    expect(emptyStore.saveCount).toBe(0);
  });

  it("rejects an orphaned database import without replacing the current database",async() => {
    const repository = await SqliteCaseRepository.open(new MemoryByteStore());
    await repository.saveSource(SOURCE);
    const bytes = repository.exportDatabase();

    const SQL = await initSqlJs({locateFile:() => sqliteWasmLocation(wasmUrl)});
    const raw = new SQL.Database(bytes);
    raw.run("PRAGMA foreign_keys=OFF");
    raw.run(
      "INSERT INTO documents(id,source_id,title,metadata_json,created_at) VALUES(?,?,?,?,?)",
      ["ORPHAN","missing-source","Orphaned document","{}","2026-09-10T12:00:00.000Z"]
    );
    const orphaned = raw.export();
    raw.close();

    await expect(repository.replaceDatabase(orphaned)).rejects.toThrow(/foreign key check failed/i);
    expect(repository.getSource(SOURCE.id)).toEqual(SOURCE);
    expect(repository.getDocument("ORPHAN")).toBeNull();
    repository.close();
  });

  it("serializes overlapping flushes so an older snapshot cannot overwrite newer knowledge",async() => {
    const store = new ReorderingByteStore();
    const repository = await SqliteCaseRepository.open(store);
    await Promise.all([
      repository.saveSchool({id:"school-west",name:"Western school"}),
      repository.saveSource(SOURCE)
    ]);
    repository.close();

    const reopened = await SqliteCaseRepository.open(store);
    expect(reopened.getSchool("school-west")?.name).toBe("Western school");
    expect(reopened.getSource(SOURCE.id)?.title).toBe("Kitab al-Raml");
    reopened.close();
  });
});
