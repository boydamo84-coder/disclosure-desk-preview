'use strict';
// Real Chromium UX test against fictional page data; no outside network or real comments.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const {buildFixture}=require('./m73_owner_comments_fixture.cjs');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
   const errors=[];
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==BASE)return route.abort();
    if(url.pathname==='/__m74-dialog')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});
    return route.continue();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/__m74-dialog',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.DDConfirm);
   await page.evaluate(()=>{
    window.__m74Results=[];
    const trigger=document.createElement('button');
    trigger.id='m74ConfirmTrigger';trigger.type='button';trigger.textContent='Test confirmation';
    trigger.style.cssText='position:fixed;top:125px;left:14px;z-index:10000;min-height:44px';
    trigger.onclick=()=>void window.DDConfirm.show({
     title:'Delete your comment?',message:'This action cannot be undone. Existing replies may remain visible.',
     confirmText:'Delete comment'
    }).then(ok=>window.__m74Results.push(ok));
    document.body.append(trigger);
   });
   const trigger=page.locator('#m74ConfirmTrigger'),dialog=page.locator('dialog.dd-confirm-dialog');
   await trigger.click();
   await dialog.waitFor({state:'visible'});
   const layout=await dialog.evaluate(node=>{
    const r=node.getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight,
     outline:getComputedStyle(node).borderRadius,bodyScroll:document.documentElement.scrollWidth-innerWidth,
     cancelFocus:document.activeElement?.classList.contains('dd-confirm-cancel')};
   });
   assert(layout.left>=-1&&layout.right<=width+1&&layout.top>=0&&layout.bottom<=layout.height+1,
    'Confirm fits screen '+width+': '+JSON.stringify(layout));
   assert(layout.bodyScroll<=1,'Confirm must not widen page '+width);
   assert(layout.cancelFocus,'Safe Cancel has initial keyboard focus');
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>window.__m74Results.length===1);
   assert.equal(await page.evaluate(()=>window.__m74Results[0]),false,'Escape cancels');
   await trigger.click();
   await dialog.getByRole('button',{name:'Cancel'}).click();
   await page.waitForFunction(()=>window.__m74Results.length===2);
   assert.equal(await page.evaluate(()=>window.__m74Results[1]),false,'Cancel button cancels');
   await trigger.click();
   await dialog.getByRole('button',{name:'Delete comment'}).click();
   await page.waitForFunction(()=>window.__m74Results.length===3);
   assert.equal(await page.evaluate(()=>window.__m74Results[2]),true,'Confirm approves only on explicit action');
   await page.evaluate(()=>{
    document.getElementById('m74ConfirmTrigger').onclick=()=>void window.DDConfirm.show({
     title:'Delete this cloud document forever?',message:'Cannot be restored.',
     confirmText:'Delete forever',requiredPhrase:'DELETE'
    }).then(ok=>window.__m74Results.push(ok));
   });
   await trigger.click();
   const deleteForever=dialog.getByRole('button',{name:'Delete forever'});
   assert.equal(await deleteForever.isDisabled(),true,'Typed delete must initially be disabled');
   const input=dialog.locator('input.dd-confirm-phrase');
   await input.fill('delete');
   assert.equal(await deleteForever.isDisabled(),true,'Typed confirmation is case-sensitive');
   await input.fill('DELETE');
   assert.equal(await deleteForever.isEnabled(),true,'Exact DELETE enables action');
   await deleteForever.click();
   await page.waitForFunction(()=>window.__m74Results.length===4);
   assert.equal(await page.evaluate(()=>window.__m74Results[3]),true);
   assert.equal(await dialog.count(),0,'Dialog cleans up after action');
   assert.equal(errors.length,0,'No unexpected browser errors: '+errors.join(' | '));
   await context.close();
   console.log('PASS M74 branded confirmation Chromium '+width+'px, Cancel/Escape, confirm, typed delete, containment');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
