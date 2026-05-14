"use client";

import { useState } from "react";

import { Contract } from "@/types/contracts";

import { CLAUSE_TYPES } from "@/constants/clauses";

import ClauseCell from "./clause-cell";
import StatusBadge from "./status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  contracts: Contract[];
  queryNote?: string;
  filteredFileNames?: string[];
  filteredClauseTypes?: string[];
  onDelete?: (contractId: string) => void;
}

export default function ContractsTable({
  contracts,
  queryNote,
  filteredFileNames,
  filteredClauseTypes,
  onDelete,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmContract, setConfirmContract] = useState<Contract | null>(null);

  async function confirmDelete() {
    if (!confirmContract) return;
    const contractId = confirmContract._id;
    setConfirmContract(null);
    try {
      setDeletingId(contractId);
      const res = await fetch("/api/contracts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId }),
      });
      const data = await res.json();
      if (data.success) {
        onDelete?.(contractId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }
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
              <th className="w-10 p-4" />

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
                <td className="p-4">
                  <button
                    onClick={() => setConfirmContract(contract)}
                    disabled={deletingId === contract._id}
                    title="Delete contract"
                    className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
                  >
                    {deletingId === contract._id ? (
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                        />
                      </svg>
                    )}
                  </button>
                </td>

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
                  colSpan={3 + visibleClauseTypes.length}
                  className="p-8 text-center text-sm text-muted-foreground"
                >
                  No contracts match the query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!confirmContract}
        onOpenChange={(open) => !open && setConfirmContract(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {confirmContract?.fileName}
            </span>
            ? This will permanently remove the contract and all its extracted
            clauses.
          </p>

          <DialogFooter className="mt-2">
            <button
              onClick={() => setConfirmContract(null)}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
