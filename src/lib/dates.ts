/* Local-date utilities. All dates are stored as 'YYYY-MM-DD' strings and
   converted with local-time Date objects so nothing shifts across timezones. */

export const PLAN_START = '2026-10-13';
export const PLAN_END = '2027-01-10';
export const TOTAL_DAYS = 90;

/** Parse 'YYYY-MM-DD' into a local Date at midnight. */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a local Date as 'YYYY-MM-DD'. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's local date as 'YYYY-MM-DD'. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Add days to an ISO date string. */
export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Difference in whole days: b - a. */
export function diffDays(a: string, b: string): number {
  const ms = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(ms / 86400000);
}

/** Day number (1..90) for a date, or null when outside the plan window. */
export function dayNumberFor(iso: string): number | null {
  const n = diffDays(PLAN_START, iso) + 1;
  return n >= 1 && n <= TOTAL_DAYS ? n : null;
}

/** ISO date for a plan day number (1..90). */
export function dateForDay(dayNumber: number): string {
  return addDays(PLAN_START, dayNumber - 1);
}

export function isWithinPlan(iso: string): boolean {
  return iso >= PLAN_START && iso <= PLAN_END;
}

export interface MissionClock {
  mode: 'pre-start' | 'active' | 'post-end';
  currentDay: number | null; // 1..90 when active
  daysElapsed: number; // 0 before start
  daysRemaining: number; // 0 after end
  date: string;
}

export function missionClock(dateISO: string = todayISO()): MissionClock {
  if (dateISO < PLAN_START) {
    return {
      mode: 'pre-start',
      currentDay: null,
      daysElapsed: 0,
      daysRemaining: TOTAL_DAYS + diffDays(dateISO, PLAN_START),
      date: dateISO,
    };
  }
  if (dateISO > PLAN_END) {
    return {
      mode: 'post-end',
      currentDay: null,
      daysElapsed: TOTAL_DAYS,
      daysRemaining: 0,
      date: dateISO,
    };
  }
  const day = diffDays(PLAN_START, dateISO) + 1;
  return {
    mode: 'active',
    currentDay: day,
    daysElapsed: day,
    daysRemaining: TOTAL_DAYS - day,
    date: dateISO,
  };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function weekdayName(iso: string): string {
  return WEEKDAYS[parseDate(iso).getDay()];
}

export function monthName(iso: string): string {
  return MONTHS[parseDate(iso).getMonth()];
}

/** e.g. "Tuesday, October 13" */
export function longDayLabel(iso: string): string {
  const d = parseDate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** e.g. "October 13, 2026" */
export function mediumDate(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** e.g. "Oct 13" */
export function shortDate(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** e.g. "13 Oct 2026, 4:30 PM" */
export function formatDateTime(isoDateTime: string | null): string {
  if (!isoDateTime) return '—';
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '—';
  const date = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${date}, ${h}:${min} ${ampm}`;
}

/** Month sections of the roadmap in plan order. */
export function monthSections(): { label: string; year: number; monthIndex: number; fromDay: number; toDay: number }[] {
  return [
    { label: 'October 2026', year: 2026, monthIndex: 9, fromDay: 1, toDay: 19 },
    { label: 'November 2026', year: 2026, monthIndex: 10, fromDay: 20, toDay: 49 },
    { label: 'December 2026', year: 2026, monthIndex: 11, fromDay: 50, toDay: 80 },
    { label: 'January 2027', year: 2027, monthIndex: 0, fromDay: 81, toDay: 90 },
  ];
}

/** Weekday index (0=Sun) of Oct 13, 2026 — used for heatmap columns. */
export function weekdayOfPlanStart(): number {
  return parseDate(PLAN_START).getDay();
}
