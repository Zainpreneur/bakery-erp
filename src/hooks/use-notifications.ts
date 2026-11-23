"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api-client";
import type { DashboardSummary, Order } from "@/lib/types";
import {
  loadNotificationPrefs,
  PREFS_EVENT,
  type NotificationPrefs,
} from "@/lib/notification-prefs";

const STORAGE_KEY = "bakery-read-notifications";

export type NotificationKind = "stock" | "payment" | "due" | "ready";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  read: boolean;
};

function loadReadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function buildNotifications(
  summary: DashboardSummary | null,
  orders: Order[],
  readIds: string[]
): AppNotification[] {
  const items: Omit<AppNotification, "read">[] = [];
  const now = new Date().toISOString();

  for (const ingredient of summary?.lowStockIngredients ?? []) {
    items.push({
      id: `stock:${ingredient.id}`,
      kind: "stock",
      title: `${ingredient.name} is low on stock`,
      description: `${ingredient.quantityInStock} ${ingredient.unit} left — at or below the reorder point.`,
      href: "/ingredients",
      createdAt: now,
    });
  }

  for (const order of orders) {
    if (
      order.dueDate &&
      new Date(order.dueDate).getTime() < Date.now() &&
      order.status !== "COMPLETED" &&
      order.status !== "CANCELLED"
    ) {
      items.push({
        id: `due:${order.id}`,
        kind: "due",
        title: `${order.orderNumber} is past due`,
        description: `Due ${new Date(order.dueDate).toLocaleDateString()} · ${order.customer?.name ?? "Walk-in"}.`,
        href: `/orders/${order.id}`,
        createdAt: order.dueDate,
      });
    }

    if (order.paymentStatus !== "PAID" && order.status !== "CANCELLED") {
      const balance = order.totalAmount - order.paidAmount;
      items.push({
        id: `payment:${order.id}`,
        kind: "payment",
        title: `${order.orderNumber} has an outstanding balance`,
        description: `${balance.toLocaleString(undefined, { style: "currency", currency: "USD" })} unpaid · ${order.customer?.name ?? "Walk-in"}.`,
        href: `/orders/${order.id}`,
        createdAt: order.createdAt,
      });
    }

    if (order.status === "READY") {
      items.push({
        id: `ready:${order.id}`,
        kind: "ready",
        title: `${order.orderNumber} is ready for handoff`,
        description: `${order.customer?.name ?? "Walk-in"} · ${order.items.reduce((sum, item) => sum + item.quantity, 0)} items.`,
        href: `/orders/${order.id}`,
        createdAt: order.createdAt,
      });
    }
  }

  const read = new Set(readIds);
  return items
    .map((item) => ({ ...item, read: read.has(item.id) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function useNotifications() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [readIds, setReadIds] = useState<string[]>(loadReadIds);
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadNotificationPrefs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setPrefs(loadNotificationPrefs());
    window.addEventListener(PREFS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        api.get<DashboardSummary>("/dashboard/summary"),
        api.get<Order[]>("/orders"),
      ]);
      setSummary(summaryRes.data);
      setOrders(ordersRes.data);
    } catch {
      // Keep the last good snapshot if a refresh fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persist = useCallback((ids: string[]) => {
    setReadIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Browsers with storage disabled still get in-memory state.
    }
  }, []);

  const markRead = useCallback(
    (id: string) => {
      persist(Array.from(new Set([...loadReadIds(), id])));
    },
    [persist]
  );

  const markAllRead = useCallback(
    (ids: string[]) => {
      persist(Array.from(new Set([...loadReadIds(), ...ids])));
    },
    [persist]
  );

  const notifications = useMemo(
    () => buildNotifications(summary, orders, readIds).filter((item) => prefs[item.kind] !== false),
    [summary, orders, readIds, prefs]
  );
  const unreadCount = notifications.filter((item) => !item.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
  };
}
