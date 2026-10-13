/* All Topics — searchable, sortable database of every scheduled topic record. */

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Table2,
  X,
} from 'lucide-react';
import { useStore } from '../state/store';
import { allTopics, needsRevisionList, revisedOnOrAfter, revisionCountFor } from '../lib/progress';
import { mediumDate, formatDateTime } from '../lib/dates';
import { Badge, Card, Checkbox, EmptyState, Select, Tabs } from '../components/ui';
import { ConfidenceStars, StatusBadge, TopicDetailPanel, statusTone, taskTypeTone } from '../components/topics/TopicBits';
import type { Topic } from '../types';
import { SUBJECTS, TOPIC_STATUSES } from '../types';

type SortKey = 'day' | 'subject' | 'title' | 'status' | 'confidence' | 'date';
type QuickFilter = 'all' | 'incomplete' | 'completed' | 'revision' | 'low-confidence' | 'unrated';

export default function AllTopics() {
  const { data, setTopicStatus, toggleComplete, toggleNeedsRevision, notify } = useStore();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [status, setStatus] = useState('all');
  const [taskType, setTaskType] = useState('all');
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('day');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openTopic, setOpenTopic] = useState<Topic | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const revisionSet = useMemo(() => new Set(needsRevisionList(data).map((t) => t.id)), [data]);

  const filtered = useMemo(() => {
    let list = allTopics(data);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => `${t.title} ${t.chapter} ${t.subject} ${t.notes}`.toLowerCase().includes(q));
    }
    if (subject !== 'all') list = list.filter((t) => t.subject === subject);
    if (status !== 'all') list = list.filter((t) => t.status === status);
    if (taskType !== 'all') list = list.filter((t) => t.taskType === taskType);
    if (quick === 'incomplete') list = list.filter((t) => t.status !== 'Completed');
    if (quick === 'completed') list = list.filter((t) => t.status === 'Completed');
    if (quick === 'revision') list = list.filter((t) => revisionSet.has(t.id) || t.needsRevision);
    if (quick === 'low-confidence') list = list.filter((t) => t.confidence !== null && t.confidence <= 2);
    if (quick === 'unrated') list = list.filter((t) => t.confidence === null);

    const dir = sortDir === 'asc' ? 1 : -1;
    list = list.slice().sort((a, b) => {
      switch (sortKey) {
        case 'day':
          return (a.dayNumber - b.dayNumber) * dir;
        case 'subject':
          return a.subject.localeCompare(b.subject) * dir || a.dayNumber - b.dayNumber;
        case 'title':
          return a.title.localeCompare(b.title) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir || a.dayNumber - b.dayNumber;
        case 'confidence':
          return ((a.confidence ?? 0) - (b.confidence ?? 0)) * dir || a.dayNumber - b.dayNumber;
        case 'date':
          return a.originalScheduledDate.localeCompare(b.originalScheduledDate) * dir;
        default:
          return 0;
      }
    });
    return list;
  }, [data, search, subject, status, taskType, quick, sortKey, sortDir, revisionSet]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filterActive = search || subject !== 'all' || status !== 'all' || taskType !== 'all' || quick !== 'all';

  const bulkComplete = () => {
    let n = 0;
    selected.forEach((id) => {
      if (setTopicStatus(id, 'Completed')) n += 1;
    });
    notify(`${n} topic${n === 1 ? '' : 's'} marked complete.`, 'success');
    setSelected(new Set());
  };

  const th = (key: SortKey, label: string, className = '') => (
    <th className={`cursor-pointer select-none px-3 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-ink-tertiary transition hover:text-ink dark:text-night-tertiary dark:hover:text-night-text ${className}`} onClick={() => toggleSort(key)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === key && (sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
      </span>
    </th>
  );

  return (
    <div className="space-y-5">
      <section className="card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-title">All Topics</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink dark:text-night-text">Topic database</h1>
            <p className="mt-0.5 text-xs text-ink-tertiary dark:text-night-tertiary">
              {allTopics(data).length} records · every scheduled entry is one record linked to its day and subject
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <span className="text-2xs text-ink-tertiary dark:text-night-tertiary">{selected.size} selected</span>
                <button className="btn-accent" onClick={bulkComplete}>
                  <CheckCircle2 size={13} /> Mark complete
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    selected.forEach((id) => toggleNeedsRevision(id));
                    notify('Revision flags toggled for selection.', 'success');
                    setSelected(new Set());
                  }}
                >
                  <RotateCcw size={12} /> Toggle revision
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input-base pl-8 text-sm"
              placeholder="Search topic names, chapters, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink" aria-label="Clear">
                <X size={13} />
              </button>
            )}
          </div>
          <Select
            ariaLabel="Subject filter"
            value={subject}
            onChange={setSubject}
            options={[{ value: 'all', label: 'All subjects' }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            ariaLabel="Status filter"
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'All statuses' }, ...TOPIC_STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            ariaLabel="Task type filter"
            value={taskType}
            onChange={setTaskType}
            options={[
              { value: 'all', label: 'All task types' },
              { value: 'Concept', label: 'Concept' },
              { value: 'Practice', label: 'Practice' },
              { value: 'Revision', label: 'Revision' },
              { value: 'Test', label: 'Test' },
            ]}
          />
          {filterActive && (
            <button
              className="btn-ghost"
              onClick={() => {
                setSearch('');
                setSubject('all');
                setStatus('all');
                setTaskType('all');
                setQuick('all');
              }}
            >
              <Filter size={12} /> Clear
            </button>
          )}
        </div>

        <div className="mt-3">
          <Tabs<QuickFilter>
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'incomplete', label: 'Incomplete' },
              { id: 'completed', label: 'Completed' },
              { id: 'revision', label: 'Revision queue' },
              { id: 'low-confidence', label: 'Low confidence' },
              { id: 'unrated', label: 'Unrated' },
            ]}
            active={quick}
            onChange={setQuick}
          />
        </div>
      </section>

      <Card padded={false}>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Table2 size={22} />}
              title="No topics match"
              description="Adjust the search or filters. The full database contains every scheduled topic."
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="border-b divider bg-surface-muted dark:bg-night">
                  <tr>
                    <th className="w-10 px-3 py-2.5">
                      <Checkbox
                        checked={selected.size === filtered.length && filtered.length > 0}
                        label="Select all"
                        size="sm"
                        onChange={() => {
                          if (selected.size === filtered.length) setSelected(new Set());
                          else setSelected(new Set(filtered.map((t) => t.id)));
                        }}
                      />
                    </th>
                    {th('day', 'Day')}
                    {th('subject', 'Subject')}
                    {th('title', 'Topic')}
                    <th className="px-3 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-ink-tertiary dark:text-night-tertiary">Type</th>
                    {th('status', 'Status')}
                    {th('confidence', 'Conf.')}
                    {th('date', 'Scheduled')}
                    <th className="px-3 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-ink-tertiary dark:text-night-tertiary">Revision</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divider">
                  {filtered.map((t) => {
                    const flagged = revisionSet.has(t.id) || t.needsRevision;
                    return (
                      <tr key={t.id} className="group transition hover:bg-surface-muted dark:hover:bg-night-raised">
                        <td className="px-3 py-2.5">
                          <Checkbox
                            checked={selected.has(t.id)}
                            size="sm"
                            label={`Select ${t.title}`}
                            onChange={() => {
                              const next = new Set(selected);
                              if (next.has(t.id)) next.delete(t.id);
                              else next.add(t.id);
                              setSelected(next);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-ink-tertiary tnum dark:text-night-tertiary">
                          {String(t.dayNumber).padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-medium text-ink-secondary dark:text-night-secondary">{t.subject}</span>
                        </td>
                        <td className="max-w-[260px] px-3 py-2.5">
                          <button
                            onClick={() => setOpenTopic(t)}
                            className={`block truncate text-left text-[13px] font-medium hover:text-accent ${t.status === 'Completed' ? 'text-ink-tertiary line-through dark:text-night-tertiary' : 'text-ink dark:text-night-text'}`}
                            title={t.title}
                          >
                            {t.title}
                          </button>
                          <span className="block truncate text-2xs text-ink-faint dark:text-night-tertiary">{t.chapter}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={taskTypeTone(t.taskType)}>{t.taskType}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-3 py-2.5">
                          <ConfidenceStars value={t.confidence} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="text-2xs text-ink-secondary dark:text-night-secondary">{mediumDate(t.originalScheduledDate)}</span>
                          {t.revisedTargetDate && (
                            <span className="block text-2xs text-sky-600 dark:text-sky-400">→ {mediumDate(t.revisedTargetDate)}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {flagged ? (
                            <Badge tone="warn">
                              <RotateCcw size={9} /> Needed
                            </Badge>
                          ) : revisionCountFor(data, t.id) > 0 ? (
                            <Badge tone="good">Revised ×{revisionCountFor(data, t.id)}</Badge>
                          ) : (
                            <span className="text-2xs text-ink-faint dark:text-night-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => toggleComplete(t.id)}
                              className="rounded-md border border-line px-2 py-1 text-2xs text-ink-tertiary hover:text-emerald-600 dark:border-night-line dark:text-night-tertiary"
                            >
                              {t.status === 'Completed' ? 'Reopen' : 'Done'}
                            </button>
                            <button
                              onClick={() => setOpenTopic(t)}
                              className="rounded-md border border-line px-2 py-1 text-2xs text-ink-tertiary hover:text-accent dark:border-night-line dark:text-night-tertiary"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="divide-y divider lg:hidden">
              {filtered.map((t) => (
                <div key={t.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(t.id)}
                      size="sm"
                      label={`Select ${t.title}`}
                      onChange={() => {
                        const next = new Set(selected);
                        if (next.has(t.id)) next.delete(t.id);
                        else next.add(t.id);
                        setSelected(next);
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => setOpenTopic(t)} className="block text-left text-[13px] font-medium text-ink dark:text-night-text">
                        {t.title}
                      </button>
                      <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
                        Day {t.dayNumber} · {t.subject} · {t.chapter}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={t.status} />
                        <Badge tone={taskTypeTone(t.taskType)}>{t.taskType}</Badge>
                        <ConfidenceStars value={t.confidence} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t divider px-4 py-2.5">
              <span className="text-2xs text-ink-tertiary dark:text-night-tertiary">
                Showing <span className="font-mono tnum">{filtered.length}</span> of{' '}
                <span className="font-mono tnum">{allTopics(data).length}</span> topics
              </span>
              <div className="flex items-center gap-2 text-2xs text-ink-tertiary dark:text-night-tertiary">
                <SlidersHorizontal size={11} /> Sorted by {sortKey} {sortDir === 'asc' ? '↑' : '↓'}
              </div>
            </div>
          </>
        )}
      </Card>

      {openTopic && <TopicDetailPanel topic={openTopic} onClose={() => setOpenTopic(null)} />}
    </div>
  );
}

void formatDateTime;
