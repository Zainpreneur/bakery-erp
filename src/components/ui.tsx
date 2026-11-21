'use client';

import { useEffect, useId, useRef } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/icons';
import type { IconName } from '@/components/icons';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <div className={clsx('inline-flex items-center gap-2 text-crust-700', className)} role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-crust-700/20 border-t-crust-700" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-crust-800/10 bg-white shadow-[0_1px_2px_rgba(84,53,24,0.04),0_8px_24px_rgba(84,53,24,0.04)]',
        className
      )}
    >
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'icon';
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const styles = {
    primary: 'bg-crust-700 text-white shadow-sm hover:bg-crust-800 active:bg-crust-800/90',
    secondary: 'bg-cream-100 text-crust-800 hover:bg-cream-200 active:bg-cream-200/80',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-700/90',
    ghost: 'bg-transparent text-crust-700 hover:bg-cream-100 active:bg-cream-200',
  };
  const sizes = {
    sm: 'min-h-9 gap-1.5 rounded-lg px-2.5 py-1.5 text-xs',
    md: 'min-h-11 gap-2 rounded-xl px-4 py-2 text-sm',
    icon: 'h-10 w-10 rounded-xl p-0',
  };

  return (
    <button
      className={clsx(
        'inline-flex shrink-0 items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        'active:scale-[0.98] motion-reduce:active:scale-100',
        styles[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="[&>span:first-child]:h-4 [&>span:first-child]:w-4" /> : null}
      {!loading && leftIcon ? <Icon name={leftIcon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
      {!loading && rightIcon ? <Icon name={rightIcon} size={size === 'sm' ? 14 : 16} /> : null}
    </button>
  );
}

const fieldStyles =
  'w-full min-h-11 rounded-xl border border-crust-800/15 bg-white px-3 py-2 text-sm text-crust-800 shadow-[inset_0_1px_1px_rgba(84,53,24,0.03)] transition placeholder:text-crust-800/40 hover:border-crust-800/25 focus:border-amber-550 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-550/50 disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-crust-800/50';

export function Input({ className, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={clsx(fieldStyles, invalid && 'border-red-400', className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({
  className,
  children,
  invalid,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={clsx(fieldStyles, 'cursor-pointer pr-8', invalid && 'border-red-400', className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={clsx(fieldStyles, 'min-h-24 resize-y', invalid && 'border-red-400', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Label({
  children,
  htmlFor,
  hint,
  error,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={clsx('mb-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-crust-800/60">
        {children}
      </label>
      {hint && !error ? <p className="mt-1 text-[11px] leading-4 text-crust-800/50">{hint}</p> : null}
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
          <Icon name="alert" size={12} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 ring-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 ring-blue-200',
  READY: 'bg-purple-100 text-purple-800 ring-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200',
  PAID: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  PARTIAL: 'bg-amber-100 text-amber-800 ring-amber-200',
  UNPAID: 'bg-red-100 text-red-800 ring-red-200',
  default: 'bg-cream-200 text-crust-800 ring-cream-200',
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        badgeColors[value] ?? badgeColors.default
      )}
    >
      {label ?? value.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = 'box',
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="rounded-2xl bg-cream-100 p-3 text-crust-700">
        <Icon name={icon} size={24} />
      </div>
      <p className="font-display text-base font-semibold text-crust-800">{title}</p>
      {subtitle ? <p className="max-w-sm text-sm leading-6 text-crust-800/60">{subtitle}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading your data…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-crust-800/10 bg-white p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <Spinner />
      <p className="text-sm font-medium text-crust-800/60">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'We couldn’t load this' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center" role="alert">
      <div className="rounded-2xl bg-red-100 p-3 text-red-700">
        <Icon name="alert" size={24} />
      </div>
      <div>
        <p className="font-display text-base font-semibold text-crust-800">{title}</p>
        <p className="mt-1 max-w-md text-sm text-crust-800/60">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" leftIcon="refresh" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-xl bg-cream-200/70 motion-reduce:animate-none', className)} />;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-crust-800 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm leading-6 text-crust-800/60">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function TableShell({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={clsx('overflow-hidden', className)}>
      <div
        className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-550/50"
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = 'amber',
  icon,
  trend,
  trendDirection = 'up',
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'amber' | 'green' | 'red' | 'blue';
  icon?: IconName;
  trend?: string;
  trendDirection?: 'up' | 'down';
}) {
  const accents: Record<string, { surface: string; icon: string }> = {
    amber: { surface: 'from-amber-50 to-white', icon: 'bg-amber-100 text-amber-700' },
    green: { surface: 'from-emerald-50 to-white', icon: 'bg-emerald-100 text-emerald-700' },
    red: { surface: 'from-red-50 to-white', icon: 'bg-red-100 text-red-700' },
    blue: { surface: 'from-sky-50 to-white', icon: 'bg-sky-100 text-sky-700' },
  };

  return (
    <Card className={clsx('group bg-gradient-to-br p-4 transition-shadow hover:shadow-md sm:p-5', accents[accent].surface)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-crust-800/55">{label}</p>
        {icon ? (
          <span className={clsx('rounded-xl p-2', accents[accent].icon)}>
            <Icon name={icon} size={18} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-crust-800 sm:text-[26px]">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-crust-800/50">
        {sub ? <span>{sub}</span> : null}
        {trend ? (
          <span
            className={clsx(
              'inline-flex items-center gap-1 font-semibold',
              trendDirection === 'up' ? 'text-emerald-700' : 'text-red-600'
            )}
          >
            <Icon name={trendDirection === 'up' ? 'trendingUp' : 'trendingDown'} size={12} />
            {trend}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => titleRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={clsx(
        'app-dialog w-[calc(100%_-_2rem)] rounded-3xl border border-crust-800/10 bg-white p-0 text-crust-800 shadow-2xl',
        width
      )}
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-crust-800/10 px-5 py-4 sm:px-6">
          <div>
            <h3 id={titleId} ref={titleRef} tabIndex={-1} className="font-display text-lg font-semibold outline-none sm:text-xl">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-crust-800/60">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 -mt-1 text-crust-800/50"
          >
            <Icon name="close" size={18} />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md">
      <div className="space-y-6">
        <p className="text-sm leading-6 text-crust-800/65">{message}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant={tone} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function money(n: number | undefined | null) {
  return currency.format(n ?? 0);
}
