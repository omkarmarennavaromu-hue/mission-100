/* Progress calculations — every number derives from stored topic records. */

import type { AppData, DayProgress, Subject, Topic, TopicCompletionStat, TopicStatus } from '../types';
import { SUBJECTS } from '../types';
import { addDays, dayNumberFor, diffDays, PLAN_START, todayISO, TOTAL_DAYS } from './dates';

const SUBJECT_ORDER: Record<string, number> = { Physics: 0, Chemistry: 1, Mathematics: 2 };

export function allTopics(data: AppData): Topic[] {
  return Object.values(data.topics).sort((a, b) => {
    if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
    const sa = SUBJECT_ORDER[a.subject] ?? 9;
    const sb = SUBJECT_ORDER[b.subject] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });
}

export function topicsForDay(data: AppData, dayNumber: number): Topic[] {
  return allTopics(data).filter((t) => t.dayNumber === dayNumber);
}

export function topicsForSubject(data: AppData, subject: Subject): Topic[] {
  return allTopics(data).filter((t) => t.subject === subject);
}

export function isCompleted(t: Topic): boolean {
  return t.status === 'Completed';
}

export function stat(topics: Topic[]): TopicCompletionStat {
  const total = topics.length;
  const completed = topics.filter(isCompleted).length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function overallStat(data: AppData): TopicCompletionStat {
  return stat(allTopics(data));
}

export function subjectStat(data: AppData, subject: Subject): TopicCompletionStat {
  return stat(topicsForSubject(data, subject));
}

export function dayProgress(data: AppData, dayNumber: number): DayProgress {
  const topics = topicsForDay(data, dayNumber);
  const completed = topics.filter(isCompleted).length;
  return {
    completed,
    total: topics.length,
    percent: topics.length === 0 ? 0 : Math.round((completed / topics.length) * 100),
  };
}

/** True only when EVERY scheduled topic of the day is completed. */
export function isDayComplete(data: AppData, dayNumber: number): boolean {
  const p = dayProgress(data, dayNumber);
  return p.total > 0 && p.completed === p.total;
}

export function dayStatus(data: AppData, dayNumber: number): 'Not Started' | 'In Progress' | 'Completed' | 'Partially Complete' | 'Overdue' {
  const p = dayProgress(data, dayNumber);
  const today = todayISO();
  const dayDate = data.days[String(dayNumber)]?.date;
  const past = dayDate ? dayDate < today : false;

  if (p.completed === p.total && p.total > 0) return 'Completed';
  if (p.completed === 0 && p.total > 0) {
    return past ? 'Overdue' : 'Not Started';
  }
  return past ? 'Partially Complete' : 'In Progress';
}

export function needsRevisionList(data: AppData): Topic[] {
  return allTopics(data).filter(
    (t) => t.needsRevision || t.status === 'Needs Revision' || (t.status === 'Completed' && t.confidence !== null && t.confidence <= 2),
  );
}

export function overdueTopics(data: AppData): Topic[] {
  const today = todayISO();
  return allTopics(data).filter(
    (t) => t.status !== 'Completed' && t.originalScheduledDate < today,
  );
}

export function revisedOnOrAfter(data: AppData, topicId: string): string | null {
  const sessions = data.revisionSessions.filter((s) => s.topicId === topicId);
  if (sessions.length === 0) return null;
  return sessions.map((s) => s.revisionDate).sort().slice(-1)[0];
}

export function revisionCountFor(data: AppData, topicId: string): number {
  return data.revisionSessions.filter((s) => s.topicId === topicId).length;
}

/** Topics completed (by actual completion timestamp) on a given calendar date. */
export function completionsByDate(data: AppData): Record<string, Topic[]> {
  const map: Record<string, Topic[]> = {};
  for (const t of Object.values(data.topics)) {
    if (!t.completedAt) continue;
    const d = t.completedAt.slice(0, 10);
    (map[d] ??= []).push(t);
  }
  return map;
}

/** Cumulative actual completion as of each plan date (uses completion timestamps). */
export function actualCumulativeSeries(data: AppData): { date: string; dayNumber: number; actual: number }[] {
  const sorted = allTopics(data).filter((t) => t.completedAt);
  const byDate = completionsByDate(data);
  const series: { date: string; dayNumber: number; actual: number }[] = [];
  let running = 0;
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const date = data.days[String(d)]?.date ?? `${PLAN_START}`;
    // count completions whose timestamp date <= this date
    void byDate;
    running = sorted.filter((t) => (t.completedAt as string).slice(0, 10) <= date).length;
    series.push({ date, dayNumber: d, actual: running });
  }
  return series;
}

/** Planned cumulative topics per day: 3 scheduled topics per day. */
export function plannedCumulativeSeries(data: AppData): { date: string; dayNumber: number; planned: number }[] {
  const series: { date: string; dayNumber: number; planned: number }[] = [];
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const date = data.days[String(d)]?.date ?? PLAN_START;
    const planned = topicsForDay(data, d).length + (d - 1) * 0;
    // cumulative = topics scheduled up to and including day d
    let cum = 0;
    for (let k = 1; k <= d; k++) cum += topicsForDay(data, k).length;
    series.push({ date, dayNumber: d, planned: cum });
    void planned;
  }
  return series;
}

export function statusDistribution(data: AppData): Record<TopicStatus, number> {
  const dist: Record<TopicStatus, number> = {
    'Not Started': 0,
    'In Progress': 0,
    Completed: 0,
    'Needs Revision': 0,
  };
  for (const t of Object.values(data.topics)) dist[t.status] += 1;
  return dist;
}

export function completionPercentOf(t: Topic): boolean {
  return t.status === 'Completed';
}

/** Weekly buckets of plan days: week 1 = days 1–7, etc. */
export function weeklyCompletedBySubject(data: AppData): {
  week: number;
  label: string;
  Physics: number;
  Chemistry: number;
  Mathematics: number;
  total: number;
}[] {
  const weeks: { week: number; label: string; Physics: number; Chemistry: number; Mathematics: number; total: number }[] = [];
  for (let w = 0; w < 13; w++) {
    const from = w * 7 + 1;
    const to = Math.min(from + 6, TOTAL_DAYS);
    if (from > TOTAL_DAYS) break;
    const bucket = { week: w + 1, label: `W${w + 1}`, Physics: 0, Chemistry: 0, Mathematics: 0, total: 0 };
    for (const t of Object.values(data.topics)) {
      if (t.dayNumber >= from && t.dayNumber <= to && t.status === 'Completed') {
        bucket[t.subject] += 1;
        bucket.total += 1;
      }
    }
    weeks.push(bucket);
  }
  return weeks;
}

export function consistencyStreak(data: AppData): { current: number; best: number; activeDays: number } {
  const byDate = completionsByDate(data);
  const today = todayISO();
  let current = 0;
  // count back from today while there is recorded activity
  let cursor = today;
  let guard = 0;
  while (byDate[cursor]?.length && guard < 400) {
    current += 1;
    cursor = addDays(cursor, -1);
    guard += 1;
  }
  // best streak across recorded dates
  const dates = Object.keys(byDate).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    if (prev && diffDays(prev, d) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best, activeDays: dates.length };
}

export function testsSummary(data: AppData) {
  const graded = data.assessments.filter((a) => a.marksObtained !== null && a.maximumMarks !== null && a.maximumMarks > 0);
  const percentages = graded.map((a) => ((a.marksObtained as number) / (a.maximumMarks as number)) * 100);
  const avg = percentages.length ? Math.round(percentages.reduce((s, x) => s + x, 0) / percentages.length) : null;
  const completed = data.assessments.filter((a) => a.status === 'Completed').length;
  return {
    total: data.assessments.length,
    completed,
    graded: graded.length,
    averagePercent: avg,
  };
}

export { SUBJECTS, TOTAL_DAYS, dayNumberFor };
