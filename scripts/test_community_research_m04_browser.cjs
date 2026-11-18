'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort('blockedbyclient'));
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto('http://127.0.0.1:4173/my-research.html',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#myResearchBoard').isVisible(),false,'Default-off author records must be hidden');
   await page.evaluate(()=>{
    const D='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',P='11111111-1111-4111-8111-111111111111',W='22222222-2222-4222-8222-222222222222';
    const clone=o=>JSON.parse(JSON.stringify(o));
    window.__m04={account:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',saveCalls:0,withdrawCalls:0,
      draft:{id:D,title:'Independent source evaluation',abstract:'An original report about archive evidence.',body:'Private source research before publication.',paper_type:'archive',source_urls:['https://www.archives.gov/research'],revision:1},
      papers:[
       {paperId:P,draftId:D,status:'published',currentEdition:2,title:'Source analysis with revisions',abstract:'A public research report with revised evidence.',type:'archive',sourceCount:1,publishedAt:'2026-11-18T10:20:00Z'},
       {paperId:W,draftId:null,status:'withdrawn',currentEdition:1,title:'Withdrawn investigation',abstract:'Retracted by its original author.',type:'case',sourceCount:1,publishedAt:'2026-11-17T10:20:00Z'}
      ]};
    window.DDCommunityResearchDrafts={
      enabled:true,
      listMine:async()=>window.__m04.account.startsWith('aaaaaaaa')?[clone(window.__m04.draft)]:[],
      getMine:async id=>id===D?clone(window.__m04.draft):null,
      saveMine:async(p,o)=>{
        if(o.id!==D||o.expectedRevision!==window.__m04.draft.revision)throw Error('Revision conflict');
        window.__m04.saveCalls++;
        window.__m04.draft={...p,id:D,revision:o.expectedRevision+1};
        return clone(window.__m04.draft);
      }
    };
    window.DDCommunityResearchRecovery={
      enabled:true,account:async()=>window.__m04.account,
      listMyPapers:async({page=0,pageSize=20}={})=>window.__m04.account.startsWith('aaaaaaaa')?
        clone(window.__m04.papers.slice(page*pageSize,(page+1)*pageSize)):[],
      listEditions:async id=>{
        if(id!==P)return [{edition:1,title:'Withdrawn investigation',abstract:'An earlier report.',body:'Withdrawn content accessible only to author.',type:'case',sourceUrls:['https://www.archives.gov/research'],publishedAt:'2026-11-17T10:00:00Z'}];
        return [
          {edition:2,title:'Source analysis with revisions',abstract:'Corrected.',body:'Latest published edition is edition two.',type:'archive',sourceUrls:['https://www.archives.gov/research'],publishedAt:'2026-11-18T10:00:00Z'},
          {edition:1,title:'Original source analysis',abstract:'Original.',body:'First published edition remains immutable.',type:'archive',sourceUrls:['https://www.archives.gov/research'],publishedAt:'2026-11-17T10:00:00Z'}
        ];
      }
    };
    window.DDCommunityResearchPublication={enabled:true,withdrawPaper:async v=>{
      if(v.paperId!==P||v.edition!==2||v.consent!==true)throw Error('Unauthorized withdrawal');
      window.__m04.withdrawCalls++;
      window.__m04.papers[0].status='withdrawn';
      return {paperId:P,edition:2,status:'withdrawn'};
    }};
   });
   await page.addScriptTag({url:'http://127.0.0.1:4173/assets/community-research-dashboard.js'});
   await page.locator('#myResearchCount').filter({hasText:'recently saved private drafts'}).waitFor();
   assert.equal(await page.locator('#myResearchRecords .item').count(),1);
   await page.getByRole('button',{name:'Review private draft'}).click();
   assert.match(await page.locator('#myResearchDetailText').innerText(),/Private source research/);
   await page.locator('#myResearchDraftText').fill('Updated independent private research, never an automatic public change.');
   await page.locator('#myResearchDraftSave').click();
   await page.locator('#myResearchDraftStatus').filter({hasText:'Saved private revision 2'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__m04.saveCalls),1);
   await page.locator('#myResearchPublishedTab').click();
   assert.equal(await page.locator('#myResearchRecords .item').count(),1);
   await page.getByRole('button',{name:'View editions and manage'}).click();
   assert.equal(await page.locator('#myResearchEditionPicker option').count(),2);
   assert.match(await page.locator('#myResearchDetailText').innerText(),/Latest published edition/);
   await page.locator('#myResearchEditionPicker').selectOption('1');
   assert.match(await page.locator('#myResearchDetailText').innerText(),/First published edition/);
   await page.locator('#myResearchWithdrawType').fill('no');
   await page.locator('#myResearchWithdrawConfirm').check();
   await page.locator('#myResearchWithdrawButton').click();
   await page.locator('#myResearchEditionStatus').filter({hasText:'Type WITHDRAW'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__m04.withdrawCalls),0);
   await page.locator('#myResearchWithdrawType').fill('WITHDRAW');
   await page.locator('#myResearchWithdrawButton').click();
   await page.locator('#myResearchCount').filter({hasText:'Withdrawal confirmed by server'}).waitFor();
   assert.equal(await page.locator('#myResearchWithdrawnTab').getAttribute('aria-selected'),'true');
   assert.equal(await page.evaluate(()=>window.__m04.withdrawCalls),1);
   assert.equal(await page.locator('#myResearchRecords .item').count(),2);
   await page.locator('#myResearchDraftTab').click();
   await page.getByRole('button',{name:'Review private draft'}).click();
   await page.evaluate(()=>{
    window.__m04.account='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    window.dispatchEvent(new Event('focus'));
   });
   await page.locator('#myResearchAvailability').filter({hasText:'Account changed'}).waitFor();
   assert.equal(await page.locator('#myResearchDetailText').innerText(),'');
   const overflow=await page.evaluate(()=>({s:document.documentElement.scrollWidth,w:document.documentElement.clientWidth}));
   assert(overflow.s<=overflow.w+2,'Horizontal overflow '+width+' '+JSON.stringify(overflow));
   assert.deepEqual(errors,[],'Browser errors '+width);
   await ctx.close();
  }
  console.log('PASS M04 Chrome: four viewports, private saved revision, two published editions, guarded withdrawal, account switch and no research leakage.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
