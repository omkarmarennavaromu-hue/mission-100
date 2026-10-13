/* Main workspace header: date, study day, greeting, daily progress. */

import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, CloudOff, Cloud, TriangleAlert } from 'lucide-react';
import { useStore } from '../../state/store';
import { dayProgress, overallStat } from '../../lib/progress';
import { longDayLabel, mediumDate, missionClock, todayISO } from '../../lib/dates';
import { ProgressBar } from '../ui';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late session';
}

export function Header() {
  const { data, storageStatus } = useStore();
  const clock = missionClock();
  const today = todayISO();
  const dayNo = clock.currentDay;
  const daily = dayNo ? dayProgress(data, dayNo) : null;
  const overall = overallStat(data);

  return (
    <header className="border-b divider bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8 dark:bg-night-surface/80">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-[0.12em] text-ink-tertiary dark:text-night-tertiary">
            <CalendarDays size={12} />
            <span>{longDayLabel(today)}</span>
            {clock.mode === 'active' && (
              <>
                <span className="text-ink-faint dark:text-night-tertiary">·</span>
                <span className="font-mono text-accent tnum">Day {clock.currentDay} / 90</span>
              </>
            )}
            {clock.mode === 'pre-start' && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="font-mono text-amber-600 tnum dark:text-amber-400">Starts in {clock.daysRemaining}d</span>
              </>
            )}
            {clock.mode === 'post-end' && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="font-mono tnum">Plan window complete</span>
              </>
            )}
          </div>
          <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-ink sm:text-xl dark:text-night-text">
            {greeting()}
            <span className="font-normal text-ink-tertiary dark:text-night-tertiary"> — let's execute.</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {daily && (
            <div className="w-44">
              <div className="flex items-center justify-between text-2xs text-ink-tertiary dark:text-night-tertiary">
                <span>Today</span>
                <span className="font-mono tnum">
                  {daily.completed}/{daily.total} · {daily.percent}%
                </span>
              </div>
              <ProgressBar value={daily.completed} total={daily.total} size="sm" className="mt-1" />
            </div>
          )}
          <div className="hidden w-44 sm:block">
            <div className="flex items-center justify-between text-2xs text-ink-tertiary dark:text-night-tertiary">
              <span>Mission</span>
              <span className="font-mono tnum">
                {overall.completed}/{overall.total} · {overall.percent}%
              </span>
            </div>
            <ProgressBar value={overall.completed} total={overall.total} size="sm" className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            {storageStatus.ok ? (
              <span
                className="flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400"
                title="Progress is saved automatically in this browser"
              >
                <Cloud size={13} /> <span className="hidden sm:inline">Saved locally</span>
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-2xs text-amber-600 dark:text-amber-400"
                title={storageStatus.message}
              >
                {storageStatus.message.includes('offline') || storageStatus.message.includes('fail') ? (
                  <CloudOff size={13} />
                ) : (
                  <TriangleAlert size={13} />
                )}
                <span className="hidden sm:inline">Storage issue</span>
              </span>
            )}
            <Link
              to={dayNo ? `/roadmap?day=${dayNo}` : '/roadmap'}
              className="hidden items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-2xs font-medium text-ink-secondary transition hover:text-ink sm:flex dark:border-night-line dark:bg-night-surface dark:text-night-secondary"
            >
              Jump to day <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-2 max-w-[1200px] text-2xs text-ink-faint dark:text-night-tertiary">
        {mediumDate(PLAN_ANCHOR)} — {mediumDate('2027-01-10')} · KSEAB 2nd PUC 2027 · KCET 2027 · JEE Main 2027
      </div>
    </header>
  );
}

const PLAN_ANCHOR = '2026-10-13';
