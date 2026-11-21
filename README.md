# 🥖 Crumb & Co. — Bakery Business Software

A full-stack management application for running a bakery: recipes & ingredients,
inventory tracking, orders & point-of-sale, customers, suppliers, expenses, and a
reporting dashboard.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **API:** Next.js Route Handlers under `src/app/api/` (no separate Express server)
- **Data:** Prisma ORM + SQLite, Zod validation
- **Auth:** JWT in an httpOnly cookie, role guards in route handlers
- **UI:** Tailwind CSS v4, Recharts
- The legacy Vite/Express implementation is kept in `client/` and `server/` as reference only.

## Features

- **Auth & roles** — JWT login, ADMIN / MANAGER / STAFF roles, team management (admin-only)
- **Products & recipes** — define menu items and the exact ingredient quantities each one consumes
- **Inventory** — ingredient stock levels, cost per unit, reorder thresholds, low-stock alerts,
  and a full stock-movement ledger (purchases, usage, adjustments, waste)
- **Orders & POS** — build an order from your product catalog, auto-computed totals,
  automatic ingredient stock deduction based on recipes (with insufficient-stock protection),
  order status workflow (Pending → In Progress → Ready → Completed, or Cancelled with
  automatic ingredient restock), and payment tracking (Unpaid / Partial / Paid)
- **Customers** — CRM with order history and search
- **Suppliers** — who you buy ingredients from
- **Expenses** — rent, utilities, equipment, etc., for a full profitability picture
- **Dashboard** — revenue today/week/month, 30-day revenue trend, top-selling products,
  low-stock alerts, and a net-income snapshot

## UI / UX

- Collapsible desktop sidebar (state saved locally) with an off-canvas mobile drawer
- Keyboard-first navigation: skip link, visible focus rings, labelled icon controls,
  native `<dialog>` modals with Escape/backdrop dismissal and focus management
- Responsive layouts with keyboard-scrollable data tables, consistent loading/empty/error
  states, retry actions, and toast feedback after mutations
- Warm bakery-inspired design tokens, SVG icon set, and reduced-motion support

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
npm install
cp .env.example .env   # optional: change JWT_SECRET / DATABASE_URL
npm run setup          # prisma generate + migrate deploy + seed
```

If `.env.example` is not present, create `.env` with:
`DATABASE_URL="file:./dev.db"` and `JWT_SECRET="change-me"`.

### Run (dev)

```bash
npm run dev
```

Open **http://localhost:3000** — the UI and API are served by the same Next.js
process. Sign in with one of the seeded demo accounts:

| Email                | Password   | Role  |
| --------------------- | ---------- | ----- |
| admin@bakery.test     | admin123   | ADMIN |
| staff@bakery.test     | staff123   | STAFF |

### Build for production

```bash
npm run build
npm start
```

`next build` produces a single optimized app; `npm start` serves the UI and API
on port 3000.

## Project Structure

```
prisma/                 Prisma schema, migrations and demo seed
src/app/                Next.js App Router
  (app)/                Authenticated app shell + feature pages
  api/                  Route Handlers (auth, users, customers, suppliers,
                        ingredients, products, orders, expenses, dashboard, health)
  login/                Sign-in page
src/components/         Auth provider, app shell and shared UI kit
src/lib/                Prisma client, auth helpers, HTTP helpers, API client, types
client/ server/         Legacy Vite + Express implementation (reference only)
```

## Notes

- SQLite is used for zero-config local development. Prisma's `datasource` block can be
  swapped to PostgreSQL/MySQL for production by changing `provider` and `DATABASE_URL`.
- Enum-like fields (order status, roles, etc.) are plain `String` columns in the Prisma
  schema (SQLite has no native enum type) but are validated with Zod at the API layer.
- Auth is stored in an httpOnly cookie; Bearer tokens are also accepted by API handlers.
