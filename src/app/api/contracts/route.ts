import { connectDB } from "@/lib/db/mongodb";

import Clause from "@/models/Clause";
import Contract from "@/models/Contract";

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    if (body.deleteAll) {
      await Clause.deleteMany({});
      await Contract.deleteMany({});
      return Response.json({ success: true });
    }

    const { contractId } = body;
    if (!contractId) {
      return Response.json(
        { success: false, error: "contractId is required" },
        { status: 400 },
      );
    }

    await Clause.deleteMany({ contractId });
    await Contract.findByIdAndDelete(contractId);

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const { contractId, fileName } = await req.json();

    if (!contractId || !fileName?.trim()) {
      return Response.json(
        { success: false, error: "contractId and fileName are required" },
        { status: 400 },
      );
    }

    await Contract.findByIdAndUpdate(contractId, {
      fileName: fileName.trim(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const contracts = await Contract.find().sort({ createdAt: -1 }).lean();

    const formattedContracts = await Promise.all(
      contracts.map(async (contract: any) => {
        const clauses = await Clause.find({
          contractId: contract._id,
        }).lean();

        const clauseMap: Record<string, any> = {};

        clauses.forEach((clause: any) => {
          clauseMap[clause.clauseType] = clause;
        });

        return {
          ...contract,
          clauses: clauseMap,
        };
      }),
    );

    return Response.json({
      success: true,
      contracts: formattedContracts,
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
