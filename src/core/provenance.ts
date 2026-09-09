export interface ProvenanceSource {
  id: string;
  title: string;
  author?: string;
  dateText?: string;
  edition?: string;
  locator?: string;
  language?: string;
  sourceType: "manuscript" | "book" | "article" | "oral" | "practitioner" | "dataset";
  notes?: string;
}

export interface ProvenancedClaim<T = unknown> {
  id: string;
  value: T;
  sourceIds: readonly string[];
  schoolIds?: readonly string[];
  certainty: "explicit-source" | "derived" | "practitioner-rule" | "uncertain";
}

export function validateProvenance(claim: ProvenancedClaim,sources: readonly ProvenanceSource[]): string[] {
  const known = new Set(sources.map((source) => source.id));
  const errors: string[] = [];
  if (claim.certainty === "explicit-source" && claim.sourceIds.length === 0) errors.push("Explicit-source claim has no source.");
  for (const sourceId of claim.sourceIds) if (!known.has(sourceId)) errors.push("Unknown source id: " + sourceId);
  return errors;
}
