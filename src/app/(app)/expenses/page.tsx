'use client';

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api-client";
import type { Expense } from "@/lib/types";
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
  money,
} from "@/components/ui";
import { useToast } from "@/components/toast-provider";

const emptyForm = { category: "Utilities", description: "", amount: 0, date: new Date().toISOString().slice(0, 10) };

export function Expenses() {
  const { notify } = useToast();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await api.get<Expense[]>("/expenses");
      setExpenses(res.data);
      setLoadError("");
    } catch (err) {
      setLoadError(apiErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await api.post("/expenses", form);
      setModalOpen(false);
      await load();
      notify("Expense added");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const expense = deleteTarget;
    if (!expense) return;
    setDeleting(true);
    try {
      await api.delete(`/expenses/${expense.id}`);
      setDeleteTarget(null);
      await load();
      notify("Expense deleted");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!expenses) {
    return loadError ? (
      <ErrorState message={loadError} onRetry={() => void load()} />
    ) : (
      <LoadingState label="Loading expenses…" />
    );
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        description="Rent, utilities, equipment, and other overhead."
        actions={
          <Button onClick={openCreate} leftIcon="plus">
            New Expense
          </Button>
        }
      />

      {expenses.length === 0 ? (
        <Card>
          <EmptyState title="No expenses recorded" subtitle="Record your first business expense to start tracking overhead." icon="expenses" />
        </Card>
      ) : (
        <TableShell label="Expenses">
          <table className="min-w-[640px] w-full text-left text-sm">
            <caption className="sr-only">Recorded expenses with dates, categories, and amounts</caption>
            <thead className="border-b border-crust-800/10 text-xs uppercase tracking-wide text-crust-800/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crust-800/5">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 text-crust-800/60">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-crust-800">{e.category}</td>
                  <td className="px-4 py-3 text-crust-800/60">{e.description}</td>
                  <td className="px-4 py-3">{money(e.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(e)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-crust-800/10 font-semibold text-crust-800">
                <td className="px-4 py-3" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-3">{money(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </TableShell>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Expense">
        <div className="space-y-4">
          <div>
            <Label htmlFor="expense-category">Category</Label>
            <Input
              id="expense-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="expense-description">Description</Label>
            <Input
              id="expense-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="expense-amount">Amount ($)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
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
            <Button loading={saving} onClick={() => void handleSave()} disabled={!form.category || form.amount <= 0}>
              Save Expense
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete expense"
        message="Delete this expense? This cannot be undone."
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Expenses;
