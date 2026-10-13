/* 90-Day Roadmap — full timeline with month sections, search, filters, calendar view. */

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Target,
  X,
} from 'lucide-react';
import { useStore } from '../state/store';
import { dayProgress, dayStatus, needsRevisionList, topicsForDay } from '../lib/progress';
import {
  longDayLabel,
  mediumDate,
  missionClock,
  monthSections,
  shortDate,
  todayISO,
  TOTAL_DAYS,
  weekdayName,
} from '../lib/dates';
import { Badge, Card, EmptyState, ProgressBar, SegmentedControl, Select } from '../components/ui';
import { StatusBadge, TopicDetailPanel, TopicRow, statusTone } from '../components/topics/TopicBits';
import type { Subject, Topic } from '../types';
import { SUBJECTS, TOPIC_STATUSES } from '../types';

type StatusFilter = 'all' | 'Not Started' | 'In Progress' | 'Completed' | 'Needs Revision' | 'incomplete' | 'revision-needed';
type SubjectFilter = 'all' | Subject;
type ViewMode = 'list' | 'calendar';

export default function Roadmap() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [openTopic, setOpenTopic] = useState<Topic | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [monthJump, setMonthJump] = useState('all');

  const clock = missionClock();
  const today = todayISO();
  const todayDay = clock.currentDay;

  // Jump-to-day via query param
  useEffect(() => {
    const day = params.get('day');
    if (day) {
      const n = Number(day);
      if (n >= 1 && n <= TOTAL_DAYS) {
        setExpandedDays((e) => ({ ...e, [n]: true }));
        setTimeout(() => {
          document.getElementById(`roadmap-day-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      }
    }
  }, [params]);

  const revisionSet = useMemo(() => new Set(needsRevisionList(data).map((t) => t.id)), [data]);

  const matchesTopic = (t: Topic): boolean => {
    if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${t.title} ${t.chapter} ${t.subject}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (statusFilter === 'incomplete' && t.status === 'Completed') return false;
    if (statusFilter === 'revision-needed' && !revisionSet.has(t.id) && t.status !== 'Needs Revision') return false;
    if (TOPIC_STATUSES.includes(statusFilter as never) && t.status !== statusFilter) return false;
    return true;
  };

  const dayMatches = (dayNumber: number): boolean => {
    const topics = topicsForDay(data, dayNumber);
    if (subjectFilter === 'all' && !search.trim() && statusFilter === 'all') return true;
    return topics.some(matchesTopic);
  };

  const sections = monthSections().filter((s) => monthJump === 'all' || s.label === monthJump);

  const filterActive = subjectFilter !== 'all' || statusFilter !== 'all' || search.trim() !== '';

  const jumpToToday = () => {
    if (todayDay) {
      setParams({ day: String(todayDay) });
      setExpandedDays((e) => ({ ...e, [todayDay!]: true }));
      setTimeout(() => document.getElementById(`roadmap-day-${todayDay}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    } else {
      const anchor = clock.mode === 'pre-start' ? 1 : TOTAL_DAYS;
      document.getElementById(`roadmap-day-${anchor}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <section className="card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-title">90-Day Roadmap</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink dark:text-night-text">
              October 13, 2026 — January 10, 2027
            </h1>
            <p className="mt-0.5 text-xs text-ink-tertiary dark:text-night-tertiary">
              {TOTAL_DAYS} days · 270 scheduled topic items · preloaded plan of record
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<ViewMode>
              value={view}
              onChange={setView}
              options={[
                { value: 'list', label: 'List', icon: <List size={12} /> },
                { value: 'calendar', label: 'Calendar', icon: <LayoutGrid size={12} /> },
              ]}
            />
            <button className="btn-ghost" onClick={jumpToToday}>
              <Target size={13} /> Jump to today
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input-base pl-8 text-sm"
              placeholder="Search topics, chapters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <Select
            ariaLabel="Filter by subject"
            value={subjectFilter}
            onChange={(v) => setSubjectFilter(v as SubjectFilter)}
            options={[
              { value: 'all', label: 'All subjects' },
              ...SUBJECTS.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            ariaLabel="Filter by status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'incomplete', label: 'Incomplete only' },
              { value: 'revision-needed', label: 'Revision needed only' },
              { value: 'Not Started', label: 'Not Started' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Needs Revision', label: 'Needs Revision' },
            ]}
          />
          <Select
            ariaLabel="Jump to month"
            value={monthJump}
            onChange={(v) => setMonthJump(v)}
            options={[
              { value: 'all', label: 'All months' },
              ...monthSections().map((m) => ({ value: m.label, label: m.label })),
            ]}
          />
          {filterActive && (
            <button
              className="btn-ghost"
              onClick={() => {
                setSearch('');
                setSubjectFilter('all');
                setStatusFilter('all');
              }}
            >
              <Filter size={12} /> Clear filters
            </button>
          )}
        </div>
      </section>

      {view === 'list' ? (
        <div className="space-y-6">
          {sections.map((section) => {
            const days = [];
            for (let d = section.fromDay; d <= section.toDay; d++) if (dayMatches(d)) days.push(d);
            if (days.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-3 bg-surface-muted/90 px-1 py-2 backdrop-blur-sm dark:bg-night/90">
                  <h2 className="text-sm font-semibold text-ink dark:text-night-text">{section.label}</h2>
                  <div className="h-px flex-1 bg-line dark:bg-night-line" />
                  <span className="font-mono text-2xs text-ink-tertiary tnum dark:text-night-tertiary">
                    Days {section.fromDay}–{section.toDay} · {days.length} shown
                  </span>
                </div>
                <div className="space-y-1.5">
                  {days.map((d) => (
                    <RoadmapDayRow
                      key={d}
                      dayNumber={d}
                      expanded={!!expandedDays[d]}
                      onToggle={() => setExpandedDays((e) => ({ ...e, [d]: !e[d] }))}
                      onOpenTopic={setOpenTopic}
                      isToday={d === todayDay}
                      highlight={matchesTopic}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {sections.every((s) => {
            let any = false;
            for (let d = s.fromDay; d <= s.toDay; d++) if (dayMatches(d)) any = true;
            return !any;
          }) && (
            <EmptyState
              icon={<Search size={22} />}
              title="No days match your filters"
              description="Try clearing the search or status filters to see the full roadmap."
              action={
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setSearch('');
                    setSubjectFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </button>
              }
            />
          )}
        </div>
      ) : (
        <CalendarView onOpenTopic={setOpenTopic} />
      )}

      {openTopic && <TopicDetailPanel topic={openTopic} onClose={() => setOpenTopic(null)} />}
    </div>
  );
}

function RoadmapDayRow({
  dayNumber,
  expanded,
  onToggle,
  onOpenTopic,
  isToday,
  highlight,
}: {
  dayNumber: number;
  expanded: boolean;
  onToggle: () => void;
  onOpenTopic: (t: Topic) => void;
  isToday: boolean;
  highlight: (t: Topic) => boolean;
}) {
  const { data } = useStore();
  const topics = topicsForDay(data, dayNumber);
  const progress = dayProgress(data, dayNumber);
  const status = dayStatus(data, dayNumber);
  const date = data.days[String(dayNumber)]?.date ?? '';

  const subjState = SUBJECTS.map((s) => {
    const list = topics.filter((t) => t.subject === s);
    const done = list.filter((t) => t.status === 'Completed').length;
    return { subject: s, done, total: list.length };
  });

  return (
    <div
      id={`roadmap-day-${dayNumber}`}
      className={`card overflow-hidden transition ${isToday ? 'border-accent ring-1 ring-accent/25 dark:border-accent/50' : ''}`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted dark:hover:bg-night-raised"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted font-mono text-xs font-semibold text-ink tnum dark:border-night-line dark:bg-night dark:text-night-text">
          {String(dayNumber).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-[13px] font-semibold text-ink dark:text-night-text">{longDayLabel(date)}</span>
            {isToday && <Badge tone="accent">Today</Badge>}
            <Badge tone={statusTone(status === 'Overdue' || status === 'Partially Complete' ? 'In Progress' : status)}>
              {status}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {subjState.map((s) => (
              <span key={s.subject} className="flex items-center gap-1 text-2xs text-ink-tertiary dark:text-night-tertiary">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    s.done === s.total && s.total > 0 ? 'bg-emerald-500' : s.done > 0 ? 'bg-accent' : 'bg-line-strong dark:bg-night-line'
                  }`}
                />
                {s.subject.slice(0, 4)} {s.done}/{s.total}
              </span>
            ))}
            <span className="font-mono text-2xs text-ink-tertiary tnum dark:text-night-tertiary">{progress.percent}%</span>
          </div>
        </div>
        <ProgressBar value={progress.completed} total={progress.total} size="sm" className="hidden w-24 sm:flex" />
        {expanded ? (
          <ChevronDown size={15} className="shrink-0 text-ink-tertiary" />
        ) : (
          <ChevronRight size={15} className="shrink-0 text-ink-tertiary" />
        )}
      </button>

      {expanded && (
        <div className="animate-fade-in border-t divider bg-surface-muted/50 px-2 py-2 dark:bg-night/40">
          {topics.filter(highlight).map((t) => (
            <TopicRow key={t.id} topic={t} showDate={false} onOpen={onOpenTopic} />
          ))}
          {topics.filter(highlight).length === 0 && (
            <p className="px-3 py-2 text-2xs text-ink-faint dark:text-night-tertiary">No topics on this day match the current filters.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarView({ onOpenTopic }: { onOpenTopic: (t: Topic) => void }) {
  const { data } = useStore();
  const [month, setMonth] = useState('October 2026');
  const sections = monthSections();
  const section = sections.find((s) => s.label === month) ?? sections[0];

  const days: { dayNumber: number; date: string; blank: boolean }[] = [];
  const firstDate = data.days[String(section.fromDay)]?.date ?? '';
  const firstDow = new Date(firstDate + 'T00:00:00').getDay();
  for (let i = 0; i < firstDow; i++) days.push({ dayNumber: 0, date: `pad-${i}`, blank: true });
  for (let d = section.fromDay; d <= section.toDay; d++) {
    days.push({ dayNumber: d, date: data.days[String(d)]?.date ?? '', blank: false });
  }

  return (
    <Card
      title="Calendar view"
      subtitle="Compact month grid — click any day to open its topics"
      action={
        <Select
          value={month}
          onChange={setMonth}
          options={sections.map((s) => ({ value: s.label, label: s.label }))}
          ariaLabel="Select month"
        />
      }
    >
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="py-1 text-2xs font-medium text-ink-faint dark:text-night-tertiary">
            {d}
          </div>
        ))}
        {days.map((d) =>
          d.blank ? (
            <div key={d.date} />
          ) : (
            <CalDay key={d.dayNumber} dayNumber={d.dayNumber} date={d.date} onOpenTopic={onOpenTopic} />
          ),
        )}
      </div>
    </Card>
  );
}

function CalDay({ dayNumber, date, onOpenTopic }: { dayNumber: number; date: string; onOpenTopic: (t: Topic) => void }) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const progress = dayProgress(data, dayNumber);
  const status = dayStatus(data, dayNumber);
  const isToday = date === todayISO();
  const topics = topicsForDay(data, dayNumber);

  const bg =
    status === 'Completed'
      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60'
      : status === 'Overdue' || status === 'Partially Complete'
        ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60'
        : status === 'In Progress'
          ? 'bg-accent-soft border-accent-border dark:bg-accent/10 dark:border-accent/30'
          : 'bg-white border-line dark:bg-night-surface dark:border-night-line';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full rounded-lg border px-1.5 py-2 text-left transition hover:ring-2 hover:ring-accent/25 ${bg} ${isToday ? 'ring-2 ring-accent/50' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-2xs font-semibold text-ink tnum dark:text-night-text">{dayNumber}</span>
          <span className="font-mono text-[9px] text-ink-tertiary tnum dark:text-night-tertiary">{shortDate(date).split(' ')[1]}</span>
        </div>
        <div className="mt-1.5 flex gap-0.5">
          {topics.map((t) => (
            <span
              key={t.id}
              className={`h-1 flex-1 rounded-full ${
                t.status === 'Completed'
                  ? 'bg-emerald-500'
                  : t.status === 'In Progress'
                    ? 'bg-accent'
                    : t.status === 'Needs Revision'
                      ? 'bg-amber-400'
                      : 'bg-line-strong dark:bg-night-line'
              }`}
            />
          ))}
        </div>
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded-xl border border-line bg-white p-3 shadow-drawer dark:border-night-line dark:bg-night-surface">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-2xs font-semibold text-ink dark:text-night-text">{mediumDate(date)}</span>
            <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink">
              <X size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setOpen(false);
                  onOpenTopic(t);
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-2xs text-ink-secondary transition hover:bg-surface-sunken hover:text-ink dark:text-night-secondary dark:hover:bg-night-raised"
              >
                <span className="font-medium">{t.subject.slice(0, 4)}:</span> {t.title}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <ProgressBar value={progress.completed} total={progress.total} showLabel size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}

void CalendarDays;
void StatusBadge;
void weekdayName;
