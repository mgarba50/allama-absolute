import type { FigurePattern, Shield } from "./types";

export interface AncestryNode {
  node: string;
  line: number;
  value: number;
  operation: "origin" | "transpose" | "parity-add";
  children: readonly AncestryNode[];
}

function patterns(shield: Shield): Record<string,FigurePattern> {
  return {
    M1:shield.mothers[0].pattern,
    M2:shield.mothers[1].pattern,
    M3:shield.mothers[2].pattern,
    M4:shield.mothers[3].pattern,
    D1:shield.daughters[0].pattern,
    D2:shield.daughters[1].pattern,
    D3:shield.daughters[2].pattern,
    D4:shield.daughters[3].pattern,
    N1:shield.nieces[0].pattern,
    N2:shield.nieces[1].pattern,
    N3:shield.nieces[2].pattern,
    N4:shield.nieces[3].pattern,
    RW:shield.rightWitness.pattern,
    LW:shield.leftWitness.pattern,
    J:shield.judge.pattern,
    R:shield.reconciler.pattern
  };
}

const parityParents: Readonly<Record<string,readonly [string,string]>> = {
  N1:["M1","M2"],
  N2:["M3","M4"],
  N3:["D1","D2"],
  N4:["D3","D4"],
  RW:["N1","N2"],
  LW:["N3","N4"],
  J:["RW","LW"],
  R:["J","M1"]
};

function trace(shield: Shield, node: string, lineIndex: number): AncestryNode {
  const table = patterns(shield);
  const pattern = table[node];
  if (!pattern) throw new Error("Unknown shield node: " + node);
  if (lineIndex < 0 || lineIndex > 3) throw new Error("Line index must be 0..3.");

  if (/^M[1-4]$/.test(node)) {
    return { node, line:lineIndex + 1, value:pattern[lineIndex], operation:"origin", children:[] };
  }

  if (/^D[1-4]$/.test(node)) {
    const daughterIndex = Number(node.slice(1)) - 1;
    const motherNode = "M" + (lineIndex + 1);
    return {
      node,
      line:lineIndex + 1,
      value:pattern[lineIndex],
      operation:"transpose",
      children:[trace(shield,motherNode,daughterIndex)]
    };
  }

  const parents = parityParents[node];
  if (!parents) throw new Error("No ancestry rule for node: " + node);

  return {
    node,
    line:lineIndex + 1,
    value:pattern[lineIndex],
    operation:"parity-add",
    children:parents.map((parent) => trace(shield,parent,lineIndex))
  };
}

export function traceJudgeLine(shield: Shield, line: number): AncestryNode {
  if (!Number.isInteger(line) || line < 1 || line > 4) throw new Error("Judge line must be 1..4.");
  return trace(shield,"J",line - 1);
}

export function traceAllJudgeLines(shield: Shield): AncestryNode[] {
  return [1,2,3,4].map((line) => traceJudgeLine(shield,line));
}

export function flattenAncestry(root: AncestryNode): Array<{ node:string; line:number; value:number; depth:number }> {
  const rows: Array<{ node:string; line:number; value:number; depth:number }> = [];
  const visit = (node: AncestryNode, depth: number) => {
    rows.push({ node:node.node, line:node.line, value:node.value, depth });
    node.children.forEach((child) => visit(child,depth + 1));
  };
  visit(root,0);
  return rows;
}
