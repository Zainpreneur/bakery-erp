"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconCalendar,
  IconCash,
  IconDotsVertical,
  IconMail,
  IconMapPin,
  IconPencil,
  IconPhone,
  IconReceipt,
  IconShoppingCart,
  IconTrash,
  IconTrendingUp,
} from "@tabler/icons-react";

import { api, apiErrorMessage, ApiError } from "@/lib/api-client";
import type { Customer, Order } from "@/lib/types";
import { formatDate, initials, money } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { ErrorView } from "@/components/error-view";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const emptyForm = { name: "", email: "", phone: "", address: "", notes: "" };

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [c, o] = await Promise.all([
        api.get<Customer>(`/customers/${id}`),
        api.get<Order[]>("/orders", { params: { customerId: id } }),
      ]);
      setCustomer(c.data);
      setOrders(o.data);
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

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "CANCELLED");
    const lifetime = valid.reduce((sum, o) => sum + o.totalAmount, 0);
    const outstanding = valid.reduce(
      (sum, o) => sum + Math.max(0, o.totalAmount - o.paidAmount),
      0
    );
    return {
      lifetime,
      outstanding,
      count: valid.length,
      average: valid.length ? lifetime / valid.length : 0,
    };
  }, [orders]);

  const favorites = useMemo(() => {
    const tally = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of orders) {
      if (order.status === "CANCELLED") continue;
      for (const item of order.items) {
        const name = item.product?.name ?? "Product";
        const entry = tally.get(item.productId) ?? { name, qty: 0, revenue: 0 };
        entry.qty += item.quantity;
        entry.revenue += item.subtotal;
        tally.set(item.productId, entry);
      }
    }
    return [...tally.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [orders]);

  function openEdit() {
    if (!customer) return;
    setForm({
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
    });
    setFormError("");
    setEditOpen(true);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!customer) return;
    setSaving(true);
    setFormError("");
    try {
      await api.put(`/customers/${customer.id}`, {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success("Customer updated");
      setEditOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!customer) return;
    try {
      await api.delete(`/customers/${customer.id}`);
      toast.success("Customer deleted");
      router.push("/customers");
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-20 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (notFound) {
    return (
      <ErrorView
        title="Customer not found"
        message="This customer may have been removed, or the link is out of date."
      />
    );
  }

  if (loadError || !customer) {
    return (
      <ErrorView
        title="Could not load customer"
        message={loadError || "Unknown error"}
        onRetry={() => void load()}
      />
    );
  }

  const maxFavoriteQty = favorites[0]?.qty ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/customers" aria-label="Back to customers">
              <IconArrowLeft className="size-4" />
            </Link>
          </Button>
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-primary text-base">
              {initials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openEdit}>
            <IconPencil className="size-4" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <IconDotsVertical className="size-4" />
                <span className="sr-only">Customer actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={openEdit}>
                <IconPencil className="size-4" /> Edit details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <IconTrash className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lifetime spend"
          value={money(stats.lifetime)}
          hint="Excludes cancelled orders"
          icon={IconCash}
        />
        <StatCard
          label="Orders"
          value={String(stats.count)}
          hint="Excludes cancelled orders"
          icon={IconShoppingCart}
        />
        <StatCard
          label="Average order"
          value={money(stats.average)}
          icon={IconTrendingUp}
        />
        <StatCard
          label="Outstanding"
          value={money(stats.outstanding)}
          hint={stats.outstanding ? "Balance still due" : "All settled"}
          icon={IconReceipt}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Order history</TabsTrigger>
          <TabsTrigger value="favorites">Favourites</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Order history</CardTitle>
              <CardDescription>
                Every order placed by {customer.name}, newest first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">
                  No orders yet. Take an order for this customer from the POS.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Order</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {money(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Favourite products</CardTitle>
              <CardDescription>
                What {customer.name} orders most, by quantity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">
                  Nothing to show yet — favourites appear once orders are placed.
                </p>
              ) : (
                <ul className="space-y-4">
                  {favorites.map((fav) => (
                    <li key={fav.name} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="font-medium">{fav.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {fav.qty} ordered · {money(fav.revenue)}
                        </span>
                      </div>
                      <Progress
                        value={Math.round((fav.qty / maxFavoriteQty) * 100)}
                        aria-label={`${fav.name} share of orders`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <IconMail className="size-4 shrink-0 text-muted-foreground" />
                {customer.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-primary hover:underline"
                  >
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">No email on file</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <IconPhone className="size-4 shrink-0 text-muted-foreground" />
                {customer.phone ? (
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-primary hover:underline"
                  >
                    {customer.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">No phone on file</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <IconMapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className={customer.address ? "" : "text-muted-foreground"}>
                  {customer.address ?? "No address on file"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <IconCalendar className="size-4 shrink-0 text-muted-foreground" />
                <span>Customer since {formatDate(customer.createdAt)}</span>
              </div>
              {customer.notes ? (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {customer.notes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>
              Contact details make it easier to take phone and catering orders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="detail-customer-name">Name</Label>
              <Input
                id="detail-customer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="detail-customer-email">Email</Label>
                <Input
                  id="detail-customer-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-customer-phone">Phone</Label>
                <Input
                  id="detail-customer-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-customer-address">Address</Label>
              <Input
                id="detail-customer-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-customer-notes">Notes</Label>
              <Textarea
                id="detail-customer-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Allergies, favourite items, standing instructions…"
              />
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !form.name.trim()}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${customer.name}?`}
        description="Customers with order history cannot be deleted. Their details will remain attached to past orders."
        onConfirm={handleDelete}
      />
    </div>
  );
}