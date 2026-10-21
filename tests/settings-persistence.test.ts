import { describe, expect, it } from "vitest";
import { PROTOCOLS, SqliteCaseRepository, createProtocolBookmark, type SqliteByteStore } from "../src/core";

class Store implements SqliteByteStore{
  bytes:Uint8Array|null=null;
  async load(){return this.bytes?new Uint8Array(this.bytes):null;}
  async save(bytes:Uint8Array){this.bytes=new Uint8Array(bytes);}
}

describe("practitioner settings persistence",()=>{
  it("stores non-secret settings, methodology and protocol bookmarks in SQLite",async()=>{
    const repo=await SqliteCaseRepository.open(new Store());
    await repo.saveSetting("local-ai",{endpoint:"http://127.0.0.1:11434/v1",model:"local"});
    expect(repo.getSetting("local-ai",null)).toEqual({endpoint:"http://127.0.0.1:11434/v1",model:"local"});
    const bookmark=createProtocolBookmark(PROTOCOLS[0],{},"2026-09-10T08:00:00.000Z");
    await repo.saveProtocolBookmark(bookmark);
    expect(repo.listProtocolBookmarks()).toHaveLength(1);
    expect(repo.databaseHealth().userVersion).toBe(4);
    repo.close();
  });
});
