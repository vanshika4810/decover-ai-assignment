import Chunk from "@/models/Chunk";

function calculateScore(text: string, query: string) {
  const lowerText = text.toLowerCase();

  const terms = query.toLowerCase().split(" ");

  let score = 0;

  for (const term of terms) {
    if (lowerText.includes(term)) {
      score += 1;
    }
  }

  return score;
}

export async function retrieveRelevantChunks(
  contractId: string,
  query: string,
) {
  const chunks = await Chunk.find({
    contractId,
  }).lean();

  const ranked = chunks
    .map((chunk: any) => ({
      ...chunk,

      score: calculateScore(chunk.text, query),
    }))
    .sort((a: any, b: any) => b.score - a.score);

  return ranked.slice(0, 3);
}
