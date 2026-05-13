"use client";

import { useState } from "react";

export default function QueryBox() {
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const [answer, setAnswer] = useState("");

  async function handleQuery() {
    try {
      setLoading(true);

      setAnswer("");

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

      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
          placeholder="Ask about clauses, risks, obligations..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />

        <button
          onClick={handleQuery}
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {answer && (
        <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
