import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const browserPath=process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const base='http://127.0.0.1:4173';
await mkdir('.preview',{recursive:true});
const browser=spawn(browserPath,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9333',`--user-data-dir=${path.resolve('.preview/browser-profile')}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let nextID=1;const pending=new Map();const errors=[];
try {
  let targets;
  for(let attempt=0;attempt<60;attempt++) { try { const r=await fetch('http://127.0.0.1:9333/json');targets=await r.json();if(targets.some(t=>t.type==='page'))break; } catch {} await sleep(250); }
  if(!targets)throw new Error('Headless browser did not start');
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);else if(m.method==='Log.entryAdded' && m.params.entry.level==='error')errors.push(m.params.entry.text);});
  function cdp(method,params={}) { const id=nextID++;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));}); }
  async function evaluate(expression) { const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+' '+r.exceptionDetails.exception?.description);return r.result.value; }
  async function waitFor(expression) { for(let i=0;i<50;i++){if(await evaluate(expression))return;await sleep(100);}throw new Error('Timed out waiting: '+expression); }
  async function navigate(route) {await cdp('Page.navigate',{url:base+route});await waitFor("document.readyState === 'complete' && !!document.querySelector('[data-open-search]')");await evaluate("document.fonts.ready");await sleep(150);}
  async function viewport(width,height) {await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});}
  async function screenshot(name,full=false) {const metrics=await cdp('Page.getLayoutMetrics');const options=full?{captureBeyondViewport:true,clip:{x:0,y:0,width:metrics.cssContentSize.width,height:metrics.cssContentSize.height,scale:1}}:{};const shot=await cdp('Page.captureScreenshot',{format:'png',...options});await writeFile('.preview/'+name+'.png',Buffer.from(shot.data,'base64'));}
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');
  await viewport(1440,1000);await navigate('/');await evaluate("document.documentElement.dataset.theme='light';localStorage.setItem('bwl-theme','light')");
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,'Desktop overflow');
  assert.equal(await evaluate('[...document.images].every(i=>i.complete && i.naturalWidth>0)'),true,'Images loaded');
  await screenshot('desktop',true);
  await evaluate("document.querySelector('[data-filter=\"嵌入式\"]').click()");
  assert.equal(await evaluate("document.querySelectorAll('[data-post]:not([hidden])').length"),1,'Category filter');
  assert.equal(await evaluate("new URL(location.href).searchParams.get('category')"),'嵌入式','Shareable filter URL');
  await evaluate("document.querySelector('[data-filter=\"all\"]').click();document.querySelector('[data-open-search]').click()");
  await waitFor("document.querySelectorAll('.search-result').length===3");
  await evaluate("document.querySelector('#search-input').value='GPIO';document.querySelector('#search-input').dispatchEvent(new Event('input'))");
  await waitFor("document.querySelectorAll('.search-result').length===1");
  assert.equal(await evaluate("document.querySelector('.search-result h3').textContent"),'ESP32 学习笔记：从点灯开始','Full text search');
  await screenshot('search');
  await evaluate("document.querySelector('#search-input').value='找不到的关键词';document.querySelector('#search-input').dispatchEvent(new Event('input'))");
  await waitFor("document.querySelectorAll('.search-result').length===0 && document.querySelector('.search-empty')");
  await evaluate("document.querySelector('#search-dialog').close();document.querySelector('[data-theme-toggle]').click()");
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark','Theme toggle');
  await navigate('/archives/');assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark','Persisted theme');
  assert.equal(await evaluate("document.querySelectorAll('.archive-item').length"),3,'Archive articles');
  await navigate('/2026/06/10/esp32-first-led/');
  assert.equal(await evaluate("!!document.querySelector('.copy-code') && document.querySelector('pre code').textContent.includes('digitalWrite')"),true,'Original code and copy control');
  assert.equal(await evaluate("document.querySelectorAll('.article-aside nav a').length"),2,'Article table of contents');
  await screenshot('article-dark',true);
  for (const route of ['/categories/','/categories/'+encodeURIComponent('嵌入式')+'/','/tags/ESP32/','/about/','/link/','/2026/05/01/hello-bwlzone/','/2026/07/01/rebuild-with-butterfly/']) {await navigate(route);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Route layout: '+route);}
  await viewport(390,844);await navigate('/');await evaluate("document.documentElement.dataset.theme='light';localStorage.setItem('bwl-theme','light')");
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Mobile overflow');
  await screenshot('mobile',true);
  await evaluate("document.querySelector('.mobile-menu-toggle').click()");assert.equal(await evaluate("document.querySelector('#mobile-nav').hidden"),false,'Mobile navigation');
  await evaluate("document.querySelector('.mobile-menu-toggle').click();document.querySelector('[data-open-search]').click()");
  await waitFor("document.querySelectorAll('.search-result').length===3");
  assert.equal(await evaluate("document.querySelector('#search-dialog').getBoundingClientRect().width <= innerWidth"),true,'Mobile search width');
  await evaluate("document.querySelector('#search-dialog').close()");
  await navigate('/2026/06/10/esp32-first-led/');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Mobile code block overflow');await screenshot('article-mobile',true);
  await viewport(320,740);await navigate('/');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Small mobile overflow');
  assert.deepEqual(errors,[],'Browser console errors');
  const report={status:'passed',checks:['desktop and 320/390px mobile layouts','all images loaded','category filtering and URL state','full text search and empty results','persistent dark mode','archive and taxonomy routes','article content, code and contents','mobile navigation and search','no browser errors'],screenshots:['desktop','mobile','search','article-dark','article-mobile']};
  await writeFile('.preview/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  await cdp('Browser.close').catch(()=>{});
} finally {if(ws?.readyState===WebSocket.OPEN)ws.close();browser.kill();}
