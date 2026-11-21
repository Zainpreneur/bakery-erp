'use client';

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api-client";
import type { Ingredient, InventoryTxnType, Supplier } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Label,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  TableShell,
  money,
} from "@/components/ui";
import { useToast } from "@/components/toast-provider";

const emptyForm = {
  name: "",
  unit: "g",
  costPerUnit: 0,
  quantityInStock: 0,
  reorderThreshold: 0,
  supplierId: "" as string | null,
};

export function Ingredients() {
  const { notify } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [stockTarget, setStockTarget] = useState<Ingredient | null>(null);
  const [stockForm, setStockForm] = useState<{ type: InventoryTxnType; quantity: number; note: string }>({
    type: "PURCHASE",
    quantity: 0,
    note: "",
  });

  async function load() {
    try {
      const [i, s] = await Promise.all([api.get<Ingredient[]>("/ingredients"), api.get<Supplier[]>("/suppliers")]);
      setIngredients(i.data);
      setSuppliers(s.data);
      setLoadError("");
    } catch (err) {
      setLoadError(apiErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(ing: Ingredient) {
    setEditing(ing);
    setForm({
      name: ing.name,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      quantityInStock: ing.quantityInStock,
      reorderThreshold: ing.reorderThreshold,
      supplierId: ing.supplierId ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, supplierId: form.supplierId || null };
      if (editing) {
        await api.put(`/ingredients/${editing.id}`, payload);
      } else {
        await api.post("/ingredients", payload);
      }
      setModalOpen(false);
      await load();
      notify(editing ? "Ingredient updated" : "Ingredient created");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const ing = deleteTarget;
    if (!ing) return;
    setDeleting(true);
    try {
      await api.delete(`/ingredients/${ing.id}`);
      setDeleteTarget(null);
      await load();
      notify("Ingredient deleted");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  function openStock(ing: Ingredient) {
    setStockTarget(ing);
    setStockForm({ type: "PURCHASE", quantity: 0, note: "" });
    setError("");
  }

  async function handleStockSave() {
    if (!stockTarget) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/ingredients/${stockTarget.id}/transactions`, stockForm);
      setStockTarget(null);
      await load();
      notify("Stock adjusted");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!ingredients) {
    return loadError ? (
      <ErrorState message={loadError} onRetry={() => void load()} />
    ) : (
      <LoadingState label="Loading ingredients…" />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory & Ingredients"
        description="Track stock levels, costs, and reorder points."
        actions={
          <Button onClick={openCreate} leftIcon="plus">
            New Ingredient
          </Button>
        }
      />

      {ingredients.length === 0 ? (
        <Card>
          <EmptyState title="No ingredients yet" subtitle="Add ingredients to build product recipes." icon="ingredients" />
        </Card>
      ) : (
        <TableShell label="Ingredients and stock levels">
          <table className="min-w-[640px] w-full text-left text-sm">
            <caption className="sr-only">Ingredients with stock levels, costs, suppliers, and reorder points</caption>
            <thead className="border-b border-crust-800/10 text-xs uppercase tracking-wide text-crust-800/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Reorder At</th>
                <th className="px-4 py-3">Cost / Unit</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crust-800/5">
              {ingredients.map((ing) => {
                const low = ing.quantityInStock <= ing.reorderThreshold;
                return (
                  <tr key={ing.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 font-medium text-crust-800">{ing.name}</td>
                    <td className="px-4 py-3">
                      {ing.quantityInStock} {ing.unit}
                    </td>
                    <td className="px-4 py-3 text-crust-800/60">
                      {ing.reorderThreshold} {ing.unit}
                    </td>
                    <td className="px-4 py-3">{money(ing.costPerUnit)}</td>
                    <td className="px-4 py-3 text-crust-800/60">{ing.supplier?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {low ? <Badge value="CANCELLED" label="Low stock" /> : <Badge value="COMPLETED" label="OK" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openStock(ing)}>
                          Adjust Stock
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon="edit" onClick={() => openEdit(ing)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(ing)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Ingredient" : "New Ingredient"}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="ingredient-name">Name</Label>
            <Input
              id="ingredient-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ingredient-unit">Unit</Label>
              <Input
                id="ingredient-unit"
                placeholder="g, kg, ml, l, unit…"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ingredient-cost">Cost / Unit ($)</Label>
              <Input
                id="ingredient-cost"
                type="number"
                step="0.0001"
                min="0"
                value={form.costPerUnit}
                onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ingredient-stock" hint={editing ? "Use “Adjust Stock” to change this." : undefined}>
                Current Stock
              </Label>
              <Input
                id="ingredient-stock"
                type="number"
                step="0.01"
                min="0"
                value={form.quantityInStock}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, quantityInStock: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="ingredient-reorder-threshold">Reorder Threshold</Label>
              <Input
                id="ingredient-reorder-threshold"
                type="number"
                step="0.01"
                min="0"
                value={form.reorderThreshold}
                onChange={(e) => setForm({ ...form, reorderThreshold: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ingredient-supplier">Supplier</Label>
            <Select
              id="ingredient-supplier"
              value={form.supplierId ?? ""}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void handleSave()} disabled={!form.name}>
              Save Ingredient
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!stockTarget} onClose={() => setStockTarget(null)} title={`Adjust Stock — ${stockTarget?.name ?? ""}`}>
        <div className="space-y-4">
          <p className="text-sm text-crust-800/60">
            Current stock: <strong>{stockTarget?.quantityInStock}</strong> {stockTarget?.unit}
          </p>
          <div>
            <Label htmlFor="stock-type">Type</Label>
            <Select
              id="stock-type"
              value={stockForm.type}
              onChange={(e) => setStockForm({ ...stockForm, type: e.target.value as InventoryTxnType })}
            >
              <option value="PURCHASE">Purchase (stock in)</option>
              <option value="ADJUSTMENT">Adjustment (+/-)</option>
              <option value="USAGE">Usage (stock out)</option>
              <option value="WASTE">Waste / spoilage (stock out)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="stock-quantity">
              Quantity {stockForm.type === "ADJUSTMENT" ? "(use negative to subtract)" : ""} ({stockTarget?.unit})
            </Label>
            <Input
              id="stock-quantity"
              type="number"
              step="0.01"
              value={stockForm.quantity}
              onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="stock-note">Note</Label>
            <Input
              id="stock-note"
              value={stockForm.note}
              onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setStockTarget(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void handleStockSave()}>
              Record
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete ingredient"
        message={`Remove "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Ingredients;
