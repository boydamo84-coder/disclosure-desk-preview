'use strict';
// Browser acceptance for W.NE M34 branded confirm/notice/input modals.
// Runs on loopback only. No actual Supabase document, credentials or Netlify.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const writer=fs.readFileSync('research/wne.html','utf8');
const workspace=fs.readFileSync('research/research-workspace.html','utf8');
const library=fs.readFileSync('research/restore-library.html','utf8');
const importJs=fs.readFileSync('research/research-docx-import.js','utf8');
assert.match(writer,/src="\.\/wne-dialogs-m34\.js"/);
assert.match(workspace,/src="\.\/wne-dialogs-m34\.js"/);
assert.match(library,/src="\.\/wne-dialogs-m34\.js"/);
assert.match(importJs,/WNEDialogs\?\.notice/);
assert.doesNotMatch(writer,/(?<!\.)\b(?:alert|confirm|prompt)\s*\(/,'Writer must not contain native browser popups');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 let n=0;const pass=s=>{n++;console.log('PASS M34 BRANDED PROMPT '+s)};
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===393?852:800},isMobile:width===393,hasTouch:width===393,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    return u.origin==='http://127.0.0.1:4173'?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();
   const browserDialogs=[];page.on('dialog',async d=>{browserDialogs.push(d.type());await d.dismiss()});
   await page.goto('http://127.0.0.1:4173/research/restore-library.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.WNEDialogs?.confirm==='function',{timeout:6500});
   await page.evaluate(()=>{window.m34Result=null;
    window.WNEDialogs.confirm('Delete the current section? It will remain in checkpoint history.',{title:'Delete section',confirmLabel:'Delete section'}).then(v=>{window.m34Result=v})});
   const dialog=page.locator('dialog.wne-m34-prompt[open]');
   await dialog.waitFor();
   assert.equal(await dialog.locator('h2').innerText(),'Delete section');
   const bounds=await dialog.boundingBox();
   assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width+2,'Dialog fits viewport without horizontal clipping');
   assert.equal(await dialog.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(20, 42, 59)','Brand navy visible');
   await dialog.getByRole('button',{name:'Cancel'}).click();
   await page.waitForFunction(()=>window.m34Result===false);
   pass(width+'px cancelled destructive action, gold/navy modal in visible viewport');

   await page.evaluate(()=>{window.m34Result=null;window.WNEDialogs.confirm('Really remove item?',{title:'Confirm deletion'}).then(v=>{window.m34Result=v})});
   await dialog.getByRole('button',{name:'Continue'}).click();
   await page.waitForFunction(()=>window.m34Result===true);
   pass(width+'px explicit confirmation resolves true');

   await page.evaluate(()=>{window.m34Value='NOT SET';window.WNEDialogs.input('Enter secret for a new encrypted backup.',{secret:true,label:'Recovery password',title:'Backup password',maxLength:256}).then(v=>{window.m34Value=v})});
   await dialog.locator('input[type=password]').fill('example-long-password-not-real');
   assert.equal(await dialog.locator('input[type=text]').count(),0,'Password field is masked');
   await dialog.getByRole('button',{name:'Confirm'}).click();
   await page.waitForFunction(()=>window.m34Value==='example-long-password-not-real');
   pass(width+'px password masked and confirmed only through button');

   await page.evaluate(()=>{window.m34Value='NOT SET';window.WNEDialogs.input('Name your new document',{defaultValue:'New Research Document',title:'New report'}).then(v=>{window.m34Value=v})});
   const field=dialog.locator('input[type=text]');assert.equal(await field.inputValue(),'New Research Document');
   await dialog.getByRole('button',{name:'Cancel'}).click();
   await page.waitForFunction(()=>window.m34Value===null);
   pass(width+'px new document cancellation returns null, no write');
   await page.evaluate(()=>{window.m34Acknowledged=false;window.WNEDialogs.notice('Could not open <script>unsafe</script> document.',{title:'Safety warning'}).then(()=>{window.m34Acknowledged=true})});
   assert.equal(await dialog.locator('script').count(),0,'Message injected only as text');
   assert.match(await dialog.innerText(),/<script>unsafe<\/script>/);
   await dialog.getByRole('button',{name:'OK'}).click();
   await page.waitForFunction(()=>window.m34Acknowledged===true);
   assert.deepEqual(browserDialogs,[],'No native OS confirm/prompt/alert is invoked');
   pass(width+'px safety notice accessible with no HTML injection or OS pop-ups');
   await ctx.close();
  }
  console.log('PASS M34 BRANDED PROMPT TOTAL '+n+' real Chromium mobile/desktop assertions; NO DEPLOY');
 }finally{await browser.close();}
})().catch(e=>{console.error('FAIL M34 BRANDED PROMPTS',e.stack||e);process.exitCode=1});
