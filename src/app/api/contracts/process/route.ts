import { extractClauses } from "@/lib/ai/extract-clause";
import { connectDB } from "@/lib/db/mongodb";
import Clause from "@/models/Clause";
import Contract from "@/models/Contract";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { contractId } = body;
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return Response.json(
        {
          success: false,
          message: "Contract not found",
        },
        {
          status: 404,
        },
      );
    }

    contract.status = "processing";

    await contract.save();

    const result = await extractClauses(contract._id.toString());

    for (const clause of result.clauses) {
      await Clause.create({
        contractId: contract._id,

        clauseType: clause.clauseType,

        found: clause.found,

        text: clause.text,

        summary: clause.summary,

        confidence: clause.confidence,
      });
    }

    contract.status = "completed";

    await contract.save();

    return Response.json({
      success: true,
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
