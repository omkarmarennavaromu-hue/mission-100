/* Today's Plan — daily task workflow + Catch-Up Mode for backlog management. */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ListTodo,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../state/store';
import {
  dayProgress,
  dayStatus,
  overdueTopics,
  topicsForDay,
} from '../lib/progress';
import { longDayLabel, mediumDate, missionClock, todayISO, TOTAL_DAYS } from '../lib/dates';
import { Badge, Card, EmptyState, ProgressBar, Tabs } from '../components/ui';
import { SUBJECT_META, StatusBadge, TopicDetailPanel, TopicRow } from '../components/topics/TopicBits';
import type { Subject, Topic } from '../types';
import { SUBJECTS } from '../types';

type View = 'plan' | 'catchup';

export default function TodaysPlan() {
  const { data, setDayNotes, rescheduleTopic, notify } = useStore();
  const clock = missionClock();
  const today = todayISO();
  const [view, setView] = useState<View>('plan');
  const [openTopic, setOpenTopic] = useState<Topic | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ learned: true, struggled: true, revisit: true });

  const dayNo = clock.currentDay ?? (clock.mode === 'pre-start' ? 1 : TOTAL_DAYS);
  const topics = topicsForDay(data, dayNo);
  const progress = dayProgress(data, dayNo);
  const status = dayStatus(data, dayNo);
  const dayRecord = data.days[String(dayNo)];
  const notes = dayRecord?.notes ?? '';

  const overdue = useMemo(() => overdueTopics(data), [data]);

  // Group notes: the daily note is a single field per spec, but we provide structured prompts
  // appended into it. Simpler: one field with three prompt placeholders shown in UI.
  const setNotes = (v: string) => setDayNotes(dayNo, v);

  const bySubject: Record<Subject, Topic[]> = {
    Physics: topics.filter((t) => t.subject === 'Physics'),
    Chemistry: topics.filter((t) => t.subject === 'Chemistry'),
    Mathematics: topics.filter((t) => t.subject === 'Mathematics'),
  };

  return (
    <div className="space-y-6">
      {/* Day header */}
      <section className="card px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-title">Today's plan</p>
            <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink dark:text-night-text">
              {clock.mode === 'active' ? `Day ${String(dayNo).padStart(2, '0')}` : `Day ${String(dayNo).padStart(2, '0')} (viewing)`}
              <span className="ml-2 text-base font-normal text-ink-tertiary dark:text-night-tertiary">
                {longDayLabel(data.days[String(dayNo)]?.date ?? today)}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={status === 'Overdue' || status === 'Partially Complete' ? 'In Progress' : status} />
              {status === 'Overdue' && <Badge tone="danger">Overdue</Badge>}
              {status === 'Partially Complete' && <Badge tone="warn">Partially complete</Badge>}
              <span className="font-mono text-2xs text-ink-tertiary tnum dark:text-night-tertiary">
                {progress.completed}/{progress.total} topics · {progress.percent}%
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="w-56">
              <ProgressBar value={progress.completed} total={progress.total} showLabel />
            </div>
            {clock.mode !== 'active' && (
              <Link to="/roadmap" className="text-2xs font-medium text-accent hover:underline">
                Open roadmap to pick another day →
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Tabs<View>
            tabs={[
              { id: 'plan', label: 'Daily checklist', count: topics.length },
              { id: 'catchup', label: 'Catch-Up Mode', count: overdue.length },
            ]}
            active={view}
            onChange={setView}
          />
        </div>
      </section>

      {view === 'plan' ? (
        <>
          {/* Subject sections */}
          <div className="grid gap-6 lg:grid-cols-3">
            {SUBJECTS.map((subject) => {
              const meta = SUBJECT_META[subject];
              const list = bySubject[subject];
              const done = list.filter((t) => t.status === 'Completed').length;
              return (
                <Card
                  key={subject}
                  title={
                    <span className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-2xs font-semibold ${meta.color}`}>
                        {subject}
                      </span>
                    </span>
                  }
                  subtitle={`${done}/${list.length} completed`}
                >
                  {list.length === 0 ? (
                    <p className="text-2xs text-ink-faint dark:text-night-tertiary">No {subject} topic scheduled today.</p>
                  ) : (
                    <div className="space-y-1">
                      {list.map((t) => (
                        <TopicRow key={t.id} topic={t} showDate={false} onOpen={setOpenTopic} />
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Daily notes */}
          <Card
            title="Daily study notes"
            subtitle="What I learned · What I struggled with · What I need to revisit tomorrow"
          >
            <textarea
              className="input-base min-h-[120px] resize-y text-sm leading-relaxed"
              placeholder={'What I learned…\n\nWhat I struggled with…\n\nWhat I need to revisit tomorrow…'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="mt-2 flex items-center gap-1.5 text-2xs text-ink-faint dark:text-night-tertiary">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Notes save automatically as you type and can be edited any time from the roadmap.
            </p>
          </Card>
        </>
      ) : (
        <CatchUpView
          overdue={overdue}
          onOpen={setOpenTopic}
          onReschedule={(id, date) => {
            const ok = rescheduleTopic(id, date);
            notify(ok ? 'Topic rescheduled (original date preserved).' : 'Could not reschedule topic.', ok ? 'success' : 'error');
          }}
        />
      )}

      {openTopic && <TopicDetailPanel topic={openTopic} onClose={() => setOpenTopic(null)} />}
    </div>
  );
}

function CatchUpView({
  overdue,
  onOpen,
  onReschedule,
}: {
  overdue: Topic[];
  onOpen: (t: Topic) => void;
  onReschedule: (id: string, date: string | null) => void;
}) {
  const { data } = useStore();
  const today = todayISO();
  const [expanded, setExpanded] = useState(true);
  const todayTopics = data.days && missionClock().currentDay ? topicsForDay(data, missionClock().currentDay!) : [];

  const bySubject: Record<Subject, number> = {
    Physics: overdue.filter((t) => t.subject === 'Physics').length,
    Chemistry: overdue.filter((t) => t.subject === 'Chemistry').length,
    Mathematics: overdue.filter((t) => t.subject === 'Mathematics').length,
  };

  // Suggested queue: oldest overdue first, then subject balance, then proximity to tests
  const suggested = useMemo(() => {
    const testDates = data.assessments.map((a) => a.date).sort();
    return overdue.slice().sort((a, b) => {
      // 1. oldest first
      const d = a.originalScheduledDate.localeCompare(b.originalScheduledDate);
      if (d !== 0) return d;
      // 2. subject balance: subject with more backlog later
      const sa = bySubject[a.subject];
      const sb = bySubject[b.subject];
      if (sa !== sb) return sa - sb;
      // 3. closest upcoming test subject priority
      const ta = testDates.find((dt) => dt > today && dt >= a.originalScheduledDate) ?? '9999';
      const tb = testDates.find((dt) => dt > today && dt >= b.originalScheduledDate) ?? '9999';
      return ta.localeCompare(tb);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overdue, data.assessments, today]);

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padded>
          <p className="section-title">Overdue incomplete</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-amber-600 tnum dark:text-amber-400">{overdue.length}</p>
          <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">past scheduled topics</p>
        </Card>
        <Card padded>
          <p className="section-title">Today's scheduled</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-ink tnum dark:text-night-text">{todayTopics.length}</p>
          <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">{mediumDate(today)}</p>
        </Card>
        <Card padded>
          <p className="section-title">Total backlog</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-ink tnum dark:text-night-text">
            {overdue.length + todayTopics.filter((t) => t.status !== 'Completed').length}
          </p>
          <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">overdue + remaining today</p>
        </Card>
        <Card padded>
          <p className="section-title">Backlog by subject</p>
          <div className="mt-1.5 space-y-1">
            {SUBJECTS.map((s) => (
              <div key={s} className="flex items-center justify-between text-2xs">
                <span className="text-ink-secondary dark:text-night-secondary">{s}</span>
                <span className="font-mono tnum text-ink dark:text-night-text">{bySubject[s]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Principle banner */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5 dark:border-sky-900/60 dark:bg-sky-950/30">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
        <p className="text-xs leading-relaxed text-sky-900 dark:text-sky-200">
          Catch-Up Mode never alters the original 90-day schedule. Rescheduling stores a separate revised target date;
          the topic keeps its original place on the roadmap, and nothing is duplicated or silently moved.
        </p>
      </div>

      {/* Suggested queue */}
      <Card
        title="Suggested catch-up queue"
        subtitle="Ordered by: oldest overdue → subject balance → upcoming tests. Fully editable — apply or ignore."
        action={
          <button className="btn-ghost" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        }
      >
        {suggested.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title="No overdue topics"
            description="There is nothing in the backlog. Keep executing the daily plan."
          />
        ) : (
          expanded && (
            <ul className="space-y-2">
              {suggested.map((t, i) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3.5 py-3 dark:border-night-line">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken font-mono text-2xs font-semibold text-ink-tertiary tnum dark:bg-night-raised dark:text-night-tertiary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => onOpen(t)} className="block text-left text-[13px] font-medium text-ink hover:text-accent dark:text-night-text">
                      {t.title}
                    </button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
                      <span>{t.subject}</span>
                      <span>·</span>
                      <span>Day {t.dayNumber}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <CalendarClock size={10} /> {mediumDate(t.originalScheduledDate)}
                      </span>
                      {t.revisedTargetDate && (
                        <>
                          <span>·</span>
                          <span className="text-sky-600 dark:text-sky-400">revised → {mediumDate(t.revisedTargetDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      className="input-base w-auto py-1 text-2xs"
                      value={t.revisedTargetDate ?? ''}
                      onChange={(e) => onReschedule(t.id, e.target.value || null)}
                      title="Set revised target date (original date preserved)"
                    />
                    {t.revisedTargetDate && (
                      <button className="btn-ghost px-2 py-1 text-2xs" onClick={() => onReschedule(t.id, null)}>
                        Clear
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </Card>

      {/* Overdue list (plain, grouped by subject) */}
      <Card title="All overdue topics" subtitle="Past incomplete work stays accessible until it is finished">
        {overdue.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={22} />} title="Nothing overdue" description="All past scheduled topics are complete." />
        ) : (
          <div className="space-y-4">
            {SUBJECTS.map((s) => {
              const list = overdue.filter((t) => t.subject === s);
              if (list.length === 0) return null;
              return (
                <div key={s}>
                  <p className="section-title mb-2">
                    {s} · {list.length}
                  </p>
                  <div className="space-y-1">
                    {list.map((t) => (
                      <TopicRow key={t.id} topic={t} showDay onOpen={onOpen} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

void AlertTriangle;
void ArrowLeftRight;
void Clock;
void ListTodo;
void RotateCcw;
