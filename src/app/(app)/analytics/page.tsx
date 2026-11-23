"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconChartBar,
  IconDownload,
  IconPrinter,
  IconRefresh,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { api, apiErrorMessage } from "@/lib/api-client";
import type { Expense, Order } from "@/lib/types";
import { formatDate, money, titleCase } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SectionBoundary } from "@/components/section-boundary";
import { Infobar } from "@/components/ui/infobar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Preset = "7" | "30" | "90" | "custom";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "var(--chart-1)",
  READY: "var(--chart-2)",
  IN_PROGRESS: "var(--chart-3)",
  PENDING: "var(--chart-4)",
  CANCELLED: "var(--chart-5)",
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: "var(--chart-1)",
  PARTIAL: "var(--chart-3)",
  UNPAID: "var(--chart-4)",
};

const moneyChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-5)" },
} satisfies ChartConfig;

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function presetsFor(value: Preset, customFrom: string, customTo: string) {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(to);
  if (value === "custom") {
    return {
      from: customFrom || isoDay(to),
      to: customTo || isoDay(to),
    };
  }
  from.setDate(from.getDate() - (Number(value) - 1));
  return { from: isoDay(from), to: isoDay(to) };
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>("30");
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return isoDay(d);
  });
  const [customTo, setCustomTo] = useState(() => isoDay(new Date()));
  const [orders, setOrders] = useState<Order[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(
    () => presetsFor(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRes, expenseRes] = await Promise.all([
        api.get<Order[]>("/orders", {
          params: {
            from: `${range.from}T00:00:00`,
            to: `${range.to}T23:59:59`,
          },
        }),
        api.get<Expense[]>("/expenses"),
      ]);
      setOrders(orderRes.data);
      setAllExpenses(expenseRes.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const analytics = useMemo(() => {
    const active = orders.filter((order) => order.status !== "CANCELLED");
    const expenses = allExpenses.filter((expense) => {
      const day = isoDay(new Date(expense.date));
      return day >= range.from && day <= range.to;
    });

    const revenue = active.reduce((sum, order) => sum + order.totalAmount, 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const collected = active.reduce((sum, order) => sum + order.paidAmount, 0);
    const avgOrder = active.length ? revenue / active.length : 0;

    const days = Math.max(
      1,
      Math.round(
        (new Date(`${range.to}T00:00:00`).getTime() -
          new Date(`${range.from}T00:00:00`).getTime()) /
          86_400_000
      ) + 1
    );
    const groupByWeek = days > 31;
    const buckets = new Map<string, { label: string; revenue: number; expenses: number }>();
    for (let i = 0; i < days; i++) {
      const date = new Date(`${range.from}T00:00:00`);
      date.setDate(date.getDate() + i);
      const key = groupByWeek
        ? `W${Math.floor(i / 7) + 1}`
        : isoDay(date);
      if (!buckets.has(key)) {
        buckets.set(key, {
          label: groupByWeek
            ? `Week ${Math.floor(i / 7) + 1}`
            : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          revenue: 0,
          expenses: 0,
        });
      }
    }
    for (const order of active) {
      const index = Math.floor(
        (new Date(order.createdAt).getTime() -
          new Date(`${range.from}T00:00:00`).getTime()) /
          86_400_000
      );
      const key = groupByWeek ? `W${Math.floor(index / 7) + 1}` : isoDay(new Date(order.createdAt));
      const bucket = buckets.get(key);
      if (bucket) bucket.revenue += order.totalAmount;
    }
    for (const expense of expenses) {
      const index = Math.floor(
        (new Date(expense.date).getTime() -
          new Date(`${range.from}T00:00:00`).getTime()) /
          86_400_000
      );
      const key = groupByWeek ? `W${Math.floor(index / 7) + 1}` : isoDay(new Date(expense.date));
      const bucket = buckets.get(key);
      if (bucket) bucket.expenses += expense.amount;
    }

    const statusCounts = Object.fromEntries(
      ["PENDING", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"].map((status) => [
        status,
        orders.filter((order) => order.status === status).length,
      ])
    );
    const paymentCounts = Object.fromEntries(
      ["PAID", "PARTIAL", "UNPAID"].map((status) => [
        status,
        active.filter((order) => order.paymentStatus === status).length,
      ])
    );

    const productTotals = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of active) {
      for (const item of order.items) {
        const entry = productTotals.get(item.productId) ?? {
          name: item.product?.name ?? "Unknown product",
          qty: 0,
          revenue: 0,
        };
        entry.qty += item.quantity;
        entry.revenue += item.subtotal;
        productTotals.set(item.productId, entry);
      }
    }

    const expenseByCategory = new Map<string, number>();
    for (const expense of expenses) {
      expenseByCategory.set(
        expense.category,
        (expenseByCategory.get(expense.category) ?? 0) + expense.amount
      );
    }

    return {
      revenue,
      expenseTotal,
      collected,
      outstanding: revenue - collected,
      avgOrder,
      profit: revenue - expenseTotal,
      orderCount: active.length,
      trend: [...buckets.values()],
      groupByWeek,
      statusData: Object.entries(statusCounts)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ name: titleCase(name), value })),
      paymentData: Object.entries(paymentCounts)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ name: titleCase(name), value })),
      topProducts: [...productTotals.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      expenseData: [...expenseByCategory.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    };
  }, [orders, allExpenses, range.from, range.to]);

  function exportCsv() {
    const header = ["Order", "Date", "Customer", "Status", "Payment", "Items", "Total", "Paid"];
    const rows = orders.map((order) => [
      order.orderNumber,
      isoDay(new Date(order.createdAt)),
      order.customer?.name ?? "Walk-in",
      order.status,
      order.paymentStatus,
      String(order.items.reduce((sum, item) => sum + item.quantity, 0)),
      order.totalAmount.toFixed(2),
      order.paidAmount.toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bakery-report-${range.from}-to-${range.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${orders.length} orders`);
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title="Analytics & reports"
        description="Revenue, costs and order mix for the selected period. Export a CSV or print a summary for your records."
        className="print:hidden"
      >
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <IconRefresh className="size-4" /> Refresh
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <IconPrinter className="size-4" /> Print
        </Button>
        <Button onClick={exportCsv} disabled={loading || !orders.length}>
          <IconDownload className="size-4" /> Export CSV
        </Button>
      </PageHeader>

      <Card className="print:hidden">
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="analytics-range">Period</Label>
            <Select value={preset} onValueChange={(value) => setPreset(value as Preset)}>
              <SelectTrigger id="analytics-range" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {preset === "custom" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="analytics-from">From</Label>
                <Input
                  id="analytics-from"
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analytics-to">To</Label>
                <Input
                  id="analytics-to"
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </div>
            </>
          ) : null}
          <p className="ml-auto text-sm text-muted-foreground">
            {formatDate(`${range.from}T00:00:00`)} – {formatDate(`${range.to}T00:00:00`)}
          </p>
        </CardContent>
      </Card>

      <div className="hidden print:block">
        <h1 className="text-2xl font-semibold">Bakery Manager · Performance report</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(`${range.from}T00:00:00`)} – {formatDate(`${range.to}T00:00:00`)}
        </p>
      </div>

      {error ? (
        <Infobar
          variant="warning"
          title="Could not load the report"
          description={error}
          action={<Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>}
        />
      ) : null}

      <SectionBoundary
        title="Report summary"
        loading={loading}
        skeleton={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Revenue" value={money(analytics.revenue)} hint="Excludes cancelled orders" icon={IconChartBar} />
          <StatCard label="Orders" value={String(analytics.orderCount)} hint={`${money(analytics.avgOrder)} average`} />
          <StatCard label="Collected" value={money(analytics.collected)} hint={`${money(analytics.outstanding)} outstanding`} />
          <StatCard label="Expenses" value={money(analytics.expenseTotal)} hint="Recorded in period" />
          <StatCard
            label="Net result"
            value={money(analytics.profit)}
            hint={analytics.profit >= 0 ? "Revenue minus expenses" : "Expenses exceed revenue"}
            trend={analytics.profit >= 0 ? "up" : "down"}
          />
        </div>
      </SectionBoundary>

      <SectionBoundary
        title="Trends"
        loading={loading}
        skeleton={<Skeleton className="h-80" />}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue vs expenses</CardTitle>
              <CardDescription>
                {analytics.groupByWeek ? "Grouped by week" : "Grouped by day"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.trend.some((point) => point.revenue || point.expenses) ? (
                <ChartContainer config={moneyChartConfig} className="h-64 w-full">
                  <BarChart data={analytics.trend} margin={{ left: 4, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} width={48} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <Empty className="h-64">
                  <EmptyHeader>
                    <EmptyTitle>No activity in this period</EmptyTitle>
                    <EmptyDescription>Try a wider date range.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order status</CardTitle>
              <CardDescription>Where orders stand today</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.statusData.length ? (
                <ChartContainer
                  config={{ value: { label: "Orders" } }}
                  className="mx-auto h-64 w-full"
                >
                  <PieChart>
                    <Pie
                      data={analytics.statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {analytics.statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toUpperCase().replace(" ", "_")] ?? "var(--chart-1)"} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <Empty className="h-64">
                  <EmptyHeader>
                    <EmptyTitle>No orders yet</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {analytics.statusData.map((entry) => (
                  <span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: STATUS_COLORS[entry.name.toUpperCase().replace(" ", "_")] }}
                    />
                    {entry.name} · {entry.value}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionBoundary>

      <SectionBoundary
        title="Breakdown"
        loading={loading}
        skeleton={<Skeleton className="h-72" />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top products</CardTitle>
              <CardDescription>Ranked by revenue in this period</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {analytics.topProducts.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Product</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="pr-6 text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topProducts.map((product) => (
                      <TableRow key={product.name}>
                        <TableCell className="pl-6 font-medium">{product.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{product.qty}</TableCell>
                        <TableCell className="pr-6 text-right tabular-nums">
                          {money(product.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyTitle>No product sales</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost & payment mix</CardTitle>
              <CardDescription>Where money goes and how orders are paid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {analytics.expenseData.length ? (
                <div className="space-y-2.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Expenses by category
                  </p>
                  {analytics.expenseData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-3 text-sm">
                      <span className="w-24 truncate text-muted-foreground">{entry.name}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-5"
                          style={{
                            width: `${Math.max(4, (entry.value / analytics.expenseTotal) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-20 text-right tabular-nums">{money(entry.value)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Orders by payment status
                </p>
                <div className="flex flex-wrap gap-2">
                  {analytics.paymentData.length ? (
                    analytics.paymentData.map((entry) => (
                      <span
                        key={entry.name}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs tabular-nums",
                          entry.name === "Paid" && "border-chart-1/30 bg-chart-1/10",
                          entry.name === "Partial" && "border-chart-3/30 bg-chart-3/10",
                          entry.name === "Unpaid" && "border-chart-4/30 bg-chart-4/10"
                        )}
                        style={{ borderColor: PAYMENT_COLORS[entry.name.toUpperCase()] }}
                      >
                        {entry.name}: <strong>{entry.value}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No orders in this period.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionBoundary>

      <p className="text-xs text-muted-foreground print:hidden">
        Figures come from order and expense records. Cancelled orders are excluded from revenue.
      </p>
    </div>
  );
}
