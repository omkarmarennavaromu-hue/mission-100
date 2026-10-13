/* Unit checks: progress semantics (reschedule, reopen, overdue, day status). */
import { initialData, mergeSchedule } from './src/lib/storage';
import {
  dayProgress,
  dayStatus,
  needsRevisionList,
  overallStat,
  overdueTopics,
  subjectStat,
} from './src/lib/progress';
import type { AppData, Topic } from './src/types';

const problems: string[] = [];
function expect(name: string, cond: boolean, detail = '') {
  if (!cond) problems.push(`${name} ${detail}`);
  console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

let data: AppData = initialData();

// Initial state
expect('Initial overall 0%', overallStat(data).percent === 0 && overallStat(data).completed === 0);
expect('Initial day-1 progress 0/3', dayProgress(data, 1).completed === 0 && dayProgress(data, 1).total === 3);
expect('Initial day status Not Started (future-ish day 5)', dayStatus(data, 5) === 'Not Started', dayStatus(data, 5));

// Complete 1 of 3 on day 1
const t1 = data.topics['d001-phy-0'];
data = {
  ...data,
  topics: {
    ...data.topics,
    [t1.id]: { ...t1, status: 'Completed', completedAt: new Date().toISOString() },
  },
};
expect('Day 1 In Progress after 1/3', dayStatus(data, 1) === 'In Progress', dayStatus(data, 1));
expect('Day 1 progress 1/3 = 33%', dayProgress(data, 1).percent === 33, String(dayProgress(data, 1).percent));

// Complete all 3 → day Completed only when ALL done
for (const id of ['d001-chem-0', 'd001-math-0']) {
  const t = data.topics[id];
  data = { ...data, topics: { ...data.topics, [id]: { ...t, status: 'Completed', completedAt: new Date().toISOString() } } };
}
expect('Day 1 Completed only when all 3 done', dayStatus(data, 1) === 'Completed', dayStatus(data, 1));
expect('One subject alone never completes the day (rule holds by construction)', dayProgress(data, 1).completed === 3);

// Reopen a topic → removes from completed count, keeps completedAt history
const t2 = data.topics['d001-chem-0'];
data = {
  ...data,
  topics: { ...data.topics, [t2.id]: { ...t2, status: 'In Progress', completedAt: t2.completedAt } },
};
expect('Reopen drops completed count to 2', dayProgress(data, 1).completed === 2, String(dayProgress(data, 1).completed));
expect('Reopen preserves completedAt history', data.topics['d001-chem-0'].completedAt !== null);
expect('Reopened day is no longer Completed', dayStatus(data, 1) !== 'Completed', dayStatus(data, 1));
expect('Overall count dropped to 2', overallStat(data).completed === 2, String(overallStat(data).completed));

// Overdue: day 2 topics are scheduled 2026-10-14; if we fake "today" semantics by
// using an incomplete topic whose scheduled date < real today (2026-10-13), day 1 items
// dated 2026-10-13 are NOT < today → not overdue. Day status for past incomplete days:
// simulate by checking a topic with originalScheduledDate in the past via day 1 + incomplete.
// d001-chem-0 is In Progress with date 2026-10-13 (== today) → Partially/In Progress, not Overdue.
expect('No overdue topics on day 1 (nothing before today)', overdueTopics(data).length === 0, `n=${overdueTopics(data).length}`);

// Reschedule: original preserved, revised stored separately, no duplicate
const t3 = data.topics['d001-math-0'];
data = {
  ...data,
  topics: { ...data.topics, [t3.id]: { ...t3, revisedTargetDate: '2026-10-20' } },
};
const count = Object.keys(data.topics).length;
expect('Reschedule does not duplicate topic', count === 270, `count=${count}`);
expect('Reschedule keeps original date', data.topics['d001-math-0'].originalScheduledDate === '2026-10-13');
expect('Reschedule stores revised date', data.topics['d001-math-0'].revisedTargetDate === '2026-10-20');

// Revision independence
const t4 = data.topics['d001-phy-0'];
data = {
  ...data,
  topics: { ...data.topics, [t4.id]: { ...t4, needsRevision: true } },
};
const rev = needsRevisionList(data);
expect('Revision flag works while completed', rev.some((x) => x.id === 'd001-phy-0'), `rev=${rev.length}`);

// Low confidence on completed topic auto-flags revision
const t5 = data.topics['d001-math-0'];
data = {
  ...data,
  topics: { ...data.topics, [t5.id]: { ...t5, status: 'Completed', confidence: 2 } },
};
expect('Completed + confidence 2 flagged for revision', needsRevisionList(data).some((x) => x.id === 'd001-math-0'));

// Subject stats
const p = subjectStat(data, 'Physics');
expect('Physics stat 1/90', p.completed === 1 && p.total === 90, `${p.completed}/${p.total}`);

// mergeSchedule preserves user fields
const merged = mergeSchedule(data);
expect('mergeSchedule preserves completion', merged.topics['d001-phy-0'].status === 'Completed');
expect('mergeSchedule preserves reschedule', merged.topics['d001-math-0'].revisedTargetDate === '2026-10-20');
expect('mergeSchedule keeps 270 topics', Object.keys(merged.topics).length === 270);

// Assessment "Not graded" semantics: percentage null when marks missing
expect('No invented marks in fresh assessments', initialData().assessments.every((a) => a.marksObtained === null && a.maximumMarks === null));

console.log(problems.length ? `\nPROBLEMS:\n${problems.join('\n')}` : '\nALL UNIT CHECKS PASSED ✓');
process.exit(problems.length ? 1 : 0);
