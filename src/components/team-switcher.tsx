"use client";

import Link from "next/link";
import { IconBread, IconChevronDown } from "@tabler/icons-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/" className="gap-3">
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconBread className="size-5" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold tracking-tight">
                Crumb &amp; Co.
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Bakery workspace
              </span>
            </div>
            <IconChevronDown className="ml-auto size-4 text-muted-foreground" />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
