# R1/R2 UI Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Bakery app with the remaining portable UI systems, layout patterns, form/table/chart upgrades, and product modules inspired by `nextjs-r1` and `nextjs-r2`, while preserving the existing Prisma backend, APIs, auth, and Radix-based UI kit.

**Architecture:** Treat this as an umbrella roadmap. Low-risk visual and no-dependency upgrades land first; dependency-heavy systems (TanStack Form, React Query, dnd-kit, optional TanStack Table v9/nuqs) land behind explicit decision gates. Every new module remains client-derived from existing APIs unless the user explicitly approves backend changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Radix UI (`radix-ui`), TanStack Table v8, Recharts, date-fns, sonner, next-themes, Prisma, JWT cookie auth.

**Spec:** this document — see "Spec / Design Direction" below. Source audits: `nextjs-r1` UI-kit inventory, `nextjs-r2` pattern inventory, and current Bakery app inventory completed on 2026-11-23.

---

## Global Constraints

- Preserve the existing backend, Prisma schema/migrations, REST route handlers, JWT auth and role checks.
- Do not replace Radix primitives with Base UI. Port r2 behavior, not its primitive implementation.
- Do not overwrite `$B/src/app/globals.css`, `$B/src/app/layout.tsx`, `$B/package.json`, or working `$B/src/components/ui/*` files with reference copies.
- Keep TanStack Table v8 for the main migration path. Full v9 + `nuqs` adoption is a separate gated task.
- Keep Zod v3. Rewrite any r2 Zod 4 syntax such as `z.email()` or `z.number({ error })` to v3 equivalents.
- Offline `npm install` fails in this environment. Copy required package directories from `$R2/node_modules` into `$B/node_modules` and mirror versions in `$B/package.json`.
- All new app routes must include `loading.tsx` and `error.tsx` using existing Bakery skeleton/error patterns.
- All data must come from `$B/src/lib/api-client.ts` or existing route handlers. No mock/faker data in shipped routes.
- No chat, AI assistant, crypto, storefront, cart, checkout, marketing, or industry-dashboard demos.
- Keep the app runnable at `http://localhost:3111`. Verification baseline: `tsc --noEmit`, `next build`, and route smoke checks.
- Branding stays consistent: "Bakery Manager" for app chrome/documents, "Crumb & Co." for workspace identity.
- Respect reduced motion. Any copied view-transition or entrance animation must keep the existing reduced-motion CSS guard.
- Every new page must be useful on desktop and mobile; no horizontal page scroll except inside intentional boards/tables.

Path shorthand used throughout:

```text
$R1 = /data/data/com.termux/files/references/nextjs-r1
$R2 = /data/data/com.termux/files/references/nextjs-r2
$B  = /data/data/com.termux/files/home/Bakery-Business-Software
```

---

## Review Focus

These are the failure modes most likely to bite users and are pinned to owning tasks below.

| Risk | Expected behavior | Owning task / verification |
|---|---|---|
| Dependency copy mismatch | `tsc --noEmit` and `next build` pass after every dependency-bearing task; no half-copied scoped packages. | Tasks 5–9, 16; run typecheck/build before commits. |
| Auth/session regression | Direct URL access to new routes redirects or renders correctly for both demo roles; logout still clears session. | Task 2 and Task 17; smoke `/`, `/orders`, `/profile`, `/roles` with and without cookies. |
| Role leakage | Staff users must not see admin-only management actions/modules as actionable controls. | Task 14; render `/roles` and `/users` with `staff@bakery.test / staff123`. |
| Empty/filtered data | Every new table/list/chart shows a designed empty state, not a blank panel or `NaN`. | Tasks 1, 4, 11, 12; smoke with filtered URLs such as `?q=zzzz`. |
| Motion/theme regression | Theme changes still animate with circular reveal normally and skip animation under `prefers-reduced-motion`. | Task 16; browser/manual check plus CSS guard assertion. |

---

## Spec / Design Direction

### 1. Current state summary

The app already contains:

- All 34 r1 UI primitives under `$B/src/components/ui/*`, plus Bakery extras such as `context-menu`, `empty`, `field`, `file-uploader`, `hover-card`, `infobar`, `loading-button`, `slider`, `spinner`, `stepper`.
- r1 shell patterns: header, sidebar, user menu, team switcher, theme customizer/toggle/provider, page header, stat card, delete dialog.
- An enhanced Bakery `DataTable` with faceted/date/number filters, URL sync, row context menus, visibility, pagination and empty states.
- Real pages for dashboard, orders, order detail, products, customers, customer 360, ingredients, suppliers, expenses, users, production, analytics, notifications and settings.
- Real APIs for auth, orders, products, customers, ingredients, suppliers, expenses, users, batches and uploads.
- Route-level `loading.tsx` and `error.tsx` boundaries for all app pages.

Remaining work is therefore **not** "copy the base kit". It is:

1. Port the best r2 systems and micro-interactions.
2. Add a few r1 reusable chrome/error/chart pieces.
3. Add genuinely useful bakery modules inspired by reference demos.
4. Raise visual consistency with a documented design language.

---

### 2. UI inspiration library

Use this as the visual target when implementing any task below.

#### 2.1 App shell / layout

Inspired by:

```text
$R1/src/components/app-header.tsx
$R1/src/components/app-sidebar.tsx
$R2/src/app/dashboard/layout.tsx
$R2/src/components/layout/header.tsx
$R2/src/components/layout/page-container.tsx
$R2/src/components/layout/info-sidebar.tsx
$R2/src/components/breadcrumbs.tsx
```

Target behavior:

- Fixed-height app shell with one intentional scroll region for page content; sidebars stay put.
- Skip-to-content link as the first focusable element.
- Breadcrumbs derived from the pathname with human labels from `$B/src/config/nav.ts`.
- Header action order: global search → notifications → help/info → theme → user menu.
- Right-side info rail is contextual, not global marketing. Each page can supply its own help content.
- Page header has a consistent three-zone shape: title/description left, KPI chips center if needed, actions right.
- On mobile, header collapses to search icon + menu + notifications; no hidden primary actions behind overflow.

Implementation targets:

```text
$B/src/components/app-shell.tsx
$B/src/components/app-header.tsx
$B/src/components/app-sidebar.tsx
$B/src/components/page-header.tsx
$B/src/components/info-panel.tsx
$B/src/config/nav.ts
```

#### 2.2 Cards and dashboard composition

Inspired by:

```text
$R1/src/components/stat-card.tsx
$R2/src/app/dashboard/overview/layout.tsx
$R2/src/features/overview/components/overview.tsx
```

Target behavior:

- Dashboard uses a 12-column grid with asymmetric spans: hero stat `col-span-6`, secondary stats `col-span-3`, charts `col-span-8`, side lists `col-span-4`.
- Card anatomy: eyebrow label, large value, trend chip, micro-chart or footer meta, icon tile in top-right.
- Cards use equal padding and equal radius; avoid nested cards inside cards unless the inner surface is visually flat.
- Hover state is subtle: border tint + `translate-y-[-1px]`, no heavy shadow.
- Loading cards preserve final geometry using `Skeleton` blocks, so no layout shift.
- Error cards stay inline with retry, not full-page takeover.

Implementation targets:

```text
$B/src/components/stat-card.tsx
$B/src/components/section-boundary.tsx
$B/src/app/(app)/page.tsx
$B/src/app/(app)/analytics/page.tsx
```

#### 2.3 Forms and validation

Inspired by:

```text
$R1/src/app/(app)/examples/forms/page.tsx
$R1/src/app/(app)/examples/forms/form-actions.tsx
$R2/src/components/forms/**
$R2/src/hooks/use-stepper.tsx
$R2/src/features/forms/components/multi-step-product-form.tsx
$R2/src/features/forms/components/advanced-form-patterns.tsx
$R2/src/features/forms/components/sheet-product-form.tsx
```

Target behavior:

- Every field has label, help text and error text slots. Help text is present by default for non-obvious fields.
- Validation appears on blur/submit, not while typing the first character.
- Wizard steps show completed checkmarks, current step highlight, and a final review step.
- Each wizard step can validate independently; final submit revalidates the full schema.
- Sheet forms keep footer actions pinned and submit via `form=` attribute so the button can live outside the `<form>`.
- Async checks show an inline spinner at field level, e.g. SKU uniqueness or email uniqueness.
- Dynamic rows (recipe ingredients, order items) have explicit add/remove/reorder affordances and empty-state copy.

Implementation targets:

```text
$B/src/components/ui/field.tsx
$B/src/components/ui/loading-button.tsx
$B/src/components/ui/stepper.tsx
$B/src/app/(app)/orders/page.tsx
$B/src/app/(app)/products/page.tsx
$B/src/app/(app)/ingredients/page.tsx
$B/src/app/(app)/users/page.tsx
```

#### 2.4 Tables

Inspired by:

```text
$R1/src/components/data-table.tsx
$R2/src/components/data-table/**
$R2/src/hooks/use-data-table.ts
```

Target behavior:

- Toolbar order: search → facet filters → date filter → number filter → view options → actions.
- Active filters render as removable chips above the table.
- Sticky header with subtle background blur.
- Selection shows an action bar with count and bulk actions.
- Column visibility menu includes "Reset to default".
- Pagination shows range text (`1–10 of 84`) plus page size.
- Row context menu includes open/edit/duplicate/delete where applicable.
- Loading state renders a table-shaped skeleton with the same column widths.

Implementation target:

```text
$B/src/components/data-table.tsx
```

#### 2.5 Charts and reports

Inspired by:

```text
$R1/src/components/charts/*
$R2/src/features/overview/components/*
```

Target behavior:

- Revenue area chart: gradient fill plus dotted comparison line.
- Category/product bar chart: horizontal bars with hatch pattern for secondary series.
- Status/payment mix: donut with center total and a labeled legend list.
- Every chart has its own skeleton and inline error boundary.
- Print layout hides chrome, keeps title/date range/KPIs/charts/tables, and uses print color adjustment.
- CSV export uses the currently filtered/date-ranged dataset, not raw all-time data.

Implementation targets:

```text
$B/src/components/charts/*
$B/src/app/(app)/analytics/page.tsx
$B/src/app/globals.css
```

#### 2.6 Kanban / production

Inspired by:

```text
$R1/src/app/(app)/apps/kanban/page.tsx
$R2/src/components/ui/kanban.tsx
$R2/src/features/kanban/components/**
```

Target behavior:

- Columns are fixed-width with horizontal scroll; cards are compact and scannable.
- Drag overlay shows a rotated/lifted card; source card becomes low-opacity placeholder.
- Keyboard arrows move batches between stages; drag is an enhancement, not the only path.
- Each card shows batch code, product, quantity, due date, assignee initials, and status chip.
- WIP warning appears when a column exceeds a configured threshold.
- Calendar view and board view share the same filters.

Implementation target:

```text
$B/src/app/(app)/production/page.tsx
$B/src/components/ui/kanban.tsx
```

#### 2.7 Notifications

Inspired by:

```text
$R1/src/app/(app)/notifications/page.tsx
$R2/src/components/ui/notification-card.tsx
$R2/src/features/notifications/components/**
```

Target behavior:

- Inbox groups by Today / Earlier.
- Each notification has an icon tile, title, one-line context, timestamp, unread dot and primary action.
- Header popover shows latest five with "View all".
- Notification preferences from `$B/src/lib/notification-prefs.ts` filter both bell and page.
- Mark-all-read updates `localStorage` and badge count without a reload.

Implementation targets:

```text
$B/src/components/notification-bell.tsx
$B/src/components/ui/notification-card.tsx
$B/src/app/(app)/notifications/page.tsx
$B/src/hooks/use-notifications.ts
```

#### 2.8 Empty, error and loading states

Inspired by:

```text
$R1/src/components/error-state.tsx
$R1/src/app/errors/**
$R1/src/app/(app)/examples/empty-states/**
$R2/src/app/global-error.tsx
$R2/src/app/not-found.tsx
$R2/src/features/overview/components/*-skeleton.tsx
```

Target behavior:

- Empty states distinguish: no data yet, no search results, error, permission denied, loading.
- Every empty state has one primary recovery action and optional secondary link.
- Full-page errors show large code, short human explanation and two exits.
- Inline boundary errors keep the page shell visible.

Implementation targets:

```text
$B/src/components/error-view.tsx
$B/src/components/ui/empty.tsx
$B/src/app/not-found.tsx
$B/src/app/global-error.tsx
$B/src/app/errors/**
```

#### 2.9 Theme and motion

Inspired by:

```text
$R1/src/components/theme-customizer.tsx
$R1/src/components/theme-toggle.tsx
$R2/src/components/themes/**
$R2/src/styles/themes/*.css
$R2/src/lib/theme-transition.ts
```

Target behavior:

- Keep Bakery's circular reveal and reduced-motion handling.
- Add optional named presets as one-click combinations of accent/radius/font/sidebar/layout.
- Theme customizer shows a live preview card, not just controls.
- Persist presets in the same localStorage mechanism already used by `$B/src/lib/theme-config.ts`.

Implementation targets:

```text
$B/src/components/theme-customizer.tsx
$B/src/lib/theme-config.ts
$B/src/lib/theme-transition.ts
```

---

### 3. Module additions

All modules below are client-derived from existing APIs; no new backend is required.

| Module | Route | Data source | Reference inspiration | Value |
|---|---|---|---|---|
| Global search / command palette | header overlay | `/orders`, `/products`, `/customers` + nav config | `$R2/src/components/kbar/*`, `$R1/src/components/app-header.tsx` | Fast navigation and actions. |
| Invoice center | `/invoices`, `/invoices/[id]` | `/orders`, `/customers` | `$R1/src/app/(app)/invoices/**` | Formal printable sales documents. |
| Activity feed | `/activity` | `/orders`, `/batches`, `/expenses`, `/users` | `$R1/src/app/(app)/activity/page.tsx` | Operational timeline. |
| Profile | `/profile` | `/api/auth/me`, `/api/users/[id]` | `$R1/src/app/(app)/profile/**` | Self-service account editing. |
| Roles & permissions | `/roles` | `/api/users`, existing role strings | `$R1/src/app/(app)/roles/page.tsx`, `$R2/src/types/index.ts` | Explains admin/staff capability boundary. |
| Help center | `/help` | static contextual content | `$R1/src/app/(app)/help/**`, `$R2/src/components/ui/infobar.tsx` | Reduces support friction. |
| UI/design showcase | `/dev/ui` or docs-only | none | `$R1/src/app/(app)/examples/**` | Internal design-system reference; optional, gate behind `NEXT_PUBLIC_DEV_UI=1`. |

Do not add: AI chat, storefront, cart, checkout, crypto, marketing landing pages, maintenance/coming-soon pages, or industry dashboards.

---

### 4. Copy / adapt matrix

| Reference area | Status | Action |
|---|---|---|
| `$R1/src/components/ui/*` | All 34 already present | Do not copy. |
| `$R1/src/hooks/*`, `$R1/src/lib/utils.ts`, `$R1/src/lib/theme-config.ts` | Already present | Do not copy. |
| `$R1/src/components/error-state.tsx`, `$R1/src/app/errors/*`, `$R1/src/app/not-found.tsx` | Absent | Adapt/rebrand in Task 3. |
| `$R1/src/components/charts/analytics-line-chart.tsx`, `category-bar-chart.tsx`, `traffic-donut-chart.tsx`, `visitors-bar-chart.tsx` | Absent | Use as styling recipes in Task 16. |
| `$R1/src/data/index.ts` | Mock-only | Never copy. |
| `$R2/src/components/ui/*` | Base UI implementations | Port behavior to Radix; do not drop in. |
| `$R2/src/components/data-table/*` | Stronger architecture; v9/nuqs | Port low-risk pieces in Task 1; full migration gated in Task 7. |
| `$R2/src/lib/form*.ts`, `$R2/src/components/forms/**` | Absent system | Adapt in Task 5. |
| `$R2/src/lib/query-client.ts`, React Query features | Absent system | Adapt in Task 6. |
| `$R2/src/components/ui/kanban.tsx`, `$R2/src/features/kanban/**` | Absent DnD system | Adapt in Task 8. |
| `$R2/src/components/kbar/*` | Absent command system | Reimplement with cmdk in Task 9 unless KBar is approved. |
| `$R2/src/features/notifications/**`, `ui/notification-card.tsx` | Partial | Adapt action model in Task 10. |
| `$R2/src/components/file-uploader.tsx`, `ui/file-preview.tsx` | Partial | Adapt UX in Task 11. |
| `$R2/src/styles/themes/*.css` | Absent presets | Cherry-pick palettes in Task 16. |
| `$R2/src/features/ai-chat/**`, `$R2/src/features/chat/**`, React Query Pokemon demo | Demo-only | Never copy. |

---

## File Structure

Files and folders this plan creates or modifies:

```text
$B/docs/superpowers/plans/2026-11-23-r1-r2-ui-expansion.md   # this document

# Shared utilities / primitives
$B/src/hooks/use-breadcrumbs.ts
$B/src/hooks/use-debounce.ts
$B/src/hooks/use-debounced-callback.ts
$B/src/hooks/use-controllable-state.ts
$B/src/hooks/use-callback-ref.ts
$B/src/lib/compose-refs.ts
$B/src/lib/format.ts                                            # add formatBytes
$B/src/components/ui/pagination.tsx
$B/src/components/ui/notification-card.tsx
$B/src/components/ui/file-preview.tsx
$B/src/components/ui/item.tsx
$B/src/components/ui/marker.tsx
$B/src/components/ui/button-group.tsx
$B/src/components/ui/aspect-ratio.tsx
$B/src/components/data-table/data-table-skeleton.tsx
$B/src/components/data-table/data-table-pagination.tsx
$B/src/components/data-table/data-table-view-options.tsx
$B/src/components/form-card-skeleton.tsx

# Shell / chrome
$B/src/components/breadcrumbs.tsx
$B/src/components/app-shell.tsx
$B/src/components/app-header.tsx
$B/src/components/app-sidebar.tsx
$B/src/components/page-header.tsx
$B/src/components/info-panel.tsx
$B/src/components/error-state.tsx
$B/src/config/nav.ts
$B/src/app/not-found.tsx
$B/src/app/global-error.tsx
$B/src/app/errors/403/page.tsx
$B/src/app/errors/404/page.tsx
$B/src/app/errors/500/page.tsx
$B/src/app/errors/503/page.tsx

# Forms
$B/src/lib/form.ts
$B/src/lib/form-context.ts
$B/src/hooks/use-stepper.tsx
$B/src/components/forms/submit-button.tsx
$B/src/components/forms/fields/*.tsx
$B/src/app/(app)/orders/page.tsx

# Data layer
$B/src/lib/query-client.ts
$B/src/components/layout/query-provider.tsx
$B/src/features/products/api/*
$B/src/features/users/api/*
$B/src/app/(app)/layout.tsx
$B/src/app/(app)/products/page.tsx
$B/src/app/(app)/users/page.tsx

# Kanban
$B/src/components/ui/kanban.tsx
$B/src/features/kanban/utils/restrict-to-container.ts
$B/src/app/(app)/production/page.tsx

# Command / notifications / uploads
$B/src/components/command-palette.tsx
$B/src/components/notification-bell.tsx
$B/src/app/(app)/notifications/page.tsx
$B/src/components/ui/file-uploader.tsx
$B/src/app/(app)/products/page.tsx

# New modules
$B/src/app/(app)/invoices/page.tsx
$B/src/app/(app)/invoices/[id]/page.tsx
$B/src/app/(app)/activity/page.tsx
$B/src/app/(app)/profile/page.tsx
$B/src/app/(app)/roles/page.tsx
$B/src/app/(app)/help/page.tsx
$B/src/config/info-content.ts

# Theme / charts / verification
$B/src/lib/theme-presets.ts
$B/src/components/theme-customizer.tsx
$B/src/components/charts/*.tsx
$B/scripts/smoke-routes.sh
```

---

## Dependency Ledger

Copy these from `$R2/node_modules` only when the owning task starts. Do not bulk-copy the whole tree.

| Package | Owning task | Source directory |
|---|---|---|
| `@tanstack/react-form` | Task 5 | `$R2/node_modules/@tanstack/react-form` |
| `@tanstack/store` | Tasks 5, 8 | `$R2/node_modules/@tanstack/store` |
| `@tanstack/react-query` | Task 6 | `$R2/node_modules/@tanstack/react-query` |
| `@tanstack/query-core` | Task 6 | `$R2/node_modules/@tanstack/query-core` |
| `@tanstack/react-query-devtools` | Task 6 | `$R2/node_modules/@tanstack/react-query-devtools` |
| `nuqs` | Task 7 only if gate approved | `$R2/node_modules/nuqs` |
| `@tanstack/react-table` v9 | Task 7 only if gate approved | `$R2/node_modules/@tanstack/react-table` |
| `zustand` | Tasks 8, 10 if store used | `$R2/node_modules/zustand` |
| `uuid` | Task 8 | `$R2/node_modules/uuid` |
| `@dnd-kit/core` | Task 8 | `$R2/node_modules/@dnd-kit/core` |
| `@dnd-kit/sortable` | Task 8 | `$R2/node_modules/@dnd-kit/sortable` |
| `@dnd-kit/modifiers` | Task 8 | `$R2/node_modules/@dnd-kit/modifiers` |
| `@dnd-kit/utilities` | Task 8 | `$R2/node_modules/@dnd-kit/utilities` |
| `kbar` | Task 9 only if KBar chosen | `$R2/node_modules/kbar` |
| `react-dropzone` | Task 11 only if dropzone chosen | `$R2/node_modules/react-dropzone` |
| `nextjs-toploader` | Optional shell polish | `$R2/node_modules/nextjs-toploader` |
| `match-sorter`, `sort-by` | Task 9 if KBar chosen | `$R2/node_modules/match-sorter`, `$R2/node_modules/sort-by` |

Never copy: `@ai-sdk/react`, `ai`, `@shadcn/helpers`, `@shadcn/react`, `@faker-js/faker`.

---

## Tasks

### Task 0: Baseline verification and smoke script

**Files:**
- Create: `scripts/smoke-routes.sh`
- Modify: none
- Test: `scripts/smoke-routes.sh`

**Interfaces:**
- Consumes: existing dev server on port `3111`, demo credentials.
- Produces: reusable smoke command for every later task.

- [ ] **Step 1: Create `scripts/smoke-routes.sh`**

Script requirements:
- Accept optional `BASE_URL`, default `http://127.0.0.1:3111`.
- Log in with `admin@bakery.test / admin123` into `/tmp/opencode/bakery-smoke-cookies.txt`.
- Check status `200` for: `/`, `/orders`, `/products`, `/customers`, `/ingredients`, `/suppliers`, `/expenses`, `/users`, `/production`, `/analytics`, `/notifications`, `/settings`, `/api/health`.
- Print one `path status` line per route.
- Exit non-zero if any route is not `200`.

- [ ] **Step 2: Run baseline verification**

Run:

```bash
chmod +x scripts/smoke-routes.sh
./node_modules/.bin/tsc --noEmit
./scripts/smoke-routes.sh
```

Expected: typecheck exit `0`; all routes `200`.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke-routes.sh
git commit -m "chore: add app route smoke script"
```

---

### Task 1: Port low-risk UI primitives and hooks

**Files:**
- Create: `src/hooks/use-breadcrumbs.ts`, `src/hooks/use-debounce.ts`, `src/hooks/use-debounced-callback.ts`, `src/hooks/use-controllable-state.ts`, `src/hooks/use-callback-ref.ts`, `src/lib/compose-refs.ts`
- Create: `src/components/ui/pagination.tsx`, `src/components/ui/item.tsx`, `src/components/ui/marker.tsx`, `src/components/ui/button-group.tsx`, `src/components/ui/aspect-ratio.tsx`
- Create: `src/components/data-table/data-table-skeleton.tsx`, `src/components/data-table/data-table-pagination.tsx`, `src/components/data-table/data-table-view-options.tsx`, `src/components/form-card-skeleton.tsx`
- Modify: `src/lib/format.ts`
- Test: `./node_modules/.bin/tsc --noEmit`

**Interfaces:**
- Consumes: `$R2/src/hooks/use-debounce.tsx`, `use-controllable-state.tsx`, `use-callback-ref.tsx`, `lib/compose-refs.ts`, `$R2/src/components/data-table/data-table-skeleton.tsx`, `$R2/src/components/ui/pagination.tsx`.
- Produces: `useDebounce<T>(value, delay)`, `useDebouncedCallback`, `useControllableState`, `useBreadcrumbs`, `Pagination`, `DataTableSkeleton`, `DataTablePagination`, `DataTableViewOptions`, `FormCardSkeleton`, `formatBytes(bytes)`.

- [ ] **Step 1: Adapt hooks without Base UI**

Port hook bodies from r2 but keep them framework-neutral. Remove any Base UI imports. For `useBreadcrumbs`, read `$B/src/config/nav.ts` and `usePathname`; unknown segments become title-cased text.

- [ ] **Step 2: Adapt missing primitives to Radix/plain elements**

Port component structure and class names, replacing Base UI `render` props with Bakery's existing Radix `asChild` patterns or plain elements. `Pagination`, `Item`, `Marker`, `ButtonGroup`, `AspectRatio` must not introduce new dependencies.

- [ ] **Step 3: Adapt table/form skeletons**

Create the table/form skeleton files using `$B/src/components/ui/skeleton.tsx`. `DataTableSkeleton` accepts `columns: number`, `rows?: number`, `showToolbar?: boolean`. `FormCardSkeleton` accepts `fields?: number`.

- [ ] **Step 4: Add `formatBytes`**

Add `export function formatBytes(bytes: number): string` to `$B/src/lib/format.ts`, copied from `$R2/src/lib/utils.ts`, handling `0`, negative values and units through `TB`.

- [ ] **Step 5: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: exit `0`.

- [ ] **Step 6: Commit**

```bash
git add src/hooks src/lib/compose-refs.ts src/lib/format.ts src/components/ui src/components/data-table src/components/form-card-skeleton.tsx
git commit -m "feat: port low-risk r2 UI primitives and hooks"
```

---

### Task 2: Shell polish, breadcrumbs and contextual info

**Files:**
- Create: `src/components/breadcrumbs.tsx`
- Modify: `src/components/app-shell.tsx`, `src/components/app-header.tsx`, `src/components/app-sidebar.tsx`, `src/components/page-header.tsx`, `src/components/info-panel.tsx`, `src/config/nav.ts`
- Test: `scripts/smoke-routes.sh`

**Interfaces:**
- Consumes: `useBreadcrumbs` from Task 1, existing nav config, auth context.
- Produces: consistent breadcrumbs in header, skip link in shell, page-level info rail content hook.

- [ ] **Step 1: Add skip link and fixed shell refinement**

In `$B/src/components/app-shell.tsx`, add a visually hidden "Skip to content" link as the first focusable element targeting `#main-content`. Ensure the main element has `id="main-content"` and `tabIndex={-1}`.

- [ ] **Step 2: Add breadcrumbs to header**

Mount `Breadcrumbs` below or beside the existing page title in `$B/src/components/app-header.tsx`. Use `useBreadcrumbs()` and keep it hidden on narrow screens only if header overflow would occur.

- [ ] **Step 3: Refine page header zones**

Update `$B/src/components/page-header.tsx` to support explicit `eyebrow`, `description`, `actions` and optional `meta` slots. Existing call sites must continue to compile unchanged.

- [ ] **Step 4: Add contextual info content**

Create `$B/src/config/info-content.ts` mapping route prefixes to title/summary/bullets/links. Wire `InfoPanel` to fall back to generic Bakery help when a route has no entry.

- [ ] **Step 5: Verify auth and routes**

Run:

```bash
./node_modules/.bin/tsc --noEmit
./scripts/smoke-routes.sh
```

Expected: typecheck exit `0`; all routes `200`.

- [ ] **Step 6: Commit**

```bash
git add src/components/breadcrumbs.tsx src/components/app-shell.tsx src/components/app-header.tsx src/components/app-sidebar.tsx src/components/page-header.tsx src/components/info-panel.tsx src/config
git commit -m "feat: polish app shell with breadcrumbs and contextual help"
```

---

### Task 3: Error, not-found and empty-state chrome

**Files:**
- Create: `src/components/error-state.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx`, `src/app/errors/403/page.tsx`, `src/app/errors/404/page.tsx`, `src/app/errors/500/page.tsx`, `src/app/errors/503/page.tsx`
- Modify: `src/components/error-view.tsx`, `src/components/ui/empty.tsx`
- Test: direct unknown route returns app 404 page.

**Interfaces:**
- Consumes: `$R1/src/components/error-state.tsx`, `$R1/src/app/errors/**`, `$B/src/components/error-view.tsx`.
- Produces: `ErrorState({code,title,description,primaryHref,primaryLabel,secondaryHref,secondaryLabel})`.

- [ ] **Step 1: Adapt `ErrorState`**

Port `$R1/src/components/error-state.tsx`, rebrand from OrbynAdmin to Bakery Manager, change default dashboard link to `/`, and keep gradient code + grid glow background.

- [ ] **Step 2: Add top-level error routes**

Create thin wrappers around `ErrorState` for `not-found`, `global-error`, and `errors/{403,404,500,503}`. Each route uses only existing UI primitives.

- [ ] **Step 3: Strengthen inline empty/error variants**

Update `$B/src/components/ui/empty.tsx` to expose variants `no-data`, `no-results`, `error`, `permission`, `loading`, each with default title/description/action copy appropriate to bakery operations.

- [ ] **Step 4: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
curl -s -o /dev/null -w 'not-found:%{http_code}\n' --max-time 30 http://127.0.0.1:3111/this-route-does-not-exist
```

Expected: typecheck exit `0`; `not-found:404` and response contains the new 404 page markup when fetched without `-o /dev/null`.

- [ ] **Step 5: Commit**

```bash
git add src/components/error-state.tsx src/components/error-view.tsx src/components/ui/empty.tsx src/app/not-found.tsx src/app/global-error.tsx src/app/errors
git commit -m "feat: add branded error and not-found pages"
```

---

### Task 4: Notification card and rich uploader UX

**Files:**
- Create: `src/components/ui/notification-card.tsx`, `src/components/ui/file-preview.tsx`
- Modify: `src/components/notification-bell.tsx`, `src/app/(app)/notifications/page.tsx`, `src/components/ui/file-uploader.tsx`, `src/app/(app)/products/page.tsx`
- Test: `scripts/smoke-routes.sh`

**Interfaces:**
- Consumes: `useNotifications()` from `$B/src/hooks/use-notifications.ts`, existing `/api/uploads` API.
- Produces: `NotificationCard`, `FilePreview`, richer uploader callbacks.

- [ ] **Step 1: Adapt notification card**

Port the visual anatomy from `$R2/src/components/ui/notification-card.tsx`: icon tile, title, context line, relative time, unread dot, action button. Map r2 action types to Bakery actions: `open-order`, `open-product`, `open-customer`, `open-notifications`.

- [ ] **Step 2: Wire notification card into bell and page**

Use `NotificationCard` in the header popover with a five-item cap and in `/notifications` with Today/Earlier groups. Keep read state in `localStorage` and preference filtering unchanged.

- [ ] **Step 3: Add file preview**

Create `FilePreview` using native `<img>`/object URL or the authenticated `/api/uploads/[filename]` URL. Show filename, `formatBytes(size)`, remove button and upload state.

- [ ] **Step 4: Upgrade uploader UX without changing storage**

Add drag-over state, rejection messages, preview list and progress-ish pending state to `$B/src/components/ui/file-uploader.tsx`. Continue uploading through `/api/uploads`; do not add `react-dropzone` unless native drag/drop proves insufficient.

- [ ] **Step 5: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
./scripts/smoke-routes.sh
```

Expected: typecheck exit `0`; all routes `200`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/notification-card.tsx src/components/ui/file-preview.tsx src/components/ui/file-uploader.tsx src/components/notification-bell.tsx "src/app/(app)/notifications/page.tsx" "src/app/(app)/products/page.tsx"
git commit -m "feat: enrich notification and upload experiences"
```

---

### Task 5: TanStack Form foundation and validated order wizard

**Files:**
- Copy deps: `@tanstack/react-form`, `@tanstack/store` from `$R2/node_modules`
- Create: `src/lib/form.ts`, `src/lib/form-context.ts`, `src/hooks/use-stepper.tsx`, `src/components/forms/submit-button.tsx`, `src/components/forms/fields/*.tsx`
- Modify: `package.json`, `src/app/(app)/orders/page.tsx`
- Test: typecheck, build, create-order smoke.

**Interfaces:**
- Consumes: Zod v3 schemas defined locally in Bakery, existing `/api/orders`, `/api/products`, `/api/customers`.
- Produces: `useAppForm`, `useFormStepper`, `SubmitButton`, field wrappers, validated 3-step order wizard.

- [ ] **Step 1: Stage dependencies**

Copy the two package directories from `$R2/node_modules` into `$B/node_modules` and add matching versions to `$B/package.json`. Do not run `npm install`.

- [ ] **Step 2: Adapt form factory**

Port `$R2/src/lib/form-context.ts` and `$R2/src/lib/form.ts`, removing Zod 4-only syntax. Register only fields Bakery uses now: text, textarea, select, checkbox, switch, date, file and slider.

- [ ] **Step 3: Adapt stepper validation**

Port `$R2/src/hooks/use-stepper.tsx` to accept explicit per-step Zod schemas. Preserve Bakery's visual `Stepper` component; the hook only supplies validation state and navigation guards.

- [ ] **Step 4: Convert order wizard**

Refactor `$B/src/app/(app)/orders/page.tsx` to use `useAppForm` and `useFormStepper`. Requirements:
- Step 1 validates at least one order item.
- Step 2 validates order type/customer/date as applicable.
- Step 3 validates payment amount is non-negative and does not exceed total.
- Final review revalidates all steps before POST.

- [ ] **Step 5: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build
```

Expected: both exit `0`. Then manually create a test order through the wizard and confirm it appears in `/orders`.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/form.ts src/lib/form-context.ts src/hooks/use-stepper.tsx src/components/forms "src/app/(app)/orders/page.tsx"
git commit -m "feat: add validated TanStack form order wizard"
```

---

### Task 6: React Query layer and converted product/user pages

**Files:**
- Copy deps: `@tanstack/react-query`, `@tanstack/query-core`, optional devtools
- Create: `src/lib/query-client.ts`, `src/components/layout/query-provider.tsx`, `src/features/products/api/*`, `src/features/users/api/*`
- Modify: `src/app/(app)/layout.tsx`, `src/app/(app)/products/page.tsx`, `src/app/(app)/users/page.tsx`
- Test: typecheck, build, smoke.

**Interfaces:**
- Consumes: `$B/src/lib/api-client.ts`, existing `/api/products`, `/api/users`.
- Produces: `QueryProvider`, `productsQueryOptions`, `usersQueryOptions`, query-key factories, mutation hooks.

- [ ] **Step 1: Stage React Query dependencies**

Copy package directories and add versions to `package.json`. Include devtools only if the reference devtools package resolves offline.

- [ ] **Step 2: Create provider and wire app layout**

Port `$R2/src/lib/query-client.ts` as a browser singleton. Mount `QueryProvider` inside `$B/src/components/app-shell.tsx` or `$B/src/app/(app)/layout.tsx` without disturbing auth provider order.

- [ ] **Step 3: Create query factories**

For products and users, create `api/types.ts`, `api/service.ts` and `api/queries.ts`. Services must call `$B/src/lib/api-client.ts`; no faker/delay/mock data.

- [ ] **Step 4: Convert product and user pages**

Replace `useEffect` fetch blocks with query hooks. Keep existing UI, filters and DataTable columns unchanged. Mutations must invalidate the relevant query keys after success.

- [ ] **Step 5: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build
./scripts/smoke-routes.sh
```

Expected: typecheck/build exit `0`; all routes `200`.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/query-client.ts src/components/layout src/features "src/app/(app)/layout.tsx" "src/app/(app)/products/page.tsx" "src/app/(app)/users/page.tsx"
git commit -m "feat: add React Query data layer for products and users"
```

---

### Task 7: Gated full modular data-table migration

> **Decision gate:** only execute after Tasks 5 and 6 are stable. If approved, copy TanStack Table v9 + `nuqs` and replace the v8 engine. If not approved, stop after the low-risk table components from Task 1.

**Files:**
- Copy deps: `@tanstack/react-table` v9, `nuqs`, zod 4 only if fully isolated
- Create: `src/components/data-table/*` full set, `src/hooks/use-data-table.ts`, `src/lib/data-table-*.ts`, `src/lib/searchparams.ts`, `src/app/api/[[...slug]]` only if server parsing is required
- Modify: all list pages using `DataTable`
- Test: full typecheck/build/smoke plus URL-state regression.

**Interfaces:**
- Consumes: `$R2/src/hooks/use-data-table.ts` and `$R2/src/lib/data-table-*.ts`.
- Produces: modular `DataTable`, `useDataTable`, URL parser/serializer.

- [ ] **Step 1: Record rollback point**

Run `git rev-parse HEAD` and save the hash in the task notes. Create branch `feat/tanstack-table-v9`.

- [ ] **Step 2: Stage dependencies and pin versions**

Copy v9 and `nuqs` packages. Do not upgrade global Zod; rewrite parsers to Zod v3 first.

- [ ] **Step 3: Port table engine**

Port the r2 data-table modules and adapt Base UI parts to Radix. Preserve Bakery features: context menus, customer hover cards, faceted/date/number filters, Bakery empty copy.

- [ ] **Step 4: Migrate one page first**

Convert `/products` only. Verify URL keys `q`, `sort`, `filters`, `cols`, `page`, `size` still work.

- [ ] **Step 5: Migrate remaining pages**

Convert orders, customers, ingredients, expenses and users after `/products` passes.

- [ ] **Step 6: Verify URL-state regression**

Run:

```bash
./node_modules/.bin/tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build
./scripts/smoke-routes.sh
curl -s -o /dev/null -w 'filtered-products:%{http_code}\n' --max-time 30 'http://127.0.0.1:3111/products?q=zzzz&sort=name.asc&page=1&size=10'
```

Expected: typecheck/build exit `0`; all routes `200`; filtered URL remains `200` and renders designed empty state.

- [ ] **Step 7: Commit or roll back**

If all checks pass:

```bash
git add package.json src/components/data-table src/hooks/use-data-table.ts src/lib/data-table-* src/lib/searchparams.ts "src/app/(app)"
git commit -m "feat: migrate data tables to modular v9 system"
```

If checks fail, return to the rollback hash and keep Task 1's v8-compatible table components.

---

### Task 8: Upgrade production Kanban with dnd-kit

**Files:**
- Copy deps: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`, `@dnd-kit/utilities`, `zustand`, `uuid`
- Create: `src/components/ui/kanban.tsx`, `src/features/kanban/utils/restrict-to-container.ts`
- Modify: `package.json`, `src/app/(app)/production/page.tsx`
- Test: typecheck/build + batch move smoke.

**Interfaces:**
- Consumes: existing `/api/batches`, `/api/products`, `BakeBatch` type.
- Produces: `Kanban`, `KanbanColumn`, `KanbanItem`, `KanbanItemHandle`, container-confined drag modifier.

- [ ] **Step 1: Stage dependencies**

Copy dnd-kit, zustand and uuid directories; add versions to `package.json`.

- [ ] **Step 2: Adapt Kanban primitive**

Port `$R2/src/components/ui/kanban.tsx` structurally. Keep Bakery class names and Radix-compatible composition. No fake tasks or demo store.

- [ ] **Step 3: Wire real batches**

Replace custom drag logic in `/production` with the new primitive. Drag end and keyboard arrow handlers must both call the existing stage PATCH endpoint.

- [ ] **Step 4: Add drag affordances**

Add drag handle, drag overlay, low-opacity source placeholder, WIP warning and horizontal scroll. Preserve Board/Calendar toggle and unscheduled list.

- [ ] **Step 5: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build
./scripts/smoke-routes.sh
```

Expected: typecheck/build exit `0`; `/production` returns `200`; moving a batch updates stage via PATCH.

- [ ] **Step 6: Commit**

```bash
git add package.json src/components/ui/kanban.tsx src/features/kanban "src/app/(app)/production/page.tsx"
git commit -m "feat: upgrade production board with dnd-kit interactions"
```

---

### Task 9: Global command palette

**Files:**
- Create: `src/components/command-palette.tsx`
- Modify: `src/components/app-header.tsx`, `src/components/app-shell.tsx`, `src/config/nav.ts`
- Test: keyboard shortcut smoke + typecheck.

**Interfaces:**
- Consumes: `allNavItems` from `$B/src/config/nav.ts`, theme setter, router.
- Produces: global command dialog with nav, create and theme action groups.

- [ ] **Step 1: Reimplement with existing cmdk**

Use `$B/src/components/ui/command.tsx`; do not add KBar. Port only action grouping and keyboard legend ideas from `$R2/src/components/kbar/*`.

- [ ] **Step 2: Define action groups**

Groups: Navigate, Create, View, Appearance. Actions: go to each nav route, new order, open notifications, open analytics, switch theme, toggle radius/font if exposed.

- [ ] **Step 3: Mount once and open from anywhere**

Mount `CommandPalette` in `$B/src/components/app-shell.tsx`. Keep header search button as a trigger. `Cmd/Ctrl+K` toggles globally.

- [ ] **Step 4: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
./scripts/smoke-routes.sh
```

Expected: typecheck exit `0`; all routes `200`; pressing `Cmd/Ctrl+K` opens palette and selecting "Go to Orders" navigates to `/orders`.

- [ ] **Step 5: Commit**

```bash
git add src/components/command-palette.tsx src/components/app-header.tsx src/components/app-shell.tsx src/config/nav.ts
git commit -m "feat: add global command palette"
```

---

### Task 10: Invoice center

**Files:**
- Create for each route: `page.tsx`, `loading.tsx`, `error.tsx`
  - `src/app/(app)/invoices/`
  - `src/app/(app)/invoices/[id]/`
- Modify: `src/config/nav.ts`, `src/app/(app)/orders/[id]/page.tsx`
- Test: invoice list/detail smoke.

**Interfaces:**
- Consumes: `/orders`, `/customers`, existing printable receipt styles in `$B/src/app/(app)/orders/[id]/page.tsx`.
- Produces: invoice list, invoice detail, print/download actions derived from orders.

- [ ] **Step 1: Build invoice list page**

Reuse `DataTable` with columns: invoice number, customer, order date, total, paid amount, status, actions. Derive invoice number from order id, e.g. `INV-000123`.

- [ ] **Step 2: Build invoice detail page**

Client component with `use(params)` for Next 16 dynamic params. Render issuer "Bakery Manager", customer block, line items, totals, payment status and print button.

- [ ] **Step 3: Reuse print CSS**

Use existing `hidden print:block` pattern and global `@media print` chrome hiding from the order detail page. Do not duplicate conflicting print rules.

- [ ] **Step 4: Add nav and cross-link**

Add Invoices to nav under Operations. Add "View invoice" action on order detail for paid/completed orders.

- [ ] **Step 5: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
./scripts/smoke-routes.sh
ID=$(curl -s -b /tmp/opencode/bakery-smoke-cookies.txt http://127.0.0.1:3111/api/orders | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const rows=Array.isArray(j)?j:(j.data??j.orders??[]);const first=rows.find(r=>r&&(r.id??r.orderId));process.stdout.write(String(first?.id??first?.orderId??""));})')
if [ -n "$ID" ]; then
  curl -s -o /dev/null -w 'invoice-detail:%{http_code}\n' --max-time 30 "http://127.0.0.1:3111/invoices/$ID"
else
  echo 'invoice-detail:SKIP (no orders seeded)'
fi
```

Expected: typecheck exit `0`; list `200`; detail `200` when an order exists.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/invoices" src/config/nav.ts "src/app/(app)/orders/[id]/page.tsx"
git commit -m "feat: add invoice center derived from orders"
```

---

### Task 11: Activity feed, profile, roles and help modules

**Files:**
- Create for each route: `page.tsx`, `loading.tsx`, `error.tsx`
  - `src/app/(app)/activity/`
  - `src/app/(app)/profile/`
  - `src/app/(app)/roles/`
  - `src/app/(app)/help/`
- Modify: `src/config/nav.ts`, `src/config/info-content.ts`, `src/components/app-header.tsx`
- Test: all new routes smoke with admin and staff cookies.

**Interfaces:**
- Consumes: `/orders`, `/batches`, `/expenses`, `/users`, `/api/auth/me`.
- Produces: four real-data/static modules with no backend changes.

- [ ] **Step 1: Activity feed**

Derive events from existing list APIs: new order, status change, payment recorded, batch created/stage moved, expense added, user created. Group by day and render with `Item`/`Avatar`/`Badge`.

- [ ] **Step 2: Profile page**

Read `/api/auth/me`; edit name/email through existing `/api/users/[id]`. Password change is out of scope until a real endpoint exists.

- [ ] **Step 3: Roles overview**

Render an admin/staff capability matrix from local config plus `/api/users`. Hide management actions from staff. This is explanatory UI, not new authorization logic.

- [ ] **Step 4: Help center**

Use `$B/src/config/info-content.ts` from Task 2 to render searchable help cards: Orders, Production, Inventory, Analytics, Settings. Link each card to the relevant route.

- [ ] **Step 5: Nav and header wiring**

Add the four routes to nav groups. Link header help icon to `/help`.

- [ ] **Step 6: Verify both roles**

Run:

```bash
./node_modules/.bin/tsc --noEmit
./scripts/smoke-routes.sh
for path in /activity /profile /roles /help; do
  code=$(curl -s -o /dev/null -b /tmp/opencode/bakery-smoke-cookies.txt -w '%{http_code}' --max-time 30 "http://127.0.0.1:3111$path")
  printf '%-12s %s\n' "$path" "$code"
done
```

Expected: typecheck exit `0`; every new route `200`; staff view shows no admin create/delete actions.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/activity" "src/app/(app)/profile" "src/app/(app)/roles" "src/app/(app)/help" src/config/nav.ts src/config/info-content.ts src/components/app-header.tsx
git commit -m "feat: add activity, profile, roles and help modules"
```

---

### Task 12: Theme presets, richer charts and visual consistency pass

**Files:**
- Create: `src/lib/theme-presets.ts`
- Modify: `src/components/theme-customizer.tsx`, `src/components/charts/*.tsx`, `src/app/globals.css`, `src/components/stat-card.tsx`
- Test: typecheck/build + reduced-motion check.

**Interfaces:**
- Consumes: `$R2/src/styles/themes/*.css` palettes, `$R2/src/features/overview/components/*` chart styling, existing Bakery theme config.
- Produces: named theme presets, patterned chart recipes, consistent card/stat visuals.

- [ ] **Step 1: Add named presets**

Create five presets only: `Bakery Warm` (default), `Midnight Oven`, `Cocoa`, `Cream Mint`, `High Contrast`. Each maps to existing accent/radius/font/sidebar/layout variables. Do not import r2 theme CSS wholesale.

- [ ] **Step 2: Add live preview to customizer**

Show a mini card with button, badge, input and chart swatch that updates as controls change. Keep circular reveal and reduced-motion guard.

- [ ] **Step 3: Upgrade chart styling**

Apply r2-inspired dotted pattern to revenue area, hatch pattern to expense series, and label list to status/payment donut in analytics. Preserve current data calculations and print rules.

- [ ] **Step 4: Card consistency pass**

Normalize padding, radius, border tint, hover lift and skeleton geometry across stat cards, chart cards, list cards and detail cards.

- [ ] **Step 5: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build
./scripts/smoke-routes.sh
```

Expected: typecheck/build exit `0`; all routes `200`; reduced-motion browser check shows no circular reveal.

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme-presets.ts src/components/theme-customizer.tsx src/components/charts src/components/stat-card.tsx src/app/globals.css
git commit -m "feat: add theme presets and richer chart styling"
```

---

### Task 13: Optional UI/design showcase

> **Decision gate:** only add if an internal design-system page is wanted. If not, keep the inspiration in this document and skip this task.

**Files:**
- Create: `src/app/dev/ui/page.tsx`, `src/app/dev/ui/loading.tsx`, `src/app/dev/ui/error.tsx`
- Modify: `src/config/nav.ts`
- Test: route smoke.

**Interfaces:**
- Consumes: all primitives from `$B/src/components/ui/*`.
- Produces: internal gallery of buttons, fields, cards, tables, charts, empty/error states.

- [ ] **Step 1: Gate the route**

Render content only when `process.env.NEXT_PUBLIC_DEV_UI === "1"`; otherwise call `notFound()`.

- [ ] **Step 2: Build gallery sections**

Sections: Foundations, Buttons, Inputs, Feedback, Data Display, Charts, Empty/Error, Patterns.

- [ ] **Step 3: Do not add demo data to production pages**

All sample values live only inside this gated route.

- [ ] **Step 4: Verify**

Run:

```bash
./node_modules/.bin/tsc --noEmit
./scripts/smoke-routes.sh
```

Expected: typecheck exit `0`; gated route returns `404` unless env flag is set.

- [ ] **Step 5: Commit**

```bash
git add "src/app/dev/ui" src/config/nav.ts
git commit -m "feat: add gated internal UI showcase"
```

---

### Task 14: Final verification and documentation update

**Files:**
- Modify: `README.md`, this plan file
- Test: full verification suite.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: updated run/verification notes and completed task checkboxes.

- [ ] **Step 1: Run full verification**

Run:

```bash
./node_modules/.bin/tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build
./scripts/smoke-routes.sh
```

Expected: all exit `0`; every core route `200`.

- [ ] **Step 2: Verify demo accounts and roles**

Sign in with both:
- `admin@bakery.test / admin123`
- `staff@bakery.test / staff123`

Check that admin sees management actions and staff does not.

- [ ] **Step 3: Update README**

Document new routes, dev command, smoke command, environment flag for `/dev/ui`, and note that new modules are derived from existing APIs.

- [ ] **Step 4: Mark completed tasks in this plan**

Tick all executed task checkboxes. For skipped gated tasks, add `Skipped: <reason>` under the task heading.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/plans/2026-11-23-r1-r2-ui-expansion.md
git commit -m "docs: update implementation plan and verification notes"
```

---

## Self-Review Coverage Map

| Requirement from user | Covered by |
|---|---|
| Layout learnings from r1/r2 | Spec §2.1, Task 2 |
| Cards | Spec §2.2, Task 12 |
| Forms | Spec §2.3, Task 5 |
| Tables | Spec §2.4, Tasks 1 and 7 |
| Charts/reports | Spec §2.5, Task 12 |
| Kanban/production | Spec §2.6, Task 8 |
| Notifications | Spec §2.7, Task 4 |
| Empty/error states | Spec §2.8, Task 3 |
| Theme/motion | Spec §2.9, Task 12 |
| Module additions | Spec §3, Tasks 9–13 |
| Everything from prior "what more can be copied" answer | Copy matrix §4, dependency ledger, Tasks 1–13 |
| Preserve backend/auth/Prisma | Global Constraints, all tasks use existing APIs |
| Offline dependency reality | Dependency Ledger |
| Do-not-copy guardrails | Copy matrix §4 and Do-Not-Copy section below |

---

## Do Not Copy

Never port these reference items into Bakery:

```text
$R1/src/app/(app)/dashboard/crypto/**
$R1/src/components/charts/crypto-*
$R1/src/components/crypto-icon.tsx
$R1/src/app/(app)/apps/ai-chat/**
$R1/src/app/(app)/apps/chat/**
$R1/src/app/(app)/apps/mail/**
$R1/src/app/(app)/storefront/**
$R1/src/app/(app)/cart/**
$R1/src/app/(app)/checkout/**
$R1/src/app/landing/**
$R1/src/app/pricing/**
$R1/src/data/index.ts
$R2/src/features/ai-chat/**
$R2/src/features/chat/**
$R2/src/features/react-query-demo/**
$R2/src/features/elements/**
$R2/src/constants/mock-api*.ts
$R2/src/app/api/products/**
$R2/src/app/api/users/**
$R2/src/components/layout/cta-github.tsx
```

Also do not use Base UI primitives, TanStack Table v9, Zod 4, faker, mock delays, remote DiceBear avatars, or OrbynAdmin template branding in shipped Bakery routes.

---

## Execution Handoff

This umbrella plan is intentionally broader than one subsystem. Before implementation, split any dependency-bearing phase (especially Tasks 5–8) into its own focused plan if the team wants one-reviewer-per-subsystem gates.

Please review this plan. Which execution approach would you prefer?

- **Subagent-driven** — a fresh subagent implements each task and a fresh reviewer checks it before the next task starts. Recommended here because the tasks touch shared shell, data and table paths, and a shipped mistake would be costly.
- **Native** — I implement every task in this session, then one whole-branch review at the end.

Does the plan capture what you want, and which approach should we use?
