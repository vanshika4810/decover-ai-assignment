import { connectDB } from "@/lib/db/mongodb";
import Contract from "@/models/Contract";

import { parsePDF } from "@/lib/parsers/pdf";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();

    const files = formData.getAll("files") as File[];

    const uploadedContracts = [];

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
        const result = await mammoth.extractRawText({
          buffer,
        });

        rawText = result.value;
      }

      const contract = await Contract.create({
        fileName: file.name,
        rawText,
      });

      uploadedContracts.push(contract);
    }

    return Response.json({
      success: true,
      contracts: uploadedContracts,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}
