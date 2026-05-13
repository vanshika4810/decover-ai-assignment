import { model } from "./gemini";

import { buildExtractionPrompt } from "./prompts";

export async function extractClauses(contractText: string) {
  const prompt = buildExtractionPrompt(contractText);

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
