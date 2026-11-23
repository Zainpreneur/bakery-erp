"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBox,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconClock,
  IconGripVertical,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { api, apiErrorMessage } from "@/lib/api-client";
import type { AuthUser, BakeBatch, BakeStage, BatchPriority, Product } from "@/lib/types";
import { titleCase } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingButton } from "@/components/ui/loading-button";
import { Infobar } from "@/components/ui/infobar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STAGES: BakeStage[] = ["PLANNED", "MIXING", "BAKING", "COOLING", "READY", "DONE"];

function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const STAGE_COLORS: Record<BakeStage, string> = {
  PLANNED: "bg-slate-500",
  MIXING: "bg-violet-500",
  BAKING: "bg-amber-500",
  COOLING: "bg-sky-500",
  READY: "bg-emerald-500",
  DONE: "bg-muted-foreground",
};

const PRIORITY_STYLES: Record<BatchPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  NORMAL: "bg-primary/10 text-primary",
  HIGH: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  URGENT: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

const PRIORITY_DOTS: Record<BatchPriority, string> = {
  LOW: "bg-muted-foreground/50",
  NORMAL: "bg-primary",
  HIGH: "bg-amber-500",
  URGENT: "bg-rose-500",
};

export default function ProductionPage() {
  const [batches, setBatches] = useState<BakeBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState<BakeStage | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "calendar">("board");
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("12");
  const [priority, setPriority] = useState<BatchPriority>("NORMAL");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BakeBatch | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [batchRes, productRes, userRes] = await Promise.all([
        api.get<BakeBatch[]>("/batches"),
        api.get<Product[]>("/products", { params: { active: true } }),
        api.get<AuthUser[]>("/users"),
      ]);
      setBatches(batchRes.data);
      setProducts(productRes.data);
      setUsers(userRes.data);
      if (!productId && productRes.data.length) setProductId(productRes.data[0].id);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
    // Load once; keeping productId current isn't needed for the initial fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => ({
      active: batches.filter((batch) => batch.stage !== "DONE").length,
      urgent: batches.filter((batch) => batch.priority === "URGENT" && batch.stage !== "DONE").length,
      ready: batches.filter((batch) => batch.stage === "READY").length,
      overdue: batches.filter(
        (batch) =>
          batch.dueDate &&
          new Date(batch.dueDate).getTime() < Date.now() &&
          batch.stage !== "DONE"
      ).length,
    }),
    [batches]
  );

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((stage) => [stage, [] as BakeBatch[]])) as Record<
      BakeStage,
      BakeBatch[]
    >;
    for (const batch of batches) map[batch.stage]?.push(batch);
    return map;
  }, [batches]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const today = localDay(new Date());
    return Array.from({ length: total }, (_, index) => {
      const dayNumber = index - firstWeekday + 1;
      const date = new Date(year, month, dayNumber);
      const key = localDay(date);
      return {
        key,
        date,
        inMonth: dayNumber >= 1 && dayNumber <= daysInMonth,
        isToday: key === today,
        batches: batches.filter((batch) => batch.dueDate?.slice(0, 10) === key),
      };
    });
  }, [calendarMonth, batches]);

  const unscheduled = useMemo(() => batches.filter((batch) => !batch.dueDate), [batches]);

  async function moveBatch(batch: BakeBatch, stage: BakeStage) {
    if (batch.stage === stage) return;
    setMovingId(batch.id);
    try {
      const updated = await api.patch<BakeBatch>(`/batches/${batch.id}`, { stage });
      setBatches((current) => current.map((item) => (item.id === updated.data.id ? updated.data : item)));
      toast.success(`${batch.batchNumber} → ${titleCase(stage).toLowerCase()}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setMovingId(null);
    }
  }

  function openCreate() {
    setProductId(products[0]?.id ?? "");
    setQuantity("12");
    setPriority("NORMAL");
    setAssignee("");
    setDueDate("");
    setNotes("");
    setFormError("");
    setDialogOpen(true);
  }

  async function createBatch(event: FormEvent) {
    event.preventDefault();
    if (!productId) {
      setFormError("Add an active product first.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/batches", {
        productId,
        quantity: Number(quantity),
        priority,
        assignedTo: assignee || null,
        dueDate: dueDate || null,
        notes: notes || null,
      });
      toast.success("Batch added to the board");
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBatch() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/batches/${deleteTarget.id}`);
      setBatches((current) => current.filter((batch) => batch.id !== deleteTarget.id));
      toast.success("Batch removed");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production board"
        description="Plan and track bake batches from mixing to handoff. Drag a card between columns to update its stage."
      >
        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
          <Button
            type="button"
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
          >
            <IconLayoutGrid className="size-4" /> Board
          </Button>
          <Button
            type="button"
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <IconCalendar className="size-4" /> Calendar
          </Button>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <IconRefresh className="size-4" /> Refresh
        </Button>
        <Button onClick={openCreate}>
          <IconPlus className="size-4" /> New batch
        </Button>
      </PageHeader>

      {error ? (
        <Infobar
          variant="warning"
          title="Could not load the production board"
          description={error}
          action={<Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active batches" value={String(stats.active)} hint="Not yet done" icon={IconBox} />
        <StatCard label="Ready for handoff" value={String(stats.ready)} hint="Waiting on the counter" icon={IconCheck} />
        <StatCard label="Urgent" value={String(stats.urgent)} hint="Prioritised batches" icon={IconAlertTriangle} />
        <StatCard label="Past due" value={String(stats.overdue)} hint={stats.overdue ? "Need attention" : "All on schedule"} icon={IconClock} />
      </div>

      {view === "board" ? (loading ? (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => (
            <Skeleton key={stage} className="h-96" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => {
            const items = grouped[stage] ?? [];
            return (
              <section
                key={stage}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(stage);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(null);
                  const id = event.dataTransfer.getData("text/plain");
                  const batch = batches.find((item) => item.id === id);
                  if (batch) void moveBatch(batch, stage);
                }}
                className={cn(
                  "flex min-h-96 flex-col rounded-xl border bg-muted/25 p-2.5 transition",
                  dragOver === stage && "border-primary bg-primary/5 ring-2 ring-primary/20"
                )}
              >
                <header className="mb-2.5 flex items-center gap-2 px-1">
                  <span className={cn("size-2 rounded-full", STAGE_COLORS[stage])} />
                  <h2 className="text-sm font-semibold">{titleCase(stage).toLowerCase()}</h2>
                  <Badge variant="secondary" className="ml-auto tabular-nums">{items.length}</Badge>
                </header>

                <div className="flex-1 space-y-2">
                  {items.length ? (
                    items.map((batch) => {
                      const stageIndex = STAGES.indexOf(batch.stage);
                      const overdue = Boolean(
                        batch.dueDate &&
                          new Date(batch.dueDate).getTime() < Date.now() &&
                          batch.stage !== "DONE"
                      );
                      return (
                        <article
                          key={batch.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", batch.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          className={cn(
                            "group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition active:cursor-grabbing hover:shadow-md",
                            movingId === batch.id && "opacity-50",
                            overdue && "border-rose-500/40"
                          )}
                        >
                          <div className="flex items-start gap-1.5">
                            <IconGripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-muted-foreground">
                                {batch.batchNumber}
                              </p>
                              <p className="mt-0.5 truncate text-sm font-semibold">
                                {batch.product.name}
                              </p>
                            </div>
                            <Badge variant="secondary" className={cn("shrink-0 text-[10px]", PRIORITY_STYLES[batch.priority])}>
                              {batch.priority}
                            </Badge>
                          </div>

                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-medium tabular-nums text-foreground">{batch.quantity} units</span>
                            {batch.assignee ? (
                              <span className="flex items-center gap-1 truncate">
                                <IconUser className="size-3.5" /> {batch.assignee.name}
                              </span>
                            ) : null}
                            {batch.dueDate ? (
                              <span className={cn("flex items-center gap-1", overdue && "text-rose-600 dark:text-rose-400")}>
                                <IconCalendar className="size-3.5" />
                                {new Date(batch.dueDate).toLocaleDateString()}
                              </span>
                            ) : null}
                          </div>

                          {batch.notes ? (
                            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{batch.notes}</p>
                          ) : null}

                          <div className="mt-2.5 flex items-center gap-1 border-t pt-2 opacity-60 transition group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              disabled={stageIndex === 0}
                              aria-label="Move back"
                              onClick={() => void moveBatch(batch, STAGES[stageIndex - 1])}
                            >
                              <IconArrowLeft className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              disabled={stageIndex === STAGES.length - 1}
                              aria-label="Move forward"
                              onClick={() => void moveBatch(batch, STAGES[stageIndex + 1])}
                            >
                              <IconArrowRight className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto size-6 text-muted-foreground hover:text-destructive"
                              aria-label="Delete batch"
                              onClick={() => setDeleteTarget(batch)}
                            >
                              <IconTrash className="size-3.5" />
                            </Button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Drop a batch here
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base">
                {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Previous month"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                >
                  <IconChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Next month"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                >
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-4">
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="bg-muted px-2 py-1.5 text-center font-medium text-muted-foreground">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day[0]}</span>
                  </div>
                ))}
                {calendarCells.map((cell) => (
                  <div
                    key={cell.key}
                    className={cn(
                      "min-h-20 bg-card p-1.5 sm:min-h-28 sm:p-2",
                      !cell.inMonth && "bg-muted/40 text-muted-foreground/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                        cell.isToday && "bg-primary font-semibold text-primary-foreground"
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {cell.batches.map((batch) => {
                        const stageIndex = STAGES.indexOf(batch.stage);
                        return (
                          <button
                            key={batch.id}
                            type="button"
                            disabled={batch.stage === "DONE"}
                            title={batch.stage === "DONE" ? batch.batchNumber : `Advance ${batch.batchNumber}`}
                            onClick={() => void moveBatch(batch, STAGES[stageIndex + 1])}
                            className={cn(
                              "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] transition hover:bg-accent disabled:cursor-default sm:text-xs",
                              batch.stage === "DONE" && "opacity-60"
                            )}
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOTS[batch.priority])} />
                            <span className="truncate">{batch.product.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Unscheduled batches</CardTitle>
              <CardDescription>Batches without a due date. Add one when creating a batch.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {unscheduled.length ? (
                unscheduled.map((batch) => (
                  <Badge key={batch.id} variant="secondary" className="gap-1.5 font-normal">
                    <span className={cn("size-1.5 rounded-full", STAGE_COLORS[batch.stage])} />
                    {batch.batchNumber} · {batch.product.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Everything has a due date.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Need to prepare stock first? <Link href="/ingredients" className="font-medium text-primary hover:underline">Check ingredients</Link>.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New bake batch</DialogTitle>
            <DialogDescription>Add a batch to the production board. You can move it later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createBatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-product">Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="batch-product"><SelectValue placeholder="Choose a product" /></SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="batch-quantity">Quantity</Label>
                <Input id="batch-quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as BatchPriority)}>
                  <SelectTrigger id="batch-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((value) => (
                      <SelectItem key={value} value={value}>{titleCase(value)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="batch-assignee">Assigned to</Label>
                <Select value={assignee || "none"} onValueChange={(value) => setAssignee(value === "none" ? "" : value)}>
                  <SelectTrigger id="batch-assignee"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-due">Due date</Label>
                <Input id="batch-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-notes">Notes</Label>
              <Textarea id="batch-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions, oven temperature…" />
            </div>
            {formError ? <p className="text-sm text-destructive" role="alert">{formError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <LoadingButton type="submit" loading={saving} loadingLabel="Adding batch">Add batch</LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.batchNumber ?? "batch"}?`}
        description="This removes the batch from the board. It does not affect orders or stock."
        confirmLabel="Remove batch"
        onConfirm={deleteBatch}
      />
    </div>
  );
}
