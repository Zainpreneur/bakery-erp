"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconBox,
} from "@tabler/icons-react";

import { api, apiErrorMessage } from "@/lib/api-client";
import type { Ingredient, Product } from "@/lib/types";
import { money } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataTable, SortableHeader } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUploader } from "@/components/ui/file-uploader";

type ProductForm = {
  name: string;
  description: string;
  category: string;
  price: string;
  isActive: boolean;
  imageUrl: string | null;
  recipeItems: { ingredientId: string; quantity: string }[];
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  category: "General",
  price: "0",
  isActive: true,
  imageUrl: null,
  recipeItems: [],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productRes, ingredientRes] = await Promise.all([
        api.get<Product[]>("/products"),
        api.get<Ingredient[]>("/ingredients"),
      ]);
      setProducts(productRes.data);
      setIngredients(ingredientRes.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.isActive).length,
      withRecipe: products.filter((p) => p.recipeItems.length > 0).length,
      avgPrice: products.length
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length
        : 0,
    }),
    [products]
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      category: product.category,
      price: String(product.price),
      isActive: product.isActive,
      imageUrl: product.imageUrl ?? null,
      recipeItems: product.recipeItems.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: String(item.quantity),
      })),
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
      description: form.description.trim() || undefined,
      category: form.category.trim() || "General",
      price: Number(form.price),
      isActive: form.isActive,
      imageUrl: form.imageUrl,
      recipeItems: form.recipeItems
        .filter((item) => item.ingredientId && Number(item.quantity) > 0)
        .map((item) => ({
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
        })),
    };
    try {
      if (editing) await api.put(`/products/${editing.id}`, payload);
      else await api.post("/products", payload);
      toast.success(editing ? "Product updated" : "Product created");
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success("Product deleted");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  }

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Product" />,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-3">
              {product.imageUrl ? (
                <span className="relative size-9 shrink-0 overflow-hidden rounded-lg border">
                  <Image src={product.imageUrl} alt="" fill className="object-cover" unoptimized />
                </span>
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconBox className="size-4" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="max-w-56 truncate text-xs text-muted-foreground">
                  {product.description || "No description"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => <SortableHeader column={column} title="Category" />,
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.category}</Badge>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => <SortableHeader column={column} title="Price" />,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{money(row.original.price)}</span>
        ),
      },
      {
        id: "recipe",
        header: "Recipe",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.original.recipeItems.length} ingredients
          </span>
        ),
      },
      {
        id: "makeable",
        header: "Can make",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.maxMakeable ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Product actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openEdit(product)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(product)}
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
        title="Products"
        description="Your menu items and the recipes behind them."
      >
        <Button onClick={openCreate}>
          <IconPlus className="size-4" /> Add product
        </Button>
      </PageHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load products</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            {error}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total products" value={String(stats.total)} icon={IconBox} />
        <StatCard label="Active" value={String(stats.active)} />
        <StatCard label="With recipes" value={String(stats.withRecipe)} />
        <StatCard label="Average price" value={money(stats.avgPrice)} />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 max-w-xs" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          searchKey="name"
          searchPlaceholder="Search products…"
          facetedFilters={[
            {
              columnId: "category",
              title: "Category",
              options: Array.from(new Set(products.map((p) => p.category)))
                .sort()
                .map((value) => ({ label: value, value })),
            },
            {
              columnId: "isActive",
              title: "Status",
              options: [
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ],
            },
          ]}
          numberFilters={[
            {
              columnId: "price",
              label: "Price",
              min: 0,
              max: Math.max(10, Math.ceil(Math.max(...products.map((p) => p.price), 0) / 10) * 10),
              step: 1,
              format: money,
            },
          ]}
        />
      )}

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit product" : "Add product"}</SheetTitle>
            <SheetDescription>
              Set the price and choose which ingredients each item uses.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Butter Croissant"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Category</Label>
                <Input
                  id="product-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Pastries"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Flaky, buttery layers baked fresh each morning"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price (USD)</Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-end">
                <label className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                  <span className="text-sm font-medium">Available for sale</span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, isActive: checked })
                    }
                  />
                </label>
              </div>
            </div>

            <FileUploader
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Recipe ingredients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      recipeItems: [
                        ...form.recipeItems,
                        { ingredientId: "", quantity: "1" },
                      ],
                    })
                  }
                >
                  <IconPlus className="size-4" /> Add ingredient
                </Button>
              </div>
              {form.recipeItems.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  No ingredients yet. Add at least one to deduct stock automatically when this product is ordered.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.recipeItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={item.ingredientId}
                        onValueChange={(value) => {
                          const next = [...form.recipeItems];
                          next[index] = { ...item, ingredientId: value };
                          setForm({ ...form, recipeItems: next });
                        }}
                      >
                        <SelectTrigger className="min-w-0 flex-1">
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({ingredient.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        className="w-24"
                        value={item.quantity}
                        aria-label="Quantity"
                        onChange={(e) => {
                          const next = [...form.recipeItems];
                          next[index] = { ...item, quantity: e.target.value };
                          setForm({ ...form, recipeItems: next });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove ingredient"
                        onClick={() =>
                          setForm({
                            ...form,
                            recipeItems: form.recipeItems.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <SheetFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <LoadingButton type="submit" loading={saving} loadingLabel="Saving product">
                {editing ? "Save changes" : "Create product"}
              </LoadingButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "product"}?`}
        description="Products used in past orders are deactivated instead of removed so order history stays intact."
        onConfirm={handleDelete}
      />
    </div>
  );
}
