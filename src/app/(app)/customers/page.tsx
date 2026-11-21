'use client';

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api-client";
import type { Customer } from "@/lib/types";
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
  TableShell,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast-provider";

const emptyForm = { name: "", email: "", phone: "", address: "", notes: "" };

export function Customers() {
  const { notify } = useToast();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load(q = "") {
    try {
      const res = await api.get<Customer[]>("/customers", { params: q ? { search: q } : undefined });
      setCustomers(res.data);
      setLoadError("");
    } catch (err) {
      setLoadError(apiErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => void load(search), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
      } else {
        await api.post("/customers", form);
      }
      setModalOpen(false);
      await load(search);
      notify(editing ? "Customer updated" : "Customer added");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const customer = deleteTarget;
    if (!customer) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${customer.id}`);
      setDeleteTarget(null);
      await load(search);
      notify("Customer deleted");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!customers) {
    return loadError ? (
      <ErrorState message={loadError} onRetry={() => void load(search)} />
    ) : (
      <LoadingState label="Loading customers…" />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Your regulars and their order history."
        actions={
          <Button onClick={openCreate} leftIcon="plus">
            New Customer
          </Button>
        }
      />

      <Input
        id="customer-search"
        aria-label="Search customers"
        placeholder="Search by name, email, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {customers.length === 0 ? (
        <Card>
          <EmptyState title="No customers found" subtitle="Try another search or add a new customer." icon="customers" />
        </Card>
      ) : (
        <TableShell label="Customers">
          <table className="min-w-[640px] w-full text-left text-sm">
            <caption className="sr-only">Customers with contact details and order counts</caption>
            <thead className="border-b border-crust-800/10 text-xs uppercase tracking-wide text-crust-800/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crust-800/5">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 font-medium text-crust-800">{c.name}</td>
                  <td className="px-4 py-3 text-crust-800/70">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-crust-800/70">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-crust-800/70">{c._count?.orders ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" leftIcon="edit" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(c)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Customer" : "New Customer"}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer-name">Name</Label>
            <Input id="customer-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="customer-address">Address</Label>
            <Input
              id="customer-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="customer-notes">Notes</Label>
            <Textarea
              id="customer-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              Save Customer
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete customer"
        message={`Remove "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Customers;
