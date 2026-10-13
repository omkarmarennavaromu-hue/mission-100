/* Shared UI primitives — restrained, Notion-meets-command-center styling. */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Check, ChevronRight, X } from 'lucide-react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className={`flex items-start justify-between gap-3 ${padded ? 'px-5 pt-4' : 'px-5 pt-4'}`}>
          <div>
            {title && <h2 className="text-sm font-semibold text-ink dark:text-night-text">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-tertiary dark:text-night-tertiary">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function ProgressBar({
  value,
  total,
  showLabel = false,
  size = 'md',
  className = '',
}: {
  value: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const pct = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-1 overflow-hidden rounded-full bg-surface-sunken dark:bg-night-raised ${size === 'sm' ? 'h-1' : 'h-1.5'}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 text-right font-mono text-2xs font-medium text-ink-tertiary tnum dark:text-night-tertiary">
          {pct}%
        </span>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'danger' | 'info';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-surface-sunken text-ink-secondary border-line dark:bg-night-raised dark:text-night-secondary dark:border-night-line',
    accent: 'bg-accent-soft text-accent border-accent-border dark:bg-accent/10 dark:text-blue-300 dark:border-accent/30',
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
    warn: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    danger: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <label className={`inline-flex cursor-pointer select-none items-center gap-2 ${size === 'sm' ? '' : ''}`}>
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
      <span
        className={`flex items-center justify-center rounded-md border transition
          ${size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'}
          ${checked
            ? 'border-accent bg-accent text-white'
            : indeterminate
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line-strong bg-white hover:border-accent/60 dark:border-night-line dark:bg-night-raised'}
          peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40`}
      >
        {checked && <Check size={size === 'sm' ? 11 : 13} strokeWidth={3} />}
        {!checked && indeterminate && <span className="h-0.5 w-2 rounded-full bg-accent" />}
      </span>
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] dark:bg-black/50" onClick={onClose} />
      <div
        className={`animate-fade-in relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-line bg-white shadow-drawer sm:rounded-2xl dark:border-night-line dark:bg-night-surface
        ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <header className="flex items-center justify-between border-b divider px-5 py-4">
          <h2 className="text-sm font-semibold text-ink dark:text-night-text">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-tertiary hover:bg-surface-sunken hover:text-ink dark:hover:bg-night-raised" aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="max-h-[calc(92vh-120px)] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t divider px-5 py-3.5">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className={danger ? 'btn-danger' : 'btn-accent'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <AlertTriangle size={16} />
          </div>
        )}
        <div className="text-sm leading-relaxed text-ink-secondary dark:text-night-secondary">{message}</div>
      </div>
    </Modal>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-12 text-center dark:border-night-line">
      {icon && <div className="mb-3 text-ink-faint dark:text-night-tertiary">{icon}</div>}
      <h3 className="text-sm font-medium text-ink dark:text-night-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface-muted p-1 dark:border-night-line dark:bg-night ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            active === t.id
              ? 'bg-white text-ink shadow-subtle dark:bg-night-raised dark:text-night-text'
              : 'text-ink-tertiary hover:text-ink dark:text-night-tertiary dark:hover:text-night-text'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`font-mono text-2xs tnum ${active === t.id ? 'text-accent' : 'text-ink-faint dark:text-night-tertiary'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  className = '',
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={`w-auto min-w-[128px] cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 pr-8 text-xs text-ink shadow-subtle outline-none transition
        focus:border-accent focus:ring-2 focus:ring-accent/15
        dark:border-night-line dark:bg-night-raised dark:text-night-text ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function IconButton({
  onClick,
  label,
  children,
  active = false,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg border p-2 transition ${
        active
          ? 'border-accent-border bg-accent-soft text-accent dark:border-accent/30 dark:bg-accent/10 dark:text-blue-300'
          : 'border-line bg-white text-ink-tertiary hover:text-ink dark:border-night-line dark:bg-night-surface dark:text-night-tertiary dark:hover:text-night-text'
      }`}
    >
      {children}
    </button>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-ink-tertiary dark:text-night-tertiary">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="text-ink-faint dark:text-night-tertiary" />}
          {it.onClick ? (
            <button onClick={it.onClick} className="hover:text-ink dark:hover:text-night-text">
              {it.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? 'text-ink dark:text-night-text' : ''}>{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-muted p-0.5 dark:border-night-line dark:bg-night">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
            value === o.value
              ? 'bg-white text-ink shadow-subtle dark:bg-night-raised dark:text-night-text'
              : 'text-ink-tertiary hover:text-ink dark:text-night-tertiary dark:hover:text-night-text'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
