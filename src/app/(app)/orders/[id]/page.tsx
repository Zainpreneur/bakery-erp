"use client";

import { use, useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconBread,
  IconCash,
  IconCheck,
  IconClock,
  IconDotsVertical,
  IconPrinter,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import { api, apiErrorMessage, ApiError } from "@/lib/api-client";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDate, formatDateTime, money, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ErrorView } from "@/components/error-view";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInput, setPaymentInput] = useState("0");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get<Order>(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setLoadError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(status: OrderStatus) {
    if (!order) return;
    try {
      await api.put(`/orders/${order.id}/status`, { status });
      toast.success(
        status === "CANCELLED"
          ? `Order ${order.orderNumber} cancelled`
          : `Order marked ${titleCase(status).toLowerCase()}`
      );
      setCancelOpen(false);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function savePayment(event: FormEvent) {
    event.preventDefault();
    if (!order) return;
    setSaving(true);
    try {
      await api.put(`/orders/${order.id}/payment`, {
        paidAmount: Number(paymentInput) || 0,
      });
      toast.success("Payment saved");
      setPaymentOpen(false);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-12 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <ErrorView
        title="Order not found"
        message="This order may have been removed, or the link is out of date."
      />
    );
  }

  if (loadError || !order) {
    return (
      <ErrorView
        title="Could not load order"
        message={loadError || "Unknown error"}
        onRetry={() => void load()}
      />
    );
  }

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
  const balance = Math.max(0, order.totalAmount - order.paidAmount);
  const paidPercent =
    order.totalAmount > 0
      ? Math.min(100, Math.round((order.paidAmount / order.totalAmount) * 100))
      : 0;
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Screen content (hidden when printing) */}
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link href="/orders" aria-label="Back to orders">
                <IconArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight tabular-nums">
                  {order.orderNumber}
                </h1>
                <StatusBadge status={order.status} />
                <StatusBadge status={order.paymentStatus} />
              </div>
              <p className="text-sm text-muted-foreground">
                {titleCase(order.orderType)} · Placed{" "}
                {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {nextStatus ? (
              <Button onClick={() => void setStatus(nextStatus)}>
                <IconCheck className="size-4" />
                Mark {titleCase(nextStatus).toLowerCase()}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => window.print()}>
              <IconPrinter className="size-4" /> Print invoice
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Order actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setPaymentInput(String(order.paidAmount));
                    setPaymentOpen(true);
                  }}
                >
                  <IconCash className="size-4" /> Edit payment
                </DropdownMenuItem>
                {order.customer ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/customers/${order.customer.id}`}>
                      <IconUser className="size-4" /> View customer
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {order.status !== "COMPLETED" &&
                order.status !== "CANCELLED" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setCancelOpen(true)}
                    >
                      <IconX className="size-4" /> Cancel order
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items + notes */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>
                  {itemCount} item{itemCount === 1 ? "" : "s"} on this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.name ?? "Product"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {money(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {money(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="text-right font-semibold">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-base font-semibold tabular-nums">
                        {money(order.totalAmount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {order.notes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {order.notes}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Summary + payment + timeline */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Customer</span>
                  {order.customer ? (
                    <Link
                      href={`/customers/${order.customer.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {order.customer.name}
                    </Link>
                  ) : (
                    <span className="font-medium">Walk-in</span>
                  )}
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Order type</span>
                  <span className="font-medium">{titleCase(order.orderType)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Placed</span>
                  <span className="font-medium tabular-nums">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Due</span>
                  <span className="font-medium tabular-nums">
                    {formatDate(order.dueDate)}
                  </span>
                </div>
                {order.createdBy ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Taken by</span>
                    <span className="font-medium">{order.createdBy.name}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>
                  {balance > 0
                    ? `${money(balance)} still due`
                    : "Fully paid — thank you!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={paidPercent} aria-label="Payment progress" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium tabular-nums">
                      {money(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium tabular-nums">
                      {money(order.paidAmount)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Balance</span>
                    <span className="font-semibold tabular-nums">
                      {money(balance)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPaymentInput(String(order.paidAmount));
                    setPaymentOpen(true);
                  }}
                >
                  <IconCash className="size-4" /> Edit payment
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {order.status === "CANCELLED" ? (
                  <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <IconX className="size-4 shrink-0" />
                    This order was cancelled. Ingredients were returned to stock.
                  </div>
                ) : (
                  <ol className="space-y-4">
                    {STATUS_FLOW.map((step, index) => {
                      const done = index < currentIndex;
                      const current = index === currentIndex;
                      return (
                        <li key={step} className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full border",
                              done &&
                                "border-primary bg-primary text-primary-foreground",
                              current &&
                                "border-primary bg-primary/10 text-primary",
                              !done &&
                                !current &&
                                "border-border text-muted-foreground"
                            )}
                          >
                            {done ? (
                              <IconCheck className="size-3.5" />
                            ) : current ? (
                              <IconClock className="size-3.5" />
                            ) : (
                              <span className="size-1.5 rounded-full bg-current" />
                            )}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              current
                                ? "font-semibold"
                                : done
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/70"
                            )}
                          >
                            {titleCase(step)}
                          </span>
                          {current ? (
                            <StatusBadge status={step} className="ml-auto" />
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Printable invoice (only visible when printing) */}
      <div className="hidden print:block">
        <div className="mx-auto max-w-3xl space-y-8 p-8 text-black">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-black text-white">
                <IconBread className="size-6" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  Bakery Manager
                </p>
                <p className="text-sm text-neutral-600">
                  Fresh from the oven, every day.
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold uppercase tracking-tight">
                Invoice
              </p>
              <p className="mt-1 font-medium tabular-nums text-neutral-600">
                {order.orderNumber}
              </p>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-end gap-8">
                  <span className="text-neutral-600">Issue date</span>
                  <span className="font-medium tabular-nums">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex justify-end gap-8">
                  <span className="text-neutral-600">Due date</span>
                  <span className="font-medium tabular-nums">
                    {formatDate(order.dueDate)}
                  </span>
                </div>
                <div className="flex justify-end gap-8">
                  <span className="text-neutral-600">Payment</span>
                  <span className="font-medium">
                    {titleCase(order.paymentStatus)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-600">
                Bill to
              </p>
              <p className="mt-2 font-semibold">
                {order.customer?.name ?? "Walk-in customer"}
              </p>
              {order.customer?.email ? (
                <p className="text-sm text-neutral-600">{order.customer.email}</p>
              ) : null}
              {order.customer?.phone ? (
                <p className="text-sm text-neutral-600">{order.customer.phone}</p>
              ) : null}
              {order.customer?.address ? (
                <p className="text-sm text-neutral-600">
                  {order.customer.address}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-600">
                Order details
              </p>
              <p className="mt-2 text-sm">
                Type: <span className="font-medium">{titleCase(order.orderType)}</span>
              </p>
              <p className="text-sm">
                Status: <span className="font-medium">{titleCase(order.status)}</span>
              </p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit price</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-200">
                  <td className="py-2 font-medium">
                    {item.product?.name ?? "Product"}
                  </td>
                  <td className="py-2 text-right tabular-nums text-neutral-600">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right tabular-nums text-neutral-600">
                    {money(item.unitPrice)}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    {money(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Total</span>
                <span className="font-medium tabular-nums">
                  {money(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Paid</span>
                <span className="font-medium tabular-nums">
                  {money(order.paidAmount)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Balance due</span>
                <span className="text-xl font-semibold tracking-tight tabular-nums">
                  {money(balance)}
                </span>
              </div>
            </div>
          </div>

          {order.notes ? (
            <>
              <Separator />
              <div className="space-y-1 text-sm text-neutral-600">
                <p className="font-medium text-black">Notes</p>
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </div>
            </>
          ) : null}

          <Separator />
          <p className="text-sm text-neutral-600">
            Thank you for your order — we appreciate your business. Please
            reference {order.orderNumber} with any payment or enquiry.
          </p>
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment · {order.orderNumber}</DialogTitle>
            <DialogDescription>
              Total due: {money(order.totalAmount)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={savePayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="detail-payment-amount">Amount paid</Label>
              <Input
                id="detail-payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentInput}
                onChange={(e) => setPaymentInput(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentOpen(false)}
              >
                Cancel
              </Button>
              <LoadingButton type="submit" loading={saving} loadingLabel="Saving payment">
                Save payment
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel order ${order.orderNumber}?`}
        description="Cancelling returns any deducted ingredients to stock. This cannot be undone."
        confirmLabel="Cancel order"
        onConfirm={() => setStatus("CANCELLED")}
      />
    </div>
  );
}