"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowUpRight, IconInfoCircle } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type HelpSection = { title: string; body: string };
type HelpContent = { title: string; description: string; sections: HelpSection[]; links?: { label: string; href: string }[] };

const HELP: Record<string, HelpContent> = {
  "/": {
    title: "Dashboard",
    description: "A live snapshot of today's bakery performance.",
    sections: [
      { title: "Revenue", body: "Totals come from orders placed in the selected period. Cancelled orders are excluded." },
      { title: "Low stock", body: "Ingredients at or below their reorder threshold. Adjust stock from the Ingredients page." },
    ],
    links: [{ label: "View orders", href: "/orders" }],
  },
  "/notifications": {
    title: "Notifications",
    description: "Things that need your attention, generated from live data.",
    sections: [
      { title: "What you'll see", body: "Low-stock ingredients, overdue orders, unpaid balances and orders ready for handoff." },
      { title: "Read state", body: "Marking an item read is stored in this browser so the bell only shows what's new to you." },
    ],
    links: [{ label: "Check ingredient stock", href: "/ingredients" }],
  },
  "/orders": {
    title: "Orders & POS",
    description: "Take orders and move them through the production queue.",
    sections: [
      { title: "Status flow", body: "Pending → In progress → Ready → Completed. Cancelling an order returns its ingredients to stock." },
      { title: "Payments", body: "Click the payment badge on any order to record partial or full payment." },
      { title: "Quick actions", body: "Right-click a row for shortcuts. Filter by status or date, and share the filtered URL with staff." },
    ],
    links: [{ label: "Check low stock", href: "/ingredients" }],
  },
  "/settings": {
    title: "Settings",
    description: "Your account and device preferences.",
    sections: [
      { title: "Profile", body: "Your identity comes from the signed-in account. Ask an administrator to change account details." },
      { title: "Appearance", body: "Theme and layout preferences are stored in this browser only, so each device can look different." },
      { title: "Notifications", body: "Toggle the kinds of alerts you care about. The bell and notification center update immediately." },
    ],
    links: [{ label: "Notification center", href: "/notifications" }],
  },
  "/analytics": {
    title: "Analytics & reports",
    description: "A financial snapshot of the selected period.",
    sections: [
      { title: "Revenue", body: "Order totals excluding cancelled orders. Collected is the portion already paid; outstanding is the remainder." },
      { title: "Net result", body: "Revenue minus recorded expenses in the same period. Use the date picker to compare periods." },
      { title: "Export & print", body: "CSV includes one row per order. Print hides the app chrome and shows a clean report header." },
    ],
    links: [{ label: "Expenses", href: "/expenses" }],
  },
  "/production": {
    title: "Production board",
    description: "Bake batches moving through the kitchen.",
    sections: [
      { title: "Stages", body: "Planned → Mixing → Baking → Cooling → Ready → Done. Drag a card between columns, or use the arrow buttons." },
      { title: "Batch numbers", body: "Assigned automatically when a batch is created. Notes, assignee and due date are visible on each card." },
    ],
    links: [{ label: "Ingredient stock", href: "/ingredients" }],
  },
  "/products": {
    title: "Products",
    description: "What you sell, and the recipes behind each item.",
    sections: [
      { title: "Recipes", body: "Each recipe item deducts its ingredient quantity from stock when an order is placed." },
      { title: "Makeable", body: "The 'Max makeable' figure shows how many of an item current stock allows you to bake." },
    ],
  },
  "/ingredients": {
    title: "Ingredients",
    description: "Raw stock, units, costs and supplier links.",
    sections: [
      { title: "Stock adjustments", body: "Every purchase, usage or correction is recorded as a transaction in the ledger." },
      { title: "Reorder point", body: "Set a threshold to surface the ingredient in dashboard low-stock alerts." },
    ],
    links: [{ label: "Suppliers", href: "/suppliers" }],
  },
  "/customers": {
    title: "Customers",
    description: "Regulars, contact details and order history.",
    sections: [
      { title: "Customer 360", body: "Open a customer to see lifetime spend, outstanding balance, order history and favourite products." },
      { title: "Orders", body: "Linking a customer at POS builds their history automatically." },
    ],
  },
  "/suppliers": {
    title: "Suppliers",
    description: "Who supplies each ingredient and how to reach them.",
    sections: [
      { title: "Linked ingredients", body: "Ingredient counts show how many recipe items depend on each supplier." },
    ],
  },
  "/expenses": {
    title: "Expenses",
    description: "Track money leaving the business.",
    sections: [
      { title: "Reporting", body: "Expenses feed the monthly figures shown on the dashboard." },
    ],
  },
  "/users": {
    title: "Team",
    description: "Staff accounts and access roles.",
    sections: [
      { title: "Roles", body: "Admins can manage everything; staff can work orders without access to sensitive settings." },
      { title: "Disabled accounts", body: "Disabling a user prevents sign-in without deleting their history." },
    ],
  },
};

function contentForPath(pathname: string): HelpContent {
  if (HELP[pathname]) return HELP[pathname];
  if (pathname.startsWith("/orders/")) return HELP["/orders"];
  if (pathname.startsWith("/customers/")) return HELP["/customers"];
  if (pathname.startsWith("/products/")) return HELP["/products"];
  if (pathname.startsWith("/ingredients/")) return HELP["/ingredients"];
  return {
    title: "Bakery Manager",
    description: "Your bakery, from order to oven to handoff.",
    sections: [
      { title: "Getting started", body: "Add ingredients, build product recipes, then start taking orders from the POS." },
    ],
  };
}

type InfoPanelContextValue = { open: boolean; setOpen: (open: boolean) => void };
const InfoPanelContext = React.createContext<InfoPanelContextValue>({
  open: false,
  setOpen: () => {},
});

export function useInfoPanel() {
  return React.useContext(InfoPanelContext);
}

export function InfoPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "i" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);

  const content = contentForPath(pathname ?? "/");

  return (
    <InfoPanelContext.Provider value={{ open, setOpen }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{content.title}</SheetTitle>
            <SheetDescription>{content.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {content.sections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </div>
            ))}
            {content.links?.length ? (
              <div className="space-y-2 border-t pt-4">
                {content.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {link.label} <IconArrowUpRight className="size-3.5" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </InfoPanelContext.Provider>
  );
}

export function InfoPanelTrigger() {
  const { open, setOpen } = useInfoPanel();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label={open ? "Close page info" : "About this page"}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
    >
      <IconInfoCircle className="size-5" />
    </Button>
  );
}
