"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconSearch,
  IconLogout,
  IconShoppingCart,
} from "@tabler/icons-react";

import type { AuthUser } from "@/lib/types";
import { allNavItems } from "@/config/nav";
import { useIsMac } from "@/hooks/use-platform";
import { useAuth } from "@/components/auth-provider";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { InfoPanelTrigger } from "@/components/info-panel";
import { NotificationBell } from "@/components/notification-bell";
import { CustomizerButton } from "@/components/theme-customizer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const CRUMB_LABELS: Record<string, string> = {
  pos: "POS",
  api: "API",
};

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map(
    (s) =>
      CRUMB_LABELS[s] ??
      allNavItems.find((item) => item.url === `/${s}`)?.title ??
      s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppHeader({ user }: { user: AuthUser }) {
  const crumbs = useBreadcrumb();
  const router = useRouter();
  const isMac = useIsMac();
  const [open, setOpen] = React.useState(false);
  const { logout } = useAuth();

  const go = React.useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <div className="mr-1 h-5 w-px shrink-0 self-center bg-border" />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <BreadcrumbItem>
                <BreadcrumbPage
                  className={i < crumbs.length - 1 ? "text-muted-foreground" : ""}
                >
                  {c}
                </BreadcrumbPage>
              </BreadcrumbItem>
              {i < crumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          className="hidden h-9 w-56 justify-start gap-2 px-3 text-muted-foreground md:flex"
          onClick={() => setOpen(true)}
        >
          <IconSearch className="size-4" />
          <span className="text-sm">Search…</span>
          <KbdGroup className="ml-auto">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <span className="text-[11px] font-medium text-muted-foreground">+</span>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          <IconSearch className="size-5" />
        </Button>

        <NotificationBell />

        <ThemeToggle />
        <InfoPanelTrigger />
        <CustomizerButton />
        <div className="mx-1 h-6 w-px shrink-0 self-center bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="grid">
              <span className="truncate text-sm">{user.name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <IconShoppingCart className="size-4" /> Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
              <IconLogout className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {allNavItems.map((item) => (
              <CommandItem
                key={item.title}
                value={item.title}
                onSelect={() => go(item.url ?? "#")}
              >
                {item.icon && <item.icon className="size-4" />}
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
