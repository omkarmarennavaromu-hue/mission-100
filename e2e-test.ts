/* MISSION 100 — end-to-end functional test (run: npx tsx e2e-test.ts) */
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

const BASE = 'http://localhost:5173/';
const results: { name: string; ok: boolean; detail: string }[] = [];
let page: Page;
let browser: Browser;

function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const consoleErrors: string[] = [];
const pageErrors: string[] = [];

async function run() {
  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // Clear storage for a fresh install
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(800);

  // ── 1. App loads with preloaded schedule ─────────────────────────────
  const title = await page.title();
  check('App loads with title', title.includes('MISSION 100'), title);

  const missionHeader = await page.locator('text=MISSION 100').first().isVisible();
  check('Mission header visible on Overview', missionHeader);

  const day1 = await page.locator('text=/Day 0?1 \\/ 90/').first().isVisible().catch(() => false);
  check('Current study day shows Day 1 / 90 (today is Oct 13, 2026)', day1);

  // ── 2. Initial 0% completion ─────────────────────────────────────────
  const overallText = await page.locator('text=Overall completion').locator('..').innerText();
  check('Initial overall completion is 0%', overallText.includes('0%'), overallText.replace(/\n/g, ' | '));

  // ── 3. Roadmap: 90 days, correct dates, 3 topics/day ─────────────────
  await page.click('a[href="#/roadmap"]');
  await page.waitForTimeout(500);
  const dayRows = await page.locator('[id^="roadmap-day-"]').count();
  check('Roadmap renders 90 day rows (list view)', dayRows === 90, `found ${dayRows}`);

  const d1Text = await page.locator('#roadmap-day-1').innerText();
  check('Day 1 shows Tuesday, October 13', d1Text.includes('Tuesday, October 13'), d1Text.split('\n')[0]);
  const d19Text = await page.locator('#roadmap-day-19').innerText();
  check('Day 19 shows Friday, October 31', d19Text.includes('October 31'), d19Text.split('\n')[0]);
  const d20Text = await page.locator('#roadmap-day-20').innerText();
  check('Day 20 shows Sunday, November 1', d20Text.includes('November 1'), d20Text.split('\n')[0]);

  // Expand day 1 and verify 3 subject topics
  await page.locator('#roadmap-day-1 button').first().click();
  await page.waitForTimeout(300);
  const d1Expanded = await page.locator('#roadmap-day-1').innerText();
  check('Day 1 expands with Physics topic', d1Expanded.includes('Electric charge basics'));
  check('Day 1 expands with Chemistry topic', d1Expanded.includes('Solutions: basics'));
  check('Day 1 expands with Mathematics topic', d1Expanded.includes('Relations: basics'));
  check('Day 1 shows PHY/CHEM/MATH markers', d1Expanded.includes('PHY') && d1Expanded.includes('CHEM') && d1Expanded.includes('MATH'));

  // ── 4. Check a topic → progress updates ──────────────────────────────
  const firstCheckboxLabel = page.locator('#roadmap-day-1 label:has(input[type="checkbox"])').first();
  await firstCheckboxLabel.scrollIntoViewIfNeeded();
  await firstCheckboxLabel.click();
  await page.waitForTimeout(400);
  const d1After = await page.locator('#roadmap-day-1').innerText();
  check('Checking a topic updates day progress (1/1 subject, 33% day)', /1\/1/.test(d1After) && d1After.includes('33%'), d1After.split('\n').slice(0, 5).join(' | '));

  await page.click('a[href="#/"]');
  await page.waitForTimeout(500);
  const overviewAfter = await page.locator('text=Overall completion').locator('..').innerText();
  check('Overview overall completion updated after check (1/270)', overviewAfter.includes('0%') && overviewAfter.includes('1 / 270'), overviewAfter.replace(/\n/g, ' | '));

  const physText = await page.locator('text=Physics').first().locator('..').innerText().catch(() => '');
  const sidebarText = await page.locator('aside').innerText();
  check('Sidebar overall progress shows 1/270', sidebarText.includes('1/270'), sidebarText.split('\n').slice(0, 8).join(' '));

  // ── 5. Persistence after refresh ─────────────────────────────────────
  await page.reload();
  await page.waitForTimeout(700);
  const sidebarAfterReload = await page.locator('aside').innerText();
  check('Progress survives refresh (1/270 still there)', sidebarAfterReload.includes('1/270'), sidebarAfterReload.split('\n').slice(0, 8).join(' '));

  // ── 6. Today's Plan workflow ─────────────────────────────────────────
  await page.click('a[href="#/today"]');
  await page.waitForTimeout(500);
  const todayText = await page.locator('main').innerText();
  check("Today's Plan shows Day 01", todayText.includes('Day 01') || todayText.includes('Day 1'), todayText.split('\n')[0]);
  check('Daily notes area present', todayText.includes('What I learned'));

  // Mark topic In Progress via detail panel
  await page.locator('main button:has-text("Solutions: basics")').first().click();
  await page.waitForTimeout(400);
  const panelVisible = await page.locator('text=Confidence').first().isVisible();
  check('Topic detail panel opens with confidence picker', panelVisible);

  // Set confidence to 2 → should flag for revision when completed
  await page.locator('button[title^="2 —"]').click();
  await page.waitForTimeout(200);
  // Mark Needs Revision
  await page.locator('button:has-text("Needs Revision")').click();
  await page.waitForTimeout(200);
  // Record a revision session
  await page.locator('button:has-text("Record revision")').click();
  await page.waitForTimeout(200);
  await page.locator('button:has-text("Save revision session")').click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── 7. Revision Center collects the topic ────────────────────────────
  await page.click('a[href="#/revision"]');
  await page.waitForTimeout(500);
  const revText = await page.locator('main').innerText();
  check('Revision Center shows flagged topic', revText.includes('Solutions: basics'), revText.slice(0, 200).replace(/\n/g, ' | '));
  check('Revision reason displayed', revText.includes('Needs Revision') || revText.includes('Confidence 1–2'));

  // ── 8. All Topics: search + filters ──────────────────────────────────
  await page.click('a[href="#/topics"]');
  await page.waitForTimeout(500);
  const topicsHeader = await page.locator('main').innerText();
  check('All Topics shows 270 records', topicsHeader.includes('270'), '');

  await page.fill('input[placeholder*="Search topic"]', 'Gauss');
  await page.waitForTimeout(400);
  let rows = await page.locator('tbody tr').count();
  check('Search "Gauss" returns matching topics only', rows >= 2 && rows <= 4, `rows=${rows}`);
  const gaussText = await page.locator('tbody').innerText();
  check('Search results contain Gauss topics', gaussText.includes("Gauss"), gaussText.slice(0, 120).replace(/\n/g, ' | '));

  await page.fill('input[placeholder*="Search topic"]', 'zzzznotfound');
  await page.waitForTimeout(400);
  const emptyText = await page.locator('main').innerText();
  check('Empty state shows for no matches', emptyText.includes('No topics match'));
  await page.click('button:has-text("Clear")');
  await page.waitForTimeout(300);

  // Status filter
  await page.selectOption('select[aria-label="Status filter"]', 'Needs Revision');
  await page.waitForTimeout(400);
  const filterText = await page.locator('main').innerText();
  const filteredRows = await page.locator('tbody tr').count();
  check('Status filter "Needs Revision" works', filteredRows >= 1, `rows=${filteredRows}`);
  await page.click('button:has-text("Clear")').catch(() => {});
  await page.waitForTimeout(200);

  // ── 9. Tests & Assessments: grading ──────────────────────────────────
  await page.click('a[href="#/tests"]');
  await page.waitForTimeout(500);
  const testsText = await page.locator('main').innerText();
  check('Tests page shows preloaded scheduled tests', testsText.includes('Chapter 1 test'), testsText.slice(0, 150).replace(/\n/g, ' | '));
  check('Ungraded tests show "Not graded"', testsText.includes('Not graded'));

  // Enter a score
  await page.locator('button:has-text("Enter score")').first().click();
  await page.waitForTimeout(400);
  await page.locator('input[placeholder="Leave empty if not graded"]').first().fill('17');
  await page.locator('input[placeholder="Leave empty if unknown"]').fill('20');
  await page.locator('textarea[placeholder*="Which questions"]').fill('Lost marks on sign convention');
  await page.locator('button:has-text("Save")').click();
  await page.waitForTimeout(500);
  const gradedText = await page.locator('main').innerText();
  check('Score saved and percentage computed (85%)', gradedText.includes('85%'), gradedText.slice(0, 150).replace(/\n/g, ' | '));
  check('Score trend chart appears with graded data', await page.locator('text=Score trend over time').isVisible());

  // ── 10. Analytics insights are data-derived ──────────────────────────
  await page.click('a[href="#/analytics"]');
  await page.waitForTimeout(700);
  const analyticsText = await page.locator('main').innerText();
  check('Analytics insight panel present', analyticsText.includes('Insight panel'));
  check('Insights mention actual data (1 topic / revision count)', analyticsText.includes('revision') || analyticsText.includes('Chemistry') || analyticsText.includes('Physics'));
  check('No fabricated predictions (no "rank" or "will score")', !/you will (score|get|secure)|predict(ed)? rank/i.test(analyticsText));
  check('Chart A explains planned vs actual', analyticsText.includes('planned') && analyticsText.includes('actual'));

  // ── 11. JSON export / import ─────────────────────────────────────────
  await page.click('a[href="#/settings"]');
  await page.waitForTimeout(500);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download JSON")'),
  ]);
  const jsonPath = '/tmp/mission100-backup.json';
  await download.saveAs(jsonPath);
  const backup = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  check('JSON backup downloads with topics', Object.keys(backup.topics).length === 270, `topics=${Object.keys(backup.topics).length}`);
  check('JSON backup preserves completion state', Object.values(backup.topics).some((t: any) => t.status === 'Completed'));
  check('JSON backup includes revision sessions', Array.isArray(backup.revisionSessions) && backup.revisionSessions.length >= 1);

  // CSV export
  const [csvDl] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download CSV")'),
  ]);
  const csvPath = '/tmp/mission100-topics.csv';
  await csvDl.saveAs(csvPath);
  const csv = fs.readFileSync(csvPath, 'utf8');
  const csvLines = csv.trim().split('\n');
  check('CSV export has 271 lines (header + 270 topics)', csvLines.length === 271, `lines=${csvLines.length}`);
  check('CSV header includes Topic ID and Status', csvLines[0].includes('Topic ID') && csvLines[0].includes('Status'));

  // Import invalid file → rejected safely
  fs.writeFileSync('/tmp/invalid.json', '{"not": "valid app data"}');
  await page.setInputFiles('input[type="file"]', '/tmp/invalid.json');
  await page.waitForTimeout(500);
  const settingsText = await page.locator('main').innerText();
  check('Invalid import rejected with error message', settingsText.includes('Import rejected'), settingsText.slice(settingsText.indexOf('Import rejected'), settingsText.indexOf('Import rejected') + 120).replace(/\n/g, ' '));
  const dataAfterBadImport = await page.evaluate(() => localStorage.getItem('mission100-data')?.length ?? 0);
  check('Current data untouched after invalid import', dataAfterBadImport > 1000, `storage bytes≈${dataAfterBadImport}`);

  // Valid import round-trip
  await page.setInputFiles('input[type="file"]', jsonPath);
  await page.waitForTimeout(400);
  await page.click('button:has-text("Replace current data")');
  await page.waitForTimeout(600);
  const afterImport = await page.locator('aside').innerText();
  check('Valid import restores progress', afterImport.includes('1/270'), afterImport.split('\n').slice(0, 6).join(' '));

  // ── 12. Theme toggle ─────────────────────────────────────────────────
  const isDarkBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.locator('aside button:has-text("Dark mode")').click();
  await page.waitForTimeout(300);
  const isDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  check('Theme toggle switches to dark', isDarkBefore !== isDarkAfter, `before=${isDarkBefore} after=${isDarkAfter}`);
  await page.locator('aside button:has-text("Light mode")').click();
  await page.waitForTimeout(300);

  // ── 13. Reset progress with confirmation ─────────────────────────────
  await page.click('button:has-text("Reset progress")');
  await page.waitForTimeout(300);
  const confirmVisible = await page.locator('text=Reset all progress?').isVisible();
  check('Reset requires confirmation dialog', confirmVisible);
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(300);
  let asideNow = await page.locator('aside').innerText();
  check('Cancel keeps progress', asideNow.includes('1/270'), '');

  await page.click('button:has-text("Reset progress")');
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Reset progress")').nth(1).click();
  await page.waitForTimeout(600);
  asideNow = await page.locator('aside').innerText();
  check('Reset returns to 0% with schedule intact', asideNow.includes('0/270'), asideNow.split('\n').slice(0, 6).join(' '));

  // Schedule still complete after reset
  await page.click('a[href="#/roadmap"]');
  await page.waitForTimeout(500);
  const rowsAfterReset = await page.locator('[id^="roadmap-day-"]').count();
  check('Schedule intact after reset (90 days)', rowsAfterReset === 90, `rows=${rowsAfterReset}`);

  // ── 14. Restore schedule preserves progress ──────────────────────────
  // complete a topic first
  await page.locator('#roadmap-day-1 button').first().click();
  await page.waitForTimeout(300);
  const cbLabel = page.locator('#roadmap-day-1 label:has(input[type="checkbox"])').first();
  await cbLabel.scrollIntoViewIfNeeded();
  await cbLabel.click();
  await page.waitForTimeout(400);
  await page.click('a[href="#/settings"]');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Restore schedule")');
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Restore schedule")').nth(1).click();
  await page.waitForTimeout(600);
  asideNow = await page.locator('aside').innerText();
  check('Restore schedule preserves progress (1/270 kept)', asideNow.includes('1/270'), asideNow.split('\n').slice(0, 6).join(' '));

  // ── 15. Catch-up mode ────────────────────────────────────────────────
  await page.click('a[href="#/today"]');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Catch-Up Mode")');
  await page.waitForTimeout(400);
  const catchupText = await page.locator('main').innerText();
  check('Catch-Up Mode shows backlog metrics', /OVERDUE INCOMPLETE/i.test(catchupText) && /TOTAL BACKLOG/i.test(catchupText));
  check('Catch-Up explains original dates preserved', catchupText.includes('never alters the original') || catchupText.includes('original 90-day schedule'));

  // ── 16. Mobile responsive ────────────────────────────────────────────
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const bottomNav = await page.locator('nav').last().isVisible();
  const hamburger = await page.locator('button[aria-label="Open menu"]').isVisible();
  check('Mobile bottom nav visible at 390px', bottomNav);
  check('Mobile menu button visible at 390px', hamburger);
  await page.locator('button[aria-label="Open menu"]').click();
  await page.waitForTimeout(400);
  const drawer = await page.locator('div[role="dialog"] >> text=All Topics').first().isVisible();
  check('Mobile drawer opens with navigation', drawer);
  await page.locator('div[role="dialog"] button[aria-label="Close menu"]').click();
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // ── 17. Console errors ───────────────────────────────────────────────
  const benign = consoleErrors.filter((e) => !/Download the React DevTools|recharts|ResizeObserver/i.test(e));
  check('No fatal console errors', benign.length === 0, benign.slice(0, 3).join(' | '));
  check('No uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

  // ── 18. No inert nav controls ────────────────────────────────────────
  for (const href of ['#/today', '#/topics', '#/revision', '#/tests', '#/analytics', '#/settings', '#/roadmap', '#/']) {
    await page.click(`a[href="${href}"]`);
    await page.waitForTimeout(250);
    const mainLen = (await page.locator('main').innerText()).length;
    check(`Route ${href} renders content`, mainLen > 80, `${mainLen} chars`);
  }

  await browser.close();

  // Summary
  const failed = results.filter((r) => !r.ok);
  console.log('\n══════════════════════════════════');
  console.log(`TOTAL: ${results.length}  PASSED: ${results.length - failed.length}  FAILED: ${failed.length}`);
  if (failed.length) {
    console.log('\nFAILURES:');
    failed.forEach((f) => console.log(` ✗ ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log('ALL E2E CHECKS PASSED ✓');
}

run().catch((e) => {
  console.error('E2E runner crashed:', e);
  process.exit(1);
});
