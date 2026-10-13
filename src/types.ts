/* MISSION 100 — core data model */

export type Subject = 'Physics' | 'Chemistry' | 'Mathematics';
export type TaskType = 'Concept' | 'Practice' | 'Revision' | 'Test';
export type TopicStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Needs Revision';
export type DayStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Partially Complete' | 'Overdue';

export const SUBJECTS: Subject[] = ['Physics', 'Chemistry', 'Mathematics'];
export const TASK_TYPES: TaskType[] = ['Concept', 'Practice', 'Revision', 'Test'];
export const TOPIC_STATUSES: TopicStatus[] = ['Not Started', 'In Progress', 'Completed', 'Needs Revision'];

export interface Plan {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Pre-start' | 'Active' | 'Completed' | 'Past Deadline';
}

export interface Topic {
  id: string; // stable id, e.g. "d001-phy-0"
  dayNumber: number;
  subject: Subject;
  chapter: string;
  title: string; // exact scheduled entry text
  taskType: TaskType;
  status: TopicStatus;
  originalScheduledDate: string; // YYYY-MM-DD
  revisedTargetDate: string | null; // YYYY-MM-DD
  completedAt: string | null; // ISO datetime
  confidence: number | null; // 1..4
  needsRevision: boolean;
  notes: string;
  actualDurationMinutes: number | null;
}

export interface Day {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  notes: string;
}

export interface RevisionSession {
  id: string;
  topicId: string;
  revisionDate: string; // YYYY-MM-DD
  confidenceBefore: number | null;
  confidenceAfter: number | null;
  notes: string;
}

export type AssessmentStatus = 'Upcoming' | 'Completed' | 'Missed';

export interface Assessment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  subject: Subject | 'Mixed';
  relatedTopicIds: string[];
  status: AssessmentStatus;
  maximumMarks: number | null;
  marksObtained: number | null;
  mistakes: string;
  nextAction: string;
  isCustom: boolean;
}

export interface StudySession {
  id: string;
  topicId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  notes: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  weekStartDay: 0 | 1;
  revisionTrackingEnabled: boolean;
  dataVersion: number;
}

export interface AppData {
  dataVersion: number;
  plan: Plan;
  topics: Record<string, Topic>;
  days: Record<string, Day>; // keyed by dayNumber as string
  revisionSessions: RevisionSession[];
  assessments: Assessment[];
  studySessions: StudySession[];
  settings: Settings;
}

export const DATA_VERSION = 1;

export interface TopicCompletionStat {
  completed: number;
  total: number;
  percent: number;
}

export interface DayProgress {
  completed: number;
  total: number;
  percent: number;
}

export const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'I do not understand it',
  2: 'I understand the basics',
  3: 'I can solve standard questions',
  4: 'I can solve exam-level questions independently',
};
