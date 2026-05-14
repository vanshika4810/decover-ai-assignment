"use client";

import { useEffect, useState } from "react";

import { Contract } from "@/types/contracts";

import QueryBox from "./query-box";

import ContractsTable from "./contracts-table";

interface Props {
  contracts: Contract[];
}

export default function ContractsSection({ contracts: initialContracts }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);

  // Keep in sync when DashboardView refreshes after an upload
  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);
  const [queryNote, setQueryNote] = useState<string>("");
  const [filteredFileNames, setFilteredFileNames] = useState<string[]>([]);
  const [filteredClauseTypes, setFilteredClauseTypes] = useState<string[]>([]);

  function handleAnswer(
    answer: string,
    relevantFileNames: string[],
    relevantClauseTypes: string[],
  ) {
    setQueryNote(answer);
    setFilteredFileNames(relevantFileNames);
    setFilteredClauseTypes(relevantClauseTypes);
  }

  function clearQueryResults() {
    setQueryNote("");
    setFilteredFileNames([]);
    setFilteredClauseTypes([]);
  }

  function handleDelete(contractId: string) {
    setContracts((prev) => prev.filter((c) => c._id !== contractId));
    setFilteredFileNames((prev) =>
      prev.filter(
        (name) => contracts.find((c) => c._id === contractId)?.fileName !== name,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <QueryBox contracts={contracts} onAnswer={handleAnswer} onClear={clearQueryResults} />

      <ContractsTable
        contracts={contracts}
        queryNote={queryNote}
        filteredFileNames={filteredFileNames.length > 0 ? filteredFileNames : undefined}
        filteredClauseTypes={filteredClauseTypes.length > 0 ? filteredClauseTypes : undefined}
        onDelete={handleDelete}
      />
    </div>
  );
}
