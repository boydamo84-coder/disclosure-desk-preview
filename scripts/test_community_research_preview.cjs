'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const {publicationDraft}=require('../docs/community-research/publication-draft.js');
const core={title:'Example',abstract:'Summary',category:'Case analysis',sections:[{title:'Public section',text:'Public content',privateNote:'DO NOT EXPORT'}],citations:[{title:'Source',url:'https://example.org/record'}],privateBoard:'DO NOT EXPORT'};
assert.ok(!JSON.stringify(publicationDraft(core)).includes('DO NOT EXPORT'));
assert.throws(()=>publicationDraft({...core,sections:[]}),/sections/);
assert.throws(()=>publicationDraft({...core,citations:[{title:'Bad',url:'javascript:alert(1)'}]}),/HTTPS/);
assert.throws(()=>publicationDraft({...core,citations:[{title:'Bad',url:'https://127.0.0.1/private'}]}),/HTTPS/);
assert.deepEqual(publicationDraft({...core,citations:[...core.citations,...core.citations]}).citations,core.citations);
assert.ok(fs.readFileSync('assets/community-test-config.js','utf8').includes('researchPublishing:false'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,1280]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const external=[];await page.route(/^https?:\/\//,r=>{external.push(r.request().url());return r.abort()});
   await page.goto(pathToFileURL(path.resolve('docs/community-research/library-preview.html')).href);
   assert.equal(await page.locator('article').count(),2);
   await page.locator('#search').fill('chronology');assert.equal(await page.locator('article').count(),1);
   await page.getByRole('button',{name:'Like · 0',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Like · 1',exact:true}).getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Dislike · 0',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Like · 0',exact:true}).getAttribute('aria-pressed'),'false');
   await page.getByRole('button',{name:'Save to sample Board'}).click();
   assert.ok(await page.getByRole('button',{name:'Remove from sample Board'}).isVisible());
   await page.locator('summary').click();
   await page.getByRole('textbox',{name:'Sample comment'}).fill('Test local comment');
   await page.getByRole('button',{name:'Add local comment'}).click();
   assert.match(await page.locator('summary').innerText(),/1/);
   await page.locator('#wne').click();
   await page.locator('#title').fill('Test report');await page.locator('#abstract').fill('Test abstract');
   await page.locator('#preview').click();assert.match(await page.locator('#status').innerText(),/permission/);
   await page.locator('#consent').check();await page.locator('#preview').click();
   assert.match(await page.locator('#status').innerText(),/disabled/);
   await page.locator('#close').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(external,[]);
   await page.close();
  }
  console.log('PASS local library interactions, consent preview, narrow layout and no network; public flag remains off');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
