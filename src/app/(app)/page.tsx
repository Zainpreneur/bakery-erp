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
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart";
import { TopProductsChart } from "@/components/charts/top-products-chart";
import { StatusBadge } from "@/components/status-badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        api.get<DashboardSummary>("/dashboard/summary"),
        api.get<Order[]>("/orders"),
      ]);
      setSummary(summaryRes.data);
      setOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !summary) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" description="Today at a glance" />
        <Alert variant="destructive">
          <IconAlertTriangle className="size-4" />
          <AlertTitle>Could not load the dashboard</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <IconRefresh className="size-4" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good day, baker 👋"
        description="Here's how the bakery is performing right now."
      >
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <IconRefresh className="size-4" /> Refresh
        </Button>
        <Button asChild>
          <Link href="/orders">
            <IconPlus className="size-4" /> New order
          </Link>
        </Button>
      </PageHeader>

      {loading || !summary ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue today"
              value={money(summary.revenueToday)}
              hint={`${summary.ordersTodayCount} orders placed`}
              icon={IconCoin}
            />
            <StatCard
              label="This week"
              value={money(summary.revenueWeek)}
              hint="Since Sunday"
              icon={IconTrendingUp}
            />
            <StatCard
              label="This month"
              value={money(summary.revenueMonth)}
              hint="Month to date"
              icon={IconCalendar}
            />
            <StatCard
              label="Low stock items"
              value={String(summary.lowStockCount)}
              hint={
                summary.lowStockCount > 0
                  ? "Ingredients need reordering"
                  : "All ingredients stocked"
              }
              icon={IconPackage}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue trend</CardTitle>
                <CardDescription>Daily revenue over the last 30 days</CardDescription>
                <CardAction>
                  <Badge variant="secondary">Live</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <RevenueAreaChart data={summary.revenueTrend} />
              </CardContent>
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
                  <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <IconPackage className="size-5" />
                    </span>
                    <p className="text-sm font-medium">No sales yet</p>
                    <p className="text-xs text-muted-foreground">
                      Product performance will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent orders</CardTitle>
                <CardDescription>Latest orders placed at the counter</CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/orders">
                      View all <IconArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
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
                      {orders.length ? (
                        orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell>
                              {order.customer?.name ?? "Walk-in"}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {money(order.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={order.status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No orders yet. Create one to see it here.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Low stock</CardTitle>
                  <CardDescription>At or below reorder point</CardDescription>
                  <CardAction>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/ingredients" aria-label="Manage inventory">
                        <IconArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  {summary.lowStockIngredients.length ? (
                    <ul className="divide-y">
                      {summary.lowStockIngredients.map((ingredient) => (
                        <li
                          key={ingredient.id}
                          className="flex items-center justify-between gap-3 py-2.5 text-sm"
                        >
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
                    <p className="text-sm text-muted-foreground">
                      Everything is well stocked. Nice work!
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Snapshot</CardTitle>
                  <CardDescription>Estimated this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Active orders</dt>
                      <dd className="font-semibold tabular-nums">
                        {summary.pendingOrders}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Customers</dt>
                      <dd className="font-semibold tabular-nums">
                        {summary.customerCount}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Expenses</dt>
                      <dd className="font-semibold tabular-nums">
                        {money(summary.expensesMonth)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t pt-3">
                      <dt className="font-medium">Net (est.)</dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {money(summary.revenueMonth - summary.expensesMonth)}
                      </dd>
                    </div>
                  </dl>
                  <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
                    <Link href="/expenses">
                      <IconShoppingCart className="size-4" /> Review expenses
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
