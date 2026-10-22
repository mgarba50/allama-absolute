import type { GeomanticFigure, QuestionProfile } from "./types";
import type { MethodExecution, MethodPack, MethodRule, StructuralFormulaResult } from "./formulaKernel";

export interface RamlHouseSelection {
  primary:number;
  supporting:readonly number[];
  reason:string;
}

function has(text:string, terms:readonly string[]):boolean {
  const lower=text.toLowerCase();
  return terms.some((term)=>lower.includes(term));
}

export function selectRamlHouses(question:QuestionProfile):RamlHouseSelection {
  const q=question.normalized.toLowerCase();

  if (question.domain==="Marriage") {
    return {primary:7,supporting:[1],reason:"Marriage/partner questions are centered on House 7; House 1 represents the querent."};
  }

  if (question.domain==="Debt") {
    if (has(q,["repay","debtor","owe","owed","payment"])) {
      return {primary:8,supporting:[7,2,1],reason:"Repayment/debtor-resource questions center on House 8, with House 7 for the debtor and House 2 for the querent's resources."};
    }
    return {primary:2,supporting:[8,7,1],reason:"Money/resource questions center on House 2 unless the wording specifically concerns the debtor's resources."};
  }

  if (question.domain==="Business") {
    if (has(q,["partner","partnership","contract","agreement","client","supplier","deal"])) {
      return {primary:7,supporting:[10,2,1],reason:"Partnership/contract/counterparty questions center on House 7; House 10 covers public outcome and House 2 resources."};
    }
    if (has(q,["profit","money","income","revenue","gain","cash","payment"])) {
      return {primary:2,supporting:[10,7,1],reason:"Business-money questions center on House 2, with outcome and counterparty as supporting houses."};
    }
    return {primary:10,supporting:[2,7,1],reason:"General business-success questions center on House 10, with resources and counterparties as supporting houses."};
  }

  if (question.domain==="Employment") {
    if (has(q,["salary","pay","income"])) return {primary:2,supporting:[10,6,1],reason:"Compensation questions center on House 2."};
    if (has(q,["work","service","routine"])) return {primary:6,supporting:[10,2,1],reason:"Work/service questions center on House 6."};
    return {primary:10,supporting:[6,2,1],reason:"Job, office, promotion and authority questions center on House 10."};
  }

  if (question.domain==="Travel") {
    if (has(q,["foreign","abroad","long","flight","international"])) return {primary:9,supporting:[1,3],reason:"Long-distance/foreign travel centers on House 9."};
    return {primary:3,supporting:[9,1],reason:"Short travel, movement and messages center on House 3; House 9 remains a supporting long-distance indicator."};
  }

  if (question.domain==="Lost Object") {
    return {primary:2,supporting:[4,7,1],reason:"Possessions center on House 2; House 4 and House 7 are retained for place/other-party context."};
  }

  if (question.domain==="Location") {
    return {primary:4,supporting:[3,7,9,1],reason:"Location/place questions center on House 4, with movement and other-party houses retained as context."};
  }

  if (question.domain==="Health Symbolism") {
    return {primary:6,supporting:[1,5,8],reason:"Illness/service symbolism centers on House 6; this remains symbolic and not medical advice."};
  }

  if (question.domain==="Legal") {
    return {primary:7,supporting:[10,9,1],reason:"Opponent/litigation questions center on House 7, with authority and law as supporting houses."};
  }

  const routed=question.houses[0] ?? 1;
  return {primary:routed,supporting:question.houses.filter((house)=>house!==routed),reason:"No narrower house-selection rule matched; the deterministic question router supplied the house."};
}

export function figureDirection(figure:GeomanticFigure):-1|0|1 {
  if (figure.quality==="favorable") return 1;
  if (figure.quality==="unfavorable") return -1;
  return 0;
}

function houseFigure(state:StructuralFormulaResult,house:number):GeomanticFigure | null {
  return state.relevantHouses.find((item)=>item.house===house)?.figure
    ?? [...state.shield.mothers,...state.shield.daughters,...state.shield.nieces][house-1]
    ?? null;
}

function makeHouseRule(id:string,house:number,priority:number,role:string):MethodRule {
  return {
    id,
    source:"ALLAMA Omega Raml/Abjad Masterbook — house-first procedural reading",
    school:"ALLAMA documented procedural core",
    description:`${role}: read the figure occupying House ${house} before late-chart synthesis.`,
    priority,
    evaluate:(state)=>{
      const figure=houseFigure(state,house);
      if (!figure) return null;
      const direction=figureDirection(figure);
      return {
        direction,
        statement:`House ${house} (${role}) contains ${figure.latin} / ${figure.arabic}: ${figure.keywords.join(", ")}.`,
        facts:[
          `house=${house}`,
          `figure=${figure.id}`,
          `quality=${figure.quality}`,
          `planet=${figure.planet}`,
          `element=${figure.element}`
        ]
      };
    }
  };
}

export function createRamlCorePack(state:StructuralFormulaResult):MethodPack {
  const selection=selectRamlHouses(state.question);
  const rules:MethodRule[]=[
    makeHouseRule("RAML-HOUSE-PRIMARY",selection.primary,100,"primary question house"),
    ...selection.supporting.map((house,index)=>makeHouseRule(`RAML-HOUSE-SUPPORT-${house}`,house,80-index,`supporting house ${index+1}`)),
    {
      id:"RAML-WITNESS-RIGHT",
      source:"ALLAMA Omega Raml/Abjad Masterbook — witnesses after the relevant house",
      school:"ALLAMA documented procedural core",
      description:"Read the right witness as secondary testimony.",
      priority:60,
      evaluate:(s)=>({
        direction:figureDirection(s.witnesses.right),
        statement:`Right Witness is ${s.witnesses.right.latin} / ${s.witnesses.right.arabic}: ${s.witnesses.right.keywords.join(", ")}.`,
        facts:[`figure=${s.witnesses.right.id}`,`quality=${s.witnesses.right.quality}`]
      })
    },
    {
      id:"RAML-WITNESS-LEFT",
      source:"ALLAMA Omega Raml/Abjad Masterbook — witnesses after the relevant house",
      school:"ALLAMA documented procedural core",
      description:"Read the left witness as secondary testimony.",
      priority:59,
      evaluate:(s)=>({
        direction:figureDirection(s.witnesses.left),
        statement:`Left Witness is ${s.witnesses.left.latin} / ${s.witnesses.left.arabic}: ${s.witnesses.left.keywords.join(", ")}.`,
        facts:[`figure=${s.witnesses.left.id}`,`quality=${s.witnesses.left.quality}`]
      })
    },
    {
      id:"RAML-JUDGE",
      source:"ALLAMA Omega Raml/Abjad Masterbook — judge as late-chart testimony, not the starting point",
      school:"ALLAMA documented procedural core",
      description:"Read the Judge only after the question house and witnesses.",
      priority:50,
      evaluate:(s)=>({
        direction:figureDirection(s.judge),
        statement:`Judge is ${s.judge.latin} / ${s.judge.arabic}: ${s.judge.keywords.join(", ")}.`,
        facts:[`figure=${s.judge.id}`,`quality=${s.judge.quality}`]
      })
    },
    {
      id:"RAML-RECONCILER",
      source:"ALLAMA extended shield convention",
      school:"ALLAMA documented procedural core",
      description:"Use the Reconciler only as a final secondary reconciliatory testimony.",
      priority:40,
      evaluate:(s)=>({
        direction:figureDirection(s.reconciler),
        statement:`Reconciler is ${s.reconciler.latin} / ${s.reconciler.arabic}: ${s.reconciler.keywords.join(", ")}.`,
        facts:[`figure=${s.reconciler.id}`,`quality=${s.reconciler.quality}`]
      })
    }
  ];

  return {
    id:"allama-raml-core-v1",
    name:"ALLAMA Raml Core — House-First Procedural Pack",
    version:1,
    rules
  };
}

export type RamlDecision = "YES"|"NO"|"CONDITIONAL"|"UNRESOLVED";

export interface RamlCoreJudgment {
  decision:RamlDecision;
  primaryHouse:number;
  primaryFigure:string;
  primaryDirection:-1|0|1;
  witnessAgreement:-1|0|1;
  judgeDirection:-1|0|1;
  rationale:readonly string[];
  execution:MethodExecution;
}

export function executeRamlCore(state:StructuralFormulaResult):RamlCoreJudgment {
  const selection=selectRamlHouses(state.question);
  const pack=createRamlCorePack(state);
  const execution:MethodExecution={
    pack:{id:pack.id,name:pack.name,version:pack.version},
    structural:state,
    matchedRules:pack.rules
      .map((rule)=>{
        const result=rule.evaluate(state);
        return result ? {
          ruleId:rule.id,source:rule.source,school:rule.school,priority:rule.priority,
          direction:result.direction,statement:result.statement,facts:result.facts
        } : null;
      })
      .filter((item):item is NonNullable<typeof item>=>Boolean(item))
      .sort((a,b)=>b.priority-a.priority || a.ruleId.localeCompare(b.ruleId))
  };

  const primary=houseFigure(state,selection.primary) ?? state.primaryHouseFigure;
  const primaryDirection=figureDirection(primary);
  const right=figureDirection(state.witnesses.right);
  const left=figureDirection(state.witnesses.left);
  const witnessAgreement=right===left ? right : 0;
  const judgeDirection=figureDirection(state.judge);

  let decision:RamlDecision="UNRESOLVED";
  const rationale:string[]=[
    selection.reason,
    `Primary House ${selection.primary}: ${primary.latin} (${primary.quality}) — ${primary.keywords.join(", ")}.`,
    `Witnesses: ${state.witnesses.right.latin} (${state.witnesses.right.quality}) / ${state.witnesses.left.latin} (${state.witnesses.left.quality}).`,
    `Judge: ${state.judge.latin} (${state.judge.quality}).`
  ];

  if (primaryDirection!==0) {
    const contraryLate=(judgeDirection!==0 && judgeDirection!==primaryDirection) || (witnessAgreement!==0 && witnessAgreement!==primaryDirection);
    decision=contraryLate ? "CONDITIONAL" : primaryDirection>0 ? "YES" : "NO";
    if (contraryLate) rationale.push("The primary house gives a directional answer, but late-chart testimony materially contradicts it; the pack therefore refuses to flatten the conflict into a false binary.");
  } else if (witnessAgreement!==0) {
    const judgeContradicts=judgeDirection!==0 && judgeDirection!==witnessAgreement;
    decision=judgeContradicts ? "CONDITIONAL" : witnessAgreement>0 ? "YES" : "NO";
    rationale.push("The primary-house figure is neutral, so concordant witnesses become the next permitted directional testimony.");
  } else if (judgeDirection!==0) {
    decision=judgeDirection>0 ? "YES" : "NO";
    rationale.push("Primary-house and witness testimony did not yield a direction; the Judge is used only as the final directional fallback.");
  } else {
    rationale.push("Primary house, witnesses and Judge remain neutral or split; no directional verdict is forced.");
  }

  return {
    decision,
    primaryHouse:selection.primary,
    primaryFigure:primary.id,
    primaryDirection,
    witnessAgreement,
    judgeDirection,
    rationale,
    execution
  };
}
