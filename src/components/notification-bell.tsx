"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconBell,
  IconCash,
  IconCheck,
  IconClock,
} from "@tabler/icons-react";

import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationKind } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export function NotificationBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();
  const recent = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            unreadCount ? `Notifications (${unreadCount} unread)` : "Notifications"
          }
        >
          <IconBell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground tabular-nums">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 ? (
              <Badge variant="secondary" className="tabular-nums">
                {unreadCount} new
              </Badge>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() =>
                markAllRead(notifications.filter((n) => !n.read).map((n) => n.id))
              }
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && !notifications.length ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length ? (
            <ul className="divide-y">
              {recent.map((notification) => {
                const Icon = KIND_ICONS[notification.kind];
                return (
                  <li key={notification.id}>
                    <Link
                      href={notification.href}
                      onClick={() => markRead(notification.id)}
                      className={cn(
                        "flex gap-3 px-4 py-3 transition hover:bg-accent/60",
                        !notification.read && "bg-primary/[0.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          KIND_STYLES[notification.kind]
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {notification.title}
                          </span>
                          {!notification.read ? (
                            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {notification.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          )}
        </div>

        <div className="border-t px-4 py-2.5 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
