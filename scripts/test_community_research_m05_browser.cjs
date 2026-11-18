'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:820},locale:'en-GB'});
   await ctx.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4173'?r.continue():r.abort('blockedbyclient'));
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:4173/my-research.html',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#myResearchBoard').isVisible(),false);
   await page.evaluate(()=>{
    const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const docs=Array.from({length:65},(_,i)=>({
     id:'a0000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),
     title:'My private source report '+(i+1),
     abstract:'An independently attributed research document and investigation.',
     revision:1,paper_type:'archive',
     body:'SECRET AUTHOR DRAFT TEXT '+(i+1),
     source_urls:['https://www.archives.gov/research']
    }));
    window.__m05={owner:A,pages:[],docs,logout:false};
    window.DDCommunityResearchDrafts={
     enabled:true,
     listMinePaged:async({page=0,pageSize=20}={})=>{
      const owner=window.__m05.owner;
      window.__m05.pages.push({owner,page});
      if(owner!==A)return {items:[],hasMore:false,page};
      return {items:docs.slice(page*pageSize,(page+1)*pageSize)
       .map(({body,source_urls,...rest})=>rest),
       hasMore:(page+1)*pageSize<docs.length,page};
     },
     getMine:async id=>window.__m05.owner===A?docs.find(d=>d.id===id):null,
     saveMine:async()=>{throw Error('No save triggered in archive pagination test');}
    };
    window.DDCommunityResearchRecovery={
     enabled:true,
     account:async()=>{if(window.__m05.logout)throw Error('Session expired');return window.__m05.owner},
     listMyPapers:async()=>[],
     listEditions:async()=>[]
    };
    window.DDCommunityResearchPublication={enabled:true,withdrawPaper:async()=>{throw Error('No withdrawal permitted')}};
   });
   await page.addScriptTag({url:'http://127.0.0.1:4173/assets/community-research-dashboard.js'});
   await page.locator('#myResearchCount').filter({hasText:'Private-draft page 1'}).waitFor();
   assert.equal(await page.locator('#myResearchRecords .item').count(),20);
   assert.equal(await page.locator('#myResearchNext').isEnabled(),true);
   await page.locator('#myResearchNext').click();
   await page.locator('#myResearchCount').filter({hasText:'Private-draft page 2'}).waitFor();
   assert.equal(await page.locator('#myResearchRecords .item').count(),20);
   await page.locator('#myResearchNext').click();
   await page.locator('#myResearchCount').filter({hasText:'Private-draft page 3'}).waitFor();
   assert.equal(await page.locator('#myResearchRecords .item').count(),20);
   await page.locator('#myResearchNext').click();
   await page.locator('#myResearchCount').filter({hasText:'Private-draft page 4'}).waitFor();
   assert.equal(await page.locator('#myResearchRecords .item').count(),5);
   assert.equal(await page.locator('#myResearchNext').isEnabled(),false);
   assert.equal(await page.locator('#myResearchPrev').isEnabled(),true);
   await page.getByRole('button',{name:'Review private draft'}).first().click();
   assert.match(await page.locator('#myResearchDetailText').innerText(),/SECRET AUTHOR DRAFT TEXT/);
   assert.match(await page.locator('#myResearchDraftText').inputValue(),/SECRET AUTHOR DRAFT TEXT/);
   await page.locator('#myResearchClose').click();
   assert.equal(await page.locator('#myResearchDraftText').inputValue(),'','Private text remained in hidden editor input');
   assert.equal(await page.locator('#myResearchDraftTitle').inputValue(),'');
   await page.getByRole('button',{name:'Review private draft'}).first().click();
   await page.evaluate(()=>{
    window.__m05.owner='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    window.dispatchEvent(new Event('focus'));
   });
   await page.locator('#myResearchAvailability').filter({hasText:'Account changed'}).waitFor();
   assert.equal(await page.locator('#myResearchDetailText').innerText(),'');
   assert.equal(await page.locator('#myResearchDraftText').inputValue(),'','Account switch left private input text');
   assert.equal(await page.locator('#myResearchRecords .item').count(),0);
   const geom=await page.evaluate(()=>({s:document.documentElement.scrollWidth,w:document.documentElement.clientWidth}));
   assert(geom.s<=geom.w+2,'Horizontal overflow at '+width);
   assert.deepEqual(errors,[],String(errors));
   await ctx.close();
  }
  console.log('PASS M05 Chrome: >50 drafts across four pages, on-demand private text, editor clearing, account switching and 320/393/820/1280 responsive layout.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
