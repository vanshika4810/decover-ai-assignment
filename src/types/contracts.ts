export interface Clause {
  clauseType: string;

  found: boolean;

  text: string;

  summary: string;

  confidence: number;
}

export interface Contract {
  _id: string;

  fileName: string;

  status: string;

  clauses: Record<string, Clause>;
}
