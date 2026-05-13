"use client";

import { Contract } from "@/types/contracts";

import { CLAUSE_TYPES } from "@/constants/clauses";

import ClauseCell from "./clause-cell";

import StatusBadge from "./status-badge";

interface Props {
  contracts: Contract[];
}

export default function ContractsTable({ contracts }: Props) {
  return (
    <div className="overflow-auto rounded-xl border">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-4 text-left text-sm font-medium">Contract</th>

            <th className="p-4 text-left text-sm font-medium">Status</th>

            {CLAUSE_TYPES.map((clause) => (
              <th
                key={clause}
                className="min-w-[220px] p-4 text-left text-sm font-medium"
              >
                {clause}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {contracts.map((contract) => (
            <tr key={contract._id} className="border-b align-top">
              <td className="p-4 text-sm font-medium">{contract.fileName}</td>

              <td className="p-4">
                <StatusBadge status={contract.status} />
              </td>

              {CLAUSE_TYPES.map((clauseType) => (
                <td key={clauseType} className="p-4">
                  <ClauseCell clause={contract.clauses[clauseType]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
