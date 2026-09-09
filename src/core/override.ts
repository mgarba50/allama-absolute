import type { Verdict } from "./types";

export interface PractitionerOverride {
  id: string;
  createdAt: string;
  practitioner: string;
  machineVerdict: Verdict;
  overrideDecision: Verdict["decision"];
  reason: string;
  notes?: string;
}

export function createPractitionerOverride(
  machineVerdict: Verdict,
  overrideDecision: Verdict["decision"],
  practitioner: string,
  reason: string,
  createdAt = new Date().toISOString()
): PractitionerOverride {
  if (!reason.trim()) throw new Error("Practitioner override requires a written reason.");
  return {
    id:"OVR-" + createdAt.replace(/[-:.TZ]/g,"").slice(0,14),
    createdAt,
    practitioner,
    machineVerdict,
    overrideDecision,
    reason:reason.trim()
  };
}
