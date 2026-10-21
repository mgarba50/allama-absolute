import type { AbsoluteAnalysis } from "./analysis";
import { SYSTEM_PERSONALITY_DIRECTIVE, assertSovereignResponseStyle } from "./personality";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletion {
  text: string;
  provider: string;
  model: string;
}

export interface AiProvider {
  readonly id: string;
  readonly model: string;
  complete(messages: readonly AiMessage[], signal?: AbortSignal): Promise<AiCompletion>;
}

export interface OpenAiCompatibleOptions {
  id: string;
  endpoint: string;
  model: string;
  apiKey?: string;
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly id: string;
  readonly model: string;

  constructor(private options: OpenAiCompatibleOptions) {
    this.id = options.id;
    this.model = options.model;
  }

  async complete(messages: readonly AiMessage[], signal?: AbortSignal): Promise<AiCompletion> {
    const endpoint = this.options.endpoint.replace(/\/$/,"") + "/chat/completions";
    const headers: Record<string,string> = { "content-type":"application/json" };
    if (this.options.apiKey) headers.authorization = "Bearer " + this.options.apiKey;

    const response = await fetch(endpoint,{
      method:"POST",
      headers,
      body:JSON.stringify({ model:this.options.model, messages, temperature:0.2 }),
      signal
    });

    if (!response.ok) throw new Error("AI provider request failed with HTTP " + response.status);
    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new Error("AI provider returned no text.");
    assertSovereignResponseStyle(text);
    return { text, provider:this.options.id, model:this.options.model };
  }
}

export function analysisMessages(analysis: AbsoluteAnalysis): AiMessage[] {
  const deterministic = {
    question:analysis.question,
    shield:{
      mothers:analysis.shield.mothers.map((f) => ({ id:f.id,pattern:f.pattern })),
      daughters:analysis.shield.daughters.map((f) => ({ id:f.id,pattern:f.pattern })),
      nieces:analysis.shield.nieces.map((f) => ({ id:f.id,pattern:f.pattern })),
      rightWitness:analysis.shield.rightWitness,
      leftWitness:analysis.shield.leftWitness,
      judge:analysis.shield.judge,
      reconciler:analysis.shield.reconciler
    },
    validationErrors:analysis.validationErrors,
    elements:analysis.elements,
    traditionalEvidence:analysis.evidence,
    traditionalVerdict:analysis.traditionalVerdict,
    contradiction:analysis.contradiction,
    celestial:analysis.celestial,
    dataQuality:analysis.dataQuality
  };

  return [
    {
      role:"system",
      content:"You are the optional synthesis layer of ALLAMA ABSOLUTE. "+SYSTEM_PERSONALITY_DIRECTIVE+" Never invent figures, arithmetic, planetary positions, sources, case statistics, or missing observations. Explicitly distinguish deterministic calculation, traditional interpretation, AI synthesis, and empirical evidence. If data is absent, say it is absent."
    },
    {
      role:"user",
      content:"Synthesize the following already-calculated analysis. Challenge the leading interpretation and identify contrary evidence before writing a conclusion.\n\n" + JSON.stringify(deterministic,null,2)
    }
  ];
}

export interface LocalAiOptions {
  endpoint:string;
  model:string;
  id?:string;
}

export const LOCAL_AI_PRESETS = {
  ollama:{endpoint:"http://127.0.0.1:11434/v1",model:"",label:"Ollama OpenAI-compatible endpoint"},
  lmStudio:{endpoint:"http://127.0.0.1:1234/v1",model:"",label:"LM Studio OpenAI-compatible endpoint"}
} as const;

export function createLocalAiProvider(options:LocalAiOptions):AiProvider {
  const endpoint=options.endpoint.trim();
  const model=options.model.trim();
  if(!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(endpoint)) {
    throw new Error("Local AI endpoint must use localhost, 127.0.0.1 or ::1.");
  }
  if(!model) throw new Error("Local AI model name is required.");
  return new OpenAiCompatibleProvider({id:options.id ?? "local-ai",endpoint,model});
}
