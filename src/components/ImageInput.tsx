"use client";

import { useState, useCallback, useRef } from "react";
import { Spinner, ErrorAlert, ImageIcon } from "@/components/ui";

interface ImageInputProps {
  onImageSelect: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ImageInput({ onImageSelect, disabled }: ImageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setPreview(URL.createObjectURL(file));
      onImageSelect(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    } else {
      setError("Please drop an image file");
    }
  }, [disabled, isUploading, handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const clearImage = useCallback(() => {
    setPreview(null);
    setError(null);
    onImageSelect("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onImageSelect]);

  if (preview) {
    return (
      <div className="relative group rounded-xl overflow-hidden bg-surface-elevated">
        <img
          src={preview}
          alt="Selected"
          className="w-full aspect-video object-contain"
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-80 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={clearImage}
            disabled={disabled}
            className="px-4 py-2 bg-surface-elevated rounded-lg text-white text-sm font-medium hover:bg-surface transition-colors disabled:cursor-not-allowed"
          >
            Change Image
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`relative aspect-video rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
          isDragging
            ? "bg-surface-elevated"
            : "bg-surface-hover hover:bg-surface-elevated"
        } ${disabled || isUploading ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <>
            <Spinner size="lg" className="text-accent" />
            <p className="text-muted text-sm">Uploading...</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center">
              <ImageIcon className="text-muted" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Drop an image here</p>
              <p className="text-sm text-muted mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-muted">JPEG, PNG, WebP, GIF • Max 10MB</p>
          </>
        )}
      </div>

      {error && <ErrorAlert>{error}</ErrorAlert>}
    </div>
  );
}
