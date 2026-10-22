import type { AbsoluteKernelExecution } from "./absoluteKernel";
import type { AbsoluteSynthesis } from "./absoluteSynthesis";

export interface ConversationalAnswer {
  headline:string;
  opening:string;
  reading:readonly string[];
  practicalDirection:string;
  closing:string;
  crossReference:readonly string[];
}

function naturalDecision(decision:AbsoluteSynthesis["decision"]):string {
  if (decision==="YES") return "favorable";
  if (decision==="NO") return "unfavorable";
  if (decision==="CONDITIONAL") return "mixed but workable";
  return "unclear";
}

function practicalDirection(domain:string,decision:AbsoluteSynthesis["decision"]):string {
  const d=domain.toLowerCase();

  if (d.includes("business")) {
    if (decision==="YES") return "I would move forward, but in stages: verify the other party, define the money and obligations clearly, and avoid exposing the whole position at once.";
    if (decision==="NO") return "I would not commit money or reputation to this in its present form. Renegotiate the structure or leave it until the conditions materially change.";
    if (decision==="CONDITIONAL") return "I would not reject it outright, but I would only proceed with safeguards: written terms, staged payment or delivery, clear exit points, and independent verification of the other side.";
    return "I would avoid an irreversible commitment for now. Clarify the missing facts and ask the question again in a narrower form before acting.";
  }

  if (d.includes("marriage")) {
    if (decision==="YES") return "I would allow the matter to continue, but judge the person by character, responsibility, compatibility and family reality rather than by the symbolic reading alone.";
    if (decision==="NO") return "I would slow the matter down rather than force it. Look carefully at character, responsibility, family compatibility and any issue already causing hesitation.";
    if (decision==="CONDITIONAL") return "There is enough here to continue the conversation, but not enough for blind commitment. Resolve the specific point of friction before making a final decision.";
    return "Do not force a decision from an unclear reading. Get the practical facts straight first, then revisit the question.";
  }

  if (d.includes("debt")) {
    if (decision==="YES") return "I would expect movement toward repayment, but still document the debt, set a concrete deadline and avoid relying on promises alone.";
    if (decision==="NO") return "I would behave as though voluntary repayment may not come easily: secure evidence, set a deadline and prepare a practical recovery path.";
    if (decision==="CONDITIONAL") return "Repayment looks possible but not clean. Tie any further patience to a specific date, amount or enforceable commitment.";
    return "Do not extend more credit while the picture is unclear. Clarify the debtor's actual capacity and commitment first.";
  }

  if (d.includes("employment") || d.includes("career")) {
    if (decision==="YES") return "I would pursue it actively and prepare as though the opening is real, while keeping a second option alive until the result is secured.";
    if (decision==="NO") return "I would not build the whole plan around this opportunity. Keep applying elsewhere and treat this one as secondary unless the circumstances change.";
    if (decision==="CONDITIONAL") return "Pursue it, but do not depend on it yet. There is promise with friction, delay or a condition still attached.";
    return "Keep the option open but continue searching. The reading does not justify stopping other opportunities.";
  }

  if (d.includes("travel")) {
    if (decision==="YES") return "I would proceed with the journey, subject to the ordinary checks: documents, money, route, health and timing.";
    if (decision==="NO") return "I would postpone or restructure the journey if you have that freedom, especially if practical warning signs are already present.";
    if (decision==="CONDITIONAL") return "The journey is possible, but I would remove the weak point first—documents, timing, money, route or the person you are depending on.";
    return "Do not cancel purely from this reading, but do not rush either. Recheck the practical travel conditions before committing.";
  }

  if (d.includes("timing")) {
    if (decision==="YES") return "I would treat the period as usable and act when the practical conditions are ready rather than waiting for a perfect symbolic moment.";
    if (decision==="NO") return "I would avoid forcing the matter in the present period if delay is affordable.";
    if (decision==="CONDITIONAL") return "The timing is not completely closed, but it is not clean either. Improve the practical conditions before choosing the moment.";
    return "The timing signal is too mixed for a sharp date. Narrow the question to a specific window or event.";
  }

  if (decision==="YES") return "I would proceed, but still keep ordinary practical safeguards in place.";
  if (decision==="NO") return "I would not force the matter in its present condition.";
  if (decision==="CONDITIONAL") return "I would proceed only after the contradictory point has been identified and controlled.";
  return "I would avoid forcing a conclusion until the question or facts are narrower.";
}

function abjadSnapshot(execution:AbsoluteKernelExecution):string|null {
  const subject=execution.abjad.subject;
  if (!subject) return null;
  const element=subject.readings.find((x)=>x.tableId==="OMEGA_ELEMENT_EDUCATIONAL_4")?.member.english;
  const zodiac=subject.readings.find((x)=>x.tableId==="OMEGA_ZODIAC_COMMON_12")?.member.english;
  const planet=subject.readings.find((x)=>x.tableId==="OMEGA_WEEKDAY_SATURN_FIRST_7")?.member.metadata?.planetEnglish;
  const bits=[element,zodiac,planet].filter(Boolean);
  return bits.length ? `The subject's Abjad total is ${subject.total}, resolving in the declared tables to ${bits.join(" / ")}. I use that as a cross-reference signature rather than as a separate yes/no vote.` : null;
}

function relationSnapshot(execution:AbsoluteKernelExecution):string|null {
  const relation=execution.toukhi.nameComparison;
  if (!relation) return null;
  if (relation.dominantRelation==="FRIEND") {
    return "The Ṭūkhī name-balance comparison leans toward a friendly elemental relationship between the two names, so the name layer does not contradict cooperation.";
  }
  if (relation.dominantRelation==="SAME") {
    return "The Ṭūkhī name-balance comparison shows the same dominant elemental nature on both sides, which I read as similarity and resonance rather than as an independent verdict.";
  }
  if (relation.dominantRelation==="ENEMY") {
    return "The Ṭūkhī name-balance comparison shows an opposing elemental relationship between the names. I treat that as friction to manage, not as an automatic rejection by itself.";
  }
  return "The Ṭūkhī name-balance comparison is mixed rather than cleanly friendly or opposing, so it adds nuance without overturning the main judgment.";
}

function falakiSnapshot(execution:AbsoluteKernelExecution):string|null {
  const f=execution.falaki;
  if (!f) return null;
  return `The timing layer places the consultation in planetary hour ${f.currentHour.ordinal}, ruled by ${f.currentHour.planet}; the 28-part lunar-mansion calculation is at ${f.astronomy.lunarMansion.index} (${f.astronomy.lunarMansion.arabicName}). I keep this as timing context unless a verified rule makes it decisive for the exact question.`;
}

export function buildConversationalAnswer(
  execution:AbsoluteKernelExecution,
  synthesis:AbsoluteSynthesis
):ConversationalAnswer {
  const domain=execution.structural.question.domain;
  const decision=synthesis.decision;
  const tone=naturalDecision(decision);
  const primary=execution.raml.rationale[1] ?? synthesis.decisiveBasis;
  const witnesses=execution.raml.rationale[2] ?? "";
  const judge=execution.raml.rationale[3] ?? "";

  const reading:string[]=[];

  if (decision==="YES") {
    reading.push(`My reading is favorable overall. The strongest line comes from the Raml side: ${primary} The later testimony does not overturn that direction.`);
  } else if (decision==="NO") {
    reading.push(`My reading is unfavorable overall. The primary Raml testimony points against the matter in its present form: ${primary} I would take that seriously rather than trying to force a positive answer out of weaker secondary signs.`);
  } else if (decision==="CONDITIONAL") {
    reading.push(`I do not read this as a clean yes or a clean no. The main testimony gives a direction, but another important layer pushes back. In practical terms, the matter is possible only if the point of contradiction is controlled rather than ignored.`);
  } else {
    reading.push("The overall picture is genuinely mixed. I would not call it a failure, but I also would not pretend the present testimony gives a clean green light. The safest reading is that the matter needs a narrower question or better-defined conditions.");
  }

  if (execution.toukhi.decisionStatement) {
    reading.push(`The verified Ṭūkhī rule that actually matches this question adds: ${execution.toukhi.decisionStatement}`);
  }

  const relation=relationSnapshot(execution);
  if (relation) reading.push(relation);

  const abjad=abjadSnapshot(execution);
  if (abjad) reading.push(abjad);

  const falaki=falakiSnapshot(execution);
  if (falaki) reading.push(falaki);

  const crossReference=[
    `Raml: ${execution.raml.decision}; primary house ${execution.raml.primaryHouse}; witnesses ${execution.raml.witnessAgreement===1?"agree favorably":execution.raml.witnessAgreement===-1?"agree unfavorably":"are mixed/neutral"}; Judge ${execution.raml.judgeDirection===1?"favorable":execution.raml.judgeDirection===-1?"unfavorable":"neutral"}.`,
    execution.toukhi.decisionStatement
      ? `Ṭūkhī: a verified rule fired and was included in the judgment.`
      : execution.toukhi.nameComparison
        ? `Ṭūkhī: name-balance relation = ${execution.toukhi.nameComparison.dominantRelation}; used as contextual cross-reference.`
        : "Ṭūkhī: no directly applicable verified directional rule fired for this question.",
    execution.abjad.subject
      ? `Abjad: subject total ${execution.abjad.subject.total}; used as a correspondence cross-reference.`
      : "Abjad: no subject name supplied.",
    execution.falaki
      ? `Falaki: current hour ruler ${execution.falaki.currentHour.planet}; used as timing context.`
      : "Falaki: not requested."
  ];

  const subject=execution.input.subjectName?.trim();
  const other=execution.input.otherParty?.trim();
  const names=subject && other ? `for ${subject} and ${other}` : subject ? `for ${subject}` : "";

  return {
    headline:decision==="YES" ? "I would lean YES"
      : decision==="NO" ? "I would lean NO"
      : decision==="CONDITIONAL" ? "Possible — but not without conditions"
      : "The reading is mixed; do not force it",
    opening:`Taking the Raml judgment together with the available Ṭūkhī, Abjad and planetary cross-references, my overall reading ${names} is ${tone}.`,
    reading,
    practicalDirection:practicalDirection(domain,decision),
    closing:decision==="UNRESOLVED"
      ? "So I would not stop at “unresolved.” I would treat the uncertainty itself as the message: narrow the question, identify the practical weak point, and then test the matter again."
      : "That is the overall judgment I would act on; the technical calculations can stay in Expert Audit unless you deliberately want to inspect them.",
    crossReference
  };
}
