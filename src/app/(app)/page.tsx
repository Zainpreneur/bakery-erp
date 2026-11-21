'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { DashboardSummary } from '@/lib/types';
import { Card, ErrorState, PageHeader, Skeleton, StatCard, money } from '@/components/ui';
import { Icon } from '@/components/icons';

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<DashboardSummary>('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !data) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today at a glance"
        title="Good day!"
        description="Here's how the bakery is performing right now."
        actions={
          <Link
            href="/orders"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-crust-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-crust-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550"
          >
            <Icon name="orders" size={16} />
            New order
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={money(data.revenueToday)}
          sub={`${data.ordersTodayCount} orders placed`}
          icon="expenses"
          accent="amber"
        />
        <StatCard label="This week" value={money(data.revenueWeek)} icon="trendingUp" accent="blue" />
        <StatCard label="This month" value={money(data.revenueMonth)} icon="calendar" accent="green" />
        <StatCard
          label="Low stock items"
          value={String(data.lowStockCount)}
          sub={data.lowStockCount > 0 ? 'need reordering' : 'all stocked up'}
          icon="alert"
          accent={data.lowStockCount > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-crust-800">Revenue trend</h2>
              <p className="text-xs text-crust-800/50">Last 30 days</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <Icon name="trendingUp" size={13} />
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.revenueTrend} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e08a2c" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="#e08a2c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="#f3e6cf" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => value.slice(5)}
                tick={{ fontSize: 11, fill: '#8a5a2b' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#8a5a2b' }}
                tickFormatter={(value: number) => `$${value}`}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value) => money(Number(value))}
                labelStyle={{ color: '#543518', fontWeight: 600 }}
                contentStyle={{ borderRadius: 12, borderColor: '#f3e6cf', fontSize: 13, boxShadow: '0 12px 32px rgba(84,53,24,.12)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#e08a2c" fill="url(#revenueFill)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-crust-800">Top products</h2>
            <p className="text-xs text-crust-800/50">Units sold in the last 30 days</p>
          </div>
          {data.topProducts.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
              <span className="rounded-2xl bg-cream-100 p-3 text-crust-700">
                <Icon name="box" size={22} />
              </span>
              <p className="text-sm font-medium text-crust-800">No sales yet</p>
              <p className="text-xs text-crust-800/50">Product performance will appear here.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 0, right: 12 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={104}
                  tick={{ fontSize: 11, fill: '#543518' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => `${value} sold`}
                  cursor={{ fill: '#faf3e7' }}
                  contentStyle={{ borderRadius: 12, borderColor: '#f3e6cf', fontSize: 13 }}
                />
                <Bar dataKey="qty" fill="#8a5a2b" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-crust-800">Low stock ingredients</h2>
              <p className="text-xs text-crust-800/50">Items at or below their reorder point</p>
            </div>
            <Link
              href="/ingredients"
              className="inline-flex items-center gap-1 text-xs font-semibold text-crust-700 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550"
            >
              Manage inventory
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          {data.lowStockIngredients.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Icon name="check" size={18} />
              All ingredients are well stocked.
            </div>
          ) : (
            <ul className="divide-y divide-crust-800/5">
              {data.lowStockIngredients.map((ing) => (
                <li key={ing.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-crust-800">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-red-600">
                      <Icon name="alert" size={14} />
                    </span>
                    {ing.name}
                  </span>
                  <span className="text-xs font-medium text-red-600 sm:text-sm">
                    {ing.quantityInStock} {ing.unit} left · reorder at {ing.reorderThreshold} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-crust-800">Business snapshot</h2>
          <p className="mt-1 text-xs text-crust-800/50">Estimated this month</p>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              { label: 'Pending / active orders', value: String(data.pendingOrders) },
              { label: 'Total customers', value: String(data.customerCount) },
              { label: 'Expenses', value: money(data.expensesMonth) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <dt className="text-crust-800/60">{row.label}</dt>
                <dd className="font-semibold text-crust-800">{row.value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-crust-800/10 pt-3">
              <dt className="font-medium text-crust-800">Net (est.)</dt>
              <dd className="font-display text-lg font-semibold text-crust-800">
                {money(data.revenueMonth - data.expensesMonth)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
