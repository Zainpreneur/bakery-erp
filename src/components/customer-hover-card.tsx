"use client";

import * as React from "react";
import Link from "next/link";
import { IconArrowUpRight, IconMail, IconPhone } from "@tabler/icons-react";

import { api } from "@/lib/api-client";
import type { Customer } from "@/lib/types";
import { money } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerHoverCard({
  customer,
  children,
}: {
  customer: Customer;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [details, setDetails] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || details) return;
    let active = true;
    setLoading(true);
    void api
      .get<Customer>(`/customers/${customer.id}`)
      .then((res) => {
        if (active) setDetails(res.data);
      })
      .catch(() => {
        // Fall back to the customer data already present in the row.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, details, customer.id]);

  const orders = details?.orders ?? [];
  const spend = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={250}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-sm text-primary">
              {customer.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{customer.name}</p>
            <p className="text-xs text-muted-foreground">
              Customer since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {(customer.email || customer.phone) && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {customer.email ? (
              <p className="flex items-center gap-1.5 truncate">
                <IconMail className="size-3.5 shrink-0" /> {customer.email}
              </p>
            ) : null}
            {customer.phone ? (
              <p className="flex items-center gap-1.5">
                <IconPhone className="size-3.5 shrink-0" /> {customer.phone}
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Orders</p>
            <p className="text-sm font-semibold tabular-nums">
              {loading ? <Skeleton className="h-4 w-8" /> : (customer._count?.orders ?? orders.length)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Spend</p>
            <p className="text-sm font-semibold tabular-nums">
              {loading ? <Skeleton className="h-4 w-12" /> : money(spend)}
            </p>
          </div>
        </div>

        <Link
          href={`/customers/${customer.id}`}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View customer profile <IconArrowUpRight className="size-3.5" />
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}
