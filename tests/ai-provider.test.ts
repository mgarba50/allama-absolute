import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OpenAiCompatibleProvider,
  createLocalAiProvider
} from "../src/core";

describe("AI provider abstraction",()=>{
  afterEach(()=>vi.unstubAllGlobals());

  it("allows loopback local providers and rejects remote endpoints in local mode",()=>{
    expect(createLocalAiProvider({
      endpoint:"http://127.0.0.1:11434/v1",
      model:"qwen-local"
    }).id).toBe("local-ai");
    expect(()=>createLocalAiProvider({
      endpoint:"https://example.com/v1",
      model:"remote"
    })).toThrow(/localhost|127\.0\.0\.1|::1/i);
    expect(()=>createLocalAiProvider({
      endpoint:"http://localhost:1234/v1",
      model:""
    })).toThrow(/model name is required/i);
  });

  it("supports vendor-neutral OpenAI-compatible API providers without changing deterministic analysis",async()=>{
    const fetchMock=vi.fn(async (_input:RequestInfo|URL,init?:RequestInit)=>{
      expect(init?.method).toBe("POST");
      expect(init?.headers).toEqual(expect.objectContaining({
        "content-type":"application/json",
        authorization:"Bearer test-token"
      }));
      const body=JSON.parse(String(init?.body)) as {model:string;messages:unknown[]};
      expect(body.model).toBe("provider-model");
      expect(body.messages).toHaveLength(1);
      return new Response(JSON.stringify({
        choices:[{message:{content:"The evidence is mixed; the strongest objection remains unresolved."}}]
      }),{status:200,headers:{"content-type":"application/json"}});
    });
    vi.stubGlobal("fetch",fetchMock);

    const provider=new OpenAiCompatibleProvider({
      id:"test-provider",
      endpoint:"https://provider.example/v1/",
      model:"provider-model",
      apiKey:"test-token"
    });
    const result=await provider.complete([{role:"user",content:"Synthesize supplied evidence."}]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://provider.example/v1/chat/completions",
      expect.any(Object)
    );
    expect(result).toEqual({
      text:"The evidence is mixed; the strongest objection remains unresolved.",
      provider:"test-provider",
      model:"provider-model"
    });
  });
});
