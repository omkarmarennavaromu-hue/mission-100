/* Overview — mission header, metrics, today's progress, focus, analytics preview. */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Flag,
  LineChart,
  ListTodo,
  RotateCcw,
  Target,
} from 'lucide-react';
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
import { useStore } from '../state/store';
import {
  completionsByDate,
  consistencyStreak,
  dayProgress,
  needsRevisionList,
  overallStat,
  plannedCumulativeSeries,
  actualCumulativeSeries,
  subjectStat,
  testsSummary,
  topicsForDay,
} from '../lib/progress';
import { longDayLabel, missionClock, mediumDate, PLAN_END, PLAN_START, todayISO, TOTAL_DAYS, weekdayOfPlanStart } from '../lib/dates';
import { Card, EmptyState, ProgressBar, Select } from '../components/ui';
import { SUBJECT_META, StatusBadge, TopicDetailPanel, TopicRow } from '../components/topics/TopicBits';
import type { Topic } from '../types';
import { SUBJECTS } from '../types';

export default function Overview() {
  const { data, setDayNotes } = useStore();
  const clock = missionClock();
  const today = todayISO();
  const [openTopic, setOpenTopic] = useState<Topic | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(clock.currentDay ?? 1);

  const dayNo = clock.currentDay;
  const todayTopics = dayNo ? topicsForDay(data, dayNo) : [];
  const daily = dayNo ? dayProgress(data, dayNo) : null;
  const overall = overallStat(data);
  const phys = subjectStat(data, 'Physics');
  const chem = subjectStat(data, 'Chemistry');
  const math = subjectStat(data, 'Mathematics');
  const revisionQueue = needsRevisionList(data);
  const tests = testsSummary(data);
  const streak = consistencyStreak(data);

  const cumulative = useMemo(() => {
    const planned = plannedCumulativeSeries(data);
    const actual = actualCumulativeSeries(data);
    return planned.map((p, i) => ({ day: p.dayNumber, planned: p.planned, actual: actual[i]?.actual ?? 0 }));
  }, [data]);

  const subjectCompare = useMemo(
    () => [
      { subject: 'Physics', completed: phys.completed, total: phys.total, percent: phys.percent },
      { subject: 'Chemistry', completed: chem.completed, total: chem.total, percent: chem.percent },
      { subject: 'Mathematics', completed: math.completed, total: math.total, percent: math.percent },
    ],
    [phys, chem, math],
  );

  const completions = completionsByDate(data);
  const hasAnyCompletion = overall.completed > 0;

  const dayTopics = topicsForDay(data, selectedDay);
  const dayNotesValue = data.days[String(selectedDay)]?.notes ?? '';
  const selectedDayProgress = dayProgress(data, selectedDay);

  const focus = {
    Physics: dayTopics.find((t) => t.subject === 'Physics'),
    Chemistry: dayTopics.find((t) => t.subject === 'Chemistry'),
    Mathematics: dayTopics.find((t) => t.subject === 'Mathematics'),
  };

  return (
    <div className="space-y-6">
      {/* Mission header */}
      <section className="card overflow-hidden">
        <div className="border-b divider px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="section-title">Mission header</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl dark:text-night-text">
                MISSION 100
              </h1>
              <p className="mt-1 text-sm text-ink-secondary dark:text-night-secondary">
                90-Day Academic Execution System
              </p>
              <p className="mt-2 font-mono text-xs text-ink-tertiary tnum dark:text-night-tertiary">
                {mediumDate(PLAN_START)} — {mediumDate(PLAN_END)}
              </p>
              <p className="mt-1 text-2xs text-ink-faint dark:text-night-tertiary">
                KSEAB 2nd PUC Board Examination 2027 · KCET 2027 · JEE Main 2027
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              {/* Study day / countdown */}
              <div className="rounded-xl border border-line bg-surface-muted px-5 py-4 text-left sm:text-right dark:border-night-line dark:bg-night">
                {clock.mode === 'active' && (
                  <>
                    <p className="text-2xs font-medium uppercase tracking-[0.14em] text-ink-tertiary dark:text-night-tertiary">Current study day</p>
                    <p className="mt-1 font-mono text-4xl font-semibold tracking-tight text-ink tnum dark:text-night-text">
                      {String(clock.currentDay).padStart(2, '0')}
                      <span className="text-xl text-ink-faint dark:text-night-tertiary"> / 90</span>
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-2xs text-ink-tertiary dark:text-night-tertiary sm:justify-end">
                      <CalendarClock size={11} />
                      {clock.daysRemaining} days remaining · deadline {mediumDate(PLAN_END)}
                    </p>
                  </>
                )}
                {clock.mode === 'pre-start' && (
                  <>
                    <p className="text-2xs font-medium uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">Pre-start</p>
                    <p className="mt-1 font-mono text-4xl font-semibold tracking-tight text-ink tnum dark:text-night-text">
                      {clock.daysRemaining}
                      <span className="text-xl text-ink-faint"> days</span>
                    </p>
                    <p className="mt-1.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
                      until Day 1 on {mediumDate(PLAN_START)}
                    </p>
                  </>
                )}
                {clock.mode === 'post-end' && (
                  <>
                    <p className="text-2xs font-medium uppercase tracking-[0.14em] text-ink-tertiary dark:text-night-tertiary">Plan window</p>
                    <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-ink dark:text-night-text">
                      {overall.completed === overall.total ? 'Completed' : 'Past deadline'}
                    </p>
                    <p className="mt-1.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
                      {overall.completed}/{overall.total} topics complete
                    </p>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to="/today" className="btn-accent">
                  <ListTodo size={14} /> Open today's plan
                </Link>
                <Link to="/roadmap" className="btn-ghost">
                  90-day roadmap <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 divide-x divide-y divider sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          <Metric
            label="Overall completion"
            value={`${overall.percent}%`}
            sub={`${overall.completed} / ${overall.total} topics`}
            icon={<Target size={14} />}
          />
          <Metric
            label="Physics"
            value={`${phys.percent}%`}
            sub={`${phys.completed} / ${phys.total}`}
            icon={<SubjectIconDot subject="Physics" />}
            bar={{ v: phys.completed, t: phys.total }}
          />
          <Metric
            label="Chemistry"
            value={`${chem.percent}%`}
            sub={`${chem.completed} / ${chem.total}`}
            icon={<SubjectIconDot subject="Chemistry" />}
            bar={{ v: chem.completed, t: chem.total }}
          />
          <Metric
            label="Mathematics"
            value={`${math.percent}%`}
            sub={`${math.completed} / ${math.total}`}
            icon={<SubjectIconDot subject="Mathematics" />}
            bar={{ v: math.completed, t: math.total }}
          />
          <Metric
            label="Need revision"
            value={String(revisionQueue.length)}
            sub={revisionQueue.length === 1 ? 'topic flagged' : 'topics flagged'}
            icon={<RotateCcw size={14} />}
            tone={revisionQueue.length > 0 ? 'warn' : 'default'}
          />
          <Metric
            label="Tests"
            value={tests.graded > 0 ? `${tests.averagePercent}%` : '—'}
            sub={
              tests.graded > 0
                ? `${tests.completed} completed · avg score`
                : `${tests.completed}/${tests.total} completed · no grades yet`
            }
            icon={<CalendarCheck2 size={14} />}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's progress */}
        <Card
          className="lg:col-span-3"
          title={dayNo ? `Today's progress — Day ${String(dayNo).padStart(2, '0')}` : "Today's progress"}
          subtitle={dayNo ? longDayLabel(today) : `Selected day · ${mediumDate(data.days[String(selectedDay)]?.date ?? PLAN_START)}`}
          action={
            dayNo ? (
              <Link to="/today" className="text-xs font-medium text-accent hover:underline">
                Full plan →
              </Link>
            ) : (
              <Select
                value={String(selectedDay)}
                onChange={(v) => setSelectedDay(Number(v))}
                options={Array.from({ length: TOTAL_DAYS }, (_, i) => ({
                  value: String(i + 1),
                  label: `Day ${i + 1} — ${mediumDate(data.days[String(i + 1)]?.date ?? '')}`,
                }))}
              />
            )
          }
        >
          {(dayNo ? todayTopics : dayTopics).length === 0 ? (
            <EmptyState
              icon={<CircleDashed size={22} />}
              title="No topics scheduled"
              description="This day has no scheduled entries in the plan."
            />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-center gap-1.5 text-xs text-ink-secondary dark:text-night-secondary">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono tnum">
                    {(daily && dayNo ? daily : selectedDayProgress).completed} done
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ink-secondary dark:text-night-secondary">
                  <ListTodo size={13} className="text-ink-tertiary" />
                  <span className="font-mono tnum">
                    {(daily && dayNo ? daily : selectedDayProgress).total - (daily && dayNo ? daily : selectedDayProgress).completed} remaining
                  </span>
                </span>
                <div className="min-w-[140px] flex-1">
                  <ProgressBar
                    value={(daily && dayNo ? daily : selectedDayProgress).completed}
                    total={(daily && dayNo ? daily : selectedDayProgress).total}
                    showLabel
                  />
                </div>
              </div>
              <div className="space-y-1">
                {(dayNo ? todayTopics : dayTopics).map((t) => (
                  <TopicRow key={t.id} topic={t} showDate={false} onOpen={setOpenTopic} />
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Today's focus */}
        <Card className="lg:col-span-2" title="Today's focus" subtitle="One line per subject — keep it concrete">
          <div className="space-y-2.5">
            {SUBJECTS.map((s) => {
              const t = focus[s];
              return (
                <div key={s} className="rounded-lg border border-line px-3.5 py-2.5 dark:border-night-line">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-2xs font-semibold ${SUBJECT_META[s].color.split(' ').slice(0, 2).join(' ')}`}>
                      <SubjectIconDot subject={s} /> {s}
                    </span>
                    {t && <StatusBadge status={t.status} />}
                  </div>
                  <p className="mt-1.5 text-[13px] font-medium leading-snug text-ink dark:text-night-text">
                    {t ? t.title : 'No topic scheduled today'}
                  </p>
                  {t && (
                    <button
                      onClick={() => setOpenTopic(t)}
                      className="mt-1 text-2xs font-medium text-accent hover:underline"
                    >
                      Open topic details →
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <p className="section-title mb-2">Daily note</p>
            <textarea
              className="input-base min-h-[72px] resize-y text-sm"
              placeholder="What to prioritize today…"
              value={dayNotesValue}
              onChange={(e) => setDayNotes(selectedDay ?? 1, e.target.value)}
            />
          </div>

          <Link to="/today" className="btn-primary mt-3 w-full">
            <ListTodo size={14} /> Open today's complete plan
          </Link>
        </Card>
      </div>

      {/* Analytics preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="90-day cumulative completion"
          subtitle="Planned schedule vs. actual completions (by completion timestamp)"
          action={
            <Link to="/analytics" className="text-xs font-medium text-accent hover:underline">
              Full analytics →
            </Link>
          }
        >
          {!hasAnyCompletion ? (
            <EmptyState
              icon={<LineChart size={22} />}
              title="No completion data yet"
              description="The actual line will appear here as soon as you complete your first topic."
            />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulative} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ov-actual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#a3a3a3' }} tickLine={false} axisLine={false} interval={9} />
                  <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: '#e5e5e5' }}
                    formatter={(v: number, name: string) => [`${v} topics`, name]}
                    labelFormatter={(l) => `Day ${l}`}
                  />
                  <Area type="monotone" dataKey="planned" name="Scheduled" stroke="#a3a3a3" strokeDasharray="5 4" fill="none" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="#2563eb" fill="url(#ov-actual)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Subject completion comparison" subtitle="Completed topics per subject against the full plan">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectCompare} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#a3a3a3' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(37,99,235,0.06)' }}
                  contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: '#e5e5e5' }}
                  formatter={(v: number, name: string) => [
                    `${v} topics`,
                    name === 'completed' ? 'Completed' : 'Total planned',
                  ]}
                />
                <Bar dataKey="total" fill="#e5e5e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 text-2xs text-ink-tertiary dark:text-night-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#2563eb]" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#e5e5e5] dark:bg-night-line" /> Total planned
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Heatmap */}
        <Card className="lg:col-span-2" title="90-day activity" subtitle="Daily recorded completions — lighter days mean less activity, honest zeros">
          <Heatmap />
          {!hasAnyCompletion && (
            <p className="mt-3 text-2xs text-ink-tertiary dark:text-night-tertiary">
              No recorded activity yet. Days only light up when topics are actually completed.
            </p>
          )}
        </Card>

        {/* Consistency */}
        <Card title="Consistency" subtitle="Based on days with at least one recorded completion">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="stat-num">{streak.current}</p>
              <p className="mt-1 text-2xs text-ink-tertiary dark:text-night-tertiary">Current streak</p>
            </div>
            <div>
              <p className="stat-num">{streak.best}</p>
              <p className="mt-1 text-2xs text-ink-tertiary dark:text-night-tertiary">Best streak</p>
            </div>
            <div>
              <p className="stat-num">{streak.activeDays}</p>
              <p className="mt-1 text-2xs text-ink-tertiary dark:text-night-tertiary">Active days</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div>
              <div className="flex items-center justify-between text-2xs text-ink-tertiary dark:text-night-tertiary">
                <span>Days with activity</span>
                <span className="font-mono tnum">{streak.activeDays} / {TOTAL_DAYS}</span>
              </div>
              <ProgressBar value={streak.activeDays} total={TOTAL_DAYS} size="sm" className="mt-1" />
            </div>
            <div className="rounded-lg border border-line px-3.5 py-3 dark:border-night-line">
              <p className="flex items-center gap-1.5 text-2xs font-medium text-ink-secondary dark:text-night-secondary">
                <Activity size={12} className="text-accent" />
                Daily consistency
              </p>
              <p className="mt-1 text-2xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">
                {streak.activeDays === 0
                  ? 'Complete any topic today to start your activity record.'
                  : streak.current > 0
                    ? `You have recorded study activity for ${streak.current} consecutive day${streak.current === 1 ? '' : 's'} ending today.`
                    : 'No activity recorded today yet — yesterday or earlier is still on record.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {openTopic && <TopicPanelLazy topic={openTopic} onClose={() => setOpenTopic(null)} />}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  tone = 'default',
  bar,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone?: 'default' | 'warn';
  bar?: { v: number; t: number };
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.1em] text-ink-tertiary dark:text-night-tertiary">
        <span className={tone === 'warn' ? 'text-amber-500' : 'text-ink-faint'}>{icon}</span>
        {label}
      </div>
      <p className={`mt-1.5 font-mono text-2xl font-semibold tracking-tight tnum ${tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-ink dark:text-night-text'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">{sub}</p>
      {bar && <ProgressBar value={bar.v} total={bar.t} size="sm" className="mt-2" />}
    </div>
  );
}

function SubjectIconDot({ subject }: { subject: 'Physics' | 'Chemistry' | 'Mathematics' }) {
  const colors: Record<string, string> = {
    Physics: 'bg-sky-500',
    Chemistry: 'bg-emerald-500',
    Mathematics: 'bg-violet-500',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[subject]}`} />;
}

function Heatmap() {
  const { data } = useStore();
  const completions = completionsByDate(data);
  const startCol = weekdayOfPlanStart(); // 0=Sun
  const cells: { date: string; dayNumber: number | null; count: number }[] = [];
  for (let i = 0; i < startCol; i++) cells.push({ date: `pad-${i}`, dayNumber: null, count: 0 });
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const date = data.days[String(d)]?.date ?? '';
    cells.push({ date, dayNumber: d, count: completions[date]?.length ?? 0 });
  }

  const level = (n: number) => {
    if (n === 0) return 'bg-surface-sunken border-line dark:bg-night-raised dark:border-night-line';
    if (n === 1) return 'bg-blue-100 border-blue-200 dark:bg-blue-950/60 dark:border-blue-900';
    if (n === 2) return 'bg-blue-300 border-blue-400 dark:bg-blue-800 dark:border-blue-700';
    return 'bg-accent border-accent-hover dark:bg-blue-500 dark:border-blue-400';
  };

  return (
    <div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1" style={{ minWidth: 560 }}>
          {cells.map((c) =>
            c.dayNumber === null ? (
              <div key={c.date} />
            ) : (
              <div
                key={c.date}
                title={
                  c.count > 0
                    ? `Day ${c.dayNumber} · ${c.date} · ${c.count} topic${c.count === 1 ? '' : 's'} completed`
                    : `Day ${c.dayNumber} · ${c.date} · no completions recorded`
                }
                className={`aspect-square rounded-[4px] border transition hover:ring-2 hover:ring-accent/30 ${level(c.count)}`}
              >
                <div className="flex h-full items-center justify-center font-mono text-[8px] text-ink-faint tnum dark:text-night-tertiary">
                  {c.dayNumber}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-2xs text-ink-tertiary dark:text-night-tertiary">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] border border-line bg-surface-sunken dark:bg-night-raised dark:border-night-line" />
        <span className="h-3 w-3 rounded-[3px] border border-blue-200 bg-blue-100 dark:bg-blue-950/60 dark:border-blue-900" />
        <span className="h-3 w-3 rounded-[3px] border border-blue-400 bg-blue-300 dark:bg-blue-800 dark:border-blue-700" />
        <span className="h-3 w-3 rounded-[3px] border border-accent-hover bg-accent dark:bg-blue-500 dark:border-blue-400" />
        <span>More</span>
        <span className="ml-2 text-ink-faint dark:text-night-tertiary">= topics completed that day (3 max/day planned)</span>
      </div>
    </div>
  );
}

function TopicPanelLazy({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  return <TopicDetailPanel topic={topic} onClose={onClose} />;
}
