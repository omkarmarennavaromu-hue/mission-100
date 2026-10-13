/* Desktop sidebar + mobile drawer content. */

import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpenCheck,
  CalendarRange,
  Database,
  Download,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  Moon,
  RotateCcw,
  Settings as SettingsIcon,
  Sun,
  Table2,
  X,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { overallStat } from '../../lib/progress';
import { missionClock } from '../../lib/dates';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/today', label: "Today's Plan", icon: ListChecks },
  { to: '/roadmap', label: '90-Day Roadmap', icon: CalendarRange },
  { to: '/topics', label: 'All Topics', icon: Table2 },
  { to: '/revision', label: 'Revision Center', icon: RotateCcw },
  { to: '/tests', label: 'Tests & Assessments', icon: FlaskConical },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data, setTheme, storageStatus } = useStore();
  const overall = overallStat(data);
  const clock = missionClock();
  const location = useLocation();

  const planStatus =
    clock.mode === 'pre-start'
      ? 'Pre-start'
      : clock.mode === 'post-end'
        ? 'Plan window ended'
        : `Day ${clock.currentDay} of 90`;

  return (
    <div className="flex h-full flex-col">
      {/* Wordmark */}
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-[11px] font-bold text-white dark:bg-white dark:text-night">
                M
              </div>
              <div>
                <h1 className="text-[15px] font-semibold leading-none tracking-tight text-ink dark:text-night-text">
                  MISSION 100
                </h1>
                <p className="mt-1 text-2xs text-ink-tertiary dark:text-night-tertiary">Academic Command Center</p>
              </div>
            </div>
          </div>
          <button
            onClick={onNavigate}
            className="rounded-md p-1 text-ink-tertiary hover:bg-surface-sunken lg:hidden dark:hover:bg-night-raised"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status indicator */}
        <div className="mt-4 rounded-lg border border-line bg-surface-muted px-3 py-2.5 dark:border-night-line dark:bg-night">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-2xs font-medium text-ink-secondary dark:text-night-secondary">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  clock.mode === 'active' ? 'bg-emerald-500' : clock.mode === 'pre-start' ? 'bg-amber-400' : 'bg-ink-faint'
                }`}
              />
              {planStatus}
            </span>
            <span className="font-mono text-2xs text-ink-tertiary tnum dark:text-night-tertiary">
              {overall.completed}/{overall.total}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line dark:bg-night-line">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${overall.percent}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-2xs text-ink-tertiary dark:text-night-tertiary">
            <span>Overall progress</span>
            <span className="font-mono tnum">{overall.percent}%</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-2 pb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-faint dark:text-night-tertiary">Workspace</p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                    active
                      ? 'bg-ink text-white dark:bg-night-raised dark:text-night-text'
                      : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink dark:text-night-secondary dark:hover:bg-night-raised dark:hover:text-night-text'
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} className={active ? '' : 'opacity-70'} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t divider px-3 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTheme(data.settings.theme === 'dark' ? 'light' : 'dark')}
            className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface-sunken hover:text-ink dark:text-night-secondary dark:hover:bg-night-raised dark:hover:text-night-text"
            aria-label="Toggle theme"
          >
            {data.settings.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {data.settings.theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className="rounded-lg p-2 text-ink-tertiary transition hover:bg-surface-sunken hover:text-ink dark:hover:bg-night-raised"
            aria-label="Export & backup"
            title="Export & backup"
          >
            <Download size={14} />
          </NavLink>
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className="rounded-lg p-2 text-ink-tertiary transition hover:bg-surface-sunken hover:text-ink dark:hover:bg-night-raised"
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon size={14} />
          </NavLink>
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-2.5 text-2xs text-ink-faint dark:text-night-tertiary">
          <Database size={10} />
          <span className={storageStatus.ok ? '' : 'text-amber-600 dark:text-amber-400'}>
            {storageStatus.ok ? 'Auto-save active' : 'Storage warning'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r divider bg-white lg:block dark:bg-night-surface">
      <SidebarContent />
    </aside>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] dark:bg-black/50" onClick={onClose} />
          <div className="animate-slide-in absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r divider bg-white shadow-drawer dark:bg-night-surface">
            <SidebarContent onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  );
}

export function MobileTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b divider bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden dark:bg-night-surface/90">
      <button
        onClick={onOpenMenu}
        className="rounded-lg border border-line p-2 text-ink-secondary dark:border-night-line dark:text-night-secondary"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink font-mono text-[10px] font-bold text-white dark:bg-white dark:text-night">
          M
        </div>
        <div>
          <div className="text-[13px] font-semibold leading-none text-ink dark:text-night-text">MISSION 100</div>
          <div className="text-2xs text-ink-tertiary dark:text-night-tertiary">Academic Command Center</div>
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const items = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/today', label: 'Today', icon: ListChecks },
    { to: '/roadmap', label: 'Roadmap', icon: CalendarRange },
    { to: '/topics', label: 'Topics', icon: BookOpenCheck },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t divider bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden dark:bg-night-surface/95">
      <ul className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                    isActive ? 'text-accent' : 'text-ink-tertiary dark:text-night-tertiary'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
