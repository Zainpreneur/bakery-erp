"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "className"> {
  /** Shows a spinner, keeps the label in place, and disables the button. */
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
}

export function LoadingButton({
  loading = false,
  loadingLabel = "Loading…",
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <>
      <Button
        {...props}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn("relative", loading && "disabled:opacity-100", className)}
      >
        {loading ? (
          <Spinner aria-hidden className="absolute inset-0 m-auto" />
        ) : null}
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            loading && "opacity-0"
          )}
        >
          {children}
        </span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {loading ? loadingLabel : ""}
      </span>
    </>
  );
}
