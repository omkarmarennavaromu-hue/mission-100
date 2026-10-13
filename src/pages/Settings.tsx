/* Settings — theme, data management (export/import/CSV/reset), storage info. */

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  Moon,
  RotateCcw,
  Sun,
  Table2,
  Upload,
} from 'lucide-react';
import { useStore } from '../state/store';
import { exportAssessmentsCSV, exportJSON, exportTopicsCSV, parseImport } from '../lib/export';
import { storageEstimate, STORAGE_KEY, initialData, clearStorage } from '../lib/storage';
import { DATA_VERSION } from '../types';
import { mediumDate, PLAN_END, PLAN_START, TOTAL_DAYS } from '../lib/dates';
import { Card, ConfirmDialog, Modal, Select } from '../components/ui';
import { allTopics } from '../lib/progress';

export default function Settings() {
  const { data, storageStatus, notify, importData, resetProgress, restoreSchedule, clearAll, setTheme, setWeekStartDay, setRevisionTracking } =
    useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ text: string; name: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const totalTopics = allTopics(data).length;

  const handleFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const result = parseImport(text);
      if (!result.ok || !result.data) {
        setImportError(result.error ?? 'Unknown import error. Your current data was NOT touched.');
        return;
      }
      setPendingImport({ text, name: file.name });
    };
    reader.onerror = () => setImportError('Could not read the file.');
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <section className="card px-6 py-5">
        <p className="section-title">Settings</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink dark:text-night-text">Preferences & data</h1>
        <p className="mt-1 text-xs text-ink-tertiary dark:text-night-tertiary">
          Everything runs locally in your browser. There is no account, no server, and no subscription.
        </p>
      </section>

      {/* Appearance */}
      <Card title="Appearance" subtitle="Light theme by default; dark theme is optional">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-line bg-surface-muted p-0.5 dark:border-night-line dark:bg-night">
            <button
              onClick={() => setTheme('light')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                data.settings.theme === 'light' ? 'bg-white text-ink shadow-subtle dark:bg-night-raised dark:text-night-text' : 'text-ink-tertiary dark:text-night-tertiary'
              }`}
            >
              <Sun size={13} /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                data.settings.theme === 'dark' ? 'bg-white text-ink shadow-subtle dark:bg-night-raised dark:text-night-text' : 'text-ink-tertiary dark:text-night-tertiary'
              }`}
            >
              <Moon size={13} /> Dark
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-secondary dark:text-night-secondary">Week starts on</span>
            <Select
              value={String(data.settings.weekStartDay)}
              onChange={(v) => setWeekStartDay(Number(v) as 0 | 1)}
              options={[
                { value: '1', label: 'Monday' },
                { value: '0', label: 'Sunday' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Study preferences */}
      <Card title="Revision tracking" subtitle="Controls what the Revision Center auto-collects">
        <div className="flex items-center justify-between rounded-lg border border-line px-4 py-3 dark:border-night-line">
          <div>
            <p className="text-sm font-medium text-ink dark:text-night-text">Track completed topics without a revision</p>
            <p className="mt-0.5 max-w-xl text-2xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">
              When enabled, completed topics that have never had a revision session also appear in the Revision Center.
              Topics marked Needs Revision or rated confidence 1–2 are always included.
            </p>
          </div>
          <button
            onClick={() => setRevisionTracking(!data.settings.revisionTrackingEnabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${data.settings.revisionTrackingEnabled ? 'bg-accent' : 'bg-line-strong dark:bg-night-line'}`}
            role="switch"
            aria-checked={data.settings.revisionTrackingEnabled}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${data.settings.revisionTrackingEnabled ? 'left-[22px]' : 'left-0.5'}`}
            />
          </button>
        </div>
      </Card>

      {/* Backup & export */}
      <Card title="Backup & export" subtitle="Download your full data or topic/assessment reports">
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionTile
            icon={<FileJson size={16} />}
            title="Export JSON backup"
            desc="Complete snapshot: topics, notes, revision history, assessments, settings."
            label="Download JSON"
            onClick={() => {
              const ok = exportJSON(data);
              notify(ok ? 'JSON backup downloaded.' : 'Export failed — try again.', ok ? 'success' : 'error');
            }}
          />
          <ActionTile
            icon={<Table2 size={16} />}
            title="Export topic report (CSV)"
            desc="All 270 topic records with status, confidence, notes, revision data."
            label="Download CSV"
            onClick={() => {
              const ok = exportTopicsCSV(data);
              notify(ok ? 'Topic CSV downloaded.' : 'Export failed — try again.', ok ? 'success' : 'error');
            }}
          />
          <ActionTile
            icon={<FileSpreadsheet size={16} />}
            title="Export assessment results (CSV)"
            desc="Test names, dates, scores, percentages, mistakes, next actions."
            label="Download CSV"
            onClick={() => {
              const ok = exportAssessmentsCSV(data);
              notify(ok ? 'Assessment CSV downloaded.' : 'Export failed — try again.', ok ? 'success' : 'error');
            }}
          />
        </div>
      </Card>

      {/* Import */}
      <Card title="Import backup" subtitle="Restore from a previously exported JSON file — validated before anything is replaced">
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line px-5 py-6 dark:border-night-line"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <Upload size={18} className="text-ink-tertiary dark:text-night-tertiary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink dark:text-night-text">Drop a .json backup here</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary dark:text-night-tertiary">
              Invalid files are rejected safely — your current progress is never discarded on a failed import.
            </p>
          </div>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            Choose file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>
        {importError && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Import rejected</p>
              <p className="mt-0.5">{importError}</p>
            </div>
          </div>
        )}
        {storageStatus.ok === false && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Storage warning</p>
              <p className="mt-0.5">{storageStatus.message}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Restore / reset */}
      <Card title="Restore & reset" subtitle="Destructive actions always require explicit confirmation">
        <div className="space-y-2.5">
          <Row
            icon={<RotateCcw size={15} />}
            title="Restore default schedule items"
            desc="Re-adds any missing schedule topics without erasing your progress. Safe to run — existing completion, notes, and revision history are preserved."
            action={
              <button className="btn-ghost" onClick={() => setConfirmRestore(true)}>
                Restore schedule
              </button>
            }
          />
          <Row
            icon={<AlertTriangle size={15} className="text-amber-500" />}
            title="Reset all progress"
            desc="Clears completion states, notes, confidence, revision history, assessments, and scores — returning to 0% completion with the full schedule intact. Settings are kept."
            action={
              <button className="btn-danger" onClick={() => setConfirmReset(true)}>
                Reset progress
              </button>
            }
          />
          <Row
            icon={<Database size={15} className="text-red-500" />}
            title="Erase all local data"
            desc="Deletes the app's stored data entirely and re-initializes from code. Equivalent to opening the app for the first time."
            action={
              <button className="btn-danger" onClick={() => setConfirmClear(true)}>
                Erase local data
              </button>
            }
          />
        </div>
      </Card>

      {/* Data storage info */}
      <Card title="Data storage information" subtitle="Where your progress lives and how to protect it">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCell label="Storage engine" value="Browser localStorage" />
          <InfoCell label="Storage key" value={STORAGE_KEY} mono />
          <InfoCell label="Approximate size" value={storageEstimate()} mono />
          <InfoCell label="Data model version" value={`v${DATA_VERSION}`} mono />
          <InfoCell label="Topics stored" value={`${totalTopics} records`} mono />
          <InfoCell label="Plan window" value={`${mediumDate(PLAN_START)} — ${mediumDate(PLAN_END)}`} />
          <InfoCell label="Auto-save" value="On every change (≈120 ms debounce)" />
          <InfoCell label="Last status" value={storageStatus.message} />
        </div>
        <p className="mt-4 flex items-start gap-2 text-2xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">
          <HardDrive size={12} className="mt-0.5 shrink-0" />
          Data stays on this device and this browser profile. Clearing site data, private browsing, or switching browsers
          will not carry progress over — export a JSON backup regularly. The preloaded schedule is compiled into the
          application code and can always be restored even after a reset.
        </p>
      </Card>

      {/* About */}
      <Card title="About MISSION 100">
        <div className="space-y-2 text-xs leading-relaxed text-ink-secondary dark:text-night-secondary">
          <p>
            <span className="font-medium text-ink dark:text-night-text">Mission 100</span> — 90 Days. Three Subjects.
            Total Execution. A personal study-management system for October 13, 2026 – January 10, 2027.
          </p>
          <p>
            Targets: KSEAB 2nd PUC Board Examination 2027, KCET 2027, JEE Main 2027. Subjects: Physics, Chemistry,
            Mathematics (Computer Science is intentionally excluded from the tracker).
          </p>
          <p className="text-ink-tertiary dark:text-night-tertiary">
            The preloaded schedule is the supplied study plan and is preserved exactly as provided. It is not a guarantee
            that every examination topic is covered. This application makes no claims about expected exam scores or rank.
          </p>
        </div>
      </Card>

      {/* Import confirm modal */}
      <Modal
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        title="Import backup?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPendingImport(null)}>
              Cancel
            </button>
            <button
              className="btn-accent"
              onClick={() => {
                if (!pendingImport) return;
                const result = parseImport(pendingImport.text);
                if (result.ok && result.data) {
                  const ok = importData(result.data);
                  notify(ok ? 'Backup imported successfully.' : 'Import failed while saving.', ok ? 'success' : 'error');
                } else {
                  notify('Import failed validation.', 'error');
                }
                setPendingImport(null);
              }}
            >
              Replace current data
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-ink-secondary dark:text-night-secondary">
          <p>
            <span className="font-medium text-ink dark:text-night-text">File:</span> {pendingImport?.name}
          </p>
          <p>
            This will replace your current progress with the contents of the backup. The file passed validation. If you
            are unsure, export a JSON backup of your current state first.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        danger
        title="Reset all progress?"
        message="Every completion state, note, confidence rating, revision session, and assessment score will be cleared. The 90-day schedule stays loaded and the interface returns to 0%. This cannot be undone unless you exported a backup."
        confirmLabel="Reset progress"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetProgress();
          notify('Progress reset — schedule intact.', 'success');
          setConfirmReset(false);
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        danger
        title="Erase all local data?"
        message="This deletes the stored data entirely and re-initializes the app from code. Equivalent to a first-time install."
        confirmLabel="Erase everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearStorage();
          clearAll();
          notify('Local data erased and re-initialized.', 'success');
          setConfirmClear(false);
        }}
      />

      <ConfirmDialog
        open={confirmRestore}
        title="Restore default schedule items?"
        message="Any missing schedule topics will be re-added with fresh state. Your existing completion status, notes, and revision history are preserved — nothing is wiped."
        confirmLabel="Restore schedule"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          restoreSchedule();
          notify('Schedule items restored — progress preserved.', 'success');
          setConfirmRestore(false);
        }}
      />
    </div>
  );
}

function ActionTile({
  icon,
  title,
  desc,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-line p-4 dark:border-night-line">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary dark:bg-night-raised dark:text-night-secondary">
        {icon}
      </div>
      <p className="mt-2.5 text-sm font-medium text-ink dark:text-night-text">{title}</p>
      <p className="mt-1 flex-1 text-2xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">{desc}</p>
      <button className="btn-primary mt-3 w-full" onClick={onClick}>
        <Download size={13} /> {label}
      </button>
    </div>
  );
}

function Row({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-4 py-3.5 dark:border-night-line">
      <div className="text-ink-tertiary dark:text-night-tertiary">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink dark:text-night-text">{title}</p>
        <p className="mt-0.5 text-2xs leading-relaxed text-ink-tertiary dark:text-night-tertiary">{desc}</p>
      </div>
      {action}
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-muted px-3.5 py-2.5 dark:bg-night">
      <p className="text-2xs font-medium uppercase tracking-wide text-ink-tertiary dark:text-night-tertiary">{label}</p>
      <p className={`mt-1 truncate text-xs text-ink dark:text-night-text ${mono ? 'font-mono tnum' : ''}`} title={value}>
        {value}
      </p>
    </div>
  );
}

void CheckCircle2;
void initialData;
void TOTAL_DAYS;
