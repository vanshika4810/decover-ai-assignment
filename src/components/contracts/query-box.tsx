"use client";

import { useState } from "react";

interface Props {
  onAnswer?: (
    answer: string,
    relevantFileNames: string[],
    relevantClauseTypes: string[],
  ) => void;
  onClear?: () => void;
}

export default function QueryBox({ onAnswer, onClear }: Props) {
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleQuery() {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/query", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          query,
        }),
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
        onClear?.();
        return;
      }

      onAnswer?.(
        data.answer ?? "",
        data.relevantFileNames ?? [],
        data.relevantClauseTypes ?? [],
      );
    } catch (err) {
      console.error(err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleQuery();
  }

  return (
    <div className="space-y-4 rounded-xl border p-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">AI Contract Query</h2>

        <p className="text-sm text-muted-foreground">
          Ask questions across all uploaded contracts.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about clauses, risks, obligations..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />

        <button
          onClick={handleQuery}
          disabled={loading || !query.trim()}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
