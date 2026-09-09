export interface ManuscriptDocument {
  id: string;
  title: string;
  author?: string;
  language?: string;
  text: string;
  source?: string;
}

export interface ManuscriptHit {
  document: ManuscriptDocument;
  score: number;
  excerpt: string;
}

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu," ").split(/\s+/).filter((token) => token.length > 1);
}

export class ManuscriptIndex {
  private documents = new Map<string,ManuscriptDocument>();

  add(document: ManuscriptDocument): void {
    if (!document.id || !document.title) throw new Error("Document id and title are required.");
    this.documents.set(document.id,document);
  }

  remove(id: string): void {
    this.documents.delete(id);
  }

  list(): ManuscriptDocument[] {
    return [...this.documents.values()];
  }

  search(query: string,limit = 10): ManuscriptHit[] {
    const queryTokens = new Set(tokens(query));
    if (!queryTokens.size) return [];
    return this.list().map((document) => {
      const haystack = tokens(document.title + " " + (document.author ?? "") + " " + document.text);
      const frequencies = new Map<string,number>();
      for (const token of haystack) frequencies.set(token,(frequencies.get(token) ?? 0) + 1);
      const score = [...queryTokens].reduce((sum,token) => sum + (frequencies.get(token) ?? 0),0);
      const lower = document.text.toLowerCase();
      const firstToken = [...queryTokens][0] ?? "";
      const position = lower.indexOf(firstToken);
      const start = Math.max(0,position >= 0 ? position - 100 : 0);
      const excerpt = document.text.slice(start,start + 300);
      return { document, score, excerpt };
    }).filter((hit) => hit.score > 0).sort((a,b) => b.score - a.score).slice(0,limit);
  }
}
