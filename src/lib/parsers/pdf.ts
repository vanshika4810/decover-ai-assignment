import { extractText } from "unpdf";

export async function parsePDF(buffer: Buffer) {
  const uint8Array = new Uint8Array(buffer);

  const result = await extractText(uint8Array);

  return Array.isArray(result.text) ? result.text.join("\n") : result.text;
}
