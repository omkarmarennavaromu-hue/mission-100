/* Reusable topic row + detail panel shared by Today's Plan, Roadmap, All Topics. */

import { useState } from 'react';
import {
  Beaker,
  Calculator,
  CheckCircle2,
  Circle,
  Clock,
  FlaskConical,
  Flag,
  Loader2,
  NotebookPen,
  RotateCcw,
  Sigma,
} from 'lucide-react';
import type { Subject, Topic, TopicStatus } from '../../types';
import { CONFIDENCE_LABELS } from '../../types';
import { useStore } from '../../state/store';
import { Badge, Checkbox, Modal, Select } from '../ui';
import { formatDateTime, longDayLabel, mediumDate } from '../../lib/dates';
import { revisionCountFor, revisedOnOrAfter } from '../../lib/progress';

export const SUBJECT_META: Record<Subject, { color: string; icon: typeof Beaker; label: string }> = {
  Physics: { color: 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60', icon: FlaskConical, label: 'PHY' },
  Chemistry: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60', icon: Beaker, label: 'CHEM' },
  Mathematics: { color: 'text-violet-700 bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60', icon: Sigma, label: 'MATH' },
};

export function SubjectIcon({ subject, size = 14 }: { subject: Subject; size?: number }) {
  const Icon = SUBJECT_META[subject].icon;
  return <Icon size={size} />;
}

export function statusTone(status: TopicStatus): 'neutral' | 'good' | 'accent' | 'warn' | 'danger' {
  switch (status) {
    case 'Completed':
      return 'good';
    case 'In Progress':
      return 'accent';
    case 'Needs Revision':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function taskTypeTone(type: string): 'neutral' | 'info' | 'accent' | 'warn' {
  switch (type) {
    case 'Test':
      return 'warn';
    case 'Revision':
      return 'info';
    case 'Practice':
      return 'accent';
    default:
      return 'neutral';
  }
}

export function StatusBadge({ status }: { status: TopicStatus }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

export function TopicCheckbox({ topic, size = 'md' }: { topic: Topic; size?: 'sm' | 'md' }) {
  const { toggleComplete, notify } = useStore();
  return (
    <Checkbox
      checked={topic.status === 'Completed'}
      indeterminate={topic.status === 'In Progress'}
      size={size}
      label={`Mark ${topic.title} ${topic.status === 'Completed' ? 'incomplete' : 'complete'}`}
      onChange={() => {
        const ok = toggleComplete(topic.id);
        if (!ok) notify('Could not update this topic.', 'error');
      }}
    />
  );
}

export function ConfidencePicker({
  value,
  onChange,
  compact = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  compact?: boolean;
}) {
  return (
    <div>
      {!compact && (
        <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-ink-tertiary dark:text-night-tertiary">
          Confidence
        </p>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(value === level ? null : level)}
            title={`${level} — ${CONFIDENCE_LABELS[level]}`}
            className={`flex h-7 min-w-[26px] items-center justify-center rounded-md border font-mono text-2xs font-semibold transition tnum ${
              value === level
                ? level <= 2
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'border-accent bg-accent-soft text-accent dark:bg-accent/15 dark:text-blue-300'
                : 'border-line text-ink-tertiary hover:border-accent/50 hover:text-ink dark:border-night-line dark:text-night-tertiary'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
      {!compact && (
        <p className="mt-1.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
          {value ? `${value} — ${CONFIDENCE_LABELS[value]}` : 'Not rated yet'}
        </p>
      )}
    </div>
  );
}

export function TopicRow({
  topic,
  showDay = false,
  showDate = true,
  onOpen,
}: {
  topic: Topic;
  showDay?: boolean;
  showDate?: boolean;
  onOpen: (t: Topic) => void;
}) {
  const { setTopicStatus, toggleNeedsRevision, notify } = useStore();
  const meta = SUBJECT_META[topic.subject];
  const lowConf = topic.status === 'Completed' && topic.confidence !== null && topic.confidence <= 2;
  const flagged = topic.needsRevision || topic.status === 'Needs Revision' || lowConf;

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-transparent px-2.5 py-2.5 transition hover:border-line hover:bg-surface-muted dark:hover:border-night-line dark:hover:bg-night-raised">
      <div className="mt-0.5">
        <TopicCheckbox topic={topic} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-semibold ${meta.color}`}
          >
            <SubjectIcon subject={topic.subject} size={11} />
            {meta.label}
          </span>
          {topic.taskType !== 'Concept' && <Badge tone={taskTypeTone(topic.taskType)}>{topic.taskType}</Badge>}
          {flagged && (
            <Badge tone="warn">
              <Flag size={9} /> Revision
            </Badge>
          )}
          {topic.revisedTargetDate && <Badge tone="info">Rescheduled</Badge>}
        </div>
        <button
          onClick={() => onOpen(topic)}
          className={`mt-1 block text-left text-[13px] font-medium leading-snug transition hover:text-accent ${
            topic.status === 'Completed'
              ? 'text-ink-tertiary line-through decoration-ink-faint/60 dark:text-night-tertiary'
              : 'text-ink dark:text-night-text'
          }`}
        >
          {topic.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-tertiary dark:text-night-tertiary">
          <span className="truncate">{topic.chapter}</span>
          {showDay && <span className="font-mono tnum">Day {String(topic.dayNumber).padStart(2, '0')}</span>}
          {showDate && <span>{mediumDate(topic.originalScheduledDate)}</span>}
          {topic.revisedTargetDate && (
            <span className="text-sky-600 dark:text-sky-400">→ {mediumDate(topic.revisedTargetDate)}</span>
          )}
          {topic.completedAt && topic.status === 'Completed' && (
            <span className="flex items-center gap-1">
              <Clock size={10} /> {formatDateTime(topic.completedAt)}
            </span>
          )}
          {topic.confidence !== null && (
            <span className={topic.confidence <= 2 ? 'text-amber-600 dark:text-amber-400' : ''}>
              Confidence {topic.confidence}/4
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
        <button
          onClick={() => {
            const ok = toggleNeedsRevision(topic.id);
            if (!ok) notify('Could not update revision flag.', 'error');
          }}
          title={topic.needsRevision ? 'Remove revision flag' : 'Mark for revision'}
          className={`rounded-md border p-1.5 transition ${
            topic.needsRevision
              ? 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              : 'border-line text-ink-tertiary hover:text-amber-600 dark:border-night-line dark:text-night-tertiary'
          }`}
        >
          <RotateCcw size={12} />
        </button>
        {topic.status !== 'In Progress' && topic.status !== 'Completed' && (
          <button
            onClick={() => setTopicStatus(topic.id, 'In Progress')}
            title="Start topic"
            className="rounded-md border border-line p-1.5 text-ink-tertiary transition hover:text-accent dark:border-night-line dark:text-night-tertiary"
          >
            <Loader2 size={12} />
          </button>
        )}
        <button
          onClick={() => onOpen(topic)}
          title="Open details"
          className="rounded-md border border-line p-1.5 text-ink-tertiary transition hover:text-ink dark:border-night-line dark:text-night-tertiary"
        >
          <NotebookPen size={12} />
        </button>
      </div>
    </div>
  );
}

export function TopicDetailPanel({ topic, onClose }: { topic: Topic | null; onClose: () => void }) {
  const {
    data,
    setTopicStatus,
    setConfidence,
    toggleNeedsRevision,
    setTopicNotes,
    setTopicDuration,
    rescheduleTopic,
    addRevisionSession,
    notify,
  } = useStore();
  const [notesDraft, setNotesDraft] = useState(topic?.notes ?? '');
  const [durationDraft, setDurationDraft] = useState(topic?.actualDurationMinutes?.toString() ?? '');
  const [dateDraft, setDateDraft] = useState(topic?.revisedTargetDate ?? '');
  const [revDate, setRevDate] = useState(new Date().toISOString().slice(0, 10));
  const [revNotes, setRevNotes] = useState('');
  const [revConf, setRevConf] = useState<number | null>(topic?.confidence ?? null);
  const [showRevForm, setShowRevForm] = useState(false);

  // sync drafts when topic changes
  const topicId = topic?.id;
  const [lastId, setLastId] = useState(topicId);
  if (topicId !== lastId) {
    setLastId(topicId);
    setNotesDraft(topic?.notes ?? '');
    setDurationDraft(topic?.actualDurationMinutes?.toString() ?? '');
    setDateDraft(topic?.revisedTargetDate ?? '');
    setRevConf(topic?.confidence ?? null);
    setRevNotes('');
    setShowRevForm(false);
  }

  if (!topic) return null;
  const sessions = data.revisionSessions.filter((s) => s.topicId === topic.id).sort((a, b) => b.revisionDate.localeCompare(a.revisionDate));

  return (
    <Modal open={!!topic} onClose={onClose} title={topic.title} wide>
      <div className="space-y-5">
        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetaCell label="Subject" value={topic.subject} />
          <MetaCell label="Chapter" value={topic.chapter} />
          <MetaCell label="Day" value={`Day ${String(topic.dayNumber).padStart(2, '0')} · ${longDayLabel(topic.originalScheduledDate)}`} />
          <MetaCell label="Task type" value={topic.taskType} />
          <MetaCell label="Original date" value={mediumDate(topic.originalScheduledDate)} />
          <MetaCell label="Revised date" value={topic.revisedTargetDate ? mediumDate(topic.revisedTargetDate) : '—'} />
          <MetaCell label="Completed at" value={formatDateTime(topic.completedAt)} />
          <MetaCell label="Status" value={topic.status} />
        </div>

        {/* Status actions */}
        <div>
          <p className="section-title mb-2">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {(['Not Started', 'In Progress', 'Completed', 'Needs Revision'] as TopicStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setTopicStatus(topic.id, s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  topic.status === s
                    ? 'border-accent bg-accent-soft text-accent dark:bg-accent/15 dark:text-blue-300'
                    : 'border-line text-ink-secondary hover:border-accent/50 dark:border-night-line dark:text-night-secondary'
                }`}
              >
                {s === 'Completed' && topic.status === 'Completed' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} /> Completed
                  </span>
                ) : (
                  s
                )}
              </button>
            ))}
            {topic.status === 'Completed' && (
              <button className="btn-ghost ml-1" onClick={() => setTopicStatus(topic.id, 'In Progress')}>
                <Circle size={12} /> Reopen topic
              </button>
            )}
          </div>
          <p className="mt-2 text-2xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">
            Completion means you finished the planned study session — it is not a mastery claim. Confidence is rated separately below.
          </p>
        </div>

        {/* Confidence */}
        <ConfidencePicker value={topic.confidence} onChange={(v) => setConfidence(topic.id, v)} />
        {topic.status === 'Completed' && topic.confidence !== null && topic.confidence <= 2 && (
          <p className="-mt-3 text-2xs text-amber-600 dark:text-amber-400">
            Completed with low confidence — automatically flagged for revision.
          </p>
        )}

        {/* Revision flag */}
        <div className="flex items-center justify-between rounded-lg border border-line px-3.5 py-3 dark:border-night-line">
          <div>
            <p className="text-sm font-medium text-ink dark:text-night-text">Revision flag</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
              Keeps this topic in the Revision Center queue independently of completion.
            </p>
          </div>
          <button
            onClick={() => toggleNeedsRevision(topic.id)}
            className={`relative h-6 w-11 rounded-full transition ${topic.needsRevision ? 'bg-accent' : 'bg-line-strong dark:bg-night-line'}`}
            role="switch"
            aria-checked={topic.needsRevision}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${topic.needsRevision ? 'left-[22px]' : 'left-0.5'}`}
            />
          </button>
        </div>

        {/* Reschedule */}
        <div className="rounded-lg border border-line p-3.5 dark:border-night-line">
          <p className="text-sm font-medium text-ink dark:text-night-text">Catch-up reschedule</p>
          <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
            Original scheduled date is always preserved on the roadmap. A revised date is stored separately and never duplicates the topic.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="input-base w-auto text-xs"
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
            />
            <button
              className="btn-ghost"
              onClick={() => {
                const ok = rescheduleTopic(topic.id, dateDraft || null);
                notify(ok ? 'Revised date saved.' : 'Could not save revised date.', ok ? 'success' : 'error');
              }}
            >
              Save revised date
            </button>
            {topic.revisedTargetDate && (
              <button
                className="btn-ghost"
                onClick={() => {
                  rescheduleTopic(topic.id, null);
                  setDateDraft('');
                  notify('Reschedule cleared — topic is back on its original date.', 'success');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Duration */}
        <div>
          <p className="section-title mb-2">Actual study duration (minutes)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={5}
              placeholder="e.g. 45"
              className="input-base w-32 text-sm"
              value={durationDraft}
              onChange={(e) => setDurationDraft(e.target.value)}
            />
            <button
              className="btn-ghost"
              onClick={() => {
                const n = durationDraft.trim() === '' ? null : Math.max(0, Number(durationDraft));
                const ok = setTopicDuration(topic.id, Number.isFinite(n as number) ? n : null);
                notify(ok ? 'Duration saved.' : 'Could not save duration.', ok ? 'success' : 'error');
              }}
            >
              Save duration
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="section-title mb-2">Notes</p>
          <textarea
            className="input-base min-h-[90px] resize-y text-sm leading-relaxed"
            placeholder="Key formulas, mistakes, links, what to revisit…"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="btn-accent"
              onClick={() => {
                const ok = setTopicNotes(topic.id, notesDraft);
                notify(ok ? 'Notes saved.' : 'Could not save notes.', ok ? 'success' : 'error');
              }}
            >
              Save notes
            </button>
          </div>
        </div>

        {/* Revision sessions */}
        <div className="rounded-lg border border-line p-3.5 dark:border-night-line">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink dark:text-night-text">Revision sessions</p>
              <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
                {revisionCountFor(data, topic.id)} session{revisionCountFor(data, topic.id) === 1 ? '' : 's'} recorded
                {sessions[0] ? ` · last: ${mediumDate(sessions[0].revisionDate)}` : ''}
              </p>
            </div>
            <button className="btn-ghost" onClick={() => setShowRevForm((v) => !v)}>
              <RotateCcw size={12} /> {showRevForm ? 'Close' : 'Record revision'}
            </button>
          </div>

          {showRevForm && (
            <div className="mt-3 space-y-2.5 rounded-lg bg-surface-muted p-3 dark:bg-night">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-2xs text-ink-tertiary dark:text-night-tertiary">Revision date</p>
                  <input
                    type="date"
                    className="input-base mt-1 text-xs"
                    value={revDate}
                    onChange={(e) => setRevDate(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-2xs text-ink-tertiary dark:text-night-tertiary">Confidence after this session</p>
                  <Select
                    className="mt-1"
                    value={revConf === null ? 'none' : String(revConf)}
                    onChange={(v) => setRevConf(v === 'none' ? null : Number(v))}
                    options={[
                      { value: 'none', label: 'Keep current' },
                      { value: '1', label: '1 — Do not understand' },
                      { value: '2', label: '2 — Understand basics' },
                      { value: '3', label: '3 — Solve standard questions' },
                      { value: '4', label: '4 — Exam-level independently' },
                    ]}
                  />
                </div>
              </div>
              <textarea
                className="input-base min-h-[60px] text-xs"
                placeholder="What did you revisit? What is still weak?"
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
              />
              <button
                className="btn-accent w-full"
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
                    setShowRevForm(false);
                  } else {
                    notify('Could not record revision session.', 'error');
                  }
                }}
              >
                Save revision session
              </button>
            </div>
          )}

          {sessions.length > 0 && (
            <ul className="mt-3 space-y-2">
              {sessions.map((s) => (
                <li key={s.id} className="rounded-md border border-line px-3 py-2 dark:border-night-line">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-medium text-ink dark:text-night-text">{mediumDate(s.revisionDate)}</span>
                    <span className="font-mono text-ink-tertiary tnum dark:text-night-tertiary">
                      conf {s.confidenceBefore ?? '—'} → {s.confidenceAfter ?? '—'}
                    </span>
                  </div>
                  {s.notes && <p className="mt-1 text-2xs leading-relaxed text-ink-secondary dark:text-night-secondary">{s.notes}</p>}
                </li>
              ))}
            </ul>
          )}
          {sessions.length === 0 && !showRevForm && (
            <p className="mt-3 text-2xs text-ink-faint dark:text-night-tertiary">No revision sessions yet for this topic.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2 dark:bg-night">
      <p className="text-2xs font-medium uppercase tracking-wide text-ink-tertiary dark:text-night-tertiary">{label}</p>
      <p className="mt-0.5 truncate text-xs font-medium text-ink dark:text-night-text" title={value}>
        {value}
      </p>
    </div>
  );
}

export function ConfidenceStars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-2xs text-ink-faint dark:text-night-tertiary">—</span>;
  return (
    <span className="font-mono text-2xs tnum" title={CONFIDENCE_LABELS[value]}>
      {'●'.repeat(value)}
      <span className="text-ink-faint dark:text-night-tertiary">{'●'.repeat(4 - value)}</span>
    </span>
  );
}

export { Calculator };
