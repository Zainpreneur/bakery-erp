"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCalendar,
  IconCoin,
  IconPackage,
  IconPlus,
  IconRefresh,
  IconShoppingCart,
  IconTrendingUp,
} from "@tabler/icons-react";

import { api, apiErrorMessage } from "@/lib/api-client";
import type { DashboardSummary, Order } from "@/lib/types";
import { formatDate, money } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SectionBoundary } from "@/components/section-boundary";
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart";
import { TopProductsChart } from "@/components/charts/top-products-chart";
import { StatusBadge } from "@/components/status-badge";
import { Infobar } from "@/components/ui/infobar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SectionError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <IconAlertTriangle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <IconRefresh className="size-4" /> Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const res = await api.get<DashboardSummary>("/dashboard/summary");
      setSummary(res.data);
    } catch (err) {
      setSummaryError(apiErrorMessage(err));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await api.get<Order[]>("/orders");
      setOrders(res.data.slice(0, 5));
    } catch (err) {
      setOrdersError(apiErrorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadSummary(), loadOrders()]);
  }, [loadSummary, loadOrders]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good day, baker 👋"
        description="Here's how the bakery is performing right now."
      >
        <Button variant="outline" onClick={() => void loadAll()} disabled={summaryLoading || ordersLoading}>
          <IconRefresh className="size-4" /> Refresh
        </Button>
        <Button asChild>
          <Link href="/orders">
            <IconPlus className="size-4" /> New order
          </Link>
        </Button>
      </PageHeader>

      {/* Stats + charts + stock — one section, one skeleton, one error state. */}
      <SectionBoundary
        title="Bakery overview"
        loading={summaryLoading && !summary}
        onRetry={() => void loadSummary()}
        skeleton={<SummarySkeleton />}
        className="animate-section-in"
      >
        {summaryError && !summary ? (
          <SectionError
            title="Could not load the overview"
            message={summaryError}
            onRetry={() => void loadSummary()}
          />
        ) : summary ? (
          <div className="space-y-6">
            {summary.lowStockCount > 0 ? (
              <Infobar
                variant="warning"
                title={`${summary.lowStockCount} ingredient${summary.lowStockCount === 1 ? "" : "s"} below reorder point`}
                description="Reorder soon to avoid running out during service."
                dismissKey="low-stock"
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/ingredients">Review stock <IconArrowRight className="size-3.5" /></Link>
                  </Button>
                }
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Revenue today" value={money(summary.revenueToday)} hint={`${summary.ordersTodayCount} orders placed`} icon={IconCoin} />
              <StatCard label="This week" value={money(summary.revenueWeek)} hint="Since Sunday" icon={IconTrendingUp} />
              <StatCard label="This month" value={money(summary.revenueMonth)} hint="Month to date" icon={IconCalendar} />
              <StatCard
                label="Low stock items"
                value={String(summary.lowStockCount)}
                hint={summary.lowStockCount > 0 ? "Ingredients need reordering" : "All ingredients stocked"}
                icon={IconPackage}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue trend</CardTitle>
                  <CardDescription>Daily revenue over the last 30 days</CardDescription>
                  <CardAction><Badge variant="secondary">Live</Badge></CardAction>
                </CardHeader>
                <CardContent><RevenueAreaChart data={summary.revenueTrend} /></CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top products</CardTitle>
                  <CardDescription>Units sold in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topProducts.length ? (
                    <TopProductsChart data={summary.topProducts} />
                  ) : (
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><IconPackage /></EmptyMedia>
                        <EmptyTitle>No sales yet</EmptyTitle>
                        <EmptyDescription>Product performance will appear here.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Low stock</CardTitle>
                    <CardDescription>At or below reorder point</CardDescription>
                    <CardAction>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href="/ingredients" aria-label="Manage inventory"><IconArrowRight className="size-4" /></Link>
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {summary.lowStockIngredients.length ? (
                      <ul className="divide-y">
                        {summary.lowStockIngredients.map((ingredient) => (
                          <li key={ingredient.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                            <span className="flex min-w-0 items-center gap-2 font-medium">
                              <IconAlertTriangle className="size-4 shrink-0 text-amber-600" />
                              <span className="truncate">{ingredient.name}</span>
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {ingredient.quantityInStock} {ingredient.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Everything is well stocked. Nice work!</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Snapshot</CardTitle>
                  <CardDescription>Estimated this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Active orders</dt>
                      <dd className="font-semibold tabular-nums">{summary.pendingOrders}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Customers</dt>
                      <dd className="font-semibold tabular-nums">{summary.customerCount}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Expenses</dt>
                      <dd className="font-semibold tabular-nums">{money(summary.expensesMonth)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t pt-3">
                      <dt className="font-medium">Net (est.)</dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {money(summary.revenueMonth - summary.expensesMonth)}
                      </dd>
                    </div>
                  </dl>
                  <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
                    <Link href="/expenses"><IconShoppingCart className="size-4" /> Review expenses</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <SummarySkeleton />
        )}
      </SectionBoundary>

      {/* Recent orders — independent loading and failure state. */}
      <SectionBoundary
        title="Recent orders"
        loading={ordersLoading && !orders.length}
        onRetry={() => void loadOrders()}
        skeleton={<Skeleton className="h-72" />}
        className="animate-section-in"
      >
        {ordersError && !orders.length ? (
          <SectionError title="Could not load recent orders" message={ordersError} onRetry={() => void loadOrders()} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest orders placed at the counter</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/orders">View all <IconArrowRight className="size-4" /></Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {orders.length ? (
                <div className="-mx-4 overflow-x-auto sm:-mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Placed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                              {order.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{order.customer?.name ?? "Walk-in"}</TableCell>
                          <TableCell className="tabular-nums">{money(order.totalAmount)}</TableCell>
                          <TableCell><StatusBadge status={order.status} /></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty className="border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><IconShoppingCart /></EmptyMedia>
                    <EmptyTitle>No orders yet</EmptyTitle>
                    <EmptyDescription>Create one to see it here.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button asChild size="sm"><Link href="/orders">New order</Link></Button>
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
          </Card>
        )}
      </SectionBoundary>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 lg:col-span-2" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
