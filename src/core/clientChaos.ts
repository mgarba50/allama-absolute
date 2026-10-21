export type ChaosFragmentKind = "relevant-fact" | "alleged-fact" | "emotion" | "irrelevant-narrative" | "question";

export interface ChaosFragment {
  text: string;
  kind: ChaosFragmentKind;
  reasons: readonly string[];
}

export interface ClientChaosAnalysis {
  originalLength: number;
  fragments: readonly ChaosFragment[];
  relevantFacts: readonly string[];
  allegedFacts: readonly string[];
  emotionalClaims: readonly string[];
  irrelevantNarrative: readonly string[];
  actualQuestion: string;
  hiddenQuestions: readonly string[];
}

const EMOTION=/\b(useless|liar|hate|love|angry|furious|afraid|scared|worried|desperate|betrayed|stupid|terrible|amazing|surely|obviously|never trust)\b|(?:^|[^\p{L}\p{N}])(?:غاضب|غاضبة|غضبان|أكره|اكره|أحب|احب|خائف|خائفة|قلق|قلقة|يائس|يائسة|خانني|خانتني|كاذب|كاذبة|فظيع|فظيعة|رائع|رائعة|بالتأكيد|طبعاً|طبعا|من الواضح|لا أثق)(?=$|[^\p{L}\p{N}])/iu;
const ALLEGED=/\b(he says|she says|they say|claimed|claims|alleged|promised|told me|according to|supposedly|apparently)\b|(?:^|[^\p{L}\p{N}])(?:يقول|تقول|قال|قالت|يدعي|تدعي|زعم|زعمت|وعد|وعدت|أخبرني|اخبرني|حسب قوله|حسب قولها|وفقاً له|وفقا له|وفقاً لها|وفقا لها|يُزعم|يزعم|على ما يبدو)(?=$|[^\p{L}\p{N}])/iu;
const QUESTION=/[?؟]|\b(will|is|are|does|did|can|could|should|when|where|why|whether|which|who)\b|(?:^|[^\p{L}\p{N}])(?:هل|ماذا|متى|أين|اين|لماذا|كيف|مَن|من|أي|أيمكن|ايمكن|هل يمكن)(?=$|[^\p{L}\p{N}])/iu;
const FACT=/\b(contract|money|debt|paid|payment|date|meeting|travel|marriage|job|work|business|document|signed|sent|received|arrived|left|called|message|property|court|exam|shipment)\b|(?:^|[^\p{L}\p{N}])(?:عقد|العقد|مال|المال|أموال|اموال|دين|الدين|سداد|دفع|دفعت|دفعة|موعد|الموعد|اجتماع|سفر|زواج|وظيفة|عمل|تجارة|مشروع|وثيقة|مستند|وقّع|وقع|أرسل|ارسل|استلم|وصل|غادر|اتصل|رسالة|عقار|محكمة|امتحان|شحنة)(?=$|[^\p{L}\p{N}])/iu;

function splitFragments(message: string): string[] {
  return message
    .replace(/\r/g,"")
    .split(/(?<=[.!?؟])\s+|\n+/)
    .map((item)=>item.trim())
    .filter(Boolean);
}

export function analyzeClientChaos(message: string): ClientChaosAnalysis {
  const text=message.trim();
  if (!text) throw new Error("Client message cannot be empty.");
  const fragments=splitFragments(text).map<ChaosFragment>((fragment)=>{
    const reasons:string[]=[];
    let kind:ChaosFragmentKind="irrelevant-narrative";
    if (QUESTION.test(fragment)) { kind="question"; reasons.push("interrogative structure"); }
    if (ALLEGED.test(fragment) && kind!=="question") { kind="alleged-fact"; reasons.push("reported or attributed claim"); }
    if (FACT.test(fragment) && kind==="irrelevant-narrative") { kind="relevant-fact"; reasons.push("domain fact marker"); }
    if (EMOTION.test(fragment) && kind==="irrelevant-narrative") { kind="emotion"; reasons.push("emotion/evaluation marker"); }
    if (EMOTION.test(fragment) && kind!=="emotion") reasons.push("contains emotional framing");
    return {text:fragment,kind,reasons};
  });

  const questions=fragments.filter((item)=>item.kind==="question").map((item)=>item.text);
  const actualQuestion=questions.at(-1) ?? fragments.find((item)=>FACT.test(item.text))?.text ?? text.slice(0,500);
  const hiddenQuestions=questions.slice(0,-1);

  return {
    originalLength:text.length,
    fragments,
    relevantFacts:fragments.filter((item)=>item.kind==="relevant-fact").map((item)=>item.text),
    allegedFacts:fragments.filter((item)=>item.kind==="alleged-fact").map((item)=>item.text),
    emotionalClaims:fragments.filter((item)=>item.kind==="emotion" || item.reasons.includes("contains emotional framing")).map((item)=>item.text),
    irrelevantNarrative:fragments.filter((item)=>item.kind==="irrelevant-narrative").map((item)=>item.text),
    actualQuestion,
    hiddenQuestions
  };
}
