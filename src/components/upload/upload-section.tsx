"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function UploadSection() {
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setLoading(true);

      const formData = new FormData();

      acceptedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await fetch("/api/contracts/upload", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    onDrop,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer"
    >
      <input {...getInputProps()} />

      {loading ? (
        <p>Uploading...</p>
      ) : (
        <p>Drag & drop contracts here or click to upload</p>
      )}
    </div>
  );
}
