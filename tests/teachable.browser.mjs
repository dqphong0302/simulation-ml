import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import fs from 'node:fs/promises';
import { BASE_URL as base } from './browser.config.mjs';

const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  const errors = []; const external=[];
  page.on('pageerror', e=>errors.push(e.message));
  page.on('request', r=>{if(r.url().startsWith('http') && !r.url().startsWith(`${base}/`)) external.push(r.url());});
  await page.goto(`${base}/#/ml/teachable?tab=lab`);
  await page.locator('#tm-train').waitFor();
  console.log('TM page ready');
  assert.equal(await page.locator('#tm-train').isDisabled(), true);
  const images = await page.evaluate(()=>[0,1].map(group=>Array.from({length:8},(_,i)=>{
    const c=document.createElement('canvas');c.width=c.height=224;const x=c.getContext('2d');
    x.fillStyle=group?'#eee':'#222';x.fillRect(0,0,224,224);
    x.fillStyle=group?'#00aacc':'#ff7700';
    if(group) x.fillRect(40+i*2,45+i,120,120);else{x.beginPath();x.arc(112,112,45+i*2,0,Math.PI*2);x.fill();}
    return c.toDataURL('image/png').split(',')[1];
  })));
  for(let i=0;i<2;i++) {
    await page.locator(`#tm-files-${i}`).setInputFiles(images[i].map((data,j)=>({name:`sample-${i}-${j}.png`,mimeType:'image/png',buffer:Buffer.from(data,'base64')})));
    await page.waitForFunction(n=>document.querySelectorAll('.tm-samples img').length===n,(i+1)*8);
    console.log(`Class ${i+1}: samples ready`);
  }
  await page.locator('#tm-epochs').selectOption('5');
  await page.locator('#tm-train').click();
  console.log('Training started');
  await Promise.race([page.locator('#tm-export').waitFor({timeout:180000}),page.getByRole('alert').waitFor({timeout:180000}).then(async()=>{throw new Error(await page.getByRole('alert').innerText());})]);
  assert.equal(await page.getByRole('alert').count(),0);
  console.log('Training finished');
  await page.locator('#tm-test-file').setInputFiles({name:'heldout.png',mimeType:'image/png',buffer:Buffer.from(images[0][0],'base64')});
  await page.locator('.tm-predictions progress').first().waitFor();
  assert.equal(await page.locator('.tm-predictions progress').count(),2);
  const probs=await page.locator('.tm-predictions progress').evaluateAll(nodes=>nodes.map(n=>n.value));
  assert.ok(Math.abs(probs.reduce((a,b)=>a+b,0)-1)<0.001);
  const downloaded=page.waitForEvent('download');
  await page.locator('#tm-export').click();
  const download=await downloaded;
  const zip=await JSZip.loadAsync(await fs.readFile(await download.path()));
  assert.deepEqual(Object.keys(zip.files).sort(),['README.txt','metadata.json','model.json','weights.bin']);
  const metadata=JSON.parse(await zip.file('metadata.json').async('string'));
  assert.deepEqual(metadata.labels,['Lớp A','Lớp B']);
  // Verify the exported archive can be loaded back by the official library.
  const roundTrip=await page.evaluate(async data=>{
    const files=data.files.map(([name,bytes])=>new File([new Uint8Array(bytes)],name));
    const loaded=await window.tmImage.loadFromFiles(files[0],files[1],files[2]);
    const image=new Image(); image.src=`data:image/png;base64,${data.image}`; await image.decode();
    const result=await loaded.predict(image); loaded.model.dispose(); return result;
  },{image:images[0][0],files:await Promise.all(['model.json','weights.bin','metadata.json'].map(async name=>[name,Array.from(await zip.file(name).async('uint8array'))]))});
  assert.equal(roundTrip.length,2);
  assert.ok(Math.abs(roundTrip[0].probability-probs[0])<.0001);
  for(const [width,height] of [[1440,900],[768,1024],[390,844]]) {
    await page.setViewportSize({width,height});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
    await page.screenshot({path:`/tmp/teachable-${width}.png`,fullPage:true});
  }
  // Any dataset edit invalidates predictions and export.
  await page.locator('#tm-name-0').fill('Đồ vật A');
  assert.equal(await page.locator('#tm-export').count(),0);
  assert.equal(await page.locator('#tm-test-file').isDisabled(),true);
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[]);
  console.log('PASS: real TM/MobileNet training, prediction, ZIP export, dataset invalidation, 3 viewports; no external network or page errors.');
} finally {await browser.close();}
