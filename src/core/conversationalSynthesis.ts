import type { AbsoluteKernelExecution } from "./absoluteKernel";
import type { AbsoluteSynthesis } from "./absoluteSynthesis";

export interface ConversationalAnswer {
  headline:string;
  verdict:string;
  overview:readonly string[];
  centralThemes:readonly string[];
  opportunities:readonly string[];
  cautions:readonly string[];
  timingImpression:string;
  practicalGuidance:string;
  closing:string;
}

type Decision=AbsoluteSynthesis["decision"];

function domainKey(domain:string):string {
  const d=domain.toLowerCase();
  if (d.includes("business")) return "business";
  if (d.includes("marriage")) return "marriage";
  if (d.includes("debt")) return "debt";
  if (d.includes("employment") || d.includes("career")) return "employment";
  if (d.includes("travel")) return "travel";
  if (d.includes("timing")) return "timing";
  if (d.includes("legal")) return "legal";
  if (d.includes("health")) return "health";
  if (d.includes("lost") || d.includes("location")) return "location";
  return "general";
}

function headlineFor(domain:string,decision:Decision):string {
  const key=domainKey(domain);
  const table:Record<string,Record<Decision,string>>={
    business:{
      YES:"Proceed — but keep control of the terms",
      NO:"Do not force this deal in its present form",
      CONDITIONAL:"The opportunity is real, but the conditions are not yet clean",
      UNRESOLVED:"Do not commit yet; the matter is still unsettled"
    },
    marriage:{
      YES:"There is room for this to grow",
      NO:"Do not rush this union",
      CONDITIONAL:"There is potential, but one issue must be resolved first",
      UNRESOLVED:"The matter is not settled enough for a final commitment"
    },
    debt:{
      YES:"Repayment looks possible, but secure it properly",
      NO:"Do not rely on voluntary repayment alone",
      CONDITIONAL:"Recovery is possible, but it will require pressure or structure",
      UNRESOLVED:"Do not extend more trust until the situation becomes clearer"
    },
    employment:{
      YES:"Pursue the opening",
      NO:"Do not build your plan around this opportunity",
      CONDITIONAL:"Pursue it, but keep another path open",
      UNRESOLVED:"Keep the option alive, but do not depend on it"
    },
    travel:{
      YES:"The journey can proceed",
      NO:"Postpone or restructure the journey if you can",
      CONDITIONAL:"The journey is possible, but a weak point must be fixed first",
      UNRESOLVED:"Do not rush the journey until the practical path is clearer"
    },
    timing:{
      YES:"The period is usable",
      NO:"This is not the best moment to force the matter",
      CONDITIONAL:"The timing can work after one condition is corrected",
      UNRESOLVED:"Do not choose a date yet; the matter needs a narrower window"
    },
    legal:{
      YES:"The position has support, but handle it carefully",
      NO:"Do not assume this matter will resolve in your favor",
      CONDITIONAL:"There is room to improve the position, but it is not secure",
      UNRESOLVED:"The matter is too uncertain for a firm conclusion"
    },
    health:{
      YES:"The picture is encouraging, but practical care still comes first",
      NO:"Do not ignore the warning signs",
      CONDITIONAL:"The picture is mixed; practical care should take priority",
      UNRESOLVED:"Do not rely on this reading for a health decision"
    },
    location:{
      YES:"The matter appears recoverable",
      NO:"The trail looks weak",
      CONDITIONAL:"There are signs of recovery, but not without difficulty",
      UNRESOLVED:"The trail is too mixed for a confident location judgment"
    },
    general:{
      YES:"The signs lean in your favor",
      NO:"The signs advise against forcing the matter",
      CONDITIONAL:"Possible — but not without conditions",
      UNRESOLVED:"The matter is not settled enough to force an answer"
    }
  };
  return table[key]?.[decision] ?? table.general[decision];
}

function verdictFor(decision:Decision,strength:AbsoluteSynthesis["strength"]):string {
  if (decision==="YES") {
    return strength==="STRONG"
      ? "Taken as a whole, the matter leans clearly in your favor."
      : "Taken as a whole, the matter leans in your favor, although I would still keep a measure of caution.";
  }
  if (decision==="NO") {
    return strength==="STRONG"
      ? "Taken as a whole, the matter leans clearly against proceeding in its present form."
      : "Taken as a whole, I would be cautious about proceeding as things stand.";
  }
  if (decision==="CONDITIONAL") {
    return "Taken as a whole, I see genuine possibility here, but not a clean path. One part of the matter needs to be controlled before I would trust the outcome.";
  }
  return "Taken as a whole, the picture is too divided for me to give you a clean yes or no without pretending to see more certainty than is actually there.";
}

function relationshipTheme(execution:AbsoluteKernelExecution):string|null {
  const relation=execution.toukhi.nameComparison?.dominantRelation;
  if (!relation) return null;
  if (relation==="FRIEND") return "There is a natural degree of accord between the people involved, which makes cooperation easier when expectations are kept clear.";
  if (relation==="SAME") return "The people involved show a strong similarity of temperament or approach. That can create understanding, but it can also magnify the same blind spots on both sides.";
  if (relation==="ENEMY") return "There is a real point of friction between the people involved. It does not make success impossible, but it means trust, control and boundaries matter more than usual.";
  return "The relationship between the people involved is mixed rather than naturally easy, so success depends more on structure than on instinctive harmony.";
}

function internalConflict(execution:AbsoluteKernelExecution):boolean {
  const primary=execution.raml.primaryDirection;
  if (primary===0) return execution.raml.decision==="CONDITIONAL";
  const witness=execution.raml.witnessAgreement;
  const judge=execution.raml.judgeDirection;
  return (witness!==0 && witness!==primary) || (judge!==0 && judge!==primary) || execution.raml.decision==="CONDITIONAL";
}

function themesFor(domain:string,decision:Decision,execution:AbsoluteKernelExecution):string[] {
  const key=domainKey(domain);
  const themes:string[]=[];

  if (decision==="YES") themes.push("The matter has movement around it rather than a sense of closure or blockage.");
  if (decision==="NO") themes.push("The matter carries more resistance than ease in its present form.");
  if (decision==="CONDITIONAL") themes.push("The opportunity and the obstacle are both real; the outcome depends on how the weak point is handled.");
  if (decision==="UNRESOLVED") themes.push("The matter is not empty, but its direction is not yet settled enough to trust a firm conclusion.");

  if (key==="business") themes.push("Control, written terms and the quality of the counterparty matter more here than speed.");
  if (key==="marriage") themes.push("Character, responsibility and the ability to carry obligations matter more than attraction alone.");
  if (key==="debt") themes.push("Promises matter less than enforceable commitment, timing and actual capacity to pay.");
  if (key==="employment") themes.push("The opening should be tested actively, but your wider options should remain alive until something is secured.");
  if (key==="travel") themes.push("The journey turns on preparation, route, documents and the reliability of the people or arrangements around it.");
  if (key==="timing") themes.push("The question is less about waiting for perfection and more about choosing a moment when the practical conditions are aligned.");

  const relation=relationshipTheme(execution);
  if (relation) themes.push(relation);

  if (internalConflict(execution)) {
    themes.push("One part of the picture resists the main direction. I would treat that as a warning to tighten the conditions, not as background noise.");
  }

  return themes.slice(0,4);
}

function opportunitiesFor(domain:string,decision:Decision):string[] {
  const key=domainKey(domain);
  const items:string[]=[];

  if (decision==="YES" || decision==="CONDITIONAL") {
    items.push("There is enough openness here to justify engagement rather than immediate withdrawal.");
  } else if (decision==="NO") {
    items.push("The opportunity may improve if the structure, timing or counterpart changes; the warning is against the present form, not necessarily against the entire idea forever.");
  } else {
    items.push("The uncertainty itself creates room to gather better information before making an irreversible move.");
  }

  if (key==="business") items.push("A staged agreement, clear deliverables and controlled exposure could preserve the upside while limiting avoidable risk.");
  if (key==="marriage") items.push("A slower period of observation can reveal whether the promising side of the relationship is supported by real responsibility.");
  if (key==="debt") items.push("A concrete repayment schedule or enforceable commitment can turn uncertainty into something measurable.");
  if (key==="employment") items.push("Keeping momentum on multiple applications or contacts increases the chance that the favorable opening becomes tangible.");
  if (key==="travel") items.push("Good preparation can remove much of the weakness around the journey before departure.");
  if (key==="timing") items.push("A small delay used to improve the conditions may be more valuable than waiting passively for a perfect moment.");

  return items.slice(0,3);
}

function cautionsFor(domain:string,decision:Decision,execution:AbsoluteKernelExecution):string[] {
  const key=domainKey(domain);
  const items:string[]=[];

  if (decision==="YES") items.push("A favorable reading is not a license to become careless. The positive side depends on preserving the conditions that make the opportunity workable.");
  if (decision==="NO") items.push("Do not let urgency, sunk cost or enthusiasm pressure you into ignoring what is already uncomfortable.");
  if (decision==="CONDITIONAL") items.push("The weak point is not cosmetic. If it is left unresolved, it can become the part that overturns the opportunity.");
  if (decision==="UNRESOLVED") items.push("Do not manufacture certainty where the picture is still divided. Narrow the question or improve the facts first.");

  if (key==="business") items.push("Verify money, ownership, delivery, authority and exit terms independently before committing.");
  if (key==="marriage") items.push("Do not use symbolic reassurance to excuse poor character, irresponsibility, coercion or unresolved family problems.");
  if (key==="debt") items.push("Do not extend additional credit merely because repayment still looks possible.");
  if (key==="employment") items.push("Do not abandon other options until an offer, appointment or payment is actually secured.");
  if (key==="travel") items.push("Documents, funds, health, route and local conditions must still be checked in the ordinary way.");
  if (key==="legal") items.push("Treat this reading as reflection only; legal strategy should be based on qualified professional advice and the actual evidence.");
  if (key==="health") items.push("Treat this reading as symbolic reflection only; symptoms, diagnosis and treatment belong with qualified medical care.");

  if (internalConflict(execution)) items.push("I would be especially careful about the part of the matter that already feels inconsistent, delayed or dependent on someone else's promise.");

  return items.slice(0,4);
}

function timingFor(domain:string,decision:Decision,execution:AbsoluteKernelExecution):string {
  if (execution.toukhi.decisionDirection===1) {
    return "The broader period itself looks supportive. I would not delay merely from fear, but I would still choose the moment when the practical conditions are properly in place.";
  }
  if (execution.toukhi.decisionDirection===-1) {
    return "The broader period carries more resistance than ease. If delay is affordable, I would prefer to improve the conditions first rather than forcing the matter immediately.";
  }

  const key=domainKey(domain);
  if (decision==="YES") {
    if (key==="business") return "I would favor movement once the terms, money and authority are clear. This feels more like a matter for disciplined action than prolonged waiting.";
    if (key==="travel") return "I would move when the route, documents and money are settled. I do not see a strong reason to delay simply for the sake of delay.";
    return "I would not wait for a perfect moment. Act when the practical conditions are secure and the decision can be carried through cleanly.";
  }
  if (decision==="NO") {
    return "I would not rush this. Give the situation room to change, especially if the present obstacle can be corrected by time, distance or renegotiation.";
  }
  if (decision==="CONDITIONAL") {
    return "The better moment comes after the weak point is dealt with. I would treat resolution of that issue—not the calendar alone—as the real timing signal.";
  }
  return "I would not choose a decisive date yet. First narrow the uncertainty, then revisit the timing once the matter has a clearer shape.";
}

function guidanceFor(domain:string,decision:Decision):string {
  const key=domainKey(domain);

  if (key==="business") {
    if (decision==="YES") return "Proceed, but do it in stages. Verify the other side, put obligations in writing, keep control of money and delivery, and avoid exposing the whole position before performance is proven.";
    if (decision==="NO") return "Do not commit money or reputation to the present structure. Renegotiate the weak points or step away until the arrangement changes materially.";
    if (decision==="CONDITIONAL") return "Keep the opportunity alive, but make your participation conditional on clear terms, staged performance, independent verification and a clean exit if promises are not met.";
    return "Do not sign, pay or depend on the deal yet. Reduce the question to the specific uncertainty—counterparty, money, timing, quality or delivery—and resolve that first.";
  }

  if (key==="marriage") {
    if (decision==="YES") return "Allow the matter to continue, but judge it by character, responsibility, compatibility and the ability to carry family obligations in real life.";
    if (decision==="NO") return "Slow the matter down. Do not let emotion or family pressure push you past unresolved concerns about character, responsibility or compatibility.";
    if (decision==="CONDITIONAL") return "Continue the conversation, but make the unresolved issue explicit and require a real-world answer to it before commitment.";
    return "Do not force a marriage decision from an unclear picture. Observe more, ask harder questions and let conduct provide the missing evidence.";
  }

  if (key==="debt") {
    if (decision==="YES") return "Expect movement, but still document the obligation, set a concrete deadline and tie further patience to actual payment rather than promises.";
    if (decision==="NO") return "Act as though voluntary repayment may not come easily. Preserve evidence, set a deadline and prepare a practical recovery route.";
    if (decision==="CONDITIONAL") return "Repayment is possible, but only if patience is tied to a specific amount, date or enforceable commitment.";
    return "Do not extend more credit. First establish whether the debtor has both the capacity and the intention to pay.";
  }

  if (key==="employment") {
    if (decision==="YES") return "Pursue it actively and prepare as though the opening is real, but keep another option alive until the appointment or payment is secured.";
    if (decision==="NO") return "Do not build your whole plan around this opportunity. Continue applying elsewhere and let this one prove itself before you depend on it.";
    if (decision==="CONDITIONAL") return "Pursue it, but do not depend on it yet. Keep another path open until the delay or condition attached to this one is resolved.";
    return "Keep the option open, but continue searching. The present picture does not justify stopping other opportunities.";
  }

  if (key==="travel") {
    if (decision==="YES") return "Proceed with the journey once the ordinary checks are complete: documents, funds, route, accommodation, health and the reliability of anyone you depend on.";
    if (decision==="NO") return "Postpone or restructure the journey if you have that freedom, especially if practical warning signs are already present.";
    if (decision==="CONDITIONAL") return "The journey is possible, but fix the weak point first—documents, timing, money, route or the person you are depending on.";
    return "Do not cancel purely from uncertainty, but do not rush either. Recheck the practical travel conditions before committing.";
  }

  if (key==="health") return "Use this only as reflective symbolism. For symptoms, diagnosis, treatment or urgent concerns, rely on qualified medical care.";
  if (key==="legal") return "Use this only as reflective guidance. For legal rights, deadlines, evidence and strategy, rely on a qualified lawyer.";

  if (decision==="YES") return "Proceed, but preserve ordinary safeguards and keep enough flexibility to respond if the circumstances change.";
  if (decision==="NO") return "Do not force the matter in its present condition. Change the structure, timing or circumstances before reconsidering.";
  if (decision==="CONDITIONAL") return "Proceed only after the main weakness is identified and controlled. Do not treat the condition as a minor detail.";
  return "Do not force a conclusion yet. Narrow the question, improve the facts and revisit the matter once the uncertainty is more specific.";
}

export function buildConversationalAnswer(
  execution:AbsoluteKernelExecution,
  synthesis:AbsoluteSynthesis
):ConversationalAnswer {
  const domain=execution.structural.question.domain;
  const decision=synthesis.decision;
  const subject=execution.input.subjectName?.trim();
  const other=execution.input.otherParty?.trim();

  const context=subject && other
    ? `Looking at the matter between ${subject} and ${other}`
    : subject
      ? `Looking at the matter around ${subject}`
      : "Looking at the matter as a whole";

  const overview:string[]=[
    `${context}, ${verdictFor(decision,synthesis.strength).charAt(0).toLowerCase()+verdictFor(decision,synthesis.strength).slice(1)}`,
    decision==="YES"
      ? "There is more movement than obstruction here. I would not call the path effortless, but the overall pattern gives me more reason to engage than to withdraw."
      : decision==="NO"
        ? "What concerns me is not one isolated warning but the way resistance keeps returning around the matter. I would take that seriously rather than trying to force a favorable interpretation."
        : decision==="CONDITIONAL"
          ? "What I see is not failure; it is an opportunity tied to a condition. If that condition is handled well, the matter can improve. If it is ignored, it is exactly where the difficulty is likely to grow."
          : "I can see competing indications rather than a single settled direction. In that situation, the mature response is not to invent certainty but to identify what remains undefined and make the next decision smaller."
  ];

  return {
    headline:headlineFor(domain,decision),
    verdict:verdictFor(decision,synthesis.strength),
    overview,
    centralThemes:themesFor(domain,decision,execution),
    opportunities:opportunitiesFor(domain,decision),
    cautions:cautionsFor(domain,decision,execution),
    timingImpression:timingFor(domain,decision,execution),
    practicalGuidance:guidanceFor(domain,decision),
    closing:decision==="UNRESOLVED"
      ? "I would treat the uncertainty itself as part of the reading. Reduce the matter to the one thing you most need to know, then revisit it rather than demanding a false certainty from a broad question."
      : "That is the judgment I would act on. The analytical work behind it can remain private unless you deliberately open the expert view."
  };
}
