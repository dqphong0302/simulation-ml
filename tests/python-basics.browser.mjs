import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { BASE_URL as base } from './browser.config.mjs';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base);
  await page.locator('#library-python-tab').click();
  await expect(page.locator('h1')).toHaveText('Python & Google Colab');
  await expect(page.locator('#library-python-tab')).toHaveAttribute('aria-current', 'page');
  assert.equal(await page.locator('.python-guide .python-step').count(), 8);
  await page.locator('#jump-python-statistics').click();
  assert.ok(page.url().endsWith('#/python'), 'in-page navigation must not replace the hash route');
  await expect(page.locator('#python-statistics')).toContainText('Chạy phần 07');
  await expect(page.locator('#code-python-statistics .notebook-source')).toBeVisible();
  assert.equal(await page.locator('.notebook-cell').count(), 8);
  assert.equal(await page.locator('.python-audio audio').count(), 9);
  await expect(page.locator('#code-python-statistics .notebook-output')).toContainText('50.00%');
  assert.ok(await page.locator('.py-keyword').count() > 0);
  assert.match(await page.locator('#code-python-variables .notebook-source').evaluate(el => getComputedStyle(el).color), /32, 33, 36/);
  // Real generated audio: load, play, pause and prevent overlapping narration.
  await page.locator('#audio-python-colab').evaluate(a => a.load());
  await page.waitForFunction(() => document.querySelector('#audio-python-colab').readyState >= 1);
  assert.ok(await page.locator('#audio-python-colab').evaluate(a => a.duration) > 5);
  await page.locator('#audio-python-colab').evaluate(a => a.play());
  await page.waitForFunction(() => document.querySelector('#audio-python-colab').currentTime > 0.05);
  await page.locator('#audio-python-variables').evaluate(a => a.play());
  assert.equal(await page.locator('#audio-python-colab').evaluate(a => a.paused), true);
  await page.locator('#audio-python-variables').evaluate(a => a.pause());
  for (const audio of await page.locator('.python-audio audio').all()) {
    await audio.evaluate(a => a.load());
    await expect.poll(() => audio.evaluate(a => a.readyState)).toBeGreaterThanOrEqual(1);
    assert.ok(await audio.evaluate(a => Number.isFinite(a.duration) && a.duration > 0));
  }
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text; } } }); });
  await page.locator('#copy-python-statistics').click();
  await expect(page.locator('.python-copy-status')).toContainText('Đã sao chép code');
  assert.match(await page.evaluate(() => window.__copied), /math.isfinite/);
  const pending = page.waitForEvent('download');
  await page.locator('#download-python-basics').click();
  const file = await pending;
  assert.equal(file.suggestedFilename(), 'python-colab-buoi-1.ipynb');
  const book = JSON.parse(await fs.readFile(await file.path(), 'utf8'));
  assert.equal(book.cells.filter(c => c.cell_type === 'code').length, 8);
  for (const c of book.cells.filter(c => c.cell_type === 'code')) assert.deepEqual(c.outputs, []);
  for (const [width, height] of [[1440,900],[768,1024],[390,844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0,0));
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
    await page.screenshot({ path: `/tmp/python-guide-${width}.png`, fullPage: true });
    await page.locator('#python-variables').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/python-cell-${width}.png` });
  }
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Python & Google Colab');
  await page.locator('#python-next-eda').click();
  await expect(page).toHaveURL(/#\/eda\?tab=theory$/);
  assert.deepEqual(errors, []);
  console.log('PASS Python guide: 9 audio clips, playback exclusivity, notebook-style cells, syntax colors, copy, download, routing, 3 viewports, no page errors.');
} finally { await browser.close(); }
