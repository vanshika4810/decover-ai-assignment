"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useState } from "react";
import { ClauseClassification } from "@/types/contracts";

interface Props {
  clause: any;
}

const BADGE_CONFIG: Record<
  NonNullable<ClauseClassification>,
  { label: string; className: string }
> = {
  risk: {
    label: "Risk",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
  standard: {
    label: "Standard",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  key_term: {
    label: "Key term",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
};

function ClassificationBadge({
  classification,
}: {
  classification: ClauseClassification;
}) {
  if (!classification || !BADGE_CONFIG[classification]) return null;
  const { label, className } = BADGE_CONFIG[classification];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export default function ClauseCell({ clause }: Props) {
  const [open, setOpen] = useState(false);

  if (!clause || !clause.found) {
    return <div className="text-sm text-muted-foreground">—</div>;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-left w-full">
        <div className="space-y-1.5">
          <ClassificationBadge classification={clause.classification} />

          <p className="line-clamp-3 text-xs text-muted-foreground">
            {clause.summary}
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {clause.clauseType}
              <ClassificationBadge classification={clause.classification} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Confidence</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(clause.confidence * 100)}%
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Summary</p>
              <p className="text-sm text-muted-foreground">{clause.summary}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Full Clause</p>
              <div className="max-h-[400px] overflow-auto rounded-md border p-4 text-sm whitespace-pre-wrap">
                {clause.text}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
