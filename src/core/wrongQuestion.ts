export interface QuestionIssue {
  code: string;
  severity: "info" | "warning" | "block";
  message: string;
}

export interface QuestionQuality {
  usable: boolean;
  issues: readonly QuestionIssue[];
  suggestedRewrite?: string;
}

export function assessQuestionQuality(question: string): QuestionQuality {
  const text = question.trim();
  const issues: QuestionIssue[] = [];

  if (text.length < 8) issues.push({ code:"too-short", severity:"block", message:"Question is too short to identify a stable subject and decision." });
  if (text.length > 800) issues.push({ code:"too-long", severity:"warning", message:"Question contains excessive context; separate evidence from the core question." });

  const questionMarks = (text.match(/\?/g) ?? []).length;
  const compoundMarkers = (text.match(/\b(and also|also tell|plus|as well as|then will|and will)\b/gi) ?? []).length;
  if (questionMarks > 1 || compoundMarkers > 0) {
    issues.push({ code:"compound-question", severity:"warning", message:"Multiple independent questions appear to be combined into one cast." });
  }

  if (/\b(guarantee|certainly|100%|without doubt|prove that)\b/i.test(text)) {
    issues.push({ code:"guarantee-demand", severity:"warning", message:"The wording demands certainty beyond what the system can honestly establish." });
  }

  if (/\b(is he guilty|is she guilty|did he steal|did she steal|is .* a thief|is .* cheating)\b/i.test(text)) {
    issues.push({ code:"allegation", severity:"warning", message:"The question contains an allegation about a person. Symbolic output cannot establish guilt or misconduct." });
  }

  const pronouns = (text.match(/\b(he|she|they|it|that person|this person)\b/gi) ?? []).length;
  const namedContext = /\b(my|the|a|an)\s+[a-z]{3,}/i.test(text);
  if (pronouns >= 2 && !namedContext) {
    issues.push({ code:"ambiguous-referent", severity:"warning", message:"The subject may be ambiguous. Clarify who or what the pronouns refer to." });
  }

  const usable = !issues.some((issue) => issue.severity === "block");
  return { usable, issues };
}
