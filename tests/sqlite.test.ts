import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import {
  SqliteCaseRepository,
  appendCaseTimeline,
  createPractitionerNote,
  newCase,
  type SqliteByteStore
} from "../src/core";

class MemoryByteStore implements SqliteByteStore {
  bytes: Uint8Array | null;
  constructor(bytes: Uint8Array | null = null) {
    this.bytes = bytes;
  }
  async load(): Promise<Uint8Array | null> {
    return this.bytes ? new Uint8Array(this.bytes) : null;
  }
  async save(bytes: Uint8Array): Promise<void> {
    this.bytes = new Uint8Array(bytes);
  }
}

describe("SQLite practitioner repository", () => {
  it("persists cases, casts, notes, predictions, outcomes, overrides and calibration", async () => {
    const store = new MemoryByteStore();
    const repository = await SqliteCaseRepository.open(store);
    const createdAt = "2026-09-10T00:00:00.000Z";
    let record = newCase("Will this contract proceed?",createdAt);
    await repository.saveCase(record);

    await repository.saveCast({
      id:"CAST-1",
      caseId:record.id,
      createdAt:"2026-09-10T00:01:00.000Z",
      motherIds:["via","populus","fortuna-major","conjunctio"],
      mode:"direct"
    });

    record = appendCaseTimeline(record,"cast","Initial cast recorded","2026-09-10T00:01:00.000Z");
    await repository.saveCase(record);

    const note = createPractitionerNote(record.id,"Client supplied signed agreement.",["document"],"2026-09-10T00:02:00.000Z");
    await repository.saveNote(note);

    const verdict = {
      decision:"YES" as const,
      confidence:82,
      confidenceClass:"STRONG",
      supporting:[],
      contrary:[],
      score:0.64
    };
    await repository.savePrediction({
      id:"PRED-1",
      caseId:record.id,
      castId:"CAST-1",
      methodologyVersion:"test-1",
      verdict,
      evidence:[],
      createdAt:"2026-09-10T00:03:00.000Z"
    });

    await repository.saveOutcome({
      id:"OUT-1",
      caseId:record.id,
      predictionId:"PRED-1",
      recordedAt:"2026-09-10T00:04:00.000Z",
      resolved:true,
      binaryOutcome:true,
      notes:"Contract signed."
    });

    await repository.saveOverride({
      id:"OVR-1",
      caseId:record.id,
      predictionId:"PRED-1",
      createdAt:"2026-09-10T00:05:00.000Z",
      practitioner:"Musa Allama",
      machineVerdict:verdict,
      overrideDecision:"MIXED",
      reason:"External documentary evidence introduced after the prediction."
    });

    await repository.saveCalibration({
      id:"CAL-1",
      methodologyVersion:"test-1",
      scope:"all",
      metric:"accuracy",
      sampleSize:1,
      value:1,
      computedAt:"2026-09-10T00:06:00.000Z"
    });

    expect(repository.integrityCheck()).toBe("ok");
    expect(repository.databaseHealth().userVersion).toBe(3);
    expect(repository.referenceDataCounts()).toEqual(expect.objectContaining({figures:16,houses:12,abjad_methods:1}));
    expect(repository.listCasts(record.id)).toHaveLength(1);
    expect(repository.listNotes(record.id)[0]?.body).toContain("signed agreement");
    expect(repository.listPredictions(record.id)).toHaveLength(1);
    expect(repository.listOutcomes(record.id)[0]?.binaryOutcome).toBe(true);
    expect(repository.listOverrides(record.id)[0]?.overrideDecision).toBe("MIXED");
    expect(repository.listCalibration("all")[0]?.value).toBe(1);

    const bundle = repository.exportCase(record.id,"2026-09-10T00:07:00.000Z");
    expect(bundle.case.id).toBe(record.id);
    expect(bundle.casts).toHaveLength(1);
    expect(bundle.notes).toHaveLength(1);

    const exported = repository.exportDatabase();
    repository.close();

    const reopened = await SqliteCaseRepository.open(new MemoryByteStore(exported));
    expect(reopened.integrityCheck()).toBe("ok");
    expect(reopened.getCase(record.id)?.question).toBe("Will this contract proceed?");
    expect(reopened.listOutcomes(record.id)).toHaveLength(1);
    reopened.close();
  });

  it("requires an explicit reason for recasts", async () => {
    const repository = await SqliteCaseRepository.open(new MemoryByteStore());
    const record = newCase("Recast discipline test","2026-09-10T01:00:00.000Z");
    await repository.saveCase(record);
    await repository.saveCast({
      id:"CAST-A",caseId:record.id,createdAt:"2026-09-10T01:01:00.000Z",
      motherIds:["via","populus","fortuna-major","conjunctio"],mode:"direct"
    });
    await expect(repository.saveCast({
      id:"CAST-B",caseId:record.id,createdAt:"2026-09-10T01:02:00.000Z",
      motherIds:["via","via","via","via"],mode:"direct"
    })).rejects.toThrow(/recast reason/i);
    repository.close();
  });

  it("migrates the pre-SQLite-UI cases schema before creating updated indexes", async () => {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    const legacy = new SQL.Database();
    legacy.run(`
      CREATE TABLE cases (
        id TEXT PRIMARY KEY,
        question_original TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        blind_mode INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE casts (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        mothers_json TEXT NOT NULL,
        shield_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        supersedes_cast_id TEXT,
        recast_reason TEXT
      );
      CREATE TABLE predictions (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        methodology_version TEXT NOT NULL,
        verdict_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      INSERT INTO cases(id,question_original,created_at,status)
      VALUES('LEGACY-1','Legacy question','2026-09-01T00:00:00.000Z','open');
    `);
    const bytes = legacy.export();
    legacy.close();

    const repository = await SqliteCaseRepository.open(new MemoryByteStore(bytes));
    const migrated = repository.getCase("LEGACY-1");
    expect(migrated?.updatedAt).toBe("2026-09-01T00:00:00.000Z");
    expect(migrated?.timeline).toEqual([]);
    expect(repository.databaseHealth().userVersion).toBe(3);
    expect(repository.integrityCheck()).toBe("ok");
    repository.close();
  });

  it("rejects an invalid imported database without replacing the current store", async () => {
    const repository = await SqliteCaseRepository.open(new MemoryByteStore());
    const record = newCase("Keep me","2026-09-10T02:00:00.000Z");
    await repository.saveCase(record);

    await expect(repository.replaceDatabase(new Uint8Array([1,2,3,4]))).rejects.toThrow();
    expect(repository.getCase(record.id)?.question).toBe("Keep me");
    repository.close();
  });
});
