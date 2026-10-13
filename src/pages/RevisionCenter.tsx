/* Revision Center — auto-collected revision queue with session workflow. */

import { useMemo, useState } from 'react';
import { CheckCircle2, Filter, RotateCcw, Search, X } from 'lucide-react';
import { useStore } from '../state/store';
import { needsRevisionList, revisedOnOrAfter, revisionCountFor } from '../lib/progress';
import { mediumDate, todayISO } from '../lib/dates';
import { Badge, Card, EmptyState, ProgressBar, Select, Tabs } from '../components/ui';
import { ConfidenceStars, StatusBadge, TopicDetailPanel } from '../components/topics/TopicBits';
import type { Subject, Topic } from '../types';
import { SUBJECTS } from '../types';

type Reason = 'Marked Needs Revision' | 'Confidence 1–2' | 'Completed — not yet revised';
type FilterKey = 'all' | Subject;

function reasonFor(t: Topic, revisionTracking: boolean): Reason {
  if (t.status === 'Needs Revision' || t.needsRevision) return 'Marked Needs Revision';
  if (t.confidence !== null && t.confidence <= 2) return 'Confidence 1–2';
  return 'Completed — not yet revised';
}

export default function RevisionCenter() {
  const { data, addRevisionSession, notify, setConfidence, toggleNeedsRevision, setTopicStatus } = useStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [openTopic, setOpenTopic] = useState<Topic | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Queue = explicit flags + low confidence + completed-not-revised (if tracking enabled)
  const queue = useMemo(() => {
    let list = needsRevisionList(data);
    if (!data.settings.revisionTrackingEnabled) {
      list = list.filter((t) => t.needsRevision || t.status === 'Needs Revision' || (t.confidence !== null && t.confidence <= 2));
    }
    return list;
  }, [data]);

  const filtered = useMemo(() => {
    let list = queue;
    if (filter !== 'all') list = list.filter((t) => t.subject === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => `${t.title} ${t.chapter}`.toLowerCase().includes(q));
    }
    return list;
  }, [queue, filter, search]);

  const counts = {
    all: queue.length,
    Physics: queue.filter((t) => t.subject === 'Physics').length,
    Chemistry: queue.filter((t) => t.subject === 'Chemistry').length,
    Mathematics: queue.filter((t) => t.subject === 'Mathematics').length,
  };

  return (
    <div className="space-y-5">
      <section className="card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-title">Revision Center</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink dark:text-night-text">Revision queue</h1>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">
              Automatically collects topics explicitly marked Needs Revision, topics with confidence level 1–2
              {data.settings.revisionTrackingEnabled ? ', and completed topics with no recorded revision session.' : '.'}
              {' '}Completed topics are never classified as weak automatically.
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-3xl font-semibold text-ink tnum dark:text-night-text">{queue.length}</p>
            <p className="text-2xs text-ink-tertiary dark:text-night-tertiary">topics in queue</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Tabs<FilterKey>
            tabs={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'Physics', label: 'Physics', count: counts.Physics },
              { id: 'Chemistry', label: 'Chemistry', count: counts.Chemistry },
              { id: 'Mathematics', label: 'Mathematics', count: counts.Mathematics },
            ]}
            active={filter}
            onChange={setFilter}
          />
          <div className="relative min-w-[180px] flex-1">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input-base pl-8 text-sm"
              placeholder="Search revision topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink" aria-label="Clear">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={22} />}
          title={queue.length === 0 ? 'Revision queue is empty' : 'No topics match'}
          description={
            queue.length === 0
              ? 'Topics appear here when they are marked Needs Revision, rated confidence 1–2, or completed without a revision session.'
              : 'Try a different subject filter or search term.'
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const sessions = data.revisionSessions.filter((s) => s.topicId === t.id).sort((a, b) => b.revisionDate.localeCompare(a.revisionDate));
            const lastRevised = revisedOnOrAfter(data, t.id);
            const reason = reasonFor(t, data.settings.revisionTrackingEnabled);
            const isOpen = expanded === t.id;
            return (
              <Card key={t.id} padded={false}>
                <button
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-muted dark:hover:bg-night-raised"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink dark:text-night-text">{t.title}</span>
                      <Badge tone={reason === 'Confidence 1–2' ? 'danger' : reason === 'Marked Needs Revision' ? 'warn' : 'info'}>{reason}</Badge>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-tertiary dark:text-night-tertiary">
                      <span>{t.subject}</span>
                      <span>·</span>
                      <span>{t.chapter}</span>
                      <span>·</span>
                      <span>Studied {mediumDate(t.originalScheduledDate)}</span>
                      <span>·</span>
                      <span>
                        Last revision: {lastRevised ? mediumDate(lastRevised) : 'not yet revised'}
                      </span>
                      <span>·</span>
                      <span className="font-mono tnum">×{revisionCountFor(data, t.id)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        Conf: <ConfidenceStars value={t.confidence} />
                      </span>
                    </div>
                  </div>
                  <span className="text-2xs text-ink-faint dark:text-night-tertiary">{isOpen ? 'Hide' : 'Review'}</span>
                </button>

                {isOpen && (
                  <div className="animate-fade-in border-t divider bg-surface-muted/50 px-4 py-4 dark:bg-night/40">
                    <RevisionWorkflow topic={t} sessions={sessions} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {openTopic && <TopicDetailPanel topic={openTopic} onClose={() => setOpenTopic(null)} />}

      {/* Workflow legend */}
      <Card title="Revision workflow" subtitle="Revision history is kept separately from original topic completion">
        <ol className="space-y-2 text-xs leading-relaxed text-ink-secondary dark:text-night-secondary">
          {[
            'Open the topic and review your notes.',
            'Record that a revision session occurred (date + notes).',
            'Update confidence for where you stand now.',
            'Mark revision complete (confidence ≥ 3 clears the flag) or schedule another revision.',
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-2xs font-semibold text-accent dark:bg-accent/15 dark:text-blue-300">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function RevisionWorkflow({
  topic,
  sessions,
}: {
  topic: Topic;
  sessions: { id: string; revisionDate: string; confidenceBefore: number | null; confidenceAfter: number | null; notes: string }[];
}) {
  const { addRevisionSession, notify, setConfidence, toggleNeedsRevision, setTopicStatus } = useStore();
  const [revDate, setRevDate] = useState(todayISO());
  const [revNotes, setRevNotes] = useState('');
  const [revConf, setRevConf] = useState<number | null>(topic.confidence);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <p className="section-title mb-2">Record a revision session</p>
        <div className="space-y-2 rounded-lg border border-line bg-white p-3.5 dark:border-night-line dark:bg-night-surface">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-2xs text-ink-tertiary dark:text-night-tertiary">Revision date</p>
              <input type="date" className="input-base mt-1 text-xs" value={revDate} onChange={(e) => setRevDate(e.target.value)} />
            </div>
            <div>
              <p className="text-2xs text-ink-tertiary dark:text-night-tertiary">Confidence after</p>
              <Select
                className="mt-1"
                value={revConf === null ? 'none' : String(revConf)}
                onChange={(v) => setRevConf(v === 'none' ? null : Number(v))}
                options={[
                  { value: 'none', label: 'Keep current' },
                  { value: '1', label: '1 — Do not understand' },
                  { value: '2', label: '2 — Understand basics' },
                  { value: '3', label: '3 — Standard questions' },
                  { value: '4', label: '4 — Exam-level independently' },
                ]}
              />
            </div>
          </div>
          <textarea
            className="input-base min-h-[64px] text-xs"
            placeholder="What did you revisit? What is still weak?"
            value={revNotes}
            onChange={(e) => setRevNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-accent"
              onClick={() => {
                const ok = addRevisionSession(topic.id, {
                  revisionDate: revDate,
                  confidenceBefore: topic.confidence,
                  confidenceAfter: revConf,
                  notes: revNotes,
                });
                if (ok) {
                  notify('Revision session recorded.', 'success');
                  setRevNotes('');
                } else notify('Could not record session.', 'error');
              }}
            >
              <RotateCcw size={13} /> Save revision session
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                if (revConf !== null) setConfidence(topic.id, revConf);
                // Mark revision complete: clear flag, restore Completed status if needed
                if (topic.needsRevision) toggleNeedsRevision(topic.id);
                if (topic.status === 'Needs Revision') setTopicStatus(topic.id, 'Completed');
                notify('Revision marked complete.', 'success');
              }}
            >
              <CheckCircle2 size={13} /> Mark revision complete
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn-ghost"
            onClick={() => {
              toggleNeedsRevision(topic.id);
              notify(topic.needsRevision ? 'Revision flag removed.' : 'Topic flagged for another revision.', 'success');
            }}
          >
            {topic.needsRevision ? 'Remove revision flag' : 'Schedule another revision'}
          </button>
        </div>
      </div>

      <div>
        <p className="section-title mb-2">Revision history ({sessions.length})</p>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3.5 py-6 text-center text-2xs text-ink-faint dark:border-night-line dark:text-night-tertiary">
            No revision sessions recorded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="rounded-lg border border-line bg-white px-3.5 py-2.5 dark:border-night-line dark:bg-night-surface">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink dark:text-night-text">{mediumDate(s.revisionDate)}</span>
                  <span className="font-mono text-2xs text-ink-tertiary tnum dark:text-night-tertiary">
                    confidence {s.confidenceBefore ?? '—'} → {s.confidenceAfter ?? '—'}
                  </span>
                </div>
                {s.notes && <p className="mt-1 text-2xs leading-relaxed text-ink-secondary dark:text-night-secondary">{s.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

void Filter;
void ProgressBar;
