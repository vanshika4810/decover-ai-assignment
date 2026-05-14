"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type FileStatus = "queued" | "uploading" | "processing" | "done" | "error" | "duplicate";

interface StagedFile {
  id: string;
  file: File;
  status: FileStatus;
  errorMsg?: string;
}

interface Props {
  onUploadComplete?: () => void;
  existingFileNames?: string[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  const isPdf = type === "application/pdf";
  const isDocx =
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const color = isPdf ? "#ef4444" : isDocx ? "#3b82f6" : "#6b7280";
  const label = isPdf ? "PDF" : isDocx ? "DOC" : "FILE";

  return (
    <svg
      width="36"
      height="44"
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M4 0H22L36 14V40C36 42.2 34.2 44 32 44H4C1.8 44 0 42.2 0 40V4C0 1.8 1.8 0 4 0Z"
        fill={color}
        opacity="0.12"
      />
      <path d="M22 0L36 14H26C23.8 14 22 12.2 22 10V0Z" fill={color} opacity="0.35" />
      <text
        x="18"
        y="31"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={color}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

function StatusChip({ status }: { status: FileStatus }) {
  const map: Record<FileStatus, { label: string; className: string }> = {
    queued: {
      label: "Queued",
      className: "bg-gray-100 text-gray-600",
    },
    uploading: {
      label: "Uploading…",
      className: "bg-blue-100 text-blue-700",
    },
    processing: {
      label: "Processing…",
      className: "bg-yellow-100 text-yellow-700",
    },
    done: {
      label: "Done",
      className: "bg-green-100 text-green-700",
    },
    error: {
      label: "Error",
      className: "bg-red-100 text-red-700",
    },
  };

  const { label, className } = map[status];

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function UploadSection({ onUploadComplete }: Props) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newEntries: StagedFile[] = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: "queued",
    }));
    setStagedFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop,
    noClick: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  function updateStatus(
    id: string,
    status: FileStatus,
    errorMsg?: string,
  ) {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status, errorMsg } : f)),
    );
  }

  async function handleUpload() {
    const queued = stagedFiles.filter((f) => f.status === "queued");
    if (!queued.length) return;

    setUploading(true);

    for (const entry of queued) {
      try {
        updateStatus(entry.id, "uploading");

        const formData = new FormData();
        formData.append("files", entry.file);

        const uploadRes = await fetch("/api/contracts/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          updateStatus(entry.id, "error", "Upload failed");
          continue;
        }

        updateStatus(entry.id, "processing");

        for (const contract of uploadData.contracts || []) {
          await fetch("/api/contracts/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contractId: contract._id }),
          });
        }

        updateStatus(entry.id, "done");
      } catch {
        updateStatus(entry.id, "error", "Unexpected error");
      }
    }

    setUploading(false);
    onUploadComplete?.();
  }

  function removeFile(id: string) {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearDone() {
    setStagedFiles((prev) => prev.filter((f) => f.status !== "done"));
  }

  const queuedCount = stagedFiles.filter((f) => f.status === "queued").length;
  const doneCount = stagedFiles.filter((f) => f.status === "done").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Supported formats: PDF, DOCX
      </p>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-8 py-10 text-center transition-colors ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/30"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-10 w-10 text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>

          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop files here"
              : "Drag & drop files here, or click to browse"}
          </p>
        </div>
      </div>

      {stagedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {stagedFiles.length} file{stagedFiles.length !== 1 ? "s" : ""} staged
            </p>

            {doneCount > 0 && (
              <button
                onClick={clearDone}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear completed
              </button>
            )}
          </div>

          <ul className="divide-y rounded-lg border">
            {stagedFiles.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <FileIcon type={entry.file.type} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(entry.file.size)}
                  </p>
                  {entry.errorMsg && (
                    <p className="text-xs text-red-600">{entry.errorMsg}</p>
                  )}
                </div>

                <StatusChip status={entry.status} />

                {(entry.status === "queued" || entry.status === "error") && (
                  <button
                    onClick={() => removeFile(entry.id)}
                    className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Remove"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {queuedCount > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {uploading
            ? "Uploading…"
            : `Upload ${queuedCount} file${queuedCount !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}
