"use client";

import { useCallback, useState } from "react";

import { Contract } from "@/types/contracts";

import UploadSection from "@/components/upload/upload-section";
import ContractsSection from "@/components/contracts/contracts-section";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  initialContracts: Contract[];
}

export default function DashboardView({ initialContracts }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/contracts");
      const data = await res.json();
      if (data.success) {
        setContracts(data.contracts ?? []);
      }
    } catch {
      // silently ignore — table keeps showing existing data
    } finally {
      setRefreshing(false);
    }
  }, []);

  function handleUploadComplete() {
    setUploadOpen(false);
    refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Review Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Upload contracts and analyze legal clauses.
          </p>
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-black/80 transition-colors"
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          Upload Files
        </button>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Contracts</DialogTitle>
          </DialogHeader>

          <UploadSection onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>

      <div className="relative">
        {refreshing && (
          <div className="absolute right-0 -top-7 flex items-center gap-1.5 text-xs text-muted-foreground">
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
            Refreshing…
          </div>
        )}

        <ContractsSection contracts={contracts} />
      </div>
    </div>
  );
}
