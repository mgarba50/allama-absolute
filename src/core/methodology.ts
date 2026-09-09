import { decryptBackup, encryptBackup, type EncryptedBackup } from "./security";
import type { VersionedRule } from "./rules";

export interface MethodologyProfile {
  id: string;
  name: string;
  practitioner: string;
  version: number;
  classicalRules: readonly string[];
  customCorrespondences: Readonly<Record<string,unknown>>;
  calibratedWeights: Readonly<Record<string,number>>;
  proprietaryRules: readonly VersionedRule[];
  notes: readonly string[];
}

export const MUSA_ALLAMA_METHOD: MethodologyProfile = {
  id:"musa-allama-method",
  name:"MUSA ALLAMA METHOD",
  practitioner:"Musa Allama",
  version:1,
  classicalRules:[],
  customCorrespondences:{},
  calibratedWeights:{},
  proprietaryRules:[],
  notes:["Private practitioner methodology profile. Empty collections mean no rule or correspondence is silently invented."]
};

export function updateMethodologyProfile(
  base: MethodologyProfile,
  patch: Partial<Omit<MethodologyProfile,"id"|"practitioner">>
): MethodologyProfile {
  return {...base,...patch,id:base.id,practitioner:base.practitioner};
}

export async function encryptMethodologyProfile(profile: MethodologyProfile,password: string): Promise<EncryptedBackup> {
  return encryptBackup({kind:"allama-methodology",profile},password);
}

export async function decryptMethodologyProfile(backup: EncryptedBackup,password: string): Promise<MethodologyProfile> {
  const payload=await decryptBackup<{kind:string;profile:MethodologyProfile}>(backup,password);
  if (payload.kind!=="allama-methodology" || !payload.profile?.id) throw new Error("Encrypted payload is not an ALLAMA methodology profile.");
  return payload.profile;
}
