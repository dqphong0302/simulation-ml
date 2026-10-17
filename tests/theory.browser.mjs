import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { BASE_URL as base } from './browser.config.mjs';
const source = await fs.readFile('src/lessons/index.ts', 'utf8');
const lessons = [...source.matchAll(/id: '([^']+)', title: '([^']+)', path: '([^']+)'/g)].map(m => ({ id: m[1], path: m[3] }));
assert.equal(lessons.length, 26);
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  for (const lesson of lessons) {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/#${lesson.path}?tab=theory`);
    await page.locator('.theory-core').waitFor();
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.theory-core').evaluate(el => !!el.closest('details')), false);
    assert.equal(await page.locator('.theory-core h3').count(), 7);
    assert.ok((await page.locator('.theory-core').innerText()).includes('Đáp án gợi ý:'));
    assert.ok(await page.locator('.theory-core a[href^="https://"]').count() >= 1);
    const advanced = page.locator(`#theory-advanced-${lesson.id}`);
    assert.equal(await advanced.getAttribute('open'), null);
    await page.locator(`#toc-${lesson.id}-7`).click();
    assert.equal(await advanced.evaluate(el => el.open), true, `${lesson.id} TOC opens optional theory`);
    const pending = page.waitForEvent('download');
    await page.locator(`#download-theory-${lesson.id}`).click();
    const file = await pending;
    const text = await fs.readFile(await file.path(), 'utf8');
    assert.ok(text.includes('## Hiểu bằng lời') && text.includes('## Mở rộng ·') && text.includes('## Nguồn kiểm chứng'));
    assert.ok(await page.locator('#download-notebook').isVisible());
    console.log(`PASS theory ${lesson.id}: core, answer, sources, TOC, full download`);
    await context.close();
  }
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/#/data?tab=theory`);
    await page.locator('.theory-core').waitFor();
    await page.locator('#toc-DATA-0').click();
    await page.locator('.theory-core h3').first().scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Core overflow ${width}`);
    await page.screenshot({ path: `/tmp/sml-theory-core-${width}.png` });
    await page.locator('#toc-DATA-7').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Advanced overflow ${width}`);
    const ids = await page.locator('[id]').evaluateAll(els => els.map(el => el.id));
    assert.equal(new Set(ids).size, ids.length, `Duplicate IDs ${width}`);
  }
  await page.goto(`${base}/#/data?tab=lab`);
  await page.locator('#data-demo-scale').waitFor();
  assert.equal(await page.getByRole('checkbox', { name: 'Cắt bất thường theo IQR (1.5×)' }).isChecked(), false);
  await page.locator('#data-demo-scale').selectOption('zscore');
  assert.ok((await page.locator('.main').innerText()).includes('Z-score'));
  await page.locator('#data-demo-scale').selectOption('minmax');
  assert.ok((await page.locator('.main').innerText()).includes('Min-Max'));
  assert.deepEqual(errors, []);
  console.log('PASS: 26 theory routes, 3 viewports, advanced optional, scaling controls, no page errors.');
} finally { await browser.close(); }
