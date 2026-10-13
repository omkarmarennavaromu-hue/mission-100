/* Data-derived insights. Never predicts marks, rank, or outcomes. */

import type { AppData } from '../types';
import { SUBJECTS } from '../types';
import {
  needsRevisionList,
  overallStat,
  overdueTopics,
  subjectStat,
  testsSummary,
} from './progress';

export interface Insight {
  id: string;
  text: string;
  kind: 'info' | 'attention' | 'good';
}

export function buildInsights(data: AppData): Insight[] {
  const insights: Insight[] = [];
  const overall = overallStat(data);

  // Subject completion comparison (honest: only when there is something to compare)
  const stats = SUBJECTS.map((s) => ({ subject: s, ...subjectStat(data, s) }));
  if (overall.total > 0 && overall.completed > 0) {
    const ranked = stats.slice().sort((a, b) => b.percent - a.percent);
    const top = ranked[0];
    const bottom = ranked[ranked.length - 1];
    if (top.percent !== bottom.percent) {
      insights.push({
        id: 'subject-lead',
        text: `${top.subject} has the highest completion percentage (${top.percent}% — ${top.completed}/${top.total} topics).`,
        kind: 'info',
      });
      insights.push({
        id: 'subject-lag',
        text: `${bottom.subject} is currently lowest at ${bottom.percent}% (${bottom.completed}/${bottom.total} topics).`,
        kind: 'attention',
      });
    } else {
      insights.push({
        id: 'subject-tie',
        text: `All three subjects are level at ${top.percent}% completion.`,
        kind: 'info',
      });
    }
  } else {
    insights.push({
      id: 'no-completion',
      text: 'No topics are marked complete yet. Progress figures will appear once you start checking items off.',
      kind: 'info',
    });
  }

  // Overdue backlog
  const overdue = overdueTopics(data);
  if (overdue.length > 0) {
    insights.push({
      id: 'overdue',
      text: `You have ${overdue.length} unfinished topic${overdue.length === 1 ? '' : 's'} from previous days.`,
      kind: 'attention',
    });
  } else if (overall.completed > 0) {
    insights.push({
      id: 'no-overdue',
      text: 'No overdue topics — every past scheduled item is complete.',
      kind: 'good',
    });
  }

  // Revision queue
  const revision = needsRevisionList(data);
  const bySubject = SUBJECTS.map((s) => ({
    subject: s,
    n: revision.filter((t) => t.subject === s).length,
  })).filter((x) => x.n > 0);
  if (revision.length > 0) {
    const parts = bySubject.map((x) => `${x.subject} has ${x.n} topic${x.n === 1 ? '' : 's'} marked for revision`).join('; ');
    insights.push({ id: 'revision', text: `${parts}.`, kind: 'attention' });
  }

  // Tests
  const tests = testsSummary(data);
  if (tests.graded === 0) {
    insights.push({ id: 'tests-none', text: 'No graded tests are available yet.', kind: 'info' });
  } else {
    insights.push({
      id: 'tests-avg',
      text: `Average score across ${tests.graded} graded test${tests.graded === 1 ? '' : 's'}: ${tests.averagePercent}%.`,
      kind: 'info',
    });
  }

  // Confidence flags
  const lowConfidence = Object.values(data.topics).filter(
    (t) => t.confidence !== null && t.confidence <= 2 && t.status === 'Completed',
  );
  if (lowConfidence.length > 0) {
    insights.push({
      id: 'low-confidence',
      text: `${lowConfidence.length} completed topic${lowConfidence.length === 1 ? '' : 's'} still sit at confidence level 1–2 and are flagged for revision.`,
      kind: 'attention',
    });
  }

  return insights;
}
