'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({
  executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
 });
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    return u.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error.message||error)));
   await page.goto(base+'/community-research.html',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#researchM03Panel').isVisible(),false,
    'M03 must be strictly hidden on default test host while backend disabled');
   assert.equal(await page.locator('#researchM03Save').isEnabled(),false);
   await page.evaluate(()=>{
    const ID='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',PAPER='11111111-1111-4111-8111-111111111111';
    window.__m03={private:null,paper:null,saveCalls:[],published:[],withdrawn:[]};
    window.DDCommunityResearchDrafts={
     enabled:true,
     saveMine:async(value,opts={})=>{
      window.__m03.saveCalls.push({value,opts});
      const revision=opts.id?(window.__m03.private.revision+1):1;
      if(opts.id&&opts.id!==ID)throw Error('Unexpected draft');
      const saved={...value,id:ID,revision};
      window.__m03.private=saved;
      return structuredClone(saved);
     },
     getMine:async id=>id===ID?structuredClone(window.__m03.private):null
    };
    window.DDCommunityResearchPublication={
     enabled:true,
     publishDraft:async options=>{
      if(options.consent!==true)throw Error('Missing final public consent');
      window.__m03.published.push(options);
      if(options.paperId!==null&&options.paperId!==PAPER)throw Error('Paper linkage lost');
      const paper={paperId:PAPER,edition:options.edition===null?1:options.edition+1,status:'published'};
      window.__m03.paper=paper;
      return structuredClone(paper);
     },
     withdrawPaper:async options=>{
      if(options.consent!==true||options.paperId!==PAPER)throw Error('Unexpected withdrawal');
      window.__m03.withdrawn.push(options);
      return {paperId:PAPER,edition:options.edition,status:'withdrawn'};
     }
    };
   });
   await page.addScriptTag({url:base+'/assets/community-research-author-workflow.js'});
   assert.equal(await page.locator('#researchM03Panel').isVisible(),false,'Panel inside still-hidden preview');
   assert.equal(await page.locator('#researchM03Panel').getAttribute('hidden'),null,'Controlled author controls must be un-hidden when enabled');
   await page.locator('#beginDraft').click();
   await page.locator('#researchTitle').fill('The source document and alternative explanations');
   await page.locator('#researchAbstract').fill('This independently written report compares original sources, identifies limitations and documents possible alternatives.');
   await page.locator('#researchBody').fill('This original investigation documents a case and the limits of the available evidence. '.repeat(6));
   await page.locator('#researchSources').fill('https://www.archives.gov/research');
   await page.locator('#researchOriginal').check();
   await page.locator('#researchConsent').check();
   await page.locator('#reviewDraft').click();
   assert.equal(await page.locator('#researchPreview').isVisible(),true);
   assert.equal(await page.locator('#researchM03Save').isEnabled(),true);
   assert.equal(await page.locator('#researchM03Publish').isEnabled(),false);
   await page.locator('#researchM03Save').click();
   await page.locator('#researchM03Saved').filter({hasText:'revision 1'}).waitFor();
   assert.equal(await page.locator('#researchM03Publish').isEnabled(),false,'Save is never consent to publish');
   assert.equal(await page.locator('#researchM03Consent').isChecked(),false);
   await page.locator('#researchM03Consent').check();
   assert.equal(await page.locator('#researchM03Publish').isEnabled(),true);
   await page.locator('#researchM03Publish').click();
   await page.locator('#researchM03Status').filter({hasText:'Edition 1 confirmed published'}).waitFor();
   assert.equal(await page.locator('#researchM03Consent').isChecked(),false,'Per-edition consent reset after publish');
   const first=await page.evaluate(()=>window.__m03.published);
   assert.equal(first.length,1);
   assert.equal(first[0].revision,1);
   assert.equal(first[0].paperId,null);
   assert.equal(first[0].consent,true);

   // Revision must reuse same private ID and advance edition; original is never modified.
   await page.locator('#editDraft').click();
   await page.locator('#researchBody').fill('The corrected investigation includes newly located primary source correspondence. '.repeat(6));
   await page.locator('#reviewDraft').click();
   await page.locator('#researchM03Save').click();
   await page.locator('#researchM03Saved').filter({hasText:'revision 2'}).waitFor();
   await page.locator('#researchM03Consent').check();
   await page.locator('#researchM03Publish').click();
   await page.locator('#researchM03Status').filter({hasText:'Edition 2 confirmed published'}).waitFor();
   const result=await page.evaluate(()=>({saves:window.__m03.saveCalls,published:window.__m03.published}));
   assert.equal(result.saves[1].opts.id,'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa');
   assert.equal(result.saves[1].opts.expectedRevision,1);
   assert.equal(result.published[1].paperId,'11111111-1111-4111-8111-111111111111');
   assert.equal(result.published[1].edition,1);
   assert.equal(result.published[1].revision,2);
   assert.equal(await page.locator('#researchM03WithdrawArea').isVisible(),true);
   await page.locator('#researchM03WithdrawText').fill('wrong');
   await page.locator('#researchM03WithdrawConsent').check();
   await page.locator('#researchM03Withdraw').click();
   await page.locator('#researchM03Status').filter({hasText:'Type WITHDRAW'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__m03.withdrawn.length),0);
   await page.locator('#researchM03WithdrawText').fill('WITHDRAW');
   await page.locator('#researchM03Withdraw').click();
   await page.locator('#researchM03Status').filter({hasText:'Withdrawal confirmed'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__m03.withdrawn.length),1);
   assert.equal(await page.locator('#researchM03WithdrawArea').isVisible(),false);
   const pageWidth=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
   assert(pageWidth.scroll<=pageWidth.view+2,'Horizontal overflow at '+width+': '+JSON.stringify(pageWidth));
   assert.deepEqual(errors,[],'No browser JS errors at '+width);
   await context.close();
  }
  console.log('PASS M03 Chrome: 320/393/820/1280, real author controls off by default, private readback then explicit publish, same draft revision, separate withdrawal, no horizontal overflow');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
