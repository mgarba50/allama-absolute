import type { QuestionProfile } from "./types";

export interface Significator {
  role: string;
  house: number;
  reason: string;
}

const DOMAIN_SIGNIFICATORS: Readonly<Record<string,readonly Significator[]>> = {
  Debt:[
    { role:"querent / creditor", house:1, reason:"the practitioner/client asking" },
    { role:"querent resources", house:2, reason:"money owed to the querent" },
    { role:"debtor", house:7, reason:"the other party" },
    { role:"debtor resources / debt transfer", house:8, reason:"resources of the seventh by turned-house logic" }
  ],
  Marriage:[
    { role:"querent", house:1, reason:"the person asking" },
    { role:"prospective spouse / partner", house:7, reason:"the counterpart" }
  ],
  Business:[
    { role:"querent / enterprise", house:1, reason:"principal actor" },
    { role:"resources", house:2, reason:"capital and receipts" },
    { role:"counterparty", house:7, reason:"client, partner or opponent" },
    { role:"career / public outcome", house:10, reason:"business standing and outcome" }
  ],
  Employment:[
    { role:"applicant", house:1, reason:"the person seeking employment" },
    { role:"income", house:2, reason:"compensation" },
    { role:"work/service", house:6, reason:"labor and service" },
    { role:"employer / authority", house:10, reason:"office and decision-maker" }
  ]
};

export function identifySignificators(profile: QuestionProfile): Significator[] {
  const exact = DOMAIN_SIGNIFICATORS[profile.domain];
  if (exact) return [...exact];
  return profile.houses.map((house,index) => ({
    role:index === 0 ? "querent / principal" : "relevant factor " + (index + 1),
    house,
    reason:"selected by question-domain routing"
  }));
}
