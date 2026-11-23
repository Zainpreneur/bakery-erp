"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconBread } from "@tabler/icons-react";

import { useAuth } from "@/components/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { ConfirmProvider } from "@/components/confirm-provider";
import { InfoPanelProvider } from "@/components/info-panel";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background text-foreground">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <IconBread className="size-7 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">Warming up the ovens…</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ConfirmProvider>
        <InfoPanelProvider>
          <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset className="min-w-0">
              <AppHeader user={user} />
              <main className="app-main min-w-0 flex-1 p-4 md:p-6">{children}</main>
            </SidebarInset>
            <ThemeCustomizer />
          </SidebarProvider>
        </InfoPanelProvider>
      </ConfirmProvider>
    </TooltipProvider>
  );
}
