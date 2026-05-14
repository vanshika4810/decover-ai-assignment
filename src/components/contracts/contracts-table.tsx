"use client";

import { Contract } from "@/types/contracts";

import { CLAUSE_TYPES } from "@/constants/clauses";

import ClauseCell from "./clause-cell";

import StatusBadge from "./status-badge";

interface Props {
  contracts: Contract[];
  queryNote?: string;
  filteredFileNames?: string[];
  filteredClauseTypes?: string[];
}

export default function ContractsTable({
  contracts,
  queryNote,
  filteredFileNames,
  filteredClauseTypes,
}: Props) {
  const isFiltered =
    filteredFileNames !== undefined && filteredFileNames.length > 0;

  const visibleContracts = isFiltered
    ? contracts.filter((c) => filteredFileNames.includes(c.fileName))
    : contracts;

  // When showing query results, show only the clause types the AI identified
  // as relevant to the query. Fall back to all types in the full view.
  const visibleClauseTypes =
    filteredClauseTypes && filteredClauseTypes.length > 0
      ? CLAUSE_TYPES.filter((type) => filteredClauseTypes.includes(type))
      : CLAUSE_TYPES;

  return (
    <div className="space-y-3">
      {queryNote && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 whitespace-pre-wrap">
          <span className="mr-2 font-semibold">AI Answer:</span>
          {queryNote}
          {isFiltered && (
            <p className="mt-2 text-xs text-blue-700">
              Showing {visibleContracts.length} relevant contract
              {visibleContracts.length !== 1 ? "s" : ""} out of{" "}
              {contracts.length}.
            </p>
          )}
        </div>
      )}

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-sm font-medium">Contract</th>

              <th className="p-4 text-left text-sm font-medium">Status</th>

              {visibleClauseTypes.map((clause) => (
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
            {visibleContracts.map((contract) => (
              <tr key={contract._id} className="border-b align-top">
                <td className="p-4 text-sm font-medium">{contract.fileName}</td>

                <td className="p-4">
                  <StatusBadge status={contract.status} />
                </td>

                {visibleClauseTypes.map((clauseType) => (
                  <td key={clauseType} className="p-4">
                    <ClauseCell clause={contract.clauses[clauseType]} />
                  </td>
                ))}
              </tr>
            ))}

            {visibleContracts.length === 0 && (
              <tr>
                <td
                  colSpan={2 + visibleClauseTypes.length}
                  className="p-8 text-center text-sm text-muted-foreground"
                >
                  No contracts match the query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
