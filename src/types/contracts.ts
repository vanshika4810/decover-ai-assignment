export type ClauseClassification = "risk" | "standard" | "key_term" | null;

export interface Clause {
  clauseType: string;

  found: boolean;

  text: string;

  summary: string;

  confidence: number;

  classification: ClauseClassification;
}

export interface Contract {
  _id: string;

  fileName: string;

  status: string;

  clauses: Record<string, Clause>;
}
