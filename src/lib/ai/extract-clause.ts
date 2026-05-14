import { model } from "./gemini";

import { CLAUSE_TYPES } from "@/constants/clauses";

import { retrieveRelevantChunks } from "./retrieve-chunks";

export async function extractClauses(contractId: string) {
  const entries = await Promise.all(
    CLAUSE_TYPES.map(async (clauseType) => {
      const chunks = await retrieveRelevantChunks(contractId, clauseType);
      return [clauseType, chunks.map((chunk: any) => chunk.text).join("\n\n")] as const;
    }),
  );

  const contexts: Record<string, string> = Object.fromEntries(entries);

  const prompt = `
You are a legal contract analysis AI.

Extract the following clauses from the provided contexts.

IMPORTANT:
- Return ONLY valid JSON
- No markdown
- No explanations
- No code blocks

Return format:

{
  "clauses": [
    {
      "clauseType": "Confidentiality",
      "found": true,
      "text": "",
      "summary": "",
      "confidence": 0.92,
      "classification": "standard"
    }
  ]
}

classification rules (apply only when found is true):
- "risk"      — clause contains non-standard, unfavorable, or high-risk terms (e.g. uncapped liability, one-sided indemnification, aggressive IP assignment, no termination notice)
- "standard"  — clause is market-standard / typical with no unusual concerns
- "key_term"  — clause is present and materially important (e.g. key payment milestones, significant IP ownership, data processing obligations) but not inherently risky

If clause not found:

{
  "clauseType": "Confidentiality",
  "found": false,
  "text": "",
  "summary": "",
  "confidence": 0,
  "classification": null
}

Contexts:

${JSON.stringify(contexts, null, 2)}
`;

  const result = await model.generateContent(prompt);

  const response = await result.response;

  const text = response.text();

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}
