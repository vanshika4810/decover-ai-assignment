import { parsePDF } from "@/lib/parsers/pdf";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    const extracted: { fileName: string; rawText: string }[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let rawText = "";

      if (file.type === "application/pdf") {
        rawText = await parsePDF(buffer);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      }

      extracted.push({ fileName: file.name, rawText });
    }

    return Response.json({ success: true, files: extracted });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}
