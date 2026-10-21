export interface PractitionerNote {
  id: string;
  caseId: string;
  createdAt: string;
  body: string;
  tags: readonly string[];
  private: true;
}

export function createPractitionerNote(caseId: string,body: string,tags: readonly string[] = [],createdAt = new Date().toISOString()): PractitionerNote {
  if (!body.trim()) throw new Error("Practitioner note cannot be empty.");
  return {
    id:"NOTE-" + createdAt.replace(/[-:.TZ]/g,"").slice(0,14),
    caseId,
    createdAt,
    body:body.trim(),
    tags:[...new Set(tags.map((tag) => tag.trim()).filter(Boolean))],
    private:true
  };
}
