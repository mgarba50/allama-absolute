import { runAbsoluteKernel, type AbsoluteKernelInput, type AbsoluteKernelExecution } from "./absoluteKernel";
import { synthesizeAbsolute, type AbsoluteSynthesis } from "./absoluteSynthesis";

export interface PractitionerEngineResult {
  kernel:AbsoluteKernelExecution;
  synthesis:AbsoluteSynthesis;
  response:{
    question:string;
    verdict:AbsoluteSynthesis["decision"];
    strength:AbsoluteSynthesis["strength"];
    directAnswer:string;
    decisiveBasis:string;
    methodStatus:{
      raml:"ACTIVE";
      abjad:"CALCULATED_SOURCE_GATED";
      falaki:"CALCULATED_SOURCE_GATED"|"NOT_REQUESTED";
      tukhi:"ACTIVE"|"CORPUS_GATE_LOCKED";
    };
  };
}

export function runPractitionerEngine(input:AbsoluteKernelInput):PractitionerEngineResult {
  const kernel=runAbsoluteKernel(input);
  const synthesis=synthesizeAbsolute(kernel);
  return {
    kernel,
    synthesis,
    response:{
      question:input.question,
      verdict:synthesis.decision,
      strength:synthesis.strength,
      directAnswer:synthesis.answer,
      decisiveBasis:synthesis.decisiveBasis,
      methodStatus:{
        raml:"ACTIVE",
        abjad:"CALCULATED_SOURCE_GATED",
        falaki:kernel.falaki ? "CALCULATED_SOURCE_GATED" : "NOT_REQUESTED",
        tukhi:kernel.toukhi.activation.active ? "ACTIVE" : "CORPUS_GATE_LOCKED"
      }
    }
  };
}
