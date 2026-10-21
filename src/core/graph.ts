import type { AbsoluteAnalysis } from "./analysis";
import { housePlacements } from "./chart";
import type { DeepSearchResult } from "./deepSearch";
import { traceAllJudgeLines } from "./reverse";

export interface GraphNode {
  id:string;
  label:string;
  group:string;
  metadata?:Readonly<Record<string,unknown>>;
}
export interface GraphEdge {
  id:string;
  from:string;
  to:string;
  label?:string;
  strength?:number;
}
export interface GraphModel {
  id:string;
  title:string;
  nodes:readonly GraphNode[];
  edges:readonly GraphEdge[];
}

export function judgeAncestryGraph(analysis:AbsoluteAnalysis):GraphModel {
  const nodes=new Map<string,GraphNode>();
  const edges:GraphEdge[]=[];
  const visit=(node:ReturnType<typeof traceAllJudgeLines>[number],parent?:string)=>{
    const id=node.node+"-L"+node.line;
    if(!nodes.has(id)) nodes.set(id,{id,label:id,group:node.operation,metadata:{value:node.value}});
    if(parent) edges.push({id:parent+"->"+id,from:parent,to:id,label:node.operation});
    node.children.forEach((child)=>visit(child,id));
  };
  traceAllJudgeLines(analysis.shield).forEach((root)=>visit(root));
  return {id:"judge-ancestry",title:"Judge ancestry graph",nodes:[...nodes.values()],edges};
}

export function houseNetworkGraph(analysis:AbsoluteAnalysis):GraphModel {
  const placements=housePlacements(analysis.shield);
  const nodes=placements.map((item)=>({id:"H"+item.house,label:"H"+item.house+" · "+item.figure.latin,group:item.figure.element,metadata:{figure:item.figure.id,quality:item.figure.quality}}));
  const edges=[] as GraphEdge[];
  for(const [a,b] of [[1,7],[2,8],[3,9],[4,10],[5,11],[6,12]] as const) edges.push({id:`H${a}->H${b}`,from:"H"+a,to:"H"+b,label:"opposition"});
  for(let i=1;i<=12;i++) edges.push({id:`cycle-${i}`,from:"H"+i,to:"H"+(i===12?1:i+1),label:"sequence",strength:0.25});
  return {id:"house-network",title:"House network",nodes,edges};
}

export function elementFlowGraph(analysis:AbsoluteAnalysis):GraphModel {
  const placements=housePlacements(analysis.shield);
  const elements=["Fire","Air","Water","Earth"];
  const nodes=elements.map((element)=>({id:element,label:element,group:"element",metadata:{count:analysis.elements.distribution[element] ?? 0}}));
  const edgeMap=new Map<string,GraphEdge>();
  for(let i=0;i<placements.length-1;i++) {
    const from=placements[i].figure.element,to=placements[i+1].figure.element,key=from+"->"+to;
    const previous=edgeMap.get(key);
    edgeMap.set(key,{id:key,from,to,label:"adjacent flow",strength:(previous?.strength ?? 0)+1});
  }
  return {id:"element-flow",title:"Element flow",nodes,edges:[...edgeMap.values()]};
}

export function migrationGraph(analysis:AbsoluteAnalysis):GraphModel {
  const nodes:GraphNode[]=[];
  const edges:GraphEdge[]=[];
  for(const item of analysis.migration) {
    nodes.push({id:"F-"+item.figure.id,label:item.figure.latin,group:"figure"});
    item.houses.forEach((house,index)=>{
      const hid="H"+house;
      if(!nodes.some((n)=>n.id===hid)) nodes.push({id:hid,label:hid,group:"house"});
      edges.push({id:`${item.figure.id}-${house}`,from:"F-"+item.figure.id,to:hid,label:index===0?"origin":"migration"});
    });
  }
  return {id:"migration",title:"Figure migration",nodes,edges};
}

export function testimonyDependencyGraph(analysis:AbsoluteAnalysis):GraphModel {
  const nodes:GraphNode[]=analysis.evidence.map((item)=>({id:item.id,label:item.label,group:item.source,metadata:{direction:item.direction,weight:item.weight,reliability:item.reliability}}));
  nodes.push({id:"VERDICT",label:analysis.traditionalVerdict.decision,group:"verdict"});
  const edges=analysis.evidence.map((item)=>({id:item.id+"->VERDICT",from:item.id,to:"VERDICT",label:"testimony",strength:Math.abs(item.weight*item.reliability)}));
  return {id:"testimony-dependency",title:"Testimony dependency",nodes,edges};
}

export function contradictionGraph(deep:DeepSearchResult):GraphModel {
  const directional=deep.findings.filter((item)=>item.direction!==0).slice(0,24);
  const nodes=directional.map((item)=>({id:item.id,label:item.label,group:item.direction>0?"support":"oppose",metadata:{strength:item.strength}}));
  const edges:GraphEdge[]=[];
  for(const support of directional.filter((item)=>item.direction>0)) {
    for(const oppose of directional.filter((item)=>item.direction<0)) {
      edges.push({id:support.id+"x"+oppose.id,from:support.id,to:oppose.id,label:"contradicts",strength:Math.min(support.strength,oppose.strength)});
    }
  }
  return {id:"contradiction",title:"Contradiction graph",nodes,edges};
}
