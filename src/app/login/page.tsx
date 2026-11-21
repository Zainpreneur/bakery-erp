'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { apiErrorMessage } from '@/lib/api-client';
import { Button, Card, Input, Label } from '@/components/ui';
import { Icon } from '@/components/icons';

const demoAccounts = [
  { label: 'Administrator', email: 'admin@bakery.test', password: 'admin123' },
  { label: 'Staff member', email: 'staff@bakery.test', password: 'staff123' },
];

export function Login() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@bakery.test');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-crust-800 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-550/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-cream-200/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <Icon name="bread" size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Crumb &amp; Co.</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Bakery Manager</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/15">
            <Icon name="sparkles" size={14} />
            Built for busy bakery counters
          </p>
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Fresh orders, tighter inventory, calmer mornings.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/65">
            One place to take orders, manage recipes, track ingredients, and see how the bakery is performing today.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              { icon: 'orders' as const, text: 'Point-of-sale ordering with automatic recipe stock deduction' },
              { icon: 'ingredients' as const, text: 'Low-stock alerts before a recipe runs you dry' },
              { icon: 'trendingUp' as const, text: 'Revenue and product insights at a glance' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon name={item.icon} size={16} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Crumb &amp; Co. · Internal operations</p>
      </section>

      <section className="flex items-center justify-center bg-cream-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-crust-700 text-white">
              <Icon name="bread" size={24} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-crust-800">Crumb &amp; Co.</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-crust-800/50">Bakery Manager</p>
            </div>
          </div>

          <Card className="p-6 shadow-[0_24px_60px_rgba(84,53,24,0.10)] sm:p-8">
            <div className="mb-7">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-crust-800">Welcome back</h1>
              <p className="mt-1 text-sm text-crust-800/60">Sign in to open your bakery workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="login-email">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@bakery.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  invalid={Boolean(error)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    invalid={Boolean(error)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-crust-800/45 transition hover:bg-cream-100 hover:text-crust-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550"
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
                  </button>
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" className="w-full" loading={loading} rightIcon={loading ? undefined : 'arrowRight'}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-7 border-t border-crust-800/10 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-crust-800/45">Demo accounts</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                      setError('');
                    }}
                    className="rounded-xl border border-crust-800/10 bg-cream-50 px-3 py-2 text-left transition hover:border-amber-550/50 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550"
                  >
                    <span className="block text-xs font-semibold text-crust-800">{account.label}</span>
                    <span className="block truncate text-[11px] text-crust-800/50">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default Login;
