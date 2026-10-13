import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try{
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/#/ml/teachable?tab=lab');
  assert.equal(await page.locator('video').evaluate(v=>v.srcObject),null);
  await page.locator('#tm-start-camera').click();
  await page.getByRole('button',{name:'Chụp vào lớp 1',exact:true}).waitFor();
  await page.getByRole('button',{name:'Chụp vào lớp 1',exact:true}).click();
  assert.equal(await page.locator('.tm-samples img').count(),1);
  await page.evaluate(()=>{window.testMedia=document.querySelector('video').srcObject;});
  await page.locator('#tm-stop-camera').click();
  assert.ok(await page.evaluate(()=>window.testMedia.getTracks().every(t=>t.readyState==='ended')));
  await page.locator('#tm-start-camera').click();
  await page.getByRole('button',{name:'Chụp vào lớp 1',exact:true}).waitFor();
  await page.evaluate(()=>{window.testMedia=document.querySelector('video').srcObject;location.hash='/';});
  await page.locator('.hero').waitFor();
  assert.ok(await page.evaluate(()=>window.testMedia.getTracks().every(t=>t.readyState==='ended')));
  assert.deepEqual(errors,[]);
  console.log('PASS: webcam opt-in, capture, explicit stop and route cleanup (synthetic camera).');
}finally{await browser.close();}
