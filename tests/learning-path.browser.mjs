import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { BASE_URL as base } from './browser.config.mjs';
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base);
  await page.locator('#open-learning-path').click();
  await page.locator('#primer-INTRO').waitFor();
  assert.equal(await page.locator('h1').count(), 1);
  await page.locator('.lesson-glossary summary').click();
  assert.equal(await page.locator('.lesson-glossary dt').count(), 3);
  assert.equal(await page.locator('#complete-INTRO').isDisabled(), true);
  for (let i = 0; i < 3; i++) await page.locator(`#answer-INTRO-${i}-${(i+1)%3}`).check();
  await page.locator('#submit-quiz-INTRO').click();
  assert.equal(await page.locator('.quiz-feedback').count(), 3);
  assert.equal(await page.locator('.quiz-feedback.correct').count(), 0);
  for (let i = 0; i < 3; i++) await page.locator(`#answer-INTRO-${i}-${i}`).check();
  await page.locator('#submit-quiz-INTRO').click();
  assert.equal(await page.locator('.quiz-feedback.correct').count(), 3);
  assert.equal(await page.locator('#complete-INTRO').isDisabled(), true);
  for (let i = 0; i < 4; i++) await page.locator(`#journal-INTRO-${i}`).fill(`Nhận xét có bằng chứng ${i+1}`);
  await page.locator('#save-journal-INTRO').click();
  await page.locator('#complete-INTRO').click();
  await page.reload();
  await page.locator('#complete-INTRO').waitFor();
  assert.match(await page.locator('#complete-INTRO').innerText(), /Đã học/);
  assert.equal(await page.locator('#journal-INTRO-0').inputValue(), 'Nhận xét có bằng chứng 1');
  await page.locator('#save-journal-INTRO').click();
  assert.match(await page.locator('#complete-INTRO').innerText(), /Đã học/);
  const second = await context.newPage();
  await second.goto(`${base}/#/learning`);
  await second.locator('.path-progress').waitFor();
  assert.match(await second.locator('.path-progress').innerText(), /1\/10/);
  await page.goto(`${base}/#/ml/knn?tab=lab`);
  await page.locator('#primer-KNN').waitFor();
  assert.equal(await page.locator('#journal-KNN-0').inputValue(), '');
  await page.goto(`${base}/#/project`);
  await page.locator('#download-journal-PROJECT').waitFor();
  for (let i = 0; i < 4; i++) await page.locator(`#journal-PROJECT-${i}`).fill(`Báo cáo mục ${i+1}: dữ liệu giả lập, validation, FP/FN.`);
  const pending = page.waitForEvent('download');
  await page.locator('#download-journal-PROJECT').click();
  const report = await pending;
  assert.equal(report.suggestedFilename(), 'ghi-chep-project.md');
  assert.match(await fs.readFile(await report.path(), 'utf8'), /Báo cáo mục 4/);
  for (const [w,h] of [[1440,900],[768,1024],[390,844]]) {
    await page.setViewportSize({width:w,height:h});
    for (const route of ['/', '/intro', '/learning', '/project', '/dl/vae?tab=theory']) {
      await page.goto(`${base}/#${route}`);
      await page.locator('h1').waitFor();
      assert.equal(await page.locator('h1').count(), 1);
      if(route.includes('theory')) {
        await page.locator('.optional-theory summary').waitFor();
        assert.equal(await page.locator('.optional-theory').getAttribute('open'), null);
        await page.locator('.optional-theory summary').click();
        assert.equal(await page.locator('.theory').isVisible(), true);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow ${route} at ${w}`);
      await page.screenshot({path:`/tmp/sml-learning-${route.split('?')[0].replaceAll('/','-') || 'home'}-${w}.png`});
    }
  }
  const failing = await browser.newContext();
  await failing.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
  const blocked = await failing.newPage();
  await blocked.goto(`${base}/#/intro`);
  await blocked.locator('#save-journal-INTRO').click();
  assert.equal(await blocked.locator('[role="alert"]').count(), 1);
  assert.equal(await blocked.locator('#complete-INTRO').isDisabled(), true);
  await failing.close();
  assert.deepEqual(errors, []);
  console.log('PASS learning path: quiz feedback, score/notes gates, reload, completion preserved, isolated lessons, report download, 3 viewports, storage failure, no page errors.');
} finally { await browser.close(); }
