/* Visual QA screenshots */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1200);

  // seed a little progress so charts/heatmaps are visible
  await page.evaluate(() => {
    const raw = localStorage.getItem('mission100-data');
    if (!raw) return;
    const data = JSON.parse(raw);
    let completed = 0;
    const now = Date.now();
    for (const t of Object.values(data.topics) as any[]) {
      if (completed >= 34) break;
      t.status = 'Completed';
      t.completedAt = new Date(now - completed * 3600e3 * 7).toISOString();
      t.confidence = completed % 5 === 0 ? 2 : 3;
      if (t.confidence === 2) t.needsRevision = true;
      completed++;
    }
    data.assessments[0].marksObtained = 17;
    data.assessments[0].maximumMarks = 20;
    data.assessments[0].status = 'Completed';
    data.revisionSessions.push({
      id: 'rv-x', topicId: Object.keys(data.topics)[3], revisionDate: '2026-10-13',
      confidenceBefore: 2, confidenceAfter: 3, notes: 'Revised definitions.',
    });
    localStorage.setItem('mission100-data', JSON.stringify(data));
  });
  await page.reload();
  await page.waitForTimeout(1200);

  await page.screenshot({ path: 'shots/01-overview.png', fullPage: true });

  await page.click('a[href="#/today"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/02-today.png', fullPage: true });

  await page.click('a[href="#/roadmap"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/03-roadmap.png', fullPage: false });

  await page.click('a[href="#/topics"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/04-topics.png', fullPage: false });

  await page.click('a[href="#/revision"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/05-revision.png', fullPage: true });

  await page.click('a[href="#/tests"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/06-tests.png', fullPage: false });

  await page.click('a[href="#/analytics"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shots/07-analytics.png', fullPage: true });

  await page.click('a[href="#/settings"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/08-settings.png', fullPage: true });

  // dark mode overview
  await page.locator('aside button:has-text("Dark mode")').click();
  await page.waitForTimeout(400);
  await page.click('a[href="#/"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'shots/09-dark-overview.png', fullPage: true });
  await page.locator('aside button:has-text("Light mode")').click();
  await page.waitForTimeout(300);

  // mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shots/10-mobile-overview.png', fullPage: false });
  await page.click('a[href="#/today"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shots/11-mobile-today.png', fullPage: false });

  await browser.close();
  console.log('screenshots saved to shots/');
}

main();
