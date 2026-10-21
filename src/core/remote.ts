export type RemoteDimension = "environment" | "activity" | "social" | "distance" | "direction";

export interface RemoteHypothesis {
  id: string;
  dimension: RemoteDimension;
  label: string;
  score: number;
  supportingRuleIds: readonly string[];
  opposingRuleIds: readonly string[];
}

export interface RemoteVote {
  hypothesisId: string;
  ruleId: string;
  weight: number;
  direction: -1 | 1;
}

export function rankRemoteHypotheses(
  hypotheses: readonly Omit<RemoteHypothesis,"score"|"supportingRuleIds"|"opposingRuleIds">[],
  votes: readonly RemoteVote[]
): RemoteHypothesis[] {
  return hypotheses.map((hypothesis) => {
    const relevant = votes.filter((vote) => vote.hypothesisId === hypothesis.id);
    const score = relevant.reduce((sum,vote) => sum + vote.weight * vote.direction,0);
    return {
      ...hypothesis,
      score,
      supportingRuleIds:relevant.filter((vote) => vote.direction > 0).map((vote) => vote.ruleId),
      opposingRuleIds:relevant.filter((vote) => vote.direction < 0).map((vote) => vote.ruleId)
    };
  }).sort((a,b) => b.score - a.score);
}

export const REMOTE_STATE_BOUNDARY =
  "Remote-state results are ranked traditional symbolic hypotheses. They are not direct sensory access, GPS measurement, or verified observation.";
