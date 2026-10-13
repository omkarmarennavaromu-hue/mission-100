/* Quick integrity check for the preloaded schedule (run with tsx or via vite-node). */
import { buildSchedule, buildScheduledAssessments, SCHEDULE_META } from './src/data/syllabus';
import { dateForDay, longDayLabel, dayNumberFor, missionClock, parseDate, toISODate } from './src/lib/dates';

const { topics, days } = buildSchedule();
const topicList = Object.values(topics);
const problems: string[] = [];

// 1. Exactly 90 days
if (Object.keys(days).length !== 90) problems.push(`days=${Object.keys(days).length}, expected 90`);
if (SCHEDULE_META.dayCount !== 90) problems.push(`SCHEDULE_META.dayCount=${SCHEDULE_META.dayCount}`);

// 2. Exactly 270 topics, 3 per day
if (topicList.length !== 270) problems.push(`topics=${topicList.length}, expected 270`);
for (let d = 1; d <= 90; d++) {
  const dayTopics = topicList.filter((t) => t.dayNumber === d);
  if (dayTopics.length !== 3) problems.push(`day ${d} has ${dayTopics.length} topics`);
  const subs = new Set(dayTopics.map((t) => t.subject));
  if (subs.size !== 3) problems.push(`day ${d} subjects=${[...subs].join(',')}`);
  const expectedDate = dateForDay(d);
  if (days[String(d)].date !== expectedDate) problems.push(`day ${d} date ${days[String(d)].date} != ${expectedDate}`);
  for (const t of dayTopics) {
    if (t.originalScheduledDate !== expectedDate) problems.push(`topic ${t.id} date mismatch`);
  }
}

// 3. Spot-check key dates from the spec
const expect: [number, string][] = [
  [1, '2026-10-13'], [19, '2026-10-31'], [20, '2026-11-01'], [49, '2026-11-30'],
  [50, '2026-12-01'], [80, '2026-12-31'], [81, '2027-01-01'], [90, '2027-01-10'],
];
for (const [d, iso] of expect) {
  if (days[String(d)].date !== iso) problems.push(`Day ${d} should be ${iso}, got ${days[String(d)].date}`);
}

// 4. Spot-check topic titles from the spec
const expectTitles: [number, string, string][] = [
  [1, 'Physics', 'Electric charge basics'],
  [1, 'Chemistry', 'Solutions: basics'],
  [1, 'Mathematics', 'Relations: basics'],
  [3, 'Physics', "Coulomb's law"],
  [12, 'Physics', 'Chapter 1 test'],
  [35, 'Physics', 'Biot–Savart law'],
  [73, 'Mathematics', 'Direction cosines'],
  [80, 'Physics', "Atoms: Bohr's model"],
  [90, 'Physics', 'Full Physics revision test'],
  [90, 'Chemistry', 'Chemistry error correction'],
  [90, 'Mathematics', 'Mathematics revision test'],
];
for (const [d, subj, title] of expectTitles) {
  const t = topicList.find((x) => x.dayNumber === d && x.subject === subj);
  if (!t) problems.push(`missing topic d${d} ${subj}`);
  else if (t.title !== title) problems.push(`d${d} ${subj}: got "${t.title}", expected "${title}"`);
}

// 5. Task-type detection
const tests = topicList.filter((t) => t.taskType === 'Test');
const revisions = topicList.filter((t) => t.taskType === 'Revision');
const practices = topicList.filter((t) => t.taskType === 'Practice');
if (tests.length === 0) problems.push('no Test-type tasks detected');
const fullRevTest = topicList.find((t) => t.title === 'Full Physics revision test');
if (fullRevTest?.taskType !== 'Test') problems.push(`Full Physics revision test typed as ${fullRevTest?.taskType}`);

// 6. Assessments
const assessments = buildScheduledAssessments(topics);
if (assessments.length !== tests.length) problems.push(`assessments=${assessments.length} vs test tasks=${tests.length}`);
if (assessments.some((a) => a.maximumMarks !== null || a.marksObtained !== null)) problems.push('invented scores detected!');

// 7. Clock behavior
const pre = missionClock('2026-10-12');
const d1 = missionClock('2026-10-13');
const d90 = missionClock('2027-01-10');
const post = missionClock('2027-01-11');
if (pre.mode !== 'pre-start') problems.push('clock pre-start broken');
if (d1.mode !== 'active' || d1.currentDay !== 1) problems.push(`day1 clock: ${JSON.stringify(d1)}`);
if (d90.mode !== 'active' || d90.currentDay !== 90) problems.push(`day90 clock: ${JSON.stringify(d90)}`);
if (post.mode !== 'post-end') problems.push('clock post-end broken');
if (d90.daysRemaining !== 0) problems.push('day90 daysRemaining != 0');

// 8. Date parse/format round-trip (no UTC shift)
const rt = toISODate(parseDate('2026-10-13'));
if (rt !== '2026-10-13') problems.push(`date round-trip: ${rt}`);
if (dayNumberFor('2026-10-13') !== 1) problems.push('dayNumberFor(2026-10-13) != 1');
if (dayNumberFor('2027-01-10') !== 90) problems.push('dayNumberFor(2027-01-10) != 90');

// 9. Weekday labels
if (longDayLabel('2026-10-13') !== 'Tuesday, October 13') problems.push(`weekday label: ${longDayLabel('2026-10-13')}`);

console.log('=== MISSION 100 schedule integrity ===');
console.log(`Days: ${Object.keys(days).length}, Topics: ${topicList.length}`);
console.log(`Task types — Test: ${tests.length}, Revision: ${revisions.length}, Practice: ${practices.length}, Concept: ${topicList.length - tests.length - revisions.length - practices.length}`);
console.log(`Scheduled assessments: ${assessments.length}`);
console.log(`Day 1: ${longDayLabel('2026-10-13')} → Day 90: ${longDayLabel('2027-01-10')}`);
console.log(`Clock today (2026-10-13): ${JSON.stringify(missionClock('2026-10-13'))}`);
if (problems.length) {
  console.log('PROBLEMS:');
  problems.forEach((p) => console.log(' -', p));
  process.exit(1);
} else {
  console.log('ALL CHECKS PASSED ✓');
}
