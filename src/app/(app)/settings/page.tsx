"use client";

import { useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  IconBell,
  IconDeviceDesktop,
  IconMoon,
  IconPalette,
  IconRefresh,
  IconSun,
  IconUser,
} from "@tabler/icons-react";

import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";
import { useThemeConfig } from "@/components/theme-customizer";
import { startThemeTransition } from "@/lib/theme-transition";
import {
  accents,
  fonts,
  sidebarVariants,
  collapsibleModes,
  contentLayouts,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
} from "@/lib/theme-config";
import {
  DEFAULT_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import type { NotificationKind } from "@/hooks/use-notifications";
import { initials, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NOTIFICATION_OPTIONS: { kind: NotificationKind; title: string; description: string }[] = [
  { kind: "stock", title: "Low stock", description: "Ingredients at or below their reorder point." },
  { kind: "payment", title: "Outstanding payments", description: "Orders with an unpaid balance." },
  { kind: "due", title: "Past-due orders", description: "Orders whose due date has passed." },
  { kind: "ready", title: "Ready for handoff", description: "Orders marked ready for collection." },
];

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <Label className="text-base">{title}</Label>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { config, setConfig, reset, setOpen: openCustomizer } = useThemeConfig();
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadNotificationPrefs);

  function updatePref(kind: NotificationKind, value: boolean) {
    const next = { ...prefs, [kind]: value };
    setPrefs(next);
    saveNotificationPrefs(next);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Settings"
        description="Personal preferences for your account, appearance and notifications."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <IconUser className="size-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <IconPalette className="size-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <IconBell className="size-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your account</CardTitle>
              <CardDescription>Signed-in identity used for audit trails and assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(user?.name ?? "Bakery Staff")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{user?.name ?? "Loading…"}</p>
                  <p className="truncate text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                </div>
                {user ? (
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {titleCase(user.role)}
                  </Badge>
                ) : null}
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Profile details are managed by a workspace administrator in the Team page. Contact an admin to
                change your name, email, role or password.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Current bakery workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow title="Crumb & Co." description="Bakery workspace · local database">
                <Badge variant="outline">Active</Badge>
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Changes apply immediately and are saved on this device.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  <IconRefresh className="size-4" /> Reset
                </Button>
                <Button variant="outline" size="sm" onClick={() => openCustomizer(true)}>
                  Customize
                </Button>
              </div>
            </CardHeader>
            <CardContent className="divide-y">
              <SettingRow title="Color mode" description="Choose light, dark or follow your device.">
                <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                  {([
                    { value: "light", label: "Light", icon: IconSun },
                    { value: "dark", label: "Dark", icon: IconMoon },
                    { value: "system", label: "System", icon: IconDeviceDesktop },
                  ] as const).map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={theme === option.value ? "secondary" : "ghost"}
                      size="sm"
                      onClick={(event) =>
                        startThemeTransition(() => setTheme(option.value), event.nativeEvent)
                      }
                    >
                      <option.icon className="size-4" />
                      <span className="hidden sm:inline">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </SettingRow>

              <div className="space-y-3 py-4">
                <Label>Accent color</Label>
                <div className="flex flex-wrap gap-2">
                  {accents.map((accent) => (
                    <button
                      key={accent.key}
                      type="button"
                      title={accent.label}
                      aria-label={`${accent.label} accent`}
                      aria-pressed={config.accent === accent.key}
                      onClick={() => setConfig((current) => ({ ...current, accent: accent.key }))}
                      className={cn(
                        "size-8 rounded-full border-2 transition hover:scale-110",
                        config.accent === accent.key ? "border-foreground" : "border-transparent"
                      )}
                      style={{ background: accent.swatch }}
                    />
                  ))}
                </div>
              </div>

              <SettingRow title="Corner radius" description={`${config.radius.toFixed(2)} rem`}>
                <Slider
                  className="w-40"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[config.radius]}
                  onValueChange={([value]) => setConfig((current) => ({ ...current, radius: value }))}
                  aria-label="Corner radius"
                />
              </SettingRow>

              <SettingRow title="Font">
                <Select
                  value={config.font}
                  onValueChange={(value) => setConfig((current) => ({ ...current, font: value }))}
                >
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fonts.map((font) => (
                      <SelectItem key={font.key} value={font.key}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow title="Sidebar style">
                <Select
                  value={config.sidebarVariant}
                  onValueChange={(value) =>
                    setConfig((current) => ({ ...current, sidebarVariant: value as SidebarVariant }))
                  }
                >
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sidebarVariants.map((variant) => (
                      <SelectItem key={variant.key} value={variant.key}>{variant.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow title="Collapsed sidebar">
                <Select
                  value={config.sidebarCollapsible}
                  onValueChange={(value) =>
                    setConfig((current) => ({ ...current, sidebarCollapsible: value as SidebarCollapsible }))
                  }
                >
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {collapsibleModes.map((mode) => (
                      <SelectItem key={mode.key} value={mode.key}>{mode.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow title="Content width">
                <Select
                  value={config.contentLayout}
                  onValueChange={(value) =>
                    setConfig((current) => ({ ...current, contentLayout: value as ContentLayout }))
                  }
                >
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contentLayouts.map((layout) => (
                      <SelectItem key={layout.key} value={layout.key}>{layout.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Notification types</CardTitle>
                <CardDescription>Choose which alerts appear in the bell and notification center.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrefs(DEFAULT_PREFS);
                  saveNotificationPrefs(DEFAULT_PREFS);
                }}
              >
                <IconRefresh className="size-4" /> Defaults
              </Button>
            </CardHeader>
            <CardContent className="divide-y">
              {NOTIFICATION_OPTIONS.map((option) => (
                <SettingRow key={option.kind} title={option.title} description={option.description}>
                  <Switch
                    checked={prefs[option.kind]}
                    onCheckedChange={(checked) => updatePref(option.kind, checked)}
                    aria-label={option.title}
                  />
                </SettingRow>
              ))}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Notifications are derived from your orders and stock levels — no extra records are stored.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

