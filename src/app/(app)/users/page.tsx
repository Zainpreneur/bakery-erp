"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconShield,
  IconTrash,
  IconUsersGroup,
} from "@tabler/icons-react";

import { api, apiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import type { AuthUser, Role } from "@/lib/types";
import { initials, titleCase } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, SortableHeader } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

const emptyForm = { name: "", email: "", password: "", role: "STAFF" as Role };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<AuthUser | null>(null);
  const [roleValue, setRoleValue] = useState<Role>("STAFF");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get<AuthUser[]>("/users");
      setUsers(res.data);
    } catch (err) {
      setLoadError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.active).length,
      admins: users.filter((user) => user.role === "ADMIN").length,
    }),
    [users]
  );

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api.post("/users", form);
      toast.success("Team member added");
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: AuthUser) {
    try {
      await api.put(`/users/${user.id}`, { active: !user.active });
      toast.success(user.active ? "Account disabled" : "Account enabled");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function openRole(user: AuthUser) {
    setRoleTarget(user);
    setRoleValue(user.role);
  }

  async function saveRole() {
    if (!roleTarget) return;
    setSaving(true);
    try {
      await api.put(`/users/${roleTarget.id}`, { role: roleValue });
      toast.success("Role updated");
      setRoleTarget(null);
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
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success("Team member removed");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      throw err;
    }
  }

  const columns: ColumnDef<AuthUser>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Member" />,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.name}
                  {user.id === me?.id ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      (you)
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <StatusBadge status={row.original.role} />,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (user) => (user.active === false ? "Disabled" : "Active"),
        cell: ({ row }) =>
          row.original.active === false ? (
            <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 dark:text-rose-400">
              Disabled
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Active
            </Badge>
          ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
          const isMe = user.id === me?.id;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Team actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => openRole(user)}
                    disabled={isMe}
                  >
                    <IconShield className="size-4" /> Change role
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void toggleActive(user)}
                    disabled={isMe}
                  >
                    <IconPencil className="size-4" />
                    {user.active === false ? "Enable" : "Disable"} account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteTarget(user)}
                    disabled={isMe}
                  >
                    <IconTrash className="size-4" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [me?.id]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage staff accounts, roles and access to the bakery."
      >
        <Button onClick={openCreate}>
          <IconPlus className="size-4" /> Add team member
        </Button>
      </PageHeader>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load the team</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            {loadError}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={String(stats.total)} icon={IconUsersGroup} />
        <StatCard label="Active" value={String(stats.active)} />
        <StatCard label="Administrators" value={String(stats.admins)} icon={IconShield} />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 max-w-xs" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder="Search team members…"
          facetedFilters={[
            {
              columnId: "role",
              title: "Role",
              options: ["ADMIN", "MANAGER", "STAFF"].map((value) => ({
                label: titleCase(value),
                value,
              })),
            },
            {
              columnId: "status",
              title: "Status",
              options: [
                { label: "Active", value: "Active" },
                { label: "Disabled", value: "Disabled" },
              ],
            },
          ]}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>
              Create an account so a colleague can sign in to the bakery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-password">Temporary password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm({ ...form, role: value as Role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <LoadingButton type="submit" loading={saving} loadingLabel="Creating account">
                Create account
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roleTarget !== null} onOpenChange={(open) => !open && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Choose the access level for {roleTarget?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={roleValue} onValueChange={(value) => setRoleValue(value as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin — full access</SelectItem>
                <SelectItem value="MANAGER">Manager — operations &amp; reports</SelectItem>
                <SelectItem value="STAFF">Staff — counter &amp; orders</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleTarget(null)}>
                Cancel
              </Button>
              <LoadingButton type="button" onClick={() => void saveRole()} loading={saving} loadingLabel="Saving role">
                Save role
              </LoadingButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.name ?? "team member"}?`}
        description="They will lose access immediately. Orders they created are kept in the history."
        onConfirm={handleDelete}
      />
    </div>
  );
}
