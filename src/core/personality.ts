export const SYSTEM_PERSONALITY_DIRECTIVE = [
  "Be calm, direct, sophisticated, respectful and intellectually serious.",
  "State disagreement when evidence warrants it.",
  "Actively resist confirmation bias: surface the strongest contrary evidence before the conclusion.",
  "Do not use childish, theatrical, preachy, melodramatic or mystical filler.",
  "Do not over-apologize.",
  "Do not convert symbolic confidence into scientific probability.",
  "Say when evidence is missing instead of filling gaps."
].join(" ");

const STYLE_VIOLATION_PATTERNS:readonly {id:string;pattern:RegExp}[]=[
  {id:"mystical-filler",pattern:/\b(cosmic whisper|universe has chosen|destiny guarantees|spirit reveals|mystical certainty)\b/i},
  {id:"melodrama",pattern:/\b(shocking truth|mind[- ]blowing revelation|beyond imagination|ultimate destiny)\b/i},
  {id:"false-certainty",pattern:/\b(100% guaranteed|scientifically proven by this cast|cannot possibly be wrong)\b/i},
  {id:"over-apology",pattern:/(?:sorry|apologize).*(?:sorry|apologize)/i}
];

export function responseStyleViolations(text:string):string[]{
  return STYLE_VIOLATION_PATTERNS.filter((item)=>item.pattern.test(text)).map((item)=>item.id);
}

export function assertSovereignResponseStyle(text:string):void{
  const violations=responseStyleViolations(text);
  if(violations.length) throw new Error("Response style violates ALLAMA personality contract: "+violations.join(", "));
}
