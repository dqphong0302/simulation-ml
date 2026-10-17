import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { BASE_URL as base } from './browser.config.mjs';
const browser = await chromium.launch({ headless: true });
const errors = [], failed = [], external = [];
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => { if (r.url().startsWith('http') && !r.url().startsWith(base)) external.push(r.url()); });
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/#/`);
    await expect(page.locator('.lesson-row')).toHaveCount(26);
    await expect(page.locator('[data-exploration="true"]')).toHaveCount(3);
    await expect(page.locator('#explore-dl')).toContainText('Không bắt buộc');
    const dl = await page.locator('.catalog-group-dl .lesson-row h4 a').allTextContents();
    assert.ok(dl.indexOf('Học chuyển giao') < dl.indexOf('VAE'));
    assert.ok(dl.indexOf('Phân đoạn ảnh') < dl.indexOf('VAE'));
    await page.locator('#filter-dl').click();
    await page.screenshot({ path: `/tmp/sml-new-catalog-${width}.png`, fullPage: true });
    for (const [id, path] of [['BOOST', '/ml/boosting'], ['TRANSFER', '/dl/transfer'], ['SEG', '/dl/segmentation']]) {
      await page.goto(`${base}/#${path}?tab=lab`);
      await expect(page.locator(`#lab-${id}`)).not.toBeEmpty();
      if (id === 'BOOST') {
        await expect(page.locator('#boost-stage')).toBeVisible();
        const before = await page.locator('#boost-loss').innerText();
        await page.locator('#boost-stage').focus(); await page.keyboard.press('End');
        await expect(page.locator('#boost-stage')).toHaveValue('60');
        assert.notEqual(await page.locator('#boost-loss').innerText(), before);
        await page.locator('#boost-rate').focus(); await page.keyboard.press('Home');
        await expect(page.locator('#boost-rate')).toHaveValue('0.05');
      } else if (id === 'TRANSFER') {
        await page.locator('#transfer-step').click();
        await expect(page.locator('#transfer-delta')).toContainText('0.0000');
        await page.locator('#transfer-phase').selectOption('fine');
        await page.locator('#transfer-step').click();
        await expect(page.locator('#transfer-delta')).toContainText('0.0030');
        await page.locator('#transfer-reset').click();
        await expect(page.locator('#transfer-delta')).toContainText('Số bước: 0');
        await expect(page.locator('#transfer-real-lab')).toHaveAttribute('href', '#/ml/teachable?tab=lab');
      } else {
        await expect(page.locator('.image-teaching-panels svg')).toHaveCount(4);
        const before = await page.locator('#seg-metrics').innerText();
        await page.locator('#seg-threshold').focus(); await page.keyboard.press('End');
        assert.notEqual(await page.locator('#seg-metrics').innerText(), before);
        await page.locator('#seg-offset').focus(); await page.keyboard.press('End');
        await expect(page.locator('#seg-offset')).toHaveValue('4');
      }
      assert.equal(await page.locator('h1').count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id} overflow ${width}`);
      await page.locator(`#lab-${id}`).screenshot({ path: `/tmp/sml-${id}-${width}.png` });
      await expect(page.locator(`#quiz-${id}`)).toBeVisible();
      await page.locator(`#answer-${id}-0-0`).check();
      await page.locator(`#answer-${id}-1-1`).check();
      await page.locator(`#answer-${id}-2-2`).check();
      await page.locator(`#submit-quiz-${id}`).click();
      await expect(page.locator('.quiz-feedback')).toHaveCount(3);
      // A 404 must not strand new lessons: authored text fallback still has every scene.
      await page.route(`**/audio/**/${id.toLowerCase()}/manifest.json`, r => r.fulfill({ status: 503, body: '{}' }));
      await page.goto(`${base}/#${path}`);
      await expect(page.locator('.deck-count')).toHaveText('1 / 6');
      await page.getByRole('button', { name: 'Slide sau', exact: true }).click();
      await expect(page.locator('.deck-count')).toHaveText('2 / 6');
      await page.unroute(`**/audio/**/${id.toLowerCase()}/manifest.json`);
    }
  }
  await page.goto(`${base}/#/learning`);
  for (const id of ['boost', 'transfer', 'seg']) await expect(page.locator(`#path-${id}`)).toBeVisible();
  await page.goto(`${base}/#/datasets`);
  const csv = 'age,bmi,outcome\n' + Array.from({ length: 60 }, (_, i) => `${20 + i},${20 + i % 13},${i % 2}`).join('\n');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'boost-upload.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: /Dùng dữ liệu này/ }).click();
  await page.goto(`${base}/#/ml/boosting?tab=lab`);
  await expect(page.locator('#boost-loss')).toBeVisible();
  await expect(page.locator('.controls')).toContainText('boost-upload.csv');
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  // 503 requests above are deliberate fallback tests; all other requests must succeed.
  assert.deepEqual(failed.filter(x => !x.startsWith('503 ')), []);
  console.log('PASS applications: 3 labs × 3 viewports, controls, quizzes, audio fallback, optional grouping, paths, uploaded Boosting, no unexpected network/page errors.');
} finally { await browser.close(); }
