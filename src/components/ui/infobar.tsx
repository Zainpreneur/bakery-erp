"use client";

import * as React from "react";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InfobarProps = {
  title: string;
  description?: string;
  variant?: "info" | "warning" | "success";
  action?: React.ReactNode;
  /** Changing this key resets the dismissed state. */
  dismissKey?: string;
  className?: string;
};

const VARIANTS = {
  info: "border-primary/25 bg-primary/[0.06] text-foreground",
  warning: "border-amber-500/30 bg-amber-500/[0.08] text-foreground",
  success: "border-emerald-500/30 bg-emerald-500/[0.08] text-foreground",
} as const;

export function Infobar({
  title,
  description,
  variant = "info",
  action,
  dismissKey,
  className,
}: InfobarProps) {
  const storageKey = dismissKey ? `bakery-infobar:${dismissKey}` : null;
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch {
      // Ignore storage failures.
    }
  }, [storageKey]);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3.5 py-2.5 text-sm",
        VARIANTS[variant],
        className
      )}
    >
      <IconInfoCircle className="size-4 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <span className="font-medium">{title}</span>
        {description ? (
          <span className="ml-1.5 text-muted-foreground">{description}</span>
        ) : null}
      </div>
      {action}
      <Button
        variant="ghost"
        size="icon"
        className="-mr-1.5 size-7 shrink-0"
        aria-label="Dismiss"
        onClick={() => {
          setDismissed(true);
          if (storageKey) {
            try {
              localStorage.setItem(storageKey, "1");
            } catch {
              // Ignore storage failures.
            }
          }
        }}
      >
        <IconX className="size-3.5" />
      </Button>
    </div>
  );
}
