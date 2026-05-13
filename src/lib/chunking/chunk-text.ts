export function chunkText(text: string) {
  const chunkSize = 1500;

  const overlap = 300;

  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;

    chunks.push(text.slice(start, end));

    start += chunkSize - overlap;
  }

  return chunks;
}
