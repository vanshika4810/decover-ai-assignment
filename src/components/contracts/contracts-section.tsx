"use client";

import { useEffect, useState } from "react";

import { Contract } from "@/types/contracts";

import QueryBox from "./query-box";

import ContractsTable from "./contracts-table";

interface Props {
  contracts: Contract[];
  onRefresh?: () => void;
}

export default function ContractsSection({ contracts: initialContracts, onRefresh }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);

  // Keep in sync when DashboardView refreshes after an upload
  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);
  const [queryNote, setQueryNote] = useState<string>("");
  const [filteredFileNames, setFilteredFileNames] = useState<string[]>([]);
  const [filteredClauseTypes, setFilteredClauseTypes] = useState<string[]>([]);
  const [contractExplanations, setContractExplanations] = useState<Record<string, string>>({});

  function handleAnswer(
    answer: string,
    relevantFileNames: string[],
    relevantClauseTypes: string[],
    explanations: Record<string, string>,
  ) {
    setQueryNote(answer);
    setFilteredFileNames(relevantFileNames);
    setFilteredClauseTypes(relevantClauseTypes);
    setContractExplanations(explanations);
  }

  function clearQueryResults() {
    setQueryNote("");
    setFilteredFileNames([]);
    setFilteredClauseTypes([]);
    setContractExplanations({});
  }

  function handleDelete(contractId: string) {
    setContracts((prev) => prev.filter((c) => c._id !== contractId));
    setFilteredFileNames((prev) =>
      prev.filter(
        (name) => contracts.find((c) => c._id === contractId)?.fileName !== name,
      ),
    );
  }

  function handleDeleteAll() {
    setContracts([]);
    setFilteredFileNames([]);
    setFilteredClauseTypes([]);
    setQueryNote("");
  }

  function handleRename(contractId: string, newName: string) {
    setContracts((prev) =>
      prev.map((c) => (c._id === contractId ? { ...c, fileName: newName } : c)),
    );
    setFilteredFileNames((prev) =>
      prev.map((name) => {
        const match = contracts.find((c) => c._id === contractId);
        return match?.fileName === name ? newName : name;
      }),
    );
  }

  return (
    <div className="space-y-6">
      <QueryBox contracts={contracts} onAnswer={handleAnswer} onClear={clearQueryResults} onRefresh={onRefresh} />

      <ContractsTable
        contracts={contracts}
        queryNote={queryNote}
        filteredFileNames={filteredFileNames.length > 0 ? filteredFileNames : undefined}
        filteredClauseTypes={filteredClauseTypes.length > 0 ? filteredClauseTypes : undefined}
        contractExplanations={contractExplanations}
        onDelete={handleDelete}
        onDeleteAll={handleDeleteAll}
        onRename={handleRename}
        onRefresh={onRefresh}
      />
    </div>
  );
}
