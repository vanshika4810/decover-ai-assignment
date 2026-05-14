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
  contractExplanations?: Record<string, string>;
  onDelete?: (contractId: string) => void;
  onDeleteAll?: () => void;
  onRename?: (contractId: string, newName: string) => void;
  onRefresh?: () => void;
}

export default function ContractsTable({
  contracts,
  queryNote,
  filteredFileNames,
  filteredClauseTypes,
  contractExplanations = {},
  onDelete,
  onDeleteAll,
  onRename,
  onRefresh,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmContract, setConfirmContract] = useState<Contract | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [editName, setEditName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

  function toggleExplanation(fileName: string) {
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      next.has(fileName) ? next.delete(fileName) : next.add(fileName);
      return next;
    });
  }

  async function handleProcess(contractId: string) {
    setProcessingIds((prev) => new Set(prev).add(contractId));
    try {
      await fetch("/api/contracts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId }),
      });
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(contractId);
        return next;
      });
    }
  }

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

  async function handleDeleteAll() {
    setConfirmDeleteAll(false);
    try {
      setDeletingAll(true);
      const res = await fetch("/api/contracts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        onDeleteAll?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleRename() {
    if (!editContract || !editName.trim()) return;
    const contractId = editContract._id;
    const dot = editContract.fileName.lastIndexOf(".");
    const ext = dot > 0 ? editContract.fileName.slice(dot) : "";
    const newName = editName.trim() + ext;
    setEditContract(null);
    try {
      setRenamingId(contractId);
      const res = await fetch("/api/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, fileName: newName }),
      });
      const data = await res.json();
      if (data.success) {
        onRename?.(contractId, newName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRenamingId(null);
    }
  }

  const isFiltered =
    filteredFileNames !== undefined && filteredFileNames.length > 0;

  const visibleContracts = isFiltered
    ? contracts.filter((c) => filteredFileNames.includes(c.fileName))
    : contracts;

  const candidateClauseTypes =
    filteredClauseTypes && filteredClauseTypes.length > 0
      ? CLAUSE_TYPES.filter((type) => filteredClauseTypes.includes(type))
      : CLAUSE_TYPES;

  // In filtered mode, hide columns where every visible contract has no data.
  const visibleClauseTypes = isFiltered
    ? candidateClauseTypes.filter((type) =>
        visibleContracts.some((c) => c.clauses[type]?.found),
      )
    : candidateClauseTypes;

  function renderTable(showDelete: boolean) {
    return (
      <div className="overflow-x-auto border">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="border-b bg-muted/50">
              {showDelete && <th className="w-24 p-4" />}
              <th className="w-[180px] max-w-[180px] p-4 text-left text-sm font-medium">
                Contract Name
              </th>
              {!showDelete && (
                <th className="min-w-[280px] p-4 text-left text-sm font-medium">
                  Relevance to Query
                </th>
              )}
              {showDelete && (
                <th className="p-4 text-left text-sm font-medium">Status</th>
              )}
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
                {showDelete && (
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {/* Edit / rename */}
                      <button
                        onClick={() => {
                          setEditContract(contract);
                          const dot = contract.fileName.lastIndexOf(".");
                          setEditName(
                            dot > 0
                              ? contract.fileName.slice(0, dot)
                              : contract.fileName,
                          );
                        }}
                        disabled={renamingId === contract._id}
                        title="Rename contract"
                        className="rounded p-1 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 transition-colors"
                      >
                        {renamingId === contract._id ? (
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
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Delete */}
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
                    </div>
                  </td>
                )}

                <td className="w-[180px] max-w-[180px] p-4 text-sm font-medium wrap-break-word">
                  {contract.fileName}
                </td>

                {!showDelete && (
                  <td className="p-4 max-w-[320px]">
                    {contractExplanations[contract.fileName] ? (
                      (() => {
                        const text = contractExplanations[contract.fileName];
                        const isExpanded = expandedExplanations.has(contract.fileName);
                        const LIMIT = 160;
                        const isLong = text.length > LIMIT;
                        return (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {isExpanded || !isLong
                                ? text
                                : `${text.slice(0, LIMIT).trimEnd()}…`}
                            </p>
                            {isLong && (
                              <button
                                onClick={() => toggleExplanation(contract.fileName)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {isExpanded ? "Show less" : "Read more"}
                              </button>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                )}

                {showDelete && (
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <StatusBadge
                        status={
                          processingIds.has(contract._id)
                            ? "processing"
                            : contract.status
                        }
                      />

                      {contract.status === "uploaded" &&
                        !processingIds.has(contract._id) && (
                          <button
                            onClick={() => handleProcess(contract._id)}
                            className="flex items-center gap-1 text-xs text-blue-600 underline hover:text-blue-800 hover:underline transition-colors"
                          >
                            Complete processing
                          </button>
                        )}

                      {processingIds.has(contract._id) && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <svg
                            className="h-3 w-3 animate-spin"
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
                          Processing…
                        </p>
                      )}
                    </div>
                  </td>
                )}

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
                  colSpan={(showDelete ? 3 : 2) + visibleClauseTypes.length}
                  className="p-8 text-center text-sm text-muted-foreground"
                >
                  No contracts match the query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Query results view ── */}
      {isFiltered && (
        <>
          {queryNote && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 whitespace-pre-wrap">
              <span className="mr-2 font-semibold">AI Answer:</span>
              {queryNote}
              <p className="mt-2 text-xs text-blue-700">
                Showing {visibleContracts.length} relevant contract
                {visibleContracts.length !== 1 ? "s" : ""} out of{" "}
                {contracts.length}.
              </p>
            </div>
          )}

          {/* No delete button in query results */}
          {renderTable(false)}
        </>
      )}

      {/* ── Full contracts view (expandable) ── */}
      {!isFiltered && (
        <div className="rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-2 text-left"
            >
              <span className="text-sm font-semibold">All Contracts</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {contracts.length}
              </span>
              <svg
                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {contracts.length > 0 && (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                disabled={deletingAll}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                {deletingAll ? (
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
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
                    className="h-3.5 w-3.5"
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
                Delete all
              </button>
            )}
          </div>

          {expanded && <div className="border-t">{renderTable(true)}</div>}
        </div>
      )}

      {/* Delete single confirmation dialog */}
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

      {/* Delete all confirmation dialog */}
      <Dialog
        open={confirmDeleteAll}
        onOpenChange={(open) => !open && setConfirmDeleteAll(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete All Contracts</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            This will permanently delete all{" "}
            <span className="font-medium text-foreground">
              {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
            </span>{" "}
            and all their extracted clauses. This action cannot be undone.
          </p>

          <DialogFooter className="mt-2">
            <button
              onClick={() => setConfirmDeleteAll(false)}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAll}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
            >
              Delete all
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      {(() => {
        const dotIdx = editContract
          ? editContract.fileName.lastIndexOf(".")
          : -1;
        const ext =
          editContract && dotIdx > 0 ? editContract.fileName.slice(dotIdx) : "";
        const originalBase =
          editContract && dotIdx > 0
            ? editContract.fileName.slice(0, dotIdx)
            : (editContract?.fileName ?? "");
        const fullNewName = editName.trim() + ext;

        return (
          <Dialog
            open={!!editContract}
            onOpenChange={(open) => !open && setEditContract(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Rename Contract</DialogTitle>
              </DialogHeader>

              <div className="mt-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  File name
                </label>
                <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-black/10 overflow-hidden">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                    placeholder={originalBase}
                    autoFocus
                  />
                  {ext && (
                    <span className="select-none border-l bg-muted px-3 py-2 text-sm text-muted-foreground">
                      {ext}
                    </span>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-2">
                <button
                  onClick={() => setEditContract(null)}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  disabled={
                    !editName.trim() || fullNewName === editContract?.fileName
                  }
                  className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                >
                  Save
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
