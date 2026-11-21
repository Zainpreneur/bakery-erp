'use client';

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api-client";
import type { Ingredient, Product, RecipeItem } from "@/lib/types";
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
  Textarea,
  money,
} from "@/components/ui";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";

const emptyForm = {
  name: "",
  description: "",
  category: "General",
  price: 0,
  isActive: true,
  recipeItems: [] as RecipeItem[],
};

export function Products() {
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const [p, i] = await Promise.all([api.get<Product[]>("/products"), api.get<Ingredient[]>("/ingredients")]);
      setProducts(p.data);
      setIngredients(i.data);
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

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      category: product.category,
      price: product.price,
      isActive: product.isActive,
      recipeItems: product.recipeItems.map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity })),
    });
    setError("");
    setModalOpen(true);
  }

  function updateRecipeRow(index: number, patch: Partial<RecipeItem>) {
    setForm((f) => ({
      ...f,
      recipeItems: f.recipeItems.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  }

  function addRecipeRow() {
    if (ingredients.length === 0) return;
    setForm((f) => ({
      ...f,
      recipeItems: [...f.recipeItems, { ingredientId: ingredients[0].id, quantity: 1 }],
    }));
  }

  function removeRecipeRow(index: number) {
    setForm((f) => ({ ...f, recipeItems: f.recipeItems.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post("/products", form);
      }
      setModalOpen(false);
      await load();
      notify(editing ? "Product updated" : "Product created");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const product = deleteTarget;
    if (!product) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${product.id}`);
      setDeleteTarget(null);
      await load();
      notify("Product deleted");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!products) {
    return loadError ? (
      <ErrorState message={loadError} onRetry={() => void load()} />
    ) : (
      <LoadingState label="Loading products…" />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products & Recipes"
        description="Manage your menu and the ingredients each item uses."
        actions={
          <Button onClick={openCreate} leftIcon="plus">
            New Product
          </Button>
        }
      />

      {products.length === 0 ? (
        <Card>
          <EmptyState title="No products yet" subtitle="Add your first bakery item to get started." icon="products" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-display text-lg font-semibold text-crust-800">{p.name}</h3>
                {!p.isActive && <Badge value="default" label="Inactive" />}
              </div>
              <p className="text-xs uppercase tracking-wide text-crust-800/50">{p.category}</p>
              {p.description && <p className="mt-2 text-sm text-crust-800/70">{p.description}</p>}
              <p className="mt-3 font-display text-xl font-semibold text-amber-700">{money(p.price)}</p>
              <div className="mt-2 flex-1 text-xs text-crust-800/60">
                {p.recipeItems.length > 0 ? (
                  <ul className="space-y-0.5">
                    {p.recipeItems.map((r) => (
                      <li key={r.ingredientId}>
                        {r.ingredient?.name}: {r.quantity} {r.ingredient?.unit}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic">No recipe defined</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1" leftIcon="edit" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setDeleteTarget(p)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Product" : "New Product"} width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="product-category">Category</Label>
              <Input
                id="product-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="product-price">Price ($)</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="product-is-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <label htmlFor="product-is-active" className="text-sm text-crust-800">
                Active (visible for sale)
              </label>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Recipe (ingredients used per unit)</Label>
              <Button type="button" variant="ghost" size="sm" leftIcon="plus" onClick={addRecipeRow}>
                Add ingredient
              </Button>
            </div>
            <div className="space-y-2">
              {form.recipeItems.map((row, i) => {
                const ing = ingredients.find((x) => x.id === row.ingredientId);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      id={`recipe-ingredient-${i}`}
                      aria-label={`Ingredient for recipe row ${i + 1}`}
                      className="flex-1"
                      value={row.ingredientId}
                      onChange={(e) => updateRecipeRow(i, { ingredientId: e.target.value })}
                    >
                      {ingredients.map((ing2) => (
                        <option key={ing2.id} value={ing2.id}>
                          {ing2.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      id={`recipe-quantity-${i}`}
                      aria-label={`Quantity for recipe row ${i + 1}`}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-28"
                      value={row.quantity}
                      onChange={(e) => updateRecipeRow(i, { quantity: Number(e.target.value) })}
                    />
                    <span className="w-10 text-xs text-crust-800/50">{ing?.unit}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-crust-800/40 hover:text-red-600"
                      aria-label={`Remove recipe row ${i + 1}`}
                      onClick={() => removeRecipeRow(i)}
                    >
                      <Icon name="close" size={16} />
                    </Button>
                  </div>
                );
              })}
              {form.recipeItems.length === 0 && (
                <p className="text-xs italic text-crust-800/40">No ingredients added yet.</p>
              )}
            </div>
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
              Save Product
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product"
        message={`Remove "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Products;
