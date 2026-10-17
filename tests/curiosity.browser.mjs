import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

import { BASE_URL as base } from './browser.config.mjs';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [], failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/#/learning`);
    await expect(page.locator('#curiosity-title')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const before = await page.locator('.path-progress').innerText();
    for (const [id, correct, route] of [['data', 0, '/eda?tab=lab'], ['ai', 1, '/ml/logistic?tab=lab'], ['python', 2, '/python']]) {
      await page.locator(`#curiosity-pick-${id}`).click();
      await expect(page.locator(`#curiosity-pick-${id}`)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.curiosity-feedback')).toBeEmpty();
      await page.locator(`#curiosity-answer-${id}-${(correct + 1) % 3}`).click();
      await expect(page.locator('.curiosity-feedback')).toContainText('Chưa trúng lần này');
      await page.locator(`#curiosity-answer-${id}-${correct}`).click();
      await expect(page.locator('.curiosity-feedback')).toContainText('Bạn đã tìm ra rồi');
      await expect(page.locator('.curiosity-feedback')).toContainText(id === 'data' ? '36 phút' : id === 'ai' ? 'recall' : '60');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: overflow at ${width}`);
      await page.locator('.curiosity-start').screenshot({ path: `/tmp/sml-curiosity-${id}-${width}.png` });
      await page.locator('#curiosity-retry').click();
      await expect(page.locator('.curiosity-feedback')).toBeEmpty();
      await page.locator(`#curiosity-answer-${id}-${correct}`).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.curiosity-feedback')).toContainText('Bạn đã tìm ra rồi');
      assert.equal(await page.locator('.path-progress').innerText(), before);
      await page.locator(`#curiosity-go-${id}`).click();
      await expect(page).toHaveURL(`${base}/#${route}`);
      await expect(page.locator('h1')).toBeVisible();
      await page.goto(`${base}/#/learning`);
      await expect(page.locator('#curiosity-title')).toBeVisible();
    }
    await page.reload();
    await expect(page.locator('.curiosity-feedback')).toBeEmpty();
    assert.equal(await page.locator('.path-progress').innerText(), before);
    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    assert.deepEqual(duplicateIds, []);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  console.log('PASS curiosity: 3 challenges, correct/incorrect feedback, retry, keyboard, routes, no progress mutation, 3 viewports; no page/network errors.');
} finally { await browser.close(); }
