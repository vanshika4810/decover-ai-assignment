import Chunk from "@/models/Chunk";

import { chunkText } from "./chunk-text";

export async function processContractChunks(contractId: string, text: string) {
  const chunks = chunkText(text);

  for (let i = 0; i < chunks.length; i++) {
    await Chunk.create({
      contractId,

      text: chunks[i],

      chunkIndex: i,
    });
  }
}
