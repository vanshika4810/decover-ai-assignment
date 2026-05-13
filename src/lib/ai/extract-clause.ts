import { model } from "./gemini";

import { CLAUSE_TYPES } from "@/constants/clauses";

import { retrieveRelevantChunks } from "./retrieve-chunks";

export async function extractClauses(contractId: string) {
  const contexts: Record<string, string> = {};

  for (const clauseType of CLAUSE_TYPES) {
    const chunks = await retrieveRelevantChunks(contractId, clauseType);

    contexts[clauseType] = chunks.map((chunk: any) => chunk.text).join("\n\n");
  }

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
      "confidence": 0.92
    }
  ]
}

If clause not found:

{
  "clauseType": "Confidentiality",
  "found": false,
  "text": "",
  "summary": "",
  "confidence": 0
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

  console.log(cleaned);

  return JSON.parse(cleaned);
}
