import testDocument from "../../ABSOLUTE_TEST_CASES.json";
import { protocolCoverageForQuestion } from "./protocolCoverage";
import { universeQuestions } from "./universe";

export interface ArchitectureTestCase {
  id: string;
  category: string;
  difficulty: string;
  validation_required: boolean;
  expected_modules: readonly string[];
  status: string;
}

const document=testDocument as {engine:string;test_suite:string;version:string;cases:ArchitectureTestCase[]};

export interface ResolvedArchitectureTestCase extends ArchitectureTestCase {
  expected_modules: readonly string[];
  protocolFamily: string;
}

export function architectureTestCases(): readonly ResolvedArchitectureTestCase[] {
  const universe=new Map(universeQuestions().map((entry)=>[entry.id,entry]));
  return document.cases.map((item)=>{
    const question=universe.get(item.id);
    if (!question) return {...item,expected_modules:[],protocolFamily:"MISSING"};
    const coverage=protocolCoverageForQuestion(question);
    return {
      ...item,
      expected_modules:[...new Set([...coverage.requiredModules,...coverage.optionalModules])],
      protocolFamily:coverage.id
    };
  });
}

export function validateArchitectureTestCorpus(): string[] {
  const errors:string[]=[];
  const universe=universeQuestions();
  const resolved=architectureTestCases();
  if (resolved.length!==777) errors.push(`Expected 777 architecture test cases, found ${resolved.length}`);
  const universeIds=new Set(universe.map((item)=>item.id));
  const testIds=new Set<string>();
  for (const item of resolved) {
    if (testIds.has(item.id)) errors.push("Duplicate test case id: "+item.id);
    testIds.add(item.id);
    if (!universeIds.has(item.id)) errors.push("Test case missing from universe: "+item.id);
    if (item.protocolFamily==="MISSING") errors.push("No protocol coverage for: "+item.id);
    if (!item.validation_required) errors.push("Architecture validation disabled for: "+item.id);
  }
  for (const entry of universe) if (!testIds.has(entry.id)) errors.push("Universe question missing test-case record: "+entry.id);
  return errors;
}
