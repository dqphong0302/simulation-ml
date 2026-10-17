import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { BASE_URL as baseURL } from './browser.config.mjs';
const source = await fs.readFile('src/lessons/index.ts', 'utf8');
const lessons = [...source.matchAll(/id: '([^']+)', title: '([^']+)', path: '([^']+)'/g)]
  .map(m => ({ id: m[1], title: m[2], path: m[3] }));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(baseURL);
  for (const [group, count] of [['foundation', 2], ['ml', 11], ['dl', 10], ['genai', 3], ['all', 26]]) {
    await page.locator(`#filter-${group}`).click();
    assert.equal(await page.locator('.lesson-row').count(), count);
  }
  for (const lesson of lessons) {
    await page.goto(`${baseURL}/#${lesson.path}?tab=lab`);
    await page.locator('.tab-panel input:visible, .tab-panel button:visible, .tab-panel select:visible').first().waitFor();
    assert.equal(await page.locator('h1').innerText(), lesson.title);
    assert.equal(await page.getByRole('tab', { name: /Thực hành/ }).getAttribute('aria-selected'), 'true');
    // Skip link must focus the current content without changing the hash route.
    const hash = await page.evaluate(() => location.hash);
    await page.locator('.skip').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => location.hash), hash);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
    console.log(`PASS lab route ${lesson.id}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page.locator('#menu-toggle').click();
  await page.getByRole('textbox', { name: 'Tìm bài', exact: true }).fill('kham pha');
  assert.equal(await page.locator('.nav-group .nav-link').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'), 'false');
  assert.deepEqual(errors, []);
  console.log('PASS: all category filters, 26 lab routes, skip link, mobile search and Escape; no page errors.');
} finally { await browser.close(); }
