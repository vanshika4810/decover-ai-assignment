import { CLAUSE_TYPES } from "@/constants/clauses";

export function buildExtractionPrompt(contractText: string) {
  return `
    You are a legal contract analysis AI.

    Extract the following clauses from the contract:

    ${CLAUSE_TYPES.join("\n")}

    IMPORTANT RULES:
    - Return ONLY valid JSON
    - No markdown
    - No explanations
    - No code blocks

    Return this exact JSON structure:

    {
    "clauses": [
        {
        "clauseType": "Confidentiality",
        "found": true,
        "text": "exact clause text",
        "summary": "short summary",
        "confidence": 0.92
        }
    ]
    }

    If a clause is not found:

    {
    "clauseType": "Confidentiality",
    "found": false,
    "text": "",
    "summary": "",
    "confidence": 0
    }

    Contract:
    ${contractText}
    `;
}
