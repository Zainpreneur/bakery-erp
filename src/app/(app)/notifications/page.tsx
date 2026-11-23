"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconBell,
  IconCash,
  IconCheck,
  IconClock,
  IconRefresh,
} from "@tabler/icons-react";

import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationKind } from "@/hooks/use-notifications";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<NotificationKind, typeof IconBell> = {
  stock: IconAlertTriangle,
  payment: IconCash,
  due: IconClock,
  ready: IconCheck,
};

const KIND_STYLES: Record<NotificationKind, string> = {
  stock: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  payment: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  due: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

type Filter = "all" | "unread" | "read";

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, refresh, markRead, markAllRead } =
    useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = notifications.filter((item) =>
    filter === "all" ? true : filter === "unread" ? !item.read : item.read
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Low stock, overdue orders and unpaid balances — generated from your live data."
      >
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <IconRefresh className="size-4" /> Refresh
        </Button>
        {unreadCount > 0 ? (
          <Button
            onClick={() =>
              markAllRead(notifications.filter((n) => !n.read).map((n) => n.id))
            }
          >
            <IconCheck className="size-4" /> Mark all read
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-1.5 px-1.5 tabular-nums">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <Badge variant="secondary" className="ml-1.5 px-1.5 tabular-nums">
                {unreadCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground">
          Read state is saved in this browser.
        </p>
      </div>

      {loading && !notifications.length ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border p-4">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length ? (
        <ul className="space-y-2">
          {visible.map((notification) => {
            const Icon = KIND_ICONS[notification.kind];
            return (
              <li
                key={notification.id}
                className={cn(
                  "rounded-lg border transition",
                  !notification.read && "border-primary/30 bg-primary/[0.03]"
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      KIND_STYLES[notification.kind]
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={notification.href}
                        onClick={() => markRead(notification.id)}
                        className="text-sm font-medium hover:underline"
                      >
                        {notification.title}
                      </Link>
                      {!notification.read ? (
                        <Badge variant="secondary" className="text-[10px]">New</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead(notification.id)}
                      className="shrink-0"
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><IconBell /></EmptyMedia>
            <EmptyTitle>
              {filter === "unread"
                ? "Nothing unread"
                : filter === "read"
                  ? "No read notifications"
                  : "You're all caught up"}
            </EmptyTitle>
            <EmptyDescription>
              {filter === "all"
                ? "Low stock, overdue orders and unpaid balances will appear here."
                : "Try a different tab."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              <IconRefresh className="size-4" /> Refresh
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
