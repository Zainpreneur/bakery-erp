'use client';

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api-client";
import type { Supplier } from "@/lib/types";
import {
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
} from "@/components/ui";
import { useToast } from "@/components/toast-provider";

const emptyForm = { name: "", contactName: "", email: "", phone: "", address: "" };

export function Suppliers() {
  const { notify } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await api.get<Supplier[]>("/suppliers");
      setSuppliers(res.data);
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

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contactName: s.contactName ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      address: s.address ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form);
      } else {
        await api.post("/suppliers", form);
      }
      setModalOpen(false);
      await load();
      notify(editing ? "Supplier updated" : "Supplier created");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const supplier = deleteTarget;
    if (!supplier) return;
    setDeleting(true);
    try {
      await api.delete(`/suppliers/${supplier.id}`);
      setDeleteTarget(null);
      await load();
      notify("Supplier deleted");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!suppliers) {
    return loadError ? (
      <ErrorState message={loadError} onRetry={() => void load()} />
    ) : (
      <LoadingState label="Loading suppliers…" />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Suppliers"
        description="Who you buy ingredients from."
        actions={
          <Button onClick={openCreate} leftIcon="plus">
            New Supplier
          </Button>
        }
      />

      {suppliers.length === 0 ? (
        <Card>
          <EmptyState title="No suppliers yet" subtitle="Add a supplier to track where your ingredients come from." icon="suppliers" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="p-5">
              <h3 className="font-display text-lg font-semibold text-crust-800">{s.name}</h3>
              {s.contactName && <p className="text-sm text-crust-800/70">{s.contactName}</p>}
              <p className="mt-2 text-sm text-crust-800/60">{s.email}</p>
              <p className="text-sm text-crust-800/60">{s.phone}</p>
              <p className="text-sm text-crust-800/60">{s.address}</p>
              <p className="mt-2 text-xs text-crust-800/40">{s._count?.ingredients ?? 0} ingredients supplied</p>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1" leftIcon="edit" onClick={() => openEdit(s)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setDeleteTarget(s)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Supplier" : "New Supplier"}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="supplier-name">Name</Label>
            <Input id="supplier-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="supplier-contact-name">Contact Name</Label>
            <Input
              id="supplier-contact-name"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input
                id="supplier-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="supplier-address">Address</Label>
            <Input
              id="supplier-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
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
              Save Supplier
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete supplier"
        message={`Remove "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Suppliers;
