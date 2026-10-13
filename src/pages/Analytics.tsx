/* Analytics — six data-driven charts + calculated insight panel. */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Info,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Target,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../state/store';
import {
  actualCumulativeSeries,
  completionsByDate,
  dayProgress,
  plannedCumulativeSeries,
  statusDistribution,
  subjectStat,
  testsSummary,
  weeklyCompletedBySubject,
} from '../lib/progress';
import { buildInsights } from '../lib/insights';
import { mediumDate, shortDate, TOTAL_DAYS, weekdayOfPlanStart } from '../lib/dates';
import { Card, EmptyState, ProgressBar } from '../components/ui';
import { SUBJECTS } from '../types';

const CHART_TOOLTIP = {
  borderRadius: 8,
  fontSize: 12,
  borderColor: '#e5e5e5',
  backgroundColor: '#ffffff',
};

const AXIS = { fontSize: 10, fill: '#a3a3a3' };

export default function Analytics() {
  const { data } = useStore();
  const overallDone = Object.values(data.topics).filter((t) => t.status === 'Completed').length;
  const hasAny = overallDone > 0;
  const insights = buildInsights(data);
  const tests = testsSummary(data);

  /* Chart A — cumulative planned vs actual */
  const cumulative = useMemo(() => {
    const planned = plannedCumulativeSeries(data);
    const actual = actualCumulativeSeries(data);
    return planned.map((p, i) => ({
      day: p.dayNumber,
      date: shortDate(p.date),
      planned: p.planned,
      actual: actual[i]?.actual ?? 0,
    }));
  }, [data]);

  /* Chart B — subject performance */
  const subjectPerf = useMemo(
    () =>
      SUBJECTS.map((s) => {
        const st = subjectStat(data, s);
        return { subject: s, completed: st.completed, total: st.total, percent: st.percent };
      }),
    [data],
  );

  /* Chart C — heatmap */
  const completions = completionsByDate(data);

  /* Chart D — weekly progress by subject */
  const weekly = useMemo(() => weeklyCompletedBySubject(data), [data]);

  /* Chart E — test performance */
  const testSeries = useMemo(
    () =>
      data.assessments
        .filter((a) => a.marksObtained !== null && a.maximumMarks !== null && a.maximumMarks > 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((a, i) => ({
          name: `T${i + 1}`,
          date: shortDate(a.date),
          pct: Math.round(((a.marksObtained as number) / (a.maximumMarks as number)) * 100),
          title: a.title,
        })),
    [data.assessments],
  );

  /* Chart F — status distribution */
  const dist = statusDistribution(data);
  const distData = [
    { name: 'Not Started', value: dist['Not Started'], color: '#d4d4d4' },
    { name: 'In Progress', value: dist['In Progress'], color: '#2563eb' },
    { name: 'Completed', value: dist.Completed, color: '#10b981' },
    { name: 'Needs Revision', value: dist['Needs Revision'], color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <section className="card px-6 py-5">
        <p className="section-title">Analytics</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink dark:text-night-text">
          Performance intelligence
        </h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">
          Every figure on this page is calculated from your stored records. Scheduled completion refers to topics being
          checked off; actual cumulative progress uses real completion timestamps, so late work appears later in history.
          No predictions about exam marks or rank are generated.
        </p>
      </section>

      {/* Chart A */}
      <Card
        title="Chart A — Cumulative progress"
        subtitle="Planned cumulative topics (dashed) vs. actual cumulative completion (solid, timestamp-based)"
        action={<Badgeish icon={<LineChartIcon size={12} />} text={`${overallDone} completed`} />}
      >
        {!hasAny ? (
          <EmptyState
            icon={<LineChartIcon size={22} />}
            title="No actual progress recorded"
            description="The planned line reflects the preloaded schedule. The actual line appears once topics are completed."
          />
        ) : (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulative} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="an-actual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} interval={9} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v: number, name: string) => [`${v} topics`, name]}
                    labelFormatter={(l) => `Day ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="planned" name="Scheduled (planned)" stroke="#a3a3a3" strokeDasharray="5 4" fill="none" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="actual" name="Actual (timestamped)" stroke="#2563eb" fill="url(#an-actual)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 rounded-lg border border-line bg-surface-muted px-3.5 py-2.5 text-2xs leading-relaxed text-ink-secondary dark:border-night-line dark:bg-night dark:text-night-secondary">
              <span className="font-medium text-ink dark:text-night-text">How to read this:</span> the dashed planned line
              shows how many topics the schedule has assigned cumulatively by each day. The solid actual line counts topics
              whose completion timestamp falls on or before that date — a topic finished late contributes late.
            </div>
          </>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart B */}
        <Card title="Chart B — Subject performance" subtitle="Completed vs. total planned topics per subject">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerf} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="subject" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(37,99,235,0.05)' }}
                  contentStyle={CHART_TOOLTIP}
                  formatter={(v: number, name: string) => [`${v} topics`, name === 'completed' ? 'Completed' : 'Total planned']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" name="total" fill="#e5e5e5" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="completed" name="completed" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {subjectPerf.map((s) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="w-24 text-2xs text-ink-secondary dark:text-night-secondary">{s.subject}</span>
                <ProgressBar value={s.completed} total={s.total} size="sm" className="flex-1" />
                <span className="w-20 text-right font-mono text-2xs text-ink-tertiary tnum dark:text-night-tertiary">
                  {s.completed}/{s.total} · {s.percent}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Chart F */}
        <Card title="Chart F — Completion distribution" subtitle="Breakdown of all 270 topic records by status">
          {distData.length === 0 || dist['Not Started'] === 270 ? (
            <EmptyState
              icon={<PieChartIcon size={22} />}
              title="All topics are Not Started"
              description="The distribution will change as you work through the plan."
            />
          ) : (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                      {distData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number, name: string) => [`${v} topics`, name]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {distData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 dark:border-night-line">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="flex-1 text-2xs text-ink-secondary dark:text-night-secondary">{d.name}</span>
                    <span className="font-mono text-2xs font-semibold text-ink tnum dark:text-night-text">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Chart C — heatmap */}
      <Card
        title="Chart C — Daily activity heatmap"
        subtitle="Topics completed per calendar day using actual completion timestamps — days without activity stay unshaded"
        action={<Badgeish icon={<CalendarRange size={12} />} text={`${Object.keys(completions).length} active days`} />}
      >
        <Heatmap completions={completions} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart D */}
        <Card title="Chart D — Weekly progress" subtitle="Completed topics per plan week (Days 1–7, 8–14, …), grouped by subject">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(37,99,235,0.05)' }}
                  contentStyle={CHART_TOOLTIP}
                  formatter={(v: number, name: string) => [`${v} completed`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Physics" stackId="w" fill="#0ea5e9" radius={[0, 0, 0, 0]} barSize={22} />
                <Bar dataKey="Chemistry" stackId="w" fill="#10b981" />
                <Bar dataKey="Mathematics" stackId="w" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-2xs text-ink-tertiary dark:text-night-tertiary">
            Counts use the topic's scheduled plan week. Week 13 covers days 85–90.
          </p>
        </Card>

        {/* Chart E */}
        <Card title="Chart E — Test performance" subtitle="Graded assessment percentages over time">
          {tests.graded === 0 ? (
            <EmptyState
              icon={<Target size={22} />}
              title="No graded tests are available yet"
              description="This chart intentionally stays empty rather than inventing a score series. Enter marks in Tests & Assessments to populate it."
              action={
                <Link to="/tests" className="btn-ghost">
                  Open assessments <ArrowRight size={12} />
                </Link>
              }
            />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={testSeries} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v: number, _n: string, item: { payload?: { title?: string } }) => [`${v}%`, item?.payload?.title ?? 'Score']}
                  />
                  <Line type="monotone" dataKey="pct" name="Score %" stroke="#2563eb" strokeWidth={2} dot={{ r: 3.5, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Insight panel */}
      <Card
        title="Insight panel"
        subtitle="Generated from stored records only — no predictions about marks, rank, or outcomes"
        action={<Badgeish icon={<Info size={12} />} text={`${insights.length} insights`} />}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed ${
                ins.kind === 'attention'
                  ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100'
                  : ins.kind === 'good'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100'
                    : 'border-line bg-surface-muted text-ink-secondary dark:border-night-line dark:bg-night dark:text-night-secondary'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {ins.kind === 'attention' ? (
                  <AlertTriangle size={13} />
                ) : ins.kind === 'good' ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Info size={13} />
                )}
              </span>
              {ins.text}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Badgeish({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-2.5 py-1 text-2xs font-medium text-ink-secondary dark:border-night-line dark:bg-night dark:text-night-secondary">
      {icon} {text}
    </span>
  );
}

function Heatmap({ completions }: { completions: Record<string, ReturnType<typeof Object>[]> }) {
  const { data } = useStore();
  const startCol = weekdayOfPlanStart();
  const cells: { key: string; date: string; dayNumber: number | null; count: number }[] = [];
  for (let i = 0; i < startCol; i++) cells.push({ key: `pad-${i}`, date: '', dayNumber: null, count: 0 });
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const date = data.days[String(d)]?.date ?? '';
    cells.push({ key: `d-${d}`, date, dayNumber: d, count: (completions[date] as unknown[] | undefined)?.length ?? 0 });
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
        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5" style={{ minWidth: 620 }}>
          {cells.map((c) =>
            c.dayNumber === null ? (
              <div key={c.key} />
            ) : (
              <div
                key={c.key}
                title={
                  c.count > 0
                    ? `Day ${c.dayNumber} · ${mediumDate(c.date)} · ${c.count} topic${c.count === 1 ? '' : 's'} completed`
                    : `Day ${c.dayNumber} · ${mediumDate(c.date)} · no completions recorded`
                }
                className={`aspect-square rounded-[5px] border transition hover:ring-2 hover:ring-accent/30 ${level(c.count)}`}
              >
                <div className="flex h-full items-center justify-center font-mono text-[9px] text-ink-faint tnum dark:text-night-tertiary">
                  {c.dayNumber}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs text-ink-tertiary dark:text-night-tertiary">
        <span>0 topics</span>
        <span className="h-3 w-3 rounded-[3px] border border-line bg-surface-sunken dark:bg-night-raised dark:border-night-line" />
        <span className="h-3 w-3 rounded-[3px] border border-blue-200 bg-blue-100 dark:bg-blue-950/60 dark:border-blue-900" />
        <span className="h-3 w-3 rounded-[3px] border border-blue-400 bg-blue-300 dark:bg-blue-800 dark:border-blue-700" />
        <span className="h-3 w-3 rounded-[3px] border border-accent-hover bg-accent dark:bg-blue-500 dark:border-blue-400" />
        <span>3+ topics</span>
      </div>
    </div>
  );
}

void Activity;
void BarChart3;
void dayProgress;
