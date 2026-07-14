"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  error?: string;
  className?: string;
  aspectRatio?: "square" | "landscape" | "portrait";
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  folder = "uploads",
  label,
  error,
  className,
  aspectRatio = "square",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (result.success) {
          onChange(result.data.url);
        }
      } catch {
        // Error handled silently — toast can be added by parent
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = async () => {
    if (value) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
      } catch {
        // Deletion from R2 is best-effort
      }
    }
    onRemove?.();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-charcoal-200 bg-charcoal-50",
              aspectClasses[aspectRatio]
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 rounded-full bg-error p-1.5 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/90"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            aspectClasses[aspectRatio],
            dragOver
              ? "border-gold-500 bg-gold-50"
              : "border-charcoal-200 bg-charcoal-50/50 hover:border-gold-400 hover:bg-gold-50/50",
            error && "border-error/50"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-gold-500" />
              <span className="text-xs text-charcoal-400">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4">
              {dragOver ? (
                <Upload size={24} className="text-gold-500" />
              ) : (
                <ImageIcon size={24} className="text-charcoal-300" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-charcoal-500">
                  {dragOver ? "Drop image here" : "Click or drag to upload"}
                </p>
                <p className="text-xs text-charcoal-300 mt-0.5">
                  JPEG, PNG, WebP — Max 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
    </div>
  );
}

// Multi-image upload variant
interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  error?: string;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder = "products",
  label,
  error,
  maxImages = 8,
  className,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    const pendingFiles = Array.from(files).slice(0, maxImages - value.length);
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    const uploaded: string[] = [];

    for (const file of pendingFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();
        if (result.success) {
          uploaded.push(result.data.url);
        } else {
          console.error("Upload failed:", result.error);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    if (uploaded.length > 0) {
      onChange([...value, ...uploaded]);
    }
    setIsUploading(false);
  };

  const handleRemove = async (index: number) => {
    const url = value[index];
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      // Best-effort deletion
    }
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-charcoal-600 mb-1.5">
          {label} ({value.length}/{maxImages})
        </label>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {value.map((url, index) => (
          <div key={url} className="relative group aspect-square">
            <div className="h-full w-full overflow-hidden rounded-lg border border-charcoal-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -top-2 -right-2 rounded-full bg-error p-1.5 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/90"
              aria-label={`Remove image ${index + 1}`}
            >
              <X size={12} />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-medium text-white">
                Thumbnail
              </span>
            )}
          </div>
        ))}

        {value.length < maxImages && (
          <div
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-charcoal-200 bg-charcoal-50/50 hover:border-gold-400 hover:bg-gold-50/50 cursor-pointer transition-colors"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-gold-500" />
            ) : (
              <>
                <Upload size={20} className="text-charcoal-300 mb-1" />
                <span className="text-xs text-charcoal-400">Add Image</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files) handleUpload(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
    </div>
  );
}
