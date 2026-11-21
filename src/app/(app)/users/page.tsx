'use client';

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api-client";
import type { AuthUser, Role } from "@/lib/types";
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
} from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";

const emptyForm = { name: "", email: "", password: "", role: "STAFF" as Role };

export function Users() {
  const { user: me } = useAuth();
  const { notify } = useToast();
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await api.get<AuthUser[]>("/users");
      setUsers(res.data);
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
      await api.post("/users", form);
      setModalOpen(false);
      await load();
      notify("Team member added");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: AuthUser) {
    try {
      await api.put(`/users/${u.id}`, { active: !u.active });
      await load();
      notify(u.active ? "Team member disabled" : "Team member enabled");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    }
  }

  async function changeRole(u: AuthUser, role: Role) {
    try {
      await api.put(`/users/${u.id}`, { role });
      await load();
      notify("Role updated");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    }
  }

  async function confirmDelete() {
    const user = deleteTarget;
    if (!user) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${user.id}`);
      setDeleteTarget(null);
      await load();
      notify("Team member removed");
    } catch (err) {
      notify(apiErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!users) {
    return loadError ? (
      <ErrorState message={loadError} onRetry={() => void load()} />
    ) : (
      <LoadingState label="Loading team members…" />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description="Manage staff accounts and permissions."
        actions={
          <Button onClick={openCreate} leftIcon="plus">
            New Team Member
          </Button>
        }
      />

      {users.length === 0 ? (
        <Card>
          <EmptyState title="No team members" subtitle="Invite your staff to get started." icon="users" />
        </Card>
      ) : (
        <TableShell label="Team members">
          <table className="min-w-[640px] w-full text-left text-sm">
            <caption className="sr-only">Team members with roles, account status, and actions</caption>
            <thead className="border-b border-crust-800/10 text-xs uppercase tracking-wide text-crust-800/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crust-800/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 font-medium text-crust-800">{u.name}</td>
                  <td className="px-4 py-3 text-crust-800/70">{u.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      id={`user-role-${u.id}`}
                      aria-label={`Role for ${u.name}`}
                      className="!w-32"
                      value={u.role}
                      disabled={u.id === me?.id}
                      onChange={(e) => void changeRole(u, e.target.value as Role)}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="STAFF">Staff</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={u.active ? "COMPLETED" : "CANCELLED"} label={u.active ? "Active" : "Disabled"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => void toggleActive(u)}>
                        {u.active ? "Disable" : "Enable"}
                      </Button>
                      {u.id !== me?.id && (
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(u)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Team Member">
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select
                id="user-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
              </Select>
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
            <Button
              loading={saving}
              onClick={() => void handleSave()}
              disabled={!form.name || !form.email || form.password.length < 6}
            >
              Create Account
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove team member"
        message={`Remove team member "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Users;
