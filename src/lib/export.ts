/* JSON backup / restore and CSV export. All exports are client-side only. */

import type { AppData, Topic } from '../types';
import { validateAppData } from './storage';
import { formatDateTime } from './dates';
import { revisionCountFor, revisedOnOrAfter } from './progress';

function download(filename: string, content: string, mime: string): boolean {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}

export function exportJSON(data: AppData): boolean {
  const stamp = new Date().toISOString().slice(0, 10);
  return download(`mission100-backup-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
}

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportTopicsCSV(data: AppData): boolean {
  const header = [
    'Topic ID', 'Day', 'Scheduled Date', 'Subject', 'Chapter', 'Topic', 'Task Type',
    'Status', 'Completed At', 'Confidence', 'Needs Revision', 'Revised Target Date',
    'Actual Duration (min)', 'Revision Count', 'Last Revision Date', 'Notes',
  ];
  const rows = Object.values(data.topics)
    .sort((a, b) => a.dayNumber - b.dayNumber || a.subject.localeCompare(b.subject))
    .map((t: Topic) =>
      [
        t.id, t.dayNumber, t.originalScheduledDate, t.subject, t.chapter, t.title, t.taskType,
        t.status, t.completedAt ? formatDateTime(t.completedAt) : '', t.confidence ?? '',
        t.needsRevision ? 'Yes' : 'No', t.revisedTargetDate ?? '', t.actualDurationMinutes ?? '',
        revisionCountFor(data, t.id), revisedOnOrAfter(data, t.id) ?? '', t.notes,
      ].map(csvEscape).join(','),
    );
  const csv = [header.join(','), ...rows].join('\n');
  return download(`mission100-topics-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
}

export function exportAssessmentsCSV(data: AppData): boolean {
  const header = [
    'Assessment ID', 'Title', 'Date', 'Subject', 'Status', 'Max Marks', 'Marks Obtained',
    'Percentage', 'Graded', 'Mistakes / Weak Areas', 'Next Action', 'Custom',
  ];
  const rows = data.assessments
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => {
      const pct =
        a.marksObtained !== null && a.maximumMarks !== null && a.maximumMarks > 0
          ? `${Math.round((a.marksObtained / a.maximumMarks) * 100)}%`
          : 'Not graded';
      return [
        a.id, a.title, a.date, a.subject, a.status,
        a.maximumMarks ?? '', a.marksObtained ?? '', pct,
        a.marksObtained !== null ? 'Yes' : 'No',
        a.mistakes, a.nextAction, a.isCustom ? 'Yes' : 'No',
      ].map(csvEscape).join(',');
    });
  const csv = [header.join(','), ...rows].join('\n');
  return download(`mission100-assessments-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
}

export interface ImportResult {
  ok: boolean;
  data?: AppData;
  error?: string;
}

/** Validate a parsed backup WITHOUT touching current state. */
export function parseImport(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  const check = validateAppData(parsed);
  if (!check.ok) return { ok: false, error: check.error };
  return { ok: true, data: check.data };
}
