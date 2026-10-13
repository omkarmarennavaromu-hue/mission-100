/* Tests & Assessments — scheduled tests from the plan + custom assessments + grading. */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  Flame,
  Pencil,
  Plus,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useStore } from '../state/store';
import { testsSummary } from '../lib/progress';
import { mediumDate, todayISO, diffDays } from '../lib/dates';
import { Badge, Card, ConfirmDialog, EmptyState, Modal, ProgressBar, Select, Tabs } from '../components/ui';
import type { Assessment, AssessmentStatus, Subject } from '../types';
import { SUBJECTS } from '../types';

type FilterKey = 'all' | 'upcoming' | 'completed' | 'missed' | 'ungraded';

export default function Tests() {
  const { data, updateAssessment, addAssessment, removeAssessment, notify } = useStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [subject, setSubject] = useState('all');
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Assessment | null>(null);
  const today = todayISO();

  const summary = testsSummary(data);

  const filtered = useMemo(() => {
    let list = data.assessments.slice().sort((a, b) => a.date.localeCompare(b.date));
    if (subject !== 'all') list = list.filter((a) => a.subject === subject);
    if (filter === 'upcoming') list = list.filter((a) => a.status === 'Upcoming');
    if (filter === 'completed') list = list.filter((a) => a.status === 'Completed');
    if (filter === 'missed') list = list.filter((a) => a.status === 'Missed');
    if (filter === 'ungraded') list = list.filter((a) => a.marksObtained === null);
    return list;
  }, [data.assessments, filter, subject]);

  const graded = data.assessments
    .filter((a) => a.marksObtained !== null && a.maximumMarks !== null && a.maximumMarks > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a, i) => ({
      name: `T${i + 1}`,
      date: mediumDate(a.date),
      pct: Math.round(((a.marksObtained as number) / (a.maximumMarks as number)) * 100),
      title: a.title,
    }));

  // Weak chapters when sufficient data exists (>= 3 graded tests)
  const weakAreas = useMemo(() => {
    if (summary.graded < 3) return null;
    const bySubject: Record<string, number[]> = {};
    for (const a of data.assessments) {
      if (a.marksObtained === null || !a.maximumMarks) continue;
      const pct = (a.marksObtained / a.maximumMarks) * 100;
      (bySubject[a.subject] ??= []).push(pct);
    }
    return Object.entries(bySubject)
      .map(([s, arr]) => ({ subject: s, avg: Math.round(arr.reduce((x, y) => x + y, 0) / arr.length), n: arr.length }))
      .filter((x) => x.n >= 2)
      .sort((a, b) => a.avg - b.avg);
  }, [data.assessments, summary.graded]);

  return (
    <div className="space-y-5">
      {/* Header + summary */}
      <section className="card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-title">Tests & Assessments</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink dark:text-night-text">
              Assessment tracker
            </h1>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">
              Chapter tests, subject tests, and revision tests are preloaded from the schedule. Completing the scheduled
              task and entering a score are separate actions — no scores or maximum marks are invented.
            </p>
          </div>
          <button className="btn-accent" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add custom assessment
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Total assessments" value={String(summary.total)} icon={<ClipboardList size={13} />} />
          <Tile label="Completed" value={String(summary.completed)} icon={<CheckCircle2 size={13} />} />
          <Tile
            label="Average score"
            value={summary.graded > 0 ? `${summary.averagePercent}%` : 'Not graded'}
            icon={<TrendingUp size={13} />}
            accent={summary.graded > 0}
          />
          <Tile label="Graded entries" value={String(summary.graded)} icon={<Pencil size={13} />} />
        </div>
      </section>

      {/* Score trend */}
      <Card
        title="Score trend over time"
        subtitle="Percentage per graded assessment — shown only when actual scores exist"
      >
        {graded.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={22} />}
            title="No graded tests yet"
            description="Enter marks obtained and maximum marks on any assessment to start the trend line. Ungraded entries show as “Not graded”, never 0%."
          />
        ) : (
          <>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graded} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a3a3a3' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#a3a3a3' }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, borderColor: '#e5e5e5' }}
                    formatter={(v: number, _n: string, item: { payload?: { title?: string } }) => [`${v}%`, item?.payload?.title ?? 'Score']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pct" name="Score %" stroke="#2563eb" strokeWidth={2} dot={{ r: 3.5, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {weakAreas && weakAreas.length > 0 && (
              <div className="mt-3 rounded-lg border border-line px-3.5 py-3 dark:border-night-line">
                <p className="section-title mb-1.5">Weak areas (from graded data)</p>
                <div className="flex flex-wrap gap-2">
                  {weakAreas.map((w) => (
                    <Badge key={w.subject} tone={w.avg < 50 ? 'danger' : w.avg < 75 ? 'warn' : 'good'}>
                      {w.subject}: avg {w.avg}% ({w.n} tests)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs<FilterKey>
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'missed', label: 'Missed' },
            { id: 'ungraded', label: 'Not graded' },
          ]}
          active={filter}
          onChange={setFilter}
        />
        <Select
          ariaLabel="Filter by subject"
          value={subject}
          onChange={setSubject}
          options={[{ value: 'all', label: 'All subjects' }, ...SUBJECTS.map((s) => ({ value: s, label: s })), { value: 'Mixed', label: 'Mixed' }]}
        />
      </div>

      {/* Assessment list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="No assessments match"
          description="Try another filter, or add a custom assessment."
          action={
            <button className="btn-accent" onClick={() => setShowAdd(true)}>
              <Plus size={13} /> Add custom assessment
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const overdueTest = a.status === 'Upcoming' && a.date < today;
            const pct =
              a.marksObtained !== null && a.maximumMarks !== null && a.maximumMarks > 0
                ? Math.round((a.marksObtained / a.maximumMarks) * 100)
                : null;
            return (
              <Card key={a.id} padded={false}>
                <div className="flex flex-wrap items-start gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink dark:text-night-text">{a.title}</span>
                      <Badge tone={a.subject === 'Mixed' ? 'info' : 'neutral'}>{a.subject}</Badge>
                      <Badge tone={a.status === 'Completed' ? 'good' : a.status === 'Missed' ? 'danger' : overdueTest ? 'warn' : 'accent'}>
                        {overdueTest ? 'Upcoming (overdue)' : a.status}
                      </Badge>
                      {a.isCustom && <Badge tone="info">Custom</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-tertiary dark:text-night-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {mediumDate(a.date)}
                        {a.status === 'Upcoming' && (
                          <span className="ml-1 font-mono tnum">
                            ({diffDays(today, a.date) >= 0 ? `in ${diffDays(today, a.date)}d` : `${Math.abs(diffDays(today, a.date))}d ago`})
                          </span>
                        )}
                      </span>
                      <span>Related task on Day {dayOf(data, a)}</span>
                      {a.mistakes && <span className="text-amber-600 dark:text-amber-400">Weak areas recorded</span>}
                    </div>
                    {a.mistakes && (
                      <p className="mt-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-2xs leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        <span className="font-medium">Mistakes / weak areas:</span> {a.mistakes}
                      </p>
                    )}
                    {a.nextAction && (
                      <p className="mt-1 text-2xs text-ink-secondary dark:text-night-secondary">
                        <span className="font-medium">Next action:</span> {a.nextAction}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="font-mono text-lg font-semibold tnum text-ink dark:text-night-text">
                        {pct !== null ? `${pct}%` : 'Not graded'}
                      </p>
                      <p className="text-2xs text-ink-tertiary dark:text-night-tertiary">
                        {a.marksObtained !== null && a.maximumMarks !== null
                          ? `${a.marksObtained} / ${a.maximumMarks} marks`
                          : 'No marks recorded'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="btn-ghost px-2.5 py-1 text-2xs" onClick={() => setEditing(a)}>
                        {a.marksObtained !== null ? 'Edit score' : 'Enter score'}
                      </button>
                      {a.isCustom && (
                        <button className="btn-ghost px-2.5 py-1 text-2xs text-red-500" onClick={() => setConfirmDelete(a)}>
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grade modal */}
      <GradeModal assessment={editing} onClose={() => setEditing(null)} />

      {/* Add modal */}
      {showAdd && (
        <AddAssessmentModal
          onClose={() => setShowAdd(false)}
          onAdd={(a) => {
            addAssessment(a);
            notify('Custom assessment added.', 'success');
            setShowAdd(false);
          }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete custom assessment?"
        danger
        message={`“${confirmDelete?.title}” will be removed permanently. Scheduled tests from the plan cannot be deleted.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            removeAssessment(confirmDelete.id);
            notify('Assessment deleted.', 'success');
          }
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function dayOf(data: { days: Record<string, { date: string; dayNumber: number }> }, a: Assessment): string {
  for (const d of Object.values(data.days)) {
    if (d.date === a.date) return String(d.dayNumber);
  }
  return '—';
}

function Tile({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line px-3.5 py-2.5 dark:border-night-line">
      <p className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-ink-tertiary dark:text-night-tertiary">
        {icon} {label}
      </p>
      <p className={`mt-1 font-mono text-xl font-semibold tnum ${accent ? 'text-accent' : 'text-ink dark:text-night-text'}`}>{value}</p>
    </div>
  );
}

function GradeModal({ assessment, onClose }: { assessment: Assessment | null; onClose: () => void }) {
  const { updateAssessment, notify } = useStore();
  const [marks, setMarks] = useState('');
  const [max, setMax] = useState('');
  const [status, setStatus] = useState<AssessmentStatus>('Completed');
  const [mistakes, setMistakes] = useState('');
  const [next, setNext] = useState('');
  const [lastId, setLastId] = useState(assessment?.id);

  if (assessment?.id !== lastId) {
    setLastId(assessment?.id);
    setMarks(assessment?.marksObtained?.toString() ?? '');
    setMax(assessment?.maximumMarks?.toString() ?? '');
    setStatus(assessment?.status ?? 'Completed');
    setMistakes(assessment?.mistakes ?? '');
    setNext(assessment?.nextAction ?? '');
  }

  if (!assessment) return null;

  return (
    <Modal
      open={!!assessment}
      onClose={onClose}
      title={`Score — ${assessment.title}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-accent"
            onClick={() => {
              const maxN = max.trim() === '' ? null : Number(max);
              const marksN = marks.trim() === '' ? null : Number(marks);
              if (maxN !== null && (Number.isNaN(maxN) || maxN <= 0)) {
                notify('Maximum marks must be a positive number.', 'error');
                return;
              }
              if (marksN !== null && maxN !== null && marksN > maxN) {
                notify('Marks obtained cannot exceed maximum marks.', 'error');
                return;
              }
              updateAssessment(assessment.id, {
                maximumMarks: maxN !== null && Number.isFinite(maxN) ? maxN : null,
                marksObtained: marksN !== null && Number.isFinite(marksN) ? marksN : null,
                status,
                mistakes,
                nextAction: next,
              });
              notify('Assessment updated.', 'success');
              onClose();
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="section-title mb-1.5">Marks obtained</p>
            <input
              type="number"
              min={0}
              className="input-base"
              placeholder="Leave empty if not graded"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
            />
          </div>
          <div>
            <p className="section-title mb-1.5">Maximum marks</p>
            <input
              type="number"
              min={1}
              className="input-base"
              placeholder="Leave empty if unknown"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
        </div>
        <p className="text-2xs text-ink-tertiary dark:text-night-tertiary">
          Assessments without a score display as “Not graded” — never as 0%.
        </p>
        <div>
          <p className="section-title mb-1.5">Status</p>
          <Select
            value={status}
            onChange={(v) => setStatus(v as AssessmentStatus)}
            options={[
              { value: 'Upcoming', label: 'Upcoming' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Missed', label: 'Missed' },
            ]}
          />
        </div>
        <div>
          <p className="section-title mb-1.5">Mistakes / weak areas</p>
          <textarea
            className="input-base min-h-[72px] text-sm"
            placeholder="Which questions went wrong, which concepts were shaky…"
            value={mistakes}
            onChange={(e) => setMistakes(e.target.value)}
          />
        </div>
        <div>
          <p className="section-title mb-1.5">Next revision action</p>
          <input
            className="input-base text-sm"
            placeholder="e.g. Re-solve numericals from Solutions by Friday"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function AddAssessmentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: Omit<Assessment, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [subject, setSubject] = useState<string>('Physics');
  const [max, setMax] = useState('');
  const { notify } = useStore();

  return (
    <Modal
      open
      onClose={onClose}
      title="Add custom assessment"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-accent"
            onClick={() => {
              if (!title.trim()) {
                notify('Please enter a test name.', 'error');
                return;
              }
              onAdd({
                title: title.trim(),
                date,
                subject: subject as Subject | 'Mixed',
                relatedTopicIds: [],
                status: 'Upcoming',
                maximumMarks: max.trim() === '' ? null : Number(max),
                marksObtained: null,
                mistakes: '',
                nextAction: '',
                isCustom: true,
              });
            }}
          >
            Add assessment
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <p className="section-title mb-1.5">Test name</p>
          <input className="input-base" placeholder="e.g. KCET Mock Test 1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="section-title mb-1.5">Date</p>
            <input type="date" className="input-base" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <p className="section-title mb-1.5">Subject</p>
            <Select
              value={subject}
              onChange={setSubject}
              options={[...SUBJECTS.map((s) => ({ value: s, label: s })), { value: 'Mixed', label: 'Mixed / Full syllabus' }]}
            />
          </div>
        </div>
        <div>
          <p className="section-title mb-1.5">Maximum marks (optional)</p>
          <input type="number" min={1} className="input-base" placeholder="e.g. 100" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

void AlertTriangle;
void FilePlus2;
void Flame;
