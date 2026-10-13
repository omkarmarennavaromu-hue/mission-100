/* Versioned localStorage persistence with safe migration and honest errors. */

import { buildSchedule } from '../data/syllabus';
import type { AppData, Assessment, Topic } from '../types';
import { DATA_VERSION } from '../types';
import { PLAN_END, PLAN_START } from './dates';

const STORAGE_KEY = 'mission100-data';

export interface StorageStatus {
  ok: boolean;
  message: string;
}

/** Fresh app state: preloaded schedule + empty progress. */
export function initialData(): AppData {
  const { topics, days } = buildSchedule();
  const assessments = buildScheduledAssessmentsSafe(topics);
  return {
    dataVersion: DATA_VERSION,
    plan: {
      id: 'mission-100',
      name: 'MISSION 100 — 90-Day PCM Execution Plan',
      startDate: PLAN_START,
      endDate: PLAN_END,
      status: 'Active',
    },
    topics,
    days,
    revisionSessions: [],
    assessments,
    studySessions: [],
    settings: {
      theme:
        typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
      weekStartDay: 1,
      revisionTrackingEnabled: true,
      dataVersion: DATA_VERSION,
    },
  };
}

function buildScheduledAssessmentsSafe(topics: Record<string, Topic>): Assessment[] {
  // inline to avoid circular import issues in some bundlers
  return Object.values(topics)
    .filter((t) => t.taskType === 'Test')
    .map((t) => ({
      id: `as-${t.id}`,
      title: t.title,
      date: t.originalScheduledDate,
      subject: t.subject,
      relatedTopicIds: [t.id],
      status: 'Upcoming' as const,
      maximumMarks: null,
      marksObtained: null,
      mistakes: '',
      nextAction: '',
      isCustom: false,
    }));
}

function isTopicLike(v: unknown): v is Topic {
  const t = v as Topic;
  return (
    !!t &&
    typeof t.id === 'string' &&
    typeof t.dayNumber === 'number' &&
    typeof t.title === 'string' &&
    typeof t.status === 'string' &&
    typeof t.originalScheduledDate === 'string' &&
    (t.subject === 'Physics' || t.subject === 'Chemistry' || t.subject === 'Mathematics')
  );
}

/** Deep structural validation for imported backups. */
export function validateAppData(raw: unknown): { ok: true; data: AppData } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Backup is not a JSON object.' };
  const d = raw as Partial<AppData>;
  if (!d.topics || typeof d.topics !== 'object') return { ok: false, error: 'Backup is missing the topics database.' };
  const topicList = Object.values(d.topics);
  if (topicList.length === 0) return { ok: false, error: 'Backup contains no topic records.' };
  if (!topicList.every(isTopicLike)) return { ok: false, error: 'Backup contains malformed topic records.' };
  if (!d.days || typeof d.days !== 'object') return { ok: false, error: 'Backup is missing day records.' };
  if (!Array.isArray(d.revisionSessions)) return { ok: false, error: 'Backup is missing revisionSessions array.' };
  if (!Array.isArray(d.assessments)) return { ok: false, error: 'Backup is missing assessments array.' };
  if (!Array.isArray(d.studySessions)) return { ok: false, error: 'Backup is missing studySessions array.' };
  if (!d.settings || typeof d.settings !== 'object') return { ok: false, error: 'Backup is missing settings.' };
  if (!d.plan || typeof d.plan !== 'object') return { ok: false, error: 'Backup is missing plan metadata.' };

  const data = d as AppData;
  return { ok: true, data };
}

/** Migrate older payloads forward. Currently only v1 exists. */
function migrate(raw: AppData): AppData {
  const version = raw.dataVersion ?? 1;
  if (version > DATA_VERSION) {
    // Newer than this build: keep user progress, stamp our version.
    return { ...raw, dataVersion: DATA_VERSION };
  }
  return { ...raw, dataVersion: DATA_VERSION, settings: { ...raw.settings, dataVersion: DATA_VERSION } };
}

/**
 * Merge a schedule into existing user data without wiping progress:
 * - existing topic user-fields are preserved
 * - topics missing from user data (restored schedule) are added fresh
 * - stray topics not in the schedule are preserved (user may have rescheduled)
 */
export function mergeSchedule(base: AppData): AppData {
  const { topics: schedTopics, days: schedDays } = buildSchedule();
  const topics: Record<string, Topic> = { ...base.topics };
  for (const [id, st] of Object.entries(schedTopics)) {
    const existing = topics[id];
    if (existing) {
      topics[id] = {
        ...st,
        status: existing.status,
        completedAt: existing.completedAt,
        confidence: existing.confidence,
        needsRevision: existing.needsRevision,
        notes: existing.notes,
        revisedTargetDate: existing.revisedTargetDate,
        actualDurationMinutes: existing.actualDurationMinutes,
      };
    } else {
      topics[id] = st;
    }
  }
  const days = { ...schedDays, ...base.days };
  return { ...base, topics, days };
}

export function loadFromStorage(): { data: AppData; status: StorageStatus } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { data: initialData(), status: { ok: true, message: 'Initialized with the 90-day schedule.' } };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        data: initialData(),
        status: { ok: false, message: 'Stored data was unreadable and has been re-initialized. Your previous file may be corrupt.' },
      };
    }
    const check = validateAppData(parsed);
    if (!check.ok) {
      return {
        data: initialData(),
        status: { ok: false, message: `Stored data failed validation (${check.error}) and was re-initialized.` },
      };
    }
    const migrated = migrate(check.data);
    const merged = mergeSchedule(migrated); // ensure any missing schedule items exist
    return { data: merged, status: { ok: true, message: 'Progress restored from this browser.' } };
  } catch (e) {
    return {
      data: initialData(),
      status: { ok: false, message: `Could not read local storage (${(e as Error).message}). Started with a clean schedule.` },
    };
  }
}

export function saveToStorage(data: AppData): StorageStatus {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true, message: 'Saved.' };
  } catch (e) {
    return { ok: false, message: `Save failed: ${(e as Error).message}. Export a backup to avoid losing progress.` };
  }
}

export function clearStorage(): StorageStatus {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { ok: true, message: 'Local data cleared.' };
  } catch (e) {
    return { ok: false, message: `Could not clear storage: ${(e as Error).message}` };
  }
}

export function storageEstimate(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const bytes = raw ? new Blob([raw]).size : 0;
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return 'unknown';
  }
}

export { STORAGE_KEY };
