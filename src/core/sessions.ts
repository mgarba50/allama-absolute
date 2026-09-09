export type SessionMode = "rapid" | "client" | "scholar" | "research";

export interface SessionConfiguration {
  id: SessionMode;
  showRawCalculation: boolean;
  showSources: boolean;
  showContradictions: boolean;
  showResearchMetrics: boolean;
  reportStyle: "compact" | "client" | "scholar";
}

export const SESSION_CONFIGURATIONS: Readonly<Record<SessionMode,SessionConfiguration>> = {
  rapid:{ id:"rapid",showRawCalculation:false,showSources:false,showContradictions:true,showResearchMetrics:false,reportStyle:"compact" },
  client:{ id:"client",showRawCalculation:false,showSources:false,showContradictions:true,showResearchMetrics:false,reportStyle:"client" },
  scholar:{ id:"scholar",showRawCalculation:true,showSources:true,showContradictions:true,showResearchMetrics:false,reportStyle:"scholar" },
  research:{ id:"research",showRawCalculation:true,showSources:true,showContradictions:true,showResearchMetrics:true,reportStyle:"scholar" }
};
