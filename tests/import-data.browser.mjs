import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';

import { BASE_URL as baseURL } from './browser.config.mjs';
const browser = await chromium.launch({ headless: true });
const csv = n => 'length,width,label\n' + Array.from({ length: n }, (_, i) => `${i + 1},${i % 17 + 1},${i % 2 ? 'A' : 'B'}`).join('\n');
const upload = (page, name, text) => page.getByLabel('Chọn file dữ liệu', { exact: true }).setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.isBuffer(text) ? text : Buffer.from(text) });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url().startsWith('http') && !r.url().startsWith(baseURL)) external.push(r.url()); });
  await page.goto(baseURL);
  await page.locator('.library-tabs a[href="#/datasets"]').click();
  await upload(page, 'my-data.csv', csv(120));
  await expect(page.getByRole('heading', { name: /Xem trước: 120 dòng/ })).toBeVisible();
  for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `import overflow ${width}`);
    await page.locator('.data-import').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/data-import-${width}.png`, animations: 'disabled' });
  }
  await page.getByRole('button', { name: 'Dùng dữ liệu này', exact: true }).click();
  await page.locator('#home-explore-data').click();
  await expect(page.locator('.eda-bar')).toContainText('my-data.csv');
  await page.evaluate(() => { location.hash = '/ml/knn?tab=lab'; });
  await expect(page.locator('.controls')).toContainText('my-data.csv');
  await expect(page.locator('.controls')).toContainText('120 mẫu');
  console.log('PASS CSV import, preview 3 viewports, EDA → KNN session reuse');

  // Failed imports leave the active table intact.
  await upload(page, 'broken.csv', 'a,b\n1,2\n3');
  await expect(page.locator('.data-import [role=alert]')).toContainText('cột');
  await expect(page.locator('.controls')).toContainText('120 mẫu');
  await upload(page, 'bad.json', '[{"a": [1, 2]}]');
  await expect(page.locator('.data-import [role=alert]')).toContainText('lồng nhau');
  await upload(page, 'bad.csv', Buffer.from([0xff, 0xfe, 0xff]));
  await expect(page.locator('.data-import [role=alert]')).toBeVisible();
  console.log('PASS malformed CSV, nested JSON and invalid UTF-8 preserve active data');

  // A workbook whose first sheet is empty must still permit selecting a useful sheet.
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), 'Empty');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['height', 'weight'], ...Array.from({ length: 80 }, (_, i) => [150 + i, 50 + i * 2])]), 'Measurements');
  const xlsx = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  await upload(page, 'measurements.xlsx', xlsx);
  await expect(page.getByLabel('Chọn sheet', { exact: true })).toBeVisible();
  await page.getByLabel('Chọn sheet', { exact: true }).selectOption('Measurements');
  await expect(page.getByRole('heading', { name: /Xem trước: 80 dòng/ })).toBeVisible();
  await page.getByRole('button', { name: 'Dùng dữ liệu này', exact: true }).click();
  await expect(page.getByText(/Dữ liệu không phù hợp với bài này/)).toBeVisible();
  for (const route of ['/ml/pca', '/ml/kmeans', '/ml/regression', '/data', '/dl/autoencoder']) {
    await page.evaluate(p => { location.hash = `${p}?tab=lab`; }, route);
    await expect(page.locator('.controls')).toContainText('measurements.xlsx');
    await expect(page.locator('.controls')).toContainText('80 mẫu');
    await expect(page.locator('.lab > .main')).toBeVisible();
  }
  console.log('PASS Excel sheet selection, incompatible classification, unlabeled PCA/K-means/regression/preprocessing/AE');

  await page.evaluate(() => { location.hash = '/eda?tab=lab'; });
  const json = JSON.stringify(Array.from({ length: 40 }, (_, i) => ({ x: i, y: i * 2, label: i % 2 ? 'A' : 'B', comment: i % 3 ? 'xin chào' : null })));
  await upload(page, 'flat.json', json);
  await expect(page.getByRole('heading', { name: /Xem trước: 40 dòng/ })).toBeVisible();
  await page.getByRole('button', { name: 'Dùng dữ liệu này', exact: true }).click();
  await expect(page.locator('.eda-bar')).toContainText('flat.json');

  const legacy = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(legacy, XLSX.utils.aoa_to_sheet([['x', 'y', 'label'], ...Array.from({ length: 30 }, (_, i) => [i, i * 2, i % 2])]), 'Data');
  await upload(page, 'legacy.xls', XLSX.write(legacy, { type: 'buffer', bookType: 'xls' }));
  await expect(page.getByRole('heading', { name: /Xem trước: 30 dòng/ })).toBeVisible();
  await page.getByRole('button', { name: 'Dùng dữ liệu này', exact: true }).click();
  await expect(page.locator('.eda-bar')).toContainText('legacy.xls');
  console.log('PASS legacy XLS');

  await upload(page, 'boundary.csv', csv(200000));
  await expect(page.getByRole('heading', { name: /Xem trước: 200.000 dòng/ })).toBeVisible({ timeout: 20000 });
  await upload(page, 'over-limit.csv', csv(200001));
  await expect(page.locator('.data-import [role=alert]')).toContainText('200.000');
  await expect(page.locator('.eda-bar')).toContainText('legacy.xls');
  console.log('PASS real worker at 200,000 rows; rejects 200,001 without replacing session');

  await upload(page, 'large.csv', csv(25001));
  await expect(page.getByRole('heading', { name: /25.001 dòng/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dùng dữ liệu này', exact: true })).toBeDisabled();
  await page.getByLabel('Số dòng sử dụng', { exact: true }).selectOption('5000');
  await page.getByRole('checkbox', { name: /Tôi đồng ý dùng/ }).check();
  await page.getByRole('button', { name: 'Dùng dữ liệu này', exact: true }).click();
  await expect(page.locator('.eda-bar')).toContainText('5.000 dòng');
  await page.evaluate(() => { location.hash = '/ml/knn?tab=lab'; });
  await expect(page.getByRole('button', { name: /Đồng ý lấy mẫu 2.000 dòng/ })).toBeVisible();
  await expect(page.locator('.lab > .main')).toHaveCount(0);
  await page.getByRole('button', { name: /Đồng ý lấy mẫu 2.000 dòng/ }).click();
  await expect(page.locator('.controls')).toContainText('2000 mẫu');
  console.log('PASS JSON, 25,001-row import without silent cutoff, sample consent and training guard');

  // Pause loading the worker module, then cancel before it can process the file.
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  const workerRoute = /\/(src\/workers\/import\.worker\.ts|assets\/import\.worker-).*$/;
  await page.route(workerRoute, async route => { await hold; await route.continue().catch(() => {}); });
  await upload(page, 'cancel.csv', csv(10000));
  await page.getByRole('button', { name: 'Hủy đọc', exact: true }).click();
  release();
  await expect(page.locator('.data-import [role=status]')).toContainText('Đã hủy');
  await expect(page.locator('.controls')).toContainText('large.csv');
  await expect(page.getByRole('button', { name: 'Dùng dữ liệu này', exact: true })).toHaveCount(0);
  await page.unroute(workerRoute);
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log('PASS cancellation preserves data; no page errors or external requests');
} finally { await browser.close(); }
