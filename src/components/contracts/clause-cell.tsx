"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useState } from "react";

interface Props {
  clause: any;
}

export default function ClauseCell({ clause }: Props) {
  const [open, setOpen] = useState(false);

  if (!clause || !clause.found) {
    return <div className="text-sm text-muted-foreground">No Data Found</div>;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-left">
        <div className="space-y-1">
          <p className="text-sm font-medium text-green-600">Found</p>

          <p className="line-clamp-3 text-xs text-muted-foreground">
            {clause.summary}
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{clause.clauseType}</DialogTitle>
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
