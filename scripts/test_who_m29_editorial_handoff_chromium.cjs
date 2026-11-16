'use strict';
// M29 real Chrome: user-visible source/criteria independence without any voting.
// All requests stay on the local test server; no Supabase, Netlify or site deploy.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:4173';
const data=JSON.parse(fs.readFileSync(path.join(root,'data/who-editorial-handoff-m29.json'),'utf8'));
const role=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'))
 .people.find(p=>p.evidenceScope&&!p.claimEvidence?.length);
assert(role,'Need a role-only user case to test no percentage and no handoff panel');
const samples=['david-fravor','garry-nolan','leslie-kean','larry-warren','mike-gold'];
const expectedRubric=5,expectedChecklist=6;
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());return u.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(String(err.message||err)));
   const targets=width===393?data.dockets.map(x=>x.personId):[...samples,role.id];
   for(const pid of targets){
    await page.goto(base+'/who-is-who.html?person='+pid,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:30000});
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Premium original navigation remains');
    const host=page.locator('#profileEvidenceReviews');
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
      'Never expose an unapproved score, vote or submission control');
    const dossier=data.dockets.find(x=>x.personId===pid);
    if(dossier){
     const outer=host.locator('.claim-review > .claim-evidence-details');
     assert.equal(await outer.count(),1,'Preserve existing evidence reader for '+pid);
     await outer.locator(':scope > summary').click();
     const pane=outer.locator('details[data-m29-editorial-handoff]');
     assert.equal(await pane.count(),1,'M29 editor transparency visible for '+pid);
     await pane.locator(':scope > summary').click();
     assert.equal(await pane.getAttribute('open'),'','Expanded handoff');
     const t=await pane.innerText();
     assert.match(t,/Reviewer handoff, NOT an editorial verdict/);
     assert.match(t,/Lead reviewer: unassigned/);
     assert.match(t,/Independent second human editor: unassigned/);
     assert.match(t,/community-vote and portrait permissions: withheld/);
     assert.match(t,/Source|source/);
     assert.match(t,/Original:/);
     const items=pane.locator('.claim-m29-criteria li');
     const isPolicy=dossier.suitability==='not_applicable_to_incident_evidence_score';
     assert.equal(await items.count(),isPolicy?expectedChecklist:expectedRubric+expectedChecklist,
       'Five future proposed rubric rows plus six unsigned checkboxes, or policy-only six checkboxes');
     if(isPolicy){
      assert.match(t,/Incident evidence percentage: Not applicable/);
      assert.doesNotMatch(t,/Five proposed evidence criteria/);
     }else{
      assert.match(t,/Five proposed evidence criteria — NO points assigned/);
      assert.match(t,/up to 30 potential points/);
     }
     const a=await pane.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
     assert(a.length>=1,'Original public record remains clickable');
     assert(a.every(u=>u.startsWith('https://')));
     if(pid==='garry-nolan')assert.match(t,/council-bluffs-1977-one-paper-100788/);
     if(pid==='leslie-kean')assert.match(t,/grusch-coulthart-2023-recovery-reporting-not-independent/);
     if(pid==='larry-warren')assert.match(t,/rendlesham-1980-distinct-nights-halt-warren-claims/);
     if(pid==='david-fravor')assert.match(t,/Reused URLs — NOT separate confirmation/);
    }else{
     assert.equal(await host.locator('details[data-m29-editorial-handoff]').count(),0,
       '27 documented roles do not gain person-believability or UAP incident docket');
    }
    const bound=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(bound.scroll<=bound.viewport+4,'No horizontal overflow at '+width+'px, '+pid);
   }
   assert.deepEqual(errors,[],'No fatal JavaScript failures at '+width+'px');
   await ctx.close();
   console.log('M29 Chromium reader PASS at '+width+'px: '+targets.length+
    ' audited panels / role-only exception, no scores, no user votes, no page overflow');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
