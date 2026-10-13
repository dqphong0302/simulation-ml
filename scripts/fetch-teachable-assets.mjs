// Download official, pinned browser distributions and MobileNet assets for static hosting.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);
const root = new URL('../public/', import.meta.url);
const assets = [
  ['vendor/teachable-machine/tf-1.3.1.min.js', 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js'],
  ['vendor/teachable-machine/tm-image-0.8.5.min.js', 'https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js'],
  ['vendor/teachable-machine/LICENSE-tensorflow.txt', 'https://raw.githubusercontent.com/tensorflow/tfjs/master/LICENSE'],
  ['vendor/teachable-machine/LICENSE-teachable.txt', 'https://raw.githubusercontent.com/googlecreativelab/teachablemachine-community/master/LICENSE.txt'],
  ['models/mobilenet/model.json', 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'],
];
async function get([file, url]) {
  const destination = new URL(file, root);
  await fs.mkdir(new URL('.', destination), { recursive: true });
  let bytes;
  try { bytes = await fs.readFile(destination); }
  catch {
    // curl respects the host's configured proxy (Node fetch does not by default).
    const response = await execute('curl', ['-fsSL', '--max-time', '60', url], { encoding: 'buffer', maxBuffer: 16*1024*1024 });
    bytes = response.stdout;
    await fs.writeFile(destination, bytes, { flag: 'wx' });
  }
  return { file, url, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
const records = await Promise.all(assets.map(get));
const model = JSON.parse(await fs.readFile(new URL('models/mobilenet/model.json', root), 'utf8'));
const shards = model.weightsManifest.flatMap(group => group.paths).map(file => {
  if (!/^group\d+-shard\d+of\d+$/.test(file)) throw new Error('Unexpected shard path');
  return [`models/mobilenet/${file}`, `https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/${file}`];
});
for (let i = 0; i < shards.length; i += 6) records.push(...await Promise.all(shards.slice(i, i + 6).map(get)));
await fs.writeFile(new URL('vendor/teachable-machine/provenance.json', root), JSON.stringify(records, null, 2) + '\n');
console.log(`Verified ${records.length} local assets; ${(records.reduce((n,r)=>n+r.size,0)/1024/1024).toFixed(2)} MiB`);
