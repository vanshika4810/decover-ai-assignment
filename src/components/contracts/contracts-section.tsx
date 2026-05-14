"use client";

import { useState } from "react";

import { Contract } from "@/types/contracts";

import QueryBox from "./query-box";

import ContractsTable from "./contracts-table";

interface Props {
  contracts: Contract[];
}

export default function ContractsSection({ contracts }: Props) {
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

  return (
    <>
      <QueryBox onAnswer={handleAnswer} onClear={clearQueryResults} />

      <ContractsTable
        contracts={contracts}
        queryNote={queryNote}
        filteredFileNames={filteredFileNames.length > 0 ? filteredFileNames : undefined}
        filteredClauseTypes={filteredClauseTypes.length > 0 ? filteredClauseTypes : undefined}
      />
    </>
  );
}
