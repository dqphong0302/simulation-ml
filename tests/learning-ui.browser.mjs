import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { BASE_URL as baseURL } from './browser.config.mjs';

async function goTo(page, i) {
  for (let guard = 0; guard < 40; guard++) {
    const [cur] = (await page.locator('.deck-count').innerText()).split('/').map((x) => Number(x.trim()) - 1);
    if (cur === i) return;
    await page.getByRole('button', { name: cur < i ? 'Slide sau' : 'Slide trước', exact: true }).click();
  }
  throw new Error(`Không tới được slide ${i + 1}`);
}

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('sml.theme', 'dark'));
  page.on('pageerror', e => errors.push(e.message));
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(baseURL);
    await page.locator('.library-intro').waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.hero-stats').count(), 0);
    assert.equal(await page.locator('#lo-trinh').count(), 0);
    assert.equal(await page.getByRole('button', { name: /Chuyển sang giao diện/ }).count(), 0);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light');
    assert.equal(await page.locator('.lesson-row').count(), 26);
    assert.equal(await page.locator('.catalog-group').count(), 4);
    assert.equal(await page.locator('.lesson-thumbnail svg').count(), 26);
    assert.equal(await page.locator('.home-data').count(), 0);
    assert.equal(await page.locator('.home-intro').count(), 0);
    await page.locator('#filter-foundation').click();
    assert.equal(await page.locator('.lesson-row').count(), 2);
    assert.equal(await page.locator('.catalog-group').count(), 1);
    await page.locator('#home-search').fill('kham pha');
    assert.equal(await page.locator('.lesson-row').count(), 1);
    await page.locator('#home-search').fill('xyz-no-lesson');
    assert.equal(await page.locator('.lesson-row').count(), 0);
    await page.locator('#home-reset').click();
    assert.equal(await page.locator('.lesson-row').count(), 26);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `home overflow at ${width}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/simulation-home-${width}.png` });
    await page.goto(`${baseURL}/#/dl/mlp`);
    await page.locator('.pbar').waitFor();
    assert.equal(await page.locator('audio').evaluate(a => a.paused), true);
    assert.equal(await page.getByRole('tab', { name: /Thực hành/ }).count(), 1);
    await page.getByRole('button', { name: 'Nghe bài', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('audio')?.currentTime > .1);
    await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
    assert.equal(await page.locator('audio').evaluate(a => a.paused), true);
    await goTo(page, 2);
    assert.equal(await page.locator('audio').count(), 1);
    assert.match(await page.locator('.slide h2').innerText(), /lan truyền ngược/);
    assert.ok(await page.locator('.lecture-illustration').isVisible(), `slide illustration hidden at ${width}`);
    const toolbar = await page.locator('.deck-toolbar').boundingBox();
    const slide = await page.locator('.slide').boundingBox();
    assert.ok(toolbar && slide && toolbar.y + toolbar.height <= slide.y + 1, `navigation overlaps slide at ${width}`);
    if (width === 1440) assert.ok(slide.width > 900, 'desktop slide is unnecessarily narrow');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `lecture overflow at ${width}`);
    await page.screenshot({ path: `/tmp/simulation-lesson-${width}.png` });
    await page.goto(`${baseURL}/#/data`);
    await page.locator('.narrated .slide').waitFor();
    assert.equal(await page.locator('.narrated .slide').count(), 1);
    assert.match(await page.locator('.deck-count').innerText(), /1 \/ 8/);
    assert.equal(await page.getByRole('button', { name: 'Slide trước', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Slide sau', exact: true }).click();
    assert.match(await page.locator('.deck-count').innerText(), /2 \/ 8/);
    await goTo(page, 7);
    assert.equal(await page.getByRole('button', { name: 'Slide sau', exact: true }).isDisabled(), true);
    assert.match(await page.locator('.slide h2').innerText(), /Tổng kết/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `data overflow at ${width}`);
    await page.screenshot({ path: `/tmp/simulation-data-${width}.png` });
  }
  await page.goto(`${baseURL}/#/ml/knn`);
  await page.locator('.pbar').waitFor();
  await page.locator('.narrated').focus();
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('audio')?.currentTime > .1);
  assert.deepEqual(errors, []);
  console.log('PASS: responsive layout, 26 lessons, filters, accent-insensitive search, empty state, audio play/pause, scene navigation, keyboard start; no page errors.');
} finally { await browser.close(); }
