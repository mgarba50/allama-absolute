import type { QuestionProfile } from "./types";

export interface EngineProtocol {
  id: string;
  name: string;
  modules: readonly string[];
  depth: "rapid" | "standard" | "deep";
  description: string;
}

export const PROTOCOLS: readonly EngineProtocol[] = [
  { id:"marriage", name:"Marriage Protocol", modules:["raml","houses","significators","abjad","contradictions"], depth:"deep", description:"Relationship and seventh-house focused analysis." },
  { id:"business", name:"Business Protocol", modules:["raml","houses","significators","timing","celestial","contradictions"], depth:"deep", description:"Trade, contract, resource and authority analysis." },
  { id:"lost-object", name:"Lost Object Protocol", modules:["raml","houses","location","elements","contradictions"], depth:"deep", description:"Location-hypothesis workflow with explicit uncertainty." },
  { id:"remote-state", name:"Remote-State Protocol", modules:["raml","remote-lab","contradictions"], depth:"deep", description:"Ranks traditional symbolic hypotheses without claiming sensory observation." },
  { id:"one-minute", name:"One-Minute Client Protocol", modules:["raml","houses","significators"], depth:"rapid", description:"Minimal auditable core for time-constrained readings." },
  { id:"maximum-deep", name:"Maximum Deep Search", modules:["raml","houses","significators","abjad","celestial","migration","mirrors","contradictions","calibration"], depth:"deep", description:"Runs every relevant locally available analytical subsystem." }
];

export function recommendProtocol(profile: QuestionProfile): EngineProtocol {
  const domain = profile.domain.toLowerCase();
  if (domain.includes("marriage") || domain.includes("relationship")) return PROTOCOLS[0];
  if (domain.includes("business") || domain.includes("debt") || domain.includes("employment")) return PROTOCOLS[1];
  if (domain.includes("lost")) return PROTOCOLS[2];
  if (domain.includes("remote") || domain.includes("location")) return PROTOCOLS[3];
  return PROTOCOLS[5];
}
