"use client";

import * as React from "react";
import Image from "next/image";
import { IconUpload, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { api, apiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function FileUploader({
  value,
  onChange,
  label = "Product photo",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const res = await api.upload<{ url: string }>("/uploads", file);
      onChange(res.data.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label.toLowerCase()}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void upload(file);
        }}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center transition",
          dragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-accent/40"
        )}
      >
        {uploading ? (
          <>
            <Spinner className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">Uploading…</span>
          </>
        ) : value ? (
          <>
            <div className="relative size-24 overflow-hidden rounded-lg border">
              <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
            </div>
            <span className="text-xs text-muted-foreground">
              Click or drop to replace
            </span>
          </>
        ) : (
          <>
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <IconUpload className="size-4 text-muted-foreground" />
            </span>
            <span className="text-sm font-medium">Drop an image here</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF · up to 5 MB</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          className="text-muted-foreground"
        >
          <IconX className="size-3.5" /> Remove photo
        </Button>
      ) : null}
    </div>
  );
}
