import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173';

const source=await fs.readFile('src/lessons/index.ts','utf8');
const lessons=[...source.matchAll(/id: '([^']+)', title: '([^']+)', path: '([^']+)'/g)].map(m=>({id:m[1],title:m[2],path:m[3]}));
const special={KNN:'knn',TREE:'tree',LOGREG:'logistic'};
/** Đi tới slide i bằng mũi tên ‹ › (dùng được ở mọi khổ màn hình). */
async function goTo(page, i) {
  for (let guard = 0; guard < 40; guard++) {
    const [cur] = (await page.locator('.deck-count').innerText()).split('/').map((x) => Number(x.trim()) - 1);
    if (cur === i) return;
    await page.getByRole('button', { name: cur < i ? 'Slide sau' : 'Slide trước', exact: true }).click();
  }
  throw new Error(`Không tới được slide ${i + 1}`);
}

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({reducedMotion:'reduce'}); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const lesson of lessons){
    let manifest;
    try{manifest=JSON.parse(await fs.readFile(`public/audio/lectures-v2/${lesson.id.toLowerCase()}/manifest.json`,'utf8'));}
    catch{try{manifest=JSON.parse(await fs.readFile(`public/audio/${special[lesson.id]??`guide/${lesson.id.toLowerCase()}`}/manifest.json`,'utf8'));}catch{console.log(`PENDING ${lesson.id}: no audio manifest`);continue;}}
    assert.equal(manifest.voice,'clone-duyenhamy');
    assert.equal(new Set(manifest.scenes.map(s=>s.id)).size,manifest.scenes.length);
    await page.goto(`${baseURL}/#${lesson.path}`);
    await page.locator('.deck-count').waitFor();
    for(const [width,height] of [[1440,900],[768,1024],[390,844]]){
      await page.setViewportSize({width,height});
      for(let i=0;i<manifest.scenes.length;i++){
        const scene=manifest.scenes[i];
        await goTo(page,i);
        assert.equal(await page.locator('audio').count(),1);
        assert.equal(await page.locator('audio').getAttribute('src'),scene.audio);
        assert.equal(await page.locator('.caption').innerText(),scene.caption);
        await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=1);
        const actual=await page.locator('audio').evaluate(a=>a.duration);
        assert.ok(Math.abs(actual-scene.duration)<.3,`${lesson.id} duration mismatch`);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lesson.id} slide ${i+1} overflow ${width}`);
        if(width===1440){
          await page.getByRole('button',{name:'Nghe bài',exact:true}).click();
          await page.waitForFunction(()=>document.querySelector('audio')?.currentTime>.03);
          await page.getByRole('button',{name:'Tạm dừng',exact:true}).click();
        }
      }
      await page.screenshot({path:`/tmp/lecture-${lesson.id}-${width}.png`,fullPage:true});
    }
    console.log(`PASS ${lesson.id}: ${manifest.scenes.length} slides, audio playback, captions, durations, 3 viewports`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
