"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconAdjustments,
  IconPackage,
} from "@tabler/icons-react";

import { api, apiErrorMessage } from "@/lib/api-client";
import type { Ingredient, InventoryTxnType, Supplier } from "@/lib/types";
import { money } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataTable, SortableHeader } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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

type IngredientForm = {
  name: string;
  unit: string;
  costPerUnit: string;
  quantityInStock: string;
  reorderThreshold: string;
  supplierId: string;
};

type AdjustmentForm = {
  type: InventoryTxnType;
  quantity: string;
  note: string;
};

const emptyForm: IngredientForm = {
  name: "",
  unit: "g",
  costPerUnit: "0",
  quantityInStock: "0",
  reorderThreshold: "0",
  supplierId: "none",
};

const emptyAdjustment: AdjustmentForm = {
  type: "PURCHASE",
  quantity: "0",
  note: "",
};

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<IngredientForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Ingredient | null>(null);
  const [adjustment, setAdjustment] = useState<AdjustmentForm>(emptyAdjustment);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ingredientRes, supplierRes] = await Promise.all([
        api.get<Ingredient[]>("/ingredients"),
        api.get<Supplier[]>("/suppliers"),
      ]);
      setIngredients(ingredientRes.data);
      setSuppliers(supplierRes.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const low = ingredients.filter(
      (item) => item.quantityInStock <= item.reorderThreshold
    ).length;
    const value = ingredients.reduce(
      (sum, item) => sum + item.quantityInStock * item.costPerUnit,
      0
    );
    return {
      total: ingredients.length,
      low,
      value,
      suppliers: suppliers.length,
    };
  }, [ingredients, suppliers]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(ingredient: Ingredient) {
    setEditing(ingredient);
    setForm({
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: String(ingredient.costPerUnit),
      quantityInStock: String(ingredient.quantityInStock),
      reorderThreshold: String(ingredient.reorderThreshold),
      supplierId: ingredient.supplierId ?? "none",
    });
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      costPerUnit: Number(form.costPerUnit),
      quantityInStock: Number(form.quantityInStock),
      reorderThreshold: Number(form.reorderThreshold),
      supplierId: form.supplierId === "none" ? null : form.supplierId,
    };
    try {
      if (editing) await api.put(`/ingredients/${editing.id}`, payload);
      else await api.post("/ingredients", payload);
      toast.success(editing ? "Ingredient updated" : "Ingredient created");
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openAdjustment(ingredient: Ingredient) {
    setAdjustTarget(ingredient);
    setAdjustment(emptyAdjustment);
  }

  async function handleAdjustment(event: FormEvent) {
    event.preventDefault();
    if (!adjustTarget) return;
    setSaving(true);
    try {
      await api.post(`/ingredients/${adjustTarget.id}/transactions`, {
        type: adjustment.type,
        quantity: Number(adjustment.quantity),
        note: adjustment.note.trim() || undefined,
      });
      toast.success("Stock updated", {
        description: `${adjustTarget.name} ledger entry recorded.`,
      });
      setAdjustTarget(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/ingredients/${deleteTarget.id}`);
      toast.success("Ingredient deleted");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  }

  const columns: ColumnDef<Ingredient>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Ingredient" />,
        cell: ({ row }) => {
          const item = row.original;
          const isLow = item.quantityInStock <= item.reorderThreshold;
          return (
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconPackage className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isLow ? "Low stock" : "In stock"} · reorder at{" "}
                  {item.reorderThreshold} {item.unit}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "quantityInStock",
        header: ({ column }) => <SortableHeader column={column} title="On hand" />,
        cell: ({ row }) => {
          const item = row.original;
          const isLow = item.quantityInStock <= item.reorderThreshold;
          return (
            <span
              className={`flex items-center gap-1.5 font-medium tabular-nums ${
                isLow ? "text-amber-600 dark:text-amber-400" : ""
              }`}
            >
              {isLow ? <IconAlertTriangle className="size-3.5" /> : null}
              {item.quantityInStock} {item.unit}
            </span>
          );
        },
      },
      {
        accessorKey: "costPerUnit",
        header: ({ column }) => <SortableHeader column={column} title="Cost / unit" />,
        cell: ({ row }) => (
          <span className="tabular-nums">{money(row.original.costPerUnit)}</span>
        ),
      },
      {
        id: "value",
        header: "Stock value",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {money(row.original.quantityInStock * row.original.costPerUnit)}
          </span>
        ),
      },
      {
        id: "supplier",
        header: "Supplier",
        cell: ({ row }) =>
          row.original.supplier?.name ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Ingredient actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openAdjustment(item)}>
                    <IconAdjustments className="size-4" /> Adjust stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openEdit(item)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(item)}
                  >
                    <IconTrash className="size-4" /> Delete
                  </DropdownMenuItem>
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
        title="Ingredients"
        description="Track stock, costs and reorder points for your pantry."
      >
        <Button onClick={openCreate}>
          <IconPlus className="size-4" /> Add ingredient
        </Button>
      </PageHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load inventory</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            {error}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ingredients" value={String(stats.total)} icon={IconPackage} />
        <StatCard
          label="Low stock"
          value={String(stats.low)}
          hint={stats.low ? "Time to reorder" : "All good"}
        />
        <StatCard label="Stock value" value={money(stats.value)} />
        <StatCard label="Suppliers" value={String(stats.suppliers)} />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 max-w-xs" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={ingredients}
          searchKey="name"
          searchPlaceholder="Search ingredients…"
          toolbar={
            stats.low > 0 ? (
              <Badge variant="secondary" className="gap-1 text-amber-600 dark:text-amber-400">
                <IconAlertTriangle className="size-3.5" /> {stats.low} low
              </Badge>
            ) : null
          }
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit ingredient" : "Add ingredient"}</DialogTitle>
            <DialogDescription>
              Quantities are stored in the unit you choose here.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ingredient-name">Name</Label>
                <Input
                  id="ingredient-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="All-purpose flour"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ingredient-unit">Unit</Label>
                <Input
                  id="ingredient-unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="g, kg, ml, unit…"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ingredient-cost">Cost per unit</Label>
                <Input
                  id="ingredient-cost"
                  type="number"
                  min="0"
                  step="any"
                  value={form.costPerUnit}
                  onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ingredient-stock">Quantity in stock</Label>
                <Input
                  id="ingredient-stock"
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantityInStock}
                  onChange={(e) =>
                    setForm({ ...form, quantityInStock: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ingredient-threshold">Reorder threshold</Label>
                <Input
                  id="ingredient-threshold"
                  type="number"
                  min="0"
                  step="any"
                  value={form.reorderThreshold}
                  onChange={(e) =>
                    setForm({ ...form, reorderThreshold: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(value) => setForm({ ...form, supplierId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No supplier</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create ingredient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustTarget !== null} onOpenChange={(open) => !open && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust {adjustTarget?.name} stock</DialogTitle>
            <DialogDescription>
              Every change is recorded in the ingredient&apos;s movement ledger.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustment} className="space-y-4">
            <div className="space-y-2">
              <Label>Movement type</Label>
              <Select
                value={adjustment.type}
                onValueChange={(value) =>
                  setAdjustment({ ...adjustment, type: value as InventoryTxnType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PURCHASE">Purchase (stock in)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment (±)</SelectItem>
                  <SelectItem value="USAGE">Usage (stock out)</SelectItem>
                  <SelectItem value="WASTE">Waste (stock out)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-quantity">
                Quantity ({adjustTarget?.unit ?? "unit"})
              </Label>
              <Input
                id="adjust-quantity"
                type="number"
                step="any"
                value={adjustment.quantity}
                onChange={(e) =>
                  setAdjustment({ ...adjustment, quantity: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-note">Note</Label>
              <Textarea
                id="adjust-note"
                rows={2}
                value={adjustment.note}
                onChange={(e) =>
                  setAdjustment({ ...adjustment, note: e.target.value })
                }
                placeholder="Delivery from Golden Grain"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Record movement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "ingredient"}?`}
        description="Ingredients used in recipes cannot be deleted. Remove them from recipes first."
        onConfirm={handleDelete}
      />
    </div>
  );
}
