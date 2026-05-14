import { GoogleGenerativeAIFetchError } from "@google/generative-ai";

import { connectDB } from "@/lib/db/mongodb";
import Clause from "@/models/Clause";
import Contract from "@/models/Contract";
import { model } from "@/lib/ai/gemini";

export const maxDuration = 60;

function parseRetryAfterSeconds(
  details: GoogleGenerativeAIFetchError["errorDetails"],
): number | undefined {
  if (!details?.length) return undefined;
  for (const d of details) {
    if (d["@type"]?.includes("RetryInfo") && typeof d.retryDelay === "string") {
      const match = /^([\d.]+)s$/.exec(d.retryDelay.trim());
      if (match) return Math.ceil(Number(match[1]));
    }
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      query,
      contractIds,
      inlineContracts,
    }: {
      query: string;
      contractIds?: string[];
      inlineContracts?: { fileName: string; rawText: string }[];
    } = body;

    // undefined → all contracts; [] → none; [...ids] → specific ones
    let contracts: any[] = [];
    if (!Array.isArray(contractIds)) {
      contracts = await Contract.find({}).lean();
    } else if (contractIds.length > 0) {
      contracts = await Contract.find({ _id: { $in: contractIds } }).lean();
    }

    const enrichedContracts = await Promise.all(
      contracts.map(async (contract: any) => {
        const clauses = await Clause.find({
          contractId: contract._id,
        }).lean();

        return {
          fileName: contract.fileName,
          clauses,
          source: "stored",
        };
      }),
    );

    // Append any ad-hoc files attached directly to the query (raw text, no clauses)
    const allContracts = [
      ...enrichedContracts,
      ...(Array.isArray(inlineContracts) ? inlineContracts : []).map((ic) => ({
        fileName: ic.fileName,
        rawText: ic.rawText,
        clauses: [],
        source: "inline",
      })),
    ];

    const prompt = `
            You are an AI legal assistant.

            Answer the user's query based on the contracts data below.
            Some contracts are "stored" (fully analysed with extracted clauses).
            Some are "inline" (raw text only, attached directly by the user for this query).

            User Query:
            ${query}

            Contracts Data:
            ${JSON.stringify(allContracts)}

            Rules:
            - Be concise
            - Mention relevant contract file names
            - Explain reasoning
            - If no answer found, say so

            The available clause types are:
            "Intellectual Property Ownership", "Limitation of Liability", "Warranty Disclaimer",
            "Indemnification", "Data Processing Terms", "Termination for Convenience",
            "Non-Solicitation", "Payment Terms", "Confidentiality"

            Return ONLY a valid JSON object (no markdown, no code blocks) in this exact structure:
            {
              "answer": "your detailed answer here",
              "relevantFileNames": ["file1.pdf", "file2.pdf"],
              "relevantClauseTypes": ["Confidentiality", "Payment Terms"],
              "contractExplanations": {
                "file1.pdf": "Detailed explanation referencing specific clauses, obligations, risks, and how it answers the query.",
                "file2.pdf": "Detailed explanation referencing specific clauses, obligations, risks, and how it answers the query."
              }
            }
            - relevantFileNames: only file names from the contracts data directly relevant to the answer. Empty array if none.
            - relevantClauseTypes: only clause type names from the list above that are directly relevant to the query. Empty array if none.
            - contractExplanations: a key for every file in relevantFileNames. For each contract write a detailed explanation (3-5 sentences) covering:
              (a) which specific clauses or sections make it relevant,
              (b) what the clause actually says or obligates,
              (c) any risks, gaps, or notable terms found,
              (d) how it directly answers the user's query.
              Be specific — reference actual clause text, party names, obligations, or thresholds where available.
        `;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    let answer = text;
    let relevantFileNames: string[] = [];
    let relevantClauseTypes: string[] = [];
    let contractExplanations: Record<string, string> = {};

    try {
      const parsed = JSON.parse(text.trim());
      answer = parsed.answer ?? text;
      relevantFileNames = Array.isArray(parsed.relevantFileNames)
        ? parsed.relevantFileNames
        : [];
      relevantClauseTypes = Array.isArray(parsed.relevantClauseTypes)
        ? parsed.relevantClauseTypes
        : [];
      contractExplanations =
        parsed.contractExplanations &&
        typeof parsed.contractExplanations === "object"
          ? parsed.contractExplanations
          : {};
    } catch {
      answer = text;
    }

    return Response.json({
      success: true,
      answer,
      relevantFileNames,
      relevantClauseTypes,
      contractExplanations,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof GoogleGenerativeAIFetchError) {
      const status = error.status ?? 500;

      if (status === 429) {
        const retryAfter = parseRetryAfterSeconds(error.errorDetails);
        return Response.json(
          {
            success: false,
            error:
              "Gemini API quota or rate limit reached (free tier is limited). Try again later, enable billing for higher limits, or switch model in configuration.",
            retryAfterSeconds: retryAfter,
          },
          { status: 429 },
        );
      }

      return Response.json(
        {
          success: false,
          error: error.message || "The AI service returned an error.",
        },
        { status: status >= 400 && status < 600 ? status : 502 },
      );
    }

    return Response.json(
      {
        success: false,
        error: "Something went wrong while processing your query.",
      },
      {
        status: 500,
      },
    );
  }
}
