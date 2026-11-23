import { IconCheck } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

export type Step = {
  title: string;
  description?: string;
};

export function Stepper({
  steps,
  currentStep,
  className,
}: {
  steps: Step[];
  /** 1-based index of the active step. */
  currentStep: number;
  className?: string;
}) {
  return (
    <ol
      data-slot="stepper"
      className={cn("flex w-full items-start gap-2", className)}
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;
        const last = stepNumber === steps.length;
        return (
          <li
            key={step.title}
            data-state={done ? "complete" : active ? "active" : "upcoming"}
            className={cn("flex min-w-0 flex-1 items-start gap-2", !last && "sm:flex-none")}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary",
                  !done && !active && "border-border bg-muted/50 text-muted-foreground"
                )}
              >
                {done ? <IconCheck className="size-3.5" /> : stepNumber}
              </span>
            </div>
            <div className={cn("min-w-0 pt-0.5", last ? "" : "hidden sm:block")}>
              <p
                className={cn(
                  "text-xs font-medium leading-tight",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
              {step.description ? (
                <p className="mt-0.5 hidden text-[11px] leading-tight text-muted-foreground lg:block">
                  {step.description}
                </p>
              ) : null}
            </div>
            {!last ? (
              <span
                aria-hidden
                className={cn(
                  "mt-3.5 hidden h-px flex-1 sm:block",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
