'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icons';
import type { IconName } from '@/components/icons';
import { Button, Spinner } from '@/components/ui';
import { useToast } from '@/components/toast-provider';

const navItems: Array<{ href: string; label: string; icon: IconName; adminOnly?: boolean }> = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/orders', label: 'Orders & POS', icon: 'orders' },
  { href: '/products', label: 'Products', icon: 'products' },
  { href: '/ingredients', label: 'Inventory', icon: 'ingredients' },
  { href: '/suppliers', label: 'Suppliers', icon: 'suppliers' },
  { href: '/customers', label: 'Customers', icon: 'customers' },
  { href: '/expenses', label: 'Expenses', icon: 'expenses' },
  { href: '/users', label: 'Team', icon: 'users', adminOnly: true },
];

const STORAGE_KEY = 'bakery-sidebar-collapsed';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { notify } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [today, setToday] = useState('');

  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      setCollapsed(false);
    }
    setStorageReady(true);
    setToday(new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date()));
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Storage may be unavailable in private browsing; ignore.
    }
  }, [collapsed, storageReady]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;

      const focusables = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => firstLinkRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) return;
    const active = document.activeElement;
    if (active instanceof Node && sidebarRef.current?.contains(active)) {
      menuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      notify('Could not sign out. Please try again.', 'error');
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50">
        <Spinner />
        <p className="text-sm font-medium text-crust-800/60">Checking your session…</p>
      </div>
    );
  }

  const visibleNav = navItems.filter((item) => !item.adminOnly || user.role === 'ADMIN');
  const activeItem = visibleNav.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  );
  const pageTitle = activeItem?.label ?? 'Bakery Manager';
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-crust-900/50 backdrop-blur-[2px] md:hidden"
        />
      ) : null}

      <aside
        id="app-sidebar"
        ref={sidebarRef}
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen || undefined}
        aria-label="Main navigation"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-crust-800/10 bg-white shadow-2xl transition-[width,transform] duration-300 md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          collapsed ? 'md:w-20' : 'md:w-64'
        )}
      >
        <div
          className={clsx(
            'flex h-16 shrink-0 items-center gap-3 border-b border-crust-800/10 px-4',
            collapsed && 'md:justify-center md:px-2'
          )}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-550 to-crust-700 text-white shadow-md">
            <Icon name="bread" size={22} />
          </div>
          <div className={clsx('min-w-0 flex-1', collapsed && 'md:hidden')}>
            <p className="truncate font-display text-base font-semibold leading-tight text-crust-800">Crumb & Co.</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-crust-800/45">
              Bakery Manager
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            className={clsx(
              'hidden h-9 w-9 shrink-0 place-items-center rounded-xl text-crust-800/50 transition hover:bg-cream-100 hover:text-crust-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550 md:grid',
              collapsed && 'md:mt-2'
            )}
          >
            <Icon name={collapsed ? 'panelLeftOpen' : 'panelLeftClose'} size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl text-crust-800/50 transition hover:bg-cream-100 hover:text-crust-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550 md:hidden"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary">
          {visibleNav.map((item, index) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={index === 0 ? firstLinkRef : undefined}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={clsx(
                  'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550',
                  collapsed && 'md:justify-center md:px-0',
                  isActive ? 'bg-crust-700 text-white shadow-sm' : 'text-crust-800/70 hover:bg-cream-100 hover:text-crust-800'
                )}
              >
                {isActive ? (
                  <span className="absolute left-0 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-550 md:block" />
                ) : null}
                <Icon name={item.icon} size={19} className="shrink-0" />
                <span className={clsx('truncate', collapsed && 'md:sr-only')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={clsx('shrink-0 border-t border-crust-800/10 p-3', collapsed && 'md:px-2')}>
          <div
            className={clsx(
              'flex items-center gap-3 rounded-xl bg-cream-50 p-2',
              collapsed && 'md:justify-center md:bg-transparent md:p-0'
            )}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-crust-700 text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className={clsx('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <p className="truncate text-sm font-semibold text-crust-800">{user.name}</p>
              <p className="truncate text-[11px] text-crust-800/50">
                {user.email} · {user.role}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleLogout()}
            aria-label="Sign out"
            className={clsx('mt-2 w-full justify-start text-crust-800/60', collapsed && 'md:justify-center md:px-0')}
          >
            <Icon name="logout" size={16} />
            <span className={clsx(collapsed && 'md:sr-only')}>Sign out</span>
          </Button>
        </div>
      </aside>

      <div
        className={clsx(
          'min-h-screen transition-[padding] duration-300',
          collapsed ? 'md:pl-20' : 'md:pl-64'
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-crust-800/10 bg-cream-50/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-crust-800/10 bg-white text-crust-700 shadow-sm transition hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550 md:hidden"
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-crust-800/45">Workspace</p>
            <h2 className="truncate font-display text-base font-semibold text-crust-800 sm:text-lg">{pageTitle}</h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {today ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-crust-800/60 shadow-sm ring-1 ring-crust-800/5 sm:inline-flex">
                <Icon name="calendar" size={14} />
                {today}
              </span>
            ) : null}
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-200 text-[11px] font-semibold text-crust-800 ring-2 ring-white"
              aria-hidden="true"
            >
              {initials}
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </>
  );
}
