import { describe, expect, it } from "vitest";
import {
  LOCAL_AI_PRESETS,
  MUSA_ALLAMA_METHOD,
  PROTOCOLS,
  CorrespondenceRegistry,
  LruCache,
  createLocalAiProvider,
  createProtocolBookmark,
  exploreSchedule,
  compareLocationAwareTiming,
  houseNetworkGraph,
  judgeAncestryGraph,
  runAbsoluteAnalysis,
  validateProtocolBookmark
} from "../src/core";

describe("practitioner infrastructure",()=>{
  it("bounds reusable caches and invalidates correspondence lookup state",()=>{
    const cache=new LruCache<number>(2);
    cache.set("a",1); cache.set("b",2); cache.set("c",3);
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeUndefined();
    const registry=new CorrespondenceRegistry();
    registry.upsert({id:"x",family:"test",key:"Alpha",value:1,version:1});
    expect(registry.lookup("test","alpha")?.value).toBe(1);
    registry.remove("x");
    expect(registry.lookup("test","alpha")).toBeNull();
  });

  it("creates and validates saved protocol configurations",()=>{
    const bookmark=createProtocolBookmark(PROTOCOLS[0],{weights:{judge:1.4}},"2026-09-10T06:00:00.000Z");
    expect(validateProtocolBookmark(bookmark,PROTOCOLS)).toEqual([]);
    expect(bookmark.configuration.enabledModules.length).toBeGreaterThan(0);
  });

  it("accepts local loopback AI providers and rejects remote endpoints in local mode",()=>{
    expect(LOCAL_AI_PRESETS.ollama.endpoint).toContain("127.0.0.1");
    expect(createLocalAiProvider({endpoint:"http://127.0.0.1:11434/v1",model:"local-model"}).id).toBe("local-ai");
    expect(()=>createLocalAiProvider({endpoint:"https://example.com/v1",model:"x"})).toThrow(/local ai endpoint/i);
  });

  it("compares locations and scans bounded schedule windows using explicit traditional ranking labels",()=>{
    const candidates=compareLocationAwareTiming([
      {label:"Maiduguri",moment:new Date("2026-09-10T09:00:00Z"),latitude:11.8333,longitude:13.15,timeZone:"Africa/Lagos"},
      {label:"Kano",moment:new Date("2026-09-11T07:00:00Z"),latitude:12.0022,longitude:8.592,timeZone:"Africa/Lagos"}
    ],{preferredPlanets:["Jupiter","Sun"],avoidedPlanets:["Saturn"]});
    expect(candidates).toHaveLength(2);
    expect(candidates[0].planets).toHaveLength(7);
    const windows=exploreSchedule(new Date("2026-09-10T00:00:00Z"),new Date("2026-09-11T23:59:59Z"),11.8333,13.15,{preferredPlanets:["Jupiter"]});
    expect(windows.length).toBeGreaterThan(0);
    expect(windows.every((item)=>item.label==="traditional electional ranking")).toBe(true);
  });

  it("builds real graph models from analysis structures",()=>{
    const analysis=runAbsoluteAnalysis({question:"Will this debt be repaid?",motherIds:["via","populus","fortuna-major","conjunctio"],timestamp:"2026-09-10T06:00:00Z"});
    const ancestry=judgeAncestryGraph(analysis);
    const houses=houseNetworkGraph(analysis);
    expect(ancestry.nodes.length).toBeGreaterThan(4);
    expect(ancestry.edges.length).toBeGreaterThan(4);
    expect(houses.nodes).toHaveLength(12);
    expect(houses.edges.length).toBeGreaterThanOrEqual(18);
    expect(MUSA_ALLAMA_METHOD.name).toBe("MUSA ALLAMA METHOD");
  });
});
