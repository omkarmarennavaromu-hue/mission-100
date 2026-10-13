/* Central application store: single source of truth + immediate persistence. */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AppData, Assessment, Topic, TopicStatus } from '../types';
import { DATA_VERSION } from '../types';
import {
  clearStorage,
  initialData,
  loadFromStorage,
  mergeSchedule,
  saveToStorage,
  type StorageStatus,
} from '../lib/storage';

export type Toast = { id: number; message: string; kind: 'success' | 'error' | 'info' };

interface StoreValue {
  data: AppData;
  storageStatus: StorageStatus;
  toasts: Toast[];
  notify: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  setTopicStatus: (topicId: string, status: TopicStatus) => boolean;
  toggleComplete: (topicId: string) => boolean;
  reopenTopic: (topicId: string) => boolean;
  setConfidence: (topicId: string, confidence: number | null) => boolean;
  toggleNeedsRevision: (topicId: string) => boolean;
  setTopicNotes: (topicId: string, notes: string) => boolean;
  setTopicDuration: (topicId: string, minutes: number | null) => boolean;
  rescheduleTopic: (topicId: string, newDate: string | null) => boolean;
  setDayNotes: (dayNumber: number, notes: string) => boolean;
  addRevisionSession: (
    topicId: string,
    session: { revisionDate: string; confidenceBefore: number | null; confidenceAfter: number | null; notes: string },
  ) => boolean;
  updateAssessment: (id: string, patch: Partial<Assessment>) => boolean;
  addAssessment: (a: Omit<Assessment, 'id'>) => boolean;
  removeAssessment: (id: string) => boolean;
  setTheme: (theme: 'light' | 'dark') => boolean;
  setWeekStartDay: (d: 0 | 1) => boolean;
  setRevisionTracking: (on: boolean) => boolean;
  importData: (raw: AppData) => boolean;
  resetProgress: () => boolean;
  restoreSchedule: () => boolean;
  clearAll: () => boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

let toastCounter = 1;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadFromStorage().data);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(
    () => loadFromStorage().status,
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const saveTimer = useRef<number | null>(null);
  // Always-current snapshot so mutations can validate + report success honestly
  // (React state updaters run later, which would make boolean returns stale).
  const dataRef = useRef<AppData>(data);
  dataRef.current = data;

  const notify = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = toastCounter++;
    setToasts((t) => [...t, { id, message, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 3800);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // Persist shortly after every data change.
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const status = saveToStorage(data);
      setStorageStatus(status);
    }, 120);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [data]);

  // Theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', data.settings.theme === 'dark' ? '#0f0f10' : '#ffffff');
  }, [data.settings.theme]);

  const mutate = useCallback((fn: (prev: AppData) => AppData | null): boolean => {
    const next = fn(dataRef.current);
    if (!next) return false;
    dataRef.current = next;
    setData(next);
    return true;
  }, []);

  const patchTopic = useCallback(
    (topicId: string, patch: Partial<Topic> | ((t: Topic) => Partial<Topic> | null)) =>
      mutate((prev) => {
        const t = prev.topics[topicId];
        if (!t) return null;
        const p = typeof patch === 'function' ? patch(t) : patch;
        if (!p) return null;
        return { ...prev, topics: { ...prev.topics, [topicId]: { ...t, ...p } } };
      }),
    [mutate],
  );

  const setTopicStatus = useCallback(
    (topicId: string, status: TopicStatus): boolean =>
      patchTopic(topicId, (t) => {
        const patch: Partial<Topic> = { status };
        if (status === 'Completed') {
          if (!t.completedAt) patch.completedAt = new Date().toISOString();
        }
        if (status === 'Needs Revision') patch.needsRevision = true;
        if (t.status === 'Completed' && status !== 'Completed') {
          // Reopened: keep completedAt as history, but it no longer counts as complete.
          patch.completedAt = t.completedAt;
        }
        return patch;
      }),
    [patchTopic],
  );

  const toggleComplete = useCallback(
    (topicId: string): boolean =>
      patchTopic(topicId, (t) =>
        t.status === 'Completed'
          ? { status: 'In Progress', completedAt: t.completedAt }
          : { status: 'Completed', completedAt: new Date().toISOString() },
      ),
    [patchTopic],
  );

  const reopenTopic = useCallback(
    (topicId: string): boolean =>
      patchTopic(topicId, (t) => (t.status === 'Completed' ? { status: 'In Progress', completedAt: t.completedAt } : null)),
    [patchTopic],
  );

  const setConfidence = useCallback(
    (topicId: string, confidence: number | null): boolean =>
      patchTopic(topicId, (t) => {
        const patch: Partial<Topic> = { confidence };
        if (confidence !== null && confidence <= 2 && t.status === 'Completed') patch.needsRevision = true;
        return patch;
      }),
    [patchTopic],
  );

  const toggleNeedsRevision = useCallback(
    (topicId: string): boolean => patchTopic(topicId, (t) => ({ needsRevision: !t.needsRevision })),
    [patchTopic],
  );

  const setTopicNotes = useCallback(
    (topicId: string, notes: string): boolean => patchTopic(topicId, { notes }),
    [patchTopic],
  );

  const setTopicDuration = useCallback(
    (topicId: string, minutes: number | null): boolean => patchTopic(topicId, { actualDurationMinutes: minutes }),
    [patchTopic],
  );

  const rescheduleTopic = useCallback(
    (topicId: string, newDate: string | null): boolean =>
      patchTopic(topicId, () => ({
        revisedTargetDate: newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate) ? newDate : null,
      })),
    [patchTopic],
  );

  const setDayNotes = useCallback(
    (dayNumber: number, notes: string): boolean =>
      mutate((prev) => {
        const key = String(dayNumber);
        const day = prev.days[key];
        if (!day) return null;
        return { ...prev, days: { ...prev.days, [key]: { ...day, notes } } };
      }),
    [mutate],
  );

  const addRevisionSession = useCallback(
    (
      topicId: string,
      session: { revisionDate: string; confidenceBefore: number | null; confidenceAfter: number | null; notes: string },
    ): boolean =>
      mutate((prev) => {
        const t = prev.topics[topicId];
        if (!t) return null;
        const id = `rv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const updated: Topic = { ...t, confidence: session.confidenceAfter ?? t.confidence };
        if (session.confidenceAfter !== null && session.confidenceAfter >= 3 && updated.needsRevision) {
          updated.needsRevision = false;
          if (updated.status === 'Needs Revision') updated.status = 'Completed';
        }
        return {
          ...prev,
          topics: { ...prev.topics, [topicId]: updated },
          revisionSessions: [...prev.revisionSessions, { id, topicId, ...session }],
        };
      }),
    [mutate],
  );

  const updateAssessment = useCallback(
    (id: string, patch: Partial<Assessment>): boolean =>
      mutate((prev) => {
        const idx = prev.assessments.findIndex((a) => a.id === id);
        if (idx < 0) return null;
        const assessments = prev.assessments.slice();
        assessments[idx] = { ...assessments[idx], ...patch };
        return { ...prev, assessments };
      }),
    [mutate],
  );

  const addAssessment = useCallback(
    (a: Omit<Assessment, 'id'>): boolean =>
      mutate((prev) => {
        const id = `as-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        return { ...prev, assessments: [...prev.assessments, { ...a, id, isCustom: true }] };
      }),
    [mutate],
  );

  const removeAssessment = useCallback(
    (id: string): boolean =>
      mutate((prev) => {
        const a = prev.assessments.find((x) => x.id === id);
        if (!a || !a.isCustom) return null;
        return { ...prev, assessments: prev.assessments.filter((x) => x.id !== id) };
      }),
    [mutate],
  );

  const setTheme = useCallback(
    (theme: 'light' | 'dark') => mutate((prev) => ({ ...prev, settings: { ...prev.settings, theme } })),
    [mutate],
  );
  const setWeekStartDay = useCallback(
    (d: 0 | 1) => mutate((prev) => ({ ...prev, settings: { ...prev.settings, weekStartDay: d } })),
    [mutate],
  );
  const setRevisionTracking = useCallback(
    (on: boolean) => mutate((prev) => ({ ...prev, settings: { ...prev.settings, revisionTrackingEnabled: on } })),
    [mutate],
  );

  const importData = useCallback(
    (raw: AppData): boolean => {
      const merged = mergeSchedule({ ...raw, dataVersion: DATA_VERSION });
      dataRef.current = merged;
      setData(merged);
      const status = saveToStorage(merged);
      setStorageStatus(status);
      return status.ok;
    },
    [],
  );

  const resetProgress = useCallback((): boolean => {
    const base = initialData();
    const next = { ...base, settings: dataRef.current.settings };
    dataRef.current = next;
    setData(next);
    return true;
  }, []);

  const restoreSchedule = useCallback((): boolean => {
    const next = mergeSchedule(dataRef.current);
    dataRef.current = next;
    setData(next);
    return true;
  }, []);

  const clearAll = useCallback((): boolean => {
    const status = clearStorage();
    const fresh = initialData();
    dataRef.current = fresh;
    setData(fresh);
    setStorageStatus(status);
    return status.ok;
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      storageStatus,
      toasts,
      notify,
      dismissToast,
      setTopicStatus,
      toggleComplete,
      reopenTopic,
      setConfidence,
      toggleNeedsRevision,
      setTopicNotes,
      setTopicDuration,
      rescheduleTopic,
      setDayNotes,
      addRevisionSession,
      updateAssessment,
      addAssessment,
      removeAssessment,
      setTheme,
      setWeekStartDay,
      setRevisionTracking,
      importData,
      resetProgress,
      restoreSchedule,
      clearAll,
    }),
    [
      data,
      storageStatus,
      toasts,
      notify,
      dismissToast,
      setTopicStatus,
      toggleComplete,
      reopenTopic,
      setConfidence,
      toggleNeedsRevision,
      setTopicNotes,
      setTopicDuration,
      rescheduleTopic,
      setDayNotes,
      addRevisionSession,
      updateAssessment,
      addAssessment,
      removeAssessment,
      setTheme,
      setWeekStartDay,
      setRevisionTracking,
      importData,
      resetProgress,
      restoreSchedule,
      clearAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Effective target date for a topic (revised date when rescheduled). */
export function effectiveDate(t: Topic): string {
  return t.revisedTargetDate ?? t.originalScheduledDate;
}
