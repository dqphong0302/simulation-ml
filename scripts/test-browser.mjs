import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { BASE_URL } from '../tests/browser.config.mjs';

const root = new URL('../', import.meta.url);
try {
  const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  console.error(`Không kết nối được ${BASE_URL}. Chạy pnpm dev --port 5175 hoặc đặt BASE_URL. ${error.message}`);
  process.exit(1);
}
const suites = (await readdir(new URL('../tests', import.meta.url))).filter(name => name.endsWith('.browser.mjs')).sort();
for (const suite of suites) {
  console.log(`\nBrowser suite: ${suite}`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`tests/${suite}`], { cwd: root, env: { ...process.env, BASE_URL }, stdio: 'inherit', timeout: 300_000 });
    child.on('error', reject);
    child.on('exit', code => resolve(code ?? 1));
  });
  if (code !== 0) process.exit(code);
}
console.log(`\nPASS ${suites.length} browser suites against ${BASE_URL}.`);
