import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { BASE_URL as baseURL } from './browser.config.mjs';
const source = await fs.readFile('src/lessons/index.ts', 'utf8');
const lessons = [...source.matchAll(/id: '([^']+)', title: '([^']+)', path: '([^']+)'/g)].map(m => ({ id: m[1], path: m[3] }));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const lesson of lessons) {
    // Each student download starts a fresh browsing session. This avoids
    // Chromium's protection against many automatic downloads from one origin.
    const session = await browser.newContext({ reducedMotion: 'reduce' });
    const lessonPage = await session.newPage();
    lessonPage.on('pageerror', e => errors.push(e.message));
    await lessonPage.goto(`${baseURL}/#${lesson.path}?tab=theory`);
    await lessonPage.locator('#download-notebook').waitFor();
    const pending = lessonPage.waitForEvent('download');
    await lessonPage.locator('#download-notebook').click();
    const download = await pending;
    assert.equal(download.suggestedFilename(), `${lesson.id.toLowerCase()}.ipynb`);
    const notebook = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.equal(notebook.nbformat, 4);
    assert.ok(notebook.cells.some(c => c.cell_type === 'code'));
    assert.ok(notebook.cells[0].source.join('').includes('Colab'));
    console.log(`PASS notebook ${lesson.id}`);
    await session.close();
  }
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${baseURL}/#/ml/knn?tab=theory`);
    await page.locator('.python-preview summary').click();
    assert.ok(await page.locator('.python-step pre').first().isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Python overflow ${width}`);
    await page.screenshot({ path: `/tmp/simulation-python-${width}.png` });
    await page.goto(`${baseURL}/#/datasets`);
    await page.locator('.data-workspace-panel').waitFor();
    assert.equal(await page.locator('h1').innerText(), 'Nhập dữ liệu');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Data tab overflow ${width}`);
    await page.screenshot({ path: `/tmp/simulation-data-tab-${width}.png` });
    await page.locator('.library-tabs a[href="#/"]').click();
    await page.locator('#group-foundation').waitFor();
    assert.equal(await page.locator('.catalog-group').count(), 4);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: 26 notebook downloads, explained code preview, separate data tab, 3 viewports, no page errors.');
} finally { await browser.close(); }
