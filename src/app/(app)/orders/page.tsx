"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCash,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconPlus,
  IconShoppingCart,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { api, apiErrorMessage } from "@/lib/api-client";
import type {
  Customer,
  Order,
  OrderStatus,
  OrderType,
  Product,
} from "@/lib/types";
import { formatDate, money, titleCase } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, SortableHeader } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
];

type CartLine = { productId: string; quantity: number };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("none");
  const [orderType, setOrderType] = useState<OrderType>("WALK_IN");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [paymentTarget, setPaymentTarget] = useState<Order | null>(null);
  const [paymentInput, setPaymentInput] = useState("0");
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get<Order[]>("/orders", {
        params:
          statusFilter && statusFilter !== "all"
            ? { status: statusFilter }
            : undefined,
      });
      setOrders(res.data);
    } catch (err) {
      setLoadError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.get<Product[]>("/products", { params: { active: true } }),
      api.get<Customer[]>("/customers"),
    ])
      .then(([p, c]) => {
        if (!active) return;
        setProducts(p.data);
        setCustomers(c.data);
      })
      .catch((err) => {
        if (active) toast.error(apiErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      active: orders.filter(
        (o) => o.status === "PENDING" || o.status === "IN_PROGRESS" || o.status === "READY"
      ).length,
      awaitingPayment: orders.filter((o) => o.paymentStatus !== "PAID").length,
      revenue: orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.totalAmount, 0),
      overdue: orders.filter(
        (o) =>
          o.dueDate &&
          new Date(o.dueDate).getTime() < Date.now() &&
          o.status !== "COMPLETED" &&
          o.status !== "CANCELLED"
      ).length,
    }),
    [orders]
  );

  function openNewOrder() {
    setCart([]);
    setCustomerId("none");
    setOrderType("WALK_IN");
    setDueDate("");
    setNotes("");
    setPaidAmount("0");
    setFormError("");
    setOrderDialogOpen(true);
  }

  function addToCart(productId: string) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) {
        return current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...current, { productId, quantity: 1 }];
    });
  }

  function updateQty(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) =>
        current.filter((line) => line.productId !== productId)
      );
      return;
    }
    setCart((current) =>
      current.map((line) =>
        line.productId === productId ? { ...line, quantity } : line
      )
    );
  }

  const total = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const product = products.find((p) => p.id === line.productId);
        return sum + (product?.price ?? 0) * line.quantity;
      }, 0),
    [cart, products]
  );

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!cart.length) return;
    setSaving(true);
    setFormError("");
    try {
      await api.post("/orders", {
        customerId: customerId === "none" ? null : customerId,
        orderType,
        dueDate: dueDate || null,
        notes,
        paidAmount: Number(paidAmount) || 0,
        items: cart,
      });
      setOrderDialogOpen(false);
      toast.success("Order placed", {
        description: `${cart.reduce((sum, line) => sum + line.quantity, 0)} items added to the queue.`,
      });
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(order: Order, status: OrderStatus) {
    try {
      await api.put(`/orders/${order.id}/status`, { status });
      toast.success(
        status === "CANCELLED"
          ? `Order ${order.orderNumber} cancelled`
          : `Order marked ${titleCase(status).toLowerCase()}`
      );
      setCancelTarget(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function openPayment(order: Order) {
    setPaymentTarget(order);
    setPaymentInput(String(order.paidAmount));
  }

  async function savePayment(event: FormEvent) {
    event.preventDefault();
    if (!paymentTarget) return;
    setSaving(true);
    try {
      await api.put(`/orders/${paymentTarget.id}/payment`, {
        paidAmount: Number(paymentInput) || 0,
      });
      toast.success("Payment saved");
      setPaymentTarget(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      {
        accessorKey: "orderNumber",
        header: ({ column }) => <SortableHeader column={column} title="Order" />,
        cell: ({ row }) => (
          <div className="font-medium">
            <Link
              href={`/orders/${row.original.id}`}
              className="text-primary hover:underline"
            >
              {row.original.orderNumber}
            </Link>
            <p className="text-xs font-normal text-muted-foreground">
              {titleCase(row.original.orderType)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: "Customer",
        cell: ({ row }) =>
          row.original.customer ? (
            <Link
              href={`/customers/${row.original.customer.id}`}
              className="hover:underline"
            >
              {row.original.customer.name}
            </Link>
          ) : (
            "Walk-in"
          ),
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => <SortableHeader column={column} title="Total" />,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {money(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => openPayment(row.original)}
            className="rounded-md"
            aria-label={`Edit payment for ${row.original.orderNumber}`}
          >
            <StatusBadge status={row.original.paymentStatus} />
          </button>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title="Placed" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const order = row.original;
          const next = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
          return (
            <div className="flex justify-end">
              {next ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void setStatus(order, next)}
                >
                  Mark {titleCase(next).toLowerCase()}
                </Button>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Order actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/orders/${order.id}`}>
                      <IconEye className="size-4" /> View order
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openPayment(order)}>
                    <IconCash className="size-4" /> Edit payment
                  </DropdownMenuItem>
                  {order.status !== "COMPLETED" &&
                  order.status !== "CANCELLED" ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setCancelTarget(order)}
                      >
                        <IconX className="size-4" /> Cancel order
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders & POS"
        description="Take new orders and follow them through to handoff."
      >
        <Button onClick={openNewOrder}>
          <IconPlus className="size-4" /> New order
        </Button>
      </PageHeader>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load orders</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            {loadError}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active orders"
          value={String(stats.active)}
          hint="In the production queue"
          icon={IconShoppingCart}
        />
        <StatCard
          label="Awaiting payment"
          value={String(stats.awaitingPayment)}
          hint="Unpaid or partially paid"
          icon={IconCash}
        />
        <StatCard
          label="Order value"
          value={money(stats.revenue)}
          hint="Excludes cancelled orders"
        />
        <StatCard
          label="Past due"
          value={String(stats.overdue)}
          hint={stats.overdue ? "Need attention" : "Nothing overdue"}
          icon={stats.overdue ? IconAlertTriangle : IconClock}
        />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {[
            ["all", "All"],
            ["PENDING", "Pending"],
            ["IN_PROGRESS", "In progress"],
            ["READY", "Ready"],
            ["COMPLETED", "Completed"],
            ["CANCELLED", "Cancelled"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="px-3">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 max-w-xs" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          searchKey="orderNumber"
          searchPlaceholder="Search order number…"
        />
      )}

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>New order</DialogTitle>
            <DialogDescription>
              Pick products, then set the customer and payment details. Recipe
              stock is deducted automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitOrder} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Products</Label>
              <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-2">
                {products.length ? (
                  products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product.id)}
                      className="rounded-lg border p-2.5 text-left transition hover:border-primary/50 hover:bg-accent"
                    >
                      <span className="block truncate text-sm font-medium">
                        {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {money(product.price)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="col-span-2 py-6 text-center text-sm text-muted-foreground">
                    No active products. Add products first.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cart</Label>
                {cart.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                    Click a product to add it to the order.
                  </p>
                ) : (
                  <ul className="max-h-40 space-y-2 overflow-y-auto">
                    {cart.map((line) => {
                      const product = products.find(
                        (p) => p.id === line.productId
                      );
                      return (
                        <li
                          key={line.productId}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {product?.name ?? "Product"}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 w-16"
                            value={line.quantity}
                            aria-label={`Quantity of ${product?.name ?? "product"}`}
                            onChange={(e) =>
                              updateQty(line.productId, Number(e.target.value))
                            }
                          />
                          <span className="w-20 text-right tabular-nums">
                            {money((product?.price ?? 0) * line.quantity)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Remove ${product?.name ?? "product"}`}
                            onClick={() => updateQty(line.productId, 0)}
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{money(total)}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Walk-in</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order type</Label>
                  <Select
                    value={orderType}
                    onValueChange={(value) => setOrderType(value as OrderType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WALK_IN">Walk-in</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="CATERING">Catering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="order-due">Due date</Label>
                  <Input
                    id="order-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-paid">Amount paid now</Label>
                  <Input
                    id="order-paid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-notes">Notes</Label>
                <Textarea
                  id="order-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, allergies, pickup time…"
                />
              </div>

              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || cart.length === 0}>
                  {saving ? "Placing…" : "Place order"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentTarget !== null} onOpenChange={(open) => !open && setPaymentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment · {paymentTarget?.orderNumber}</DialogTitle>
            <DialogDescription>
              Total due: {money(paymentTarget?.totalAmount ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={savePayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount paid</Label>
              <Input
                id="payment-amount"
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
                onClick={() => setPaymentTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title={`Cancel order ${cancelTarget?.orderNumber ?? ""}?`}
        description="Cancelling returns any deducted ingredients to stock. This cannot be undone."
        confirmLabel="Cancel order"
        onConfirm={() =>
          cancelTarget ? setStatus(cancelTarget, "CANCELLED") : Promise.resolve()
        }
      />
    </div>
  );
}
