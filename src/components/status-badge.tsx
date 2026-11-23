import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { titleCase } from "@/lib/format";

const styles: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  READY: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  UNPAID: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  PARTIAL: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PAID: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  ADMIN: "bg-primary/10 text-primary",
  MANAGER: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  STAFF: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus | PaymentStatus | "ADMIN" | "MANAGER" | "STAFF";
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", styles[status] ?? "bg-muted", className)}
    >
      {titleCase(status)}
    </Badge>
  );
}
