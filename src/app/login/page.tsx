"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowRight,
  IconBread,
  IconEye,
  IconEyeOff,
  IconPackages,
  IconSparkles,
  IconTrendingUp,
  IconShoppingCart,
} from "@tabler/icons-react";

import { useAuth } from "@/components/auth-provider";
import { apiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const demoAccounts = [
  { label: "Administrator", email: "admin@bakery.test", password: "admin123" },
  { label: "Staff member", email: "staff@bakery.test", password: "staff123" },
];

const highlights = [
  {
    icon: IconShoppingCart,
    text: "Counter ordering with automatic recipe stock deduction",
  },
  {
    icon: IconPackages,
    text: "Low-stock alerts before a recipe runs you dry",
  },
  {
    icon: IconTrendingUp,
    text: "Revenue and product insights at a glance",
  },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@bakery.test");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
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
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-primary px-12 py-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <IconBread className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">Crumb &amp; Co.</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-60">
              Bakery Manager
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20">
            <IconSparkles className="size-3.5" />
            Built for busy bakery counters
          </p>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Fresh orders, tighter inventory, calmer mornings.
          </h2>
          <p className="mt-4 text-sm leading-7 opacity-75">
            One place to take orders, manage recipes, track ingredients, and see
            how the bakery is performing today.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs opacity-50">
          © {new Date().getFullYear()} Crumb &amp; Co. · Internal operations
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <IconBread className="size-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Crumb &amp; Co.</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Bakery Manager
              </p>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardContent className="space-y-6 py-8 sm:py-10">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to open your bakery workspace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@bakery.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(error)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pr-12"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={Boolean(error)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                      {showPassword ? (
                        <IconEyeOff className="size-4" />
                      ) : (
                        <IconEye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                  {!loading ? <IconArrowRight className="size-4" /> : null}
                </Button>
              </form>

              <div className="border-t pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Demo accounts
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(account.password);
                        setError("");
                      }}
                      className="rounded-lg border p-3 text-left transition hover:border-primary/50 hover:bg-accent"
                    >
                      <span className="block text-xs font-semibold">
                        {account.label}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {account.email}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
