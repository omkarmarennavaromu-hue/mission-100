# MISSION 100 — Academic Command Center

**90 Days. Three Subjects. Total Execution.**

A personal, offline-first study-management application for **October 13, 2026 – January 10, 2027**
(90 calendar days · Physics · Chemistry · Mathematics).
Targets: **KSEAB 2nd PUC Board Examination 2027 · KCET 2027 · JEE Main 2027**.

---

## How to run

```bash
cd mission-100
npm install        # first time only
npm run dev        # development server → http://localhost:5173
```

Production build & preview:

```bash
npm run build      # outputs static site to dist/
npm run preview    # serves dist/ on http://localhost:4173
```

No backend, no accounts, no API keys. After the app loads, it works without internet.

---

## What is implemented

### 1. Preloaded 90-day syllabus (source of truth)
- All **90 days × 3 subjects = 270 topic records** are transcribed **exactly** from the supplied
  schedule — titles, dates, and sequence preserved verbatim (`src/data/syllabus.ts`).
- Dates: Oct 13–31 (Days 1–19), Nov 1–30 (Days 20–49), Dec 1–31 (Days 50–80), Jan 1–10 (Days 81–90).
- Task types auto-classified for display only: Concept (205), Practice (13), Revision (12), Test (40).
- The schedule is the supplied study plan; it is **not** claimed to be verified against any
  examination syllabus. Computer Science is intentionally excluded.
- Nothing is overwritten on reload — existing user progress is preserved and schedule gaps can be
  restored without wiping progress.

### 2. Application layout
- Collapsible desktop sidebar: Overview · Today's Plan · 90-Day Roadmap · All Topics ·
  Revision Center · Tests & Assessments · Analytics · Settings.
- Sidebar: wordmark, active-plan status indicator, compact overall-progress bar, theme toggle,
  export/backup, settings.
- Main header: current date, live study day (Day N/90), dynamic greeting, daily + mission progress.
- Mobile: drawer menu + bottom navigation (Overview, Today, Roadmap, Topics, Analytics).

### 3. Overview dashboard
- Mission header with countdown and honest pre-start / active / past-deadline states
  (never shows < Day 1 or > Day 90).
- Key metrics calculated from stored data: overall %, Physics %, Chemistry %, Mathematics %,
  topics needing revision, tests completed + average score **when grades exist**.
- Today's progress checklist (checkbox, subject, title, status, detail panel) with
  completed / remaining / daily %.
- Today's focus panel (per-subject focus + single daily note).
- Analytics preview: 90-day cumulative chart (planned vs actual), subject comparison,
  activity heatmap, consistency streaks — all data-driven with honest empty states.

### 4. 90-Day Roadmap
- Full timeline with month sections, expandable day rows (day number, date + weekday, day %,
  per-subject states, calculated day status: Not Started / In Progress / Completed /
  Partially Complete / Overdue).
- A day counts as Completed **only** when all its scheduled items are complete.
- Search by topic, subject filter, status filter (incl. “incomplete only” and
  “revision-needed only”), month jump, jump-to-today, list **and** calendar views.
- Past incomplete topics remain visible and accessible forever.

### 5. All Topics database
- Every topic is an individual record: stable ID, day, date, subject, chapter, title, task type,
  status, completion timestamp, confidence (1–4), revision flag, notes, actual study duration,
  rescheduled date.
- Statuses: Not Started → In Progress → Completed, plus Needs Revision; reopen supported.
- Sortable columns, search, quick filters (incomplete / completed / revision queue /
  low confidence / unrated), bulk actions, detail panel with notes, confidence, duration,
  reschedule, revision history.
- Completion = finished the planned session; it is **not** a mastery claim. Completed topics
  with confidence ≤ 2 are auto-flagged for revision.

### 6. Daily study workflow
- Today's Plan shows only the current day's tasks (browse other days via the roadmap).
- Status cycle Not Started → In Progress → Completed with one-click checkboxes;
  revision flag independent of completion.
- Every state change updates all progress, persists immediately (debounced localStorage write),
  and never duplicates records.
- Daily notes (What I learned / struggled with / revisit tomorrow), editable later.

### 7. Revision Center
- Auto-collects: topics marked Needs Revision, topics with confidence 1–2, and (optionally)
  completed topics with no revision session. Completed topics are never auto-called weak.
- Each item shows subject, topic, original date, revision reason, last revision date,
  revision count, current confidence.
- Workflow: open topic → record revision session (date, notes, confidence after) →
  mark revision complete (confidence ≥ 3 clears the flag) or schedule another.
- Revision history is stored separately from original completion.

### 8. Tests & Assessments
- 40 test-type tasks from the schedule are preloaded as assessment records linked to their
  scheduled checklist item. Completing the task and entering a score are separate actions.
- No scores or maximum marks are invented — ungraded entries show **“Not graded”**, never 0%.
- Fields: name, date, subject, status (Upcoming / Completed / Missed), max marks, marks obtained,
  %, mistakes/weak areas, next action. Custom assessments can be added/deleted.
- With grades: individual scores, subject averages, score trend over time, weak-subject
  averages (once ≥ 3 graded tests exist).

### 9. Analytics (Charts A–F + insights)
- **A** Cumulative progress: planned (schedule-cumulative) vs actual (completion-timestamp-cumulative),
  with an explanation of the difference; late completions count late.
- **B** Subject performance: grouped bars + per-subject progress lines.
- **C** 90-day activity heatmap from recorded completion timestamps (zero-activity days stay
  unshaded; legend + tooltips).
- **D** Weekly completed topics by subject (plan weeks; week 13 = days 85–90).
- **E** Test-score trend from real grades only — stays empty rather than fabricating data.
- **F** Completion distribution (Not Started / In Progress / Completed / Needs Revision).
- Insight panel generated strictly from stored records (e.g. subject lead/lag, unfinished
  overdue topics, revision counts by subject, no-grades notice). **No predictions** of marks,
  rank, or success probability.

### 10. Catch-Up Mode
- Shows overdue incomplete topics, today's schedule, total backlog, backlog by subject.
- Manual rescheduling stores a **separate revised target date** while the original scheduled date
  and roadmap position are preserved; topics are never duplicated and future tasks never move
  automatically.
- Suggested catch-up queue ordered by (1) oldest overdue, (2) subject balance, (3) upcoming
  tests — transparent and editable.

### 11. Data model & persistence
- Entities: Plan, Day, Topic, RevisionSession, Assessment, StudySession, Settings
  (`src/types.ts`). Stable IDs (`d001-phy-0`-style) as keys; dates stored `YYYY-MM-DD` and
  parsed in local time (no UTC date-shift bugs).
- Versioned storage (`mission100-data`, `dataVersion: 1`) with validation + safe migration on
  load; corrupt storage re-initializes without crashing and says so honestly.

### 12. Import / export / safety
- Export full JSON backup; import JSON backup **after structural validation** (invalid files are
  rejected and current data is never touched).
- CSV export of topic report (270 records, 16 columns) and assessment results.
- Restore default schedule **without** erasing progress; reset all progress and erase-all
  actions require explicit confirmation dialogs.
- Settings show storage engine, key, approximate size, data version, auto-save status.
- Honest toasts: success is only reported when the operation actually succeeded.

### 13. Visual design
- Restrained Notion/Linear-inspired command center: off-white surfaces, near-black text,
  one electric-blue accent, thin dividers, compact cards, subtle transitions, monospaced
  tabular numerals for stats/countdowns, optional dark mode, responsive desktop/tablet/mobile.

---

## What was tested

Automated suites in this repo (Playwright + unit checks):

```bash
npx tsx check-schedule.ts   # 90-day syllabus integrity (90 days, 270 topics, exact dates & titles)
npx tsx unit-check.ts       # 22 progress-semantics checks (reschedule/reopen/overdue/revision rules)
npx tsx e2e-test.ts         # 63 browser end-to-end checks (requires dev server running)
```

**Latest results: schedule integrity ALL PASSED · 22/22 unit checks · 63/63 E2E checks.**

E2E coverage includes: first-load schedule, 0% initial state, day-1 clock, roadmap dates
(Oct 13/31, Nov 1), three topics per day, checkbox → all progress indicators, persistence after
refresh, topic detail workflow, confidence + revision flags, revision queue collection, search,
status filters, empty states, grading + “Not graded”, score trend, analytics insights,
JSON export/import round-trip, invalid-import rejection without data loss, CSV (271 lines),
theme toggle, reset confirmation + cancel, reset keeps schedule, restore schedule preserves
progress, catch-up mode, mobile drawer + bottom nav, zero fatal console errors, and all routes.

---

## Remaining limitations

- Storage is per-browser-profile localStorage (export JSON to move data between devices).
- `StudySession` records exist in the model; duration is captured on the topic itself —
  separate timed study sessions are not logged.
- Notification preferences are not implemented (no notification backend by design).
- The calendar roadmap view shows one month at a time (month selector), not a full quarter grid.
- Charts are day/week-granular; there is no hourly activity tracking.
- The plan window is fixed to Oct 13, 2026 – Jan 10, 2027 by design.

## How progress is stored and backed up

- **Stored:** browser `localStorage` under the key `mission100-data`, written automatically
  ~120 ms after every change; restored on load; migrated forward when the data model version changes.
- **Backed up:** Settings → *Export JSON backup* (full snapshot). CSV reports can be exported at
  any time. Import restores a snapshot after validation. The compiled schedule itself lives in
  `src/data/syllabus.ts` and can always be re-seeded via “Restore default schedule” or
  “Reset all progress” without losing what you choose to keep.

---

*The preloaded schedule is the supplied study plan and is preserved exactly as provided. It is
not a guarantee that every examination topic is covered. This application makes no claims about
expected exam scores or rank.*
