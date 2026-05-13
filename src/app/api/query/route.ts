import { connectDB } from "@/lib/db/mongodb";
import Clause from "@/models/Clause";
import Contract from "@/models/Contract";
import { model } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { query } = body;

    const contracts = await Contract.find().lean();

    const enrichedContracts = await Promise.all(
      contracts.map(async (contract: any) => {
        const clauses = await Clause.find({
          contractId: contract._id,
        }).lean();

        return {
          fileName: contract.fileNAme,
          clauses,
        };
      }),
    );

    const prompt = `
            You are an AI legal assistant.

            Answer the user's query based on the contracts data.

            User Query:
            ${query}

            Contracts Data:
            ${JSON.stringify(enrichedContracts)}

            Rules:
            - Be concise
            - Mention relevant contract names
            - Explain reasoning
            - If no answer found, say so
        `;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    return Response.json({
      success: true,
      answer: text,
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
