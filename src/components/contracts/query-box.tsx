"use client";

import { useEffect, useRef, useState } from "react";
import { Contract } from "@/types/contracts";

interface Props {
  contracts?: Contract[];
  onAnswer?: (
    answer: string,
    relevantFileNames: string[],
    relevantClauseTypes: string[],
    contractExplanations: Record<string, string>,
  ) => void;
  onClear?: () => void;
  onRefresh?: () => void;
}

interface AttachedFile {
  id: string;
  file: File;
}

export default function QueryBox({
  contracts = [],
  onAnswer,
  onClear,
  onRefresh,
}: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  // existing contracts selected for filtering
  // includeAll=false + selectedIds=[] means no pre-existing contracts (default)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [includeAll, setIncludeAll] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // ad-hoc files attached directly to the query
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // close selector on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node)
      ) {
        setSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleContract(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newEntries: AttachedFile[] = files.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
    }));
    setAttachedFiles((prev) => [...prev, ...newEntries]);
    // reset so same file can be re-attached
    e.target.value = "";
  }

  function removeAttached(id: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleClear() {
    setQuery("");
    setError("");
    setHasResult(false);
    setSelectedIds([]);
    setIncludeAll(false);
    setAttachedFiles([]);
    onClear?.();
  }

  async function handleQuery() {
    if (!query.trim()) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    try {
      setLoading(true);
      setError("");

      let uploadedContractIds: string[] = [];

      // Step 1: If files are attached, upload + process them first
      if (attachedFiles.length > 0) {
        setLoadingStep(
          `Uploading ${attachedFiles.length} file${attachedFiles.length !== 1 ? "s" : ""}…`,
        );
        const formData = new FormData();
        attachedFiles.forEach((af) => formData.append("files", af.file));

        const uploadRes = await fetch("/api/contracts/upload", {
          method: "POST",
          body: formData,
          signal,
        });
        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          setError("Failed to upload files. Please try again.");
          return;
        }

        const newIds: string[] = (uploadData.contracts ?? []).map(
          (c: { _id: string }) => c._id,
        );

        // For files that already existed in DB (skipped by upload), pick up their IDs
        const alreadyExistingIds: string[] = attachedFiles
          .map((af) => contracts.find((c) => c.fileName === af.file.name)?._id)
          .filter((id): id is string => !!id && !newIds.includes(id));

        uploadedContractIds = [...newIds, ...alreadyExistingIds];

        // Step 2: Run clause extraction on each newly uploaded contract
        if (newIds.length > 0) {
          setLoadingStep(
            `Processing ${newIds.length} file${newIds.length !== 1 ? "s" : ""}…`,
          );
          await Promise.all(
            newIds.map((id) =>
              fetch("/api/contracts/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contractId: id }),
                signal,
              }),
            ),
          );
        }
      }

      // Merge uploaded IDs with any explicitly selected existing contracts
      const queryContractIds: string[] | undefined = includeAll
        ? undefined
        : [...new Set([...selectedIds, ...uploadedContractIds])];

      if (
        !includeAll &&
        queryContractIds !== undefined &&
        queryContractIds.length === 0
      ) {
        setError(
          "No contracts to query. Select existing contracts or attach files.",
        );
        return;
      }

      // Step 3: Run the AI query against stored contracts
      setLoadingStep("Querying AI…");
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, contractIds: queryContractIds }),
        signal,
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        let message =
          typeof data.error === "string"
            ? data.error
            : "The query could not be completed.";
        if (
          typeof data.retryAfterSeconds === "number" &&
          data.retryAfterSeconds > 0
        ) {
          message += ` Try again in about ${data.retryAfterSeconds} seconds.`;
        }
        setError(message);
        setHasResult(false);
        onClear?.();
        return;
      }

      setHasResult(true);
      onRefresh?.();
      onAnswer?.(
        "",
        data.relevantFileNames ?? [],
        data.relevantClauseTypes ?? [],
        data.contractExplanations ?? {},
      );
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // User cancelled — clear state silently
        setHasResult(false);
        onClear?.();
      } else {
        console.error(err);
        setError("Network error. Check your connection and try again.");
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setLoadingStep("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) handleQuery();
  }

  const selectedContracts = contracts.filter((c) =>
    selectedIds.includes(c._id),
  );
  const hasSelections =
    selectedContracts.length > 0 || attachedFiles.length > 0;

  return (
    <div className="space-y-3 rounded-xl border p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Contract Query</h2>
        <p className="text-sm text-muted-foreground">
          Ask questions across all contracts, or select specific ones below.
        </p>
      </div>

      {/* Chips row — visible above the input when items are selected */}
      {hasSelections && (
        <div className="flex flex-wrap gap-2">
          {selectedContracts.map((c) => (
            <span
              key={c._id}
              className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {c.fileName}
              <button
                onClick={() => toggleContract(c._id)}
                className="ml-0.5 hover:text-blue-600"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}

          {attachedFiles.map((af) => (
            <span
              key={af.id}
              className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              {af.file.name}
              <button
                onClick={() => removeAttached(af.id)}
                className="ml-0.5 hover:text-green-600"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input card — no overflow-hidden so dropdowns render freely */}
      <div className="rounded-lg border focus-within:ring-2 focus-within:ring-black/10">
        {/* Text input */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about clauses, risks, obligations..."
          className="w-full rounded-t-lg px-3 py-3 text-sm outline-none bg-transparent"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="flex items-center gap-1">
            {/* Attach files button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              Attach files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileInput}
            />

            {/* Contracts selector — lives outside overflow-hidden so it renders freely */}
            {contracts.length > 0 && (
              <div className="relative" ref={selectorRef}>
                <button
                  onClick={() => setSelectorOpen((o) => !o)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                    includeAll || selectedIds.length > 0
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  {includeAll
                    ? "All contracts"
                    : selectedIds.length > 0
                      ? `${selectedIds.length} contract${selectedIds.length !== 1 ? "s" : ""} selected`
                      : "No contracts"}
                  <svg
                    className={`h-3 w-3 transition-transform ${selectorOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {selectorOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-lg border bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b px-3 py-2.5">
                      <span className="text-xs font-semibold text-foreground">
                        Include contracts
                      </span>
                      {(includeAll || selectedIds.length > 0) && (
                        <button
                          onClick={() => {
                            setIncludeAll(false);
                            setSelectedIds([]);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* All contracts toggle */}
                    <label className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 hover:bg-muted/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeAll}
                        onChange={(e) => {
                          setIncludeAll(e.target.checked);
                          if (e.target.checked) setSelectedIds([]);
                        }}
                        className="h-4 w-4 rounded accent-black"
                      />
                      <span className="text-xs font-medium text-foreground">
                        All contracts
                      </span>
                    </label>

                    <ul className="max-h-48 overflow-y-auto divide-y">
                      {contracts.map((c) => (
                        <li key={c._id}>
                          <label
                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${includeAll ? "opacity-40 pointer-events-none" : "hover:bg-muted/60"}`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                includeAll || selectedIds.includes(c._id)
                              }
                              onChange={() => toggleContract(c._id)}
                              disabled={includeAll}
                              className="h-4 w-4 rounded accent-black"
                            />
                            <span className="truncate text-xs text-foreground">
                              {c.fileName}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground rounded-b-lg">
                      {includeAll
                        ? `All ${contracts.length} contracts will be searched`
                        : selectedIds.length > 0
                          ? `Searching ${selectedIds.length} of ${contracts.length} contracts`
                          : "No pre-existing contracts — attach files above if needed"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {hasResult && (
              <button
                onClick={handleClear}
                className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Clear
              </button>
            )}
            {loading ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                Stop
              </button>
            ) : null}

            <button
              onClick={handleQuery}
              disabled={loading || !query.trim()}
              className="flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <>
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
                  {loadingStep || "Processing…"}
                </>
              ) : (
                <>
                  Get Answer
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
