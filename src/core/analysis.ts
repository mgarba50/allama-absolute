import { calculateAbjad } from "./abjad";
import { dominantElements, figureMigration, houseMirrors } from "./chart";
import { currentPlanetaryHour, moonPhase } from "./celestial";
import { analyzeContradictions } from "./contradictions";
import { figureFromId } from "./figures";
import { classifyQuestion } from "./question";
import { generateShield, validateShield } from "./raml";
import { synthesizeVerdict } from "./verdict";
import type { Evidence, Verdict } from "./types";

export interface AbsoluteAnalysisInput {
  question: string;
  motherIds: readonly string[];
  timestamp?: string | Date;
  latitude?: number;
  longitude?: number;
  abjadTexts?: readonly string[];
}

export interface AbsoluteAnalysis {
  generatedAt: string;
  question: ReturnType<typeof classifyQuestion>;
  shield: ReturnType<typeof generateShield>;
  validationErrors: readonly string[];
  elements: ReturnType<typeof dominantElements>;
  migration: ReturnType<typeof figureMigration>;
  mirrors: ReturnType<typeof houseMirrors>;
  abjad: ReturnType<typeof calculateAbjad>[];
  celestial: null | {
    planetaryHour: ReturnType<typeof currentPlanetaryHour>;
    moon: ReturnType<typeof moonPhase>;
  };
  evidence: readonly Evidence[];
  contradiction: ReturnType<typeof analyzeContradictions>;
  traditionalVerdict: Verdict;
  decisionBoundary: string | null;
  dataQuality: number;
}

function qualityDirection(quality: string): -1 | 0 | 1 {
  return quality === "favorable" ? 1 : quality === "unfavorable" ? -1 : 0;
}

function evidenceForFigure(id: string, label: string, quality: string, weight: number): Evidence {
  return {
    id,
    source:"traditional",
    direction:qualityDirection(quality),
    weight,
    reliability:1,
    label:label + " quality: " + quality
  };
}

export function runAbsoluteAnalysis(input: AbsoluteAnalysisInput): AbsoluteAnalysis {
  if (input.motherIds.length !== 4) throw new Error("Ω analysis requires exactly four Mother figure IDs.");
  const mothers = input.motherIds.map(figureFromId);
  const shield = generateShield(mothers);
  const validationErrors = validateShield(shield);
  const question = classifyQuestion(input.question);
  const moment = input.timestamp ? new Date(input.timestamp) : new Date();

  const evidence: Evidence[] = [
    evidenceForFigure("judge", "Judge", shield.judge.quality, 1.4),
    evidenceForFigure("right-witness", "Right Witness", shield.rightWitness.quality, 0.9),
    evidenceForFigure("left-witness", "Left Witness", shield.leftWitness.quality, 0.9),
    evidenceForFigure("reconciler", "Reconciler", shield.reconciler.quality, 0.55)
  ];

  const traditionalVerdict = synthesizeVerdict(evidence);
  const contradiction = analyzeContradictions(evidence);
  const abjad = (input.abjadTexts ?? []).filter(Boolean).map((text) => calculateAbjad(text));

  let celestial: AbsoluteAnalysis["celestial"] = null;
  if (Number.isFinite(input.latitude) && Number.isFinite(input.longitude)) {
    try {
      celestial = {
        planetaryHour:currentPlanetaryHour(moment,input.latitude as number,input.longitude as number),
        moon:moonPhase(moment)
      };
    } catch {
      celestial = null;
    }
  }

  const missingCelestialPenalty = input.latitude == null || input.longitude == null ? 10 : celestial ? 0 : 15;
  const validationPenalty = validationErrors.length * 20;
  const dataQuality = Math.max(0, Math.min(100, 100 - missingCelestialPenalty - validationPenalty));

  return {
    generatedAt:new Date().toISOString(),
    question,
    shield,
    validationErrors,
    elements:dominantElements(shield),
    migration:figureMigration(shield),
    mirrors:houseMirrors(shield),
    abjad,
    celestial,
    evidence,
    contradiction,
    traditionalVerdict,
    decisionBoundary:question.highStakes ? "Traditional symbolic output only; do not use as a professional or safety-critical decision." : null,
    dataQuality
  };
}
