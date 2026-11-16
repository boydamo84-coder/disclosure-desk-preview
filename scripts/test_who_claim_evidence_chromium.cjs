'use strict';
// Who's Who provisional claim evidence: local-only real Chromium QA.
// Never visits publisher URLs, talks to Supabase, modifies accounts, or enables voting.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const profiles=[
 {name:'David Grusch',kind:'claim',text:'July 2023',minSources:3,audit:true},
 {name:'Ryan Graves',kind:'claim',text:'July 2023',minSources:4,audit:true},
 {name:'David Fravor',kind:'claim',text:'July 2023',minSources:4,audit:true},
 {name:'Tim Gallaudet',kind:'claim',text:'November 2024',minSources:4,audit:true},
 {name:'Luis Elizondo',kind:'claim',text:'November 2024',minSources:4,audit:true},
 {name:'Michael Shellenberger',kind:'claim',text:'November 2024',minSources:4,audit:true},
 {name:'Mick West',kind:'claim',text:'2022',minSources:3,audit:true},
 {name:'Avi Loeb',kind:'claim',text:'2024',minSources:4,audit:true},
 {name:'Garry Nolan',kind:'claim',text:'2022',minSources:4,audit:true},
 {name:'Jacques Vallée',kind:'claim',text:'2022',minSources:4,audit:true},
 {name:'Kevin Knuth',kind:'claim',text:'2019',minSources:4,audit:true},
 {name:'Ross Coulthart',kind:'claim',text:'July 2023',minSources:4,audit:true},
 {name:'Jeremy Corbell',kind:'claim',text:'2021',minSources:4,audit:true},
 {name:'Steven Greer',kind:'claim',text:'2001',minSources:4,audit:true},
 {name:'George Knapp',kind:'claim',text:'September 2025',minSources:4,audit:true},
 {name:'Bob Lazar',kind:'claim',text:'1989',minSources:4,audit:true},
 {name:'Jake Barber',kind:'claim',text:'2025',minSources:3,audit:true},
 {name:'Larry Warren',kind:'claim',text:'Rendlesham',minSources:4,audit:true},
 {name:'Christopher Mellon',kind:'claim',text:'October 2025',minSources:4,audit:true},
 {name:'James Fox',kind:'claim',text:'Moment of Contact',minSources:4,audit:true},
 {name:'Nick Pope',kind:'claim',text:'Rendlesham',minSources:4,audit:true},
 {name:'Leslie Kean',kind:'claim',text:'June 2023',minSources:4,audit:true},
 {name:'John Greenewald Jr.',kind:'work',text:'government',minSources:4},
 {name:'David Spergel',kind:'role',text:'NASA',minSources:2},
 {name:'Daniel Evans',kind:'role',text:'NASA',minSources:2},
 {name:'Anna Paulina Luna',kind:'role',text:'House',minSources:3},
 {name:'Tim Burchett',kind:'role',text:'House',minSources:3},
 {name:'Chuck Schumer',kind:'role',text:'proposal',minSources:3},
 {name:'Jared Moskowitz',kind:'role',text:'House',minSources:2},
 {name:'Mike Gold',kind:'policy',text:'NASA',minSources:4,audit:true}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===BASE)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded',timeout:30000});
   // Track real pointer/click delivery and Back events when a rapid browse cycle fails.
   await page.evaluate(()=>{
    window.__whoProfileTrace=[];
    const record=(what,extra)=>window.__whoProfileTrace.push({
     what,...extra,url:location.search,selected:document.querySelector('#profileName')?.textContent,
     directoryVisible:!document.querySelector('#directoryPage')?.classList.contains('hidden'),
     stamp:Math.round(performance.now())
    });
    document.addEventListener('pointerdown',event=>{
     const card=event.target?.closest?.('#peopleCards [data-person-id]');
     record('capture-pointerdown',{tag:event.target?.tagName,id:event.target?.id,
      targetClass:String(event.target?.className||'').slice(0,80),
      card:card?.dataset.personId||null,x:Math.round(event.clientX),y:Math.round(event.clientY)});
    },true);
    document.addEventListener('click',event=>{
     const button=event.target?.closest?.('#peopleCards [data-person-id] button');
     const id=button?.closest('[data-person-id]')?.dataset.personId||null;
     record('document-click',{id,tag:event.target?.tagName,targetId:event.target?.id,
      targetClass:String(event.target?.className||'').slice(0,80),
      x:Math.round(event.clientX),y:Math.round(event.clientY)});
     if(button)queueMicrotask(()=>record('after-card-click-microtask',{id}));
    },true);
    window.addEventListener('popstate',()=>record('popstate-capture',{}),true);
   });
   await page.locator('#peopleCards article.card').first().waitFor({timeout:30000});
   assert.equal(await page.locator('#peopleCards article.card').count(),50,'Directory retains 50 original people');
   const dock=page.locator('#ddWebSecondaryNav');
   await dock.waitFor({state:'visible'});
   assert.equal(await dock.locator('.tab').count(),14,'Keep original premium fourteen-tab nav');
   assert.equal(await dock.locator('.tab[aria-current="page"]').getAttribute('data-tab'),'peopleDirectory');
   let list=width===393?profiles:profiles.filter(p=>['David Grusch','David Fravor','Tim Gallaudet','Mick West','Avi Loeb','Garry Nolan','Jacques Vallée','Kevin Knuth','Ross Coulthart','Jeremy Corbell','Steven Greer','George Knapp','Bob Lazar','Jake Barber','Larry Warren','Nick Pope','Christopher Mellon','James Fox','Leslie Kean','John Greenewald Jr.','David Spergel','Mike Gold'].includes(p.name));
   for(const test of list){
    await page.locator('#peopleSearch').fill(test.name);
    const cards=page.locator('#peopleCards article.card');
    const matching=cards.filter({has:page.getByRole('heading',{name:test.name,exact:true})});
    assert.equal(await matching.count(),1,'Search results include one exact named profile for '+test.name);
    console.log('Opening Who evidence profile',width,test.name,'page',new URL(page.url()).search);
    // A human must scroll a button clear of the fixed bottom dock to tap it.
    // Ensure the automated pointer gesture targets that same unobscured area.
    const profileButton=matching.locator('button').first();
    await profileButton.evaluate(button=>{
     button.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
     const dock=document.querySelector('#ddWebSecondaryNav');
     if(!dock||getComputedStyle(dock).display==='none')return;
     const safeBottom=dock.getBoundingClientRect().top-18;
     const rect=button.getBoundingClientRect();
     if(rect.bottom>safeBottom)window.scrollBy({top:rect.bottom-safeBottom,behavior:'instant'});
    });
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const tap=await profileButton.evaluate(button=>{
     const rect=button.getBoundingClientRect();
     const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
     const hit=document.elementFromPoint(x,y),dock=document.querySelector('#ddWebSecondaryNav');
     return {ok:hit===button||button.contains(hit),
      button:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom},
      hit:{tag:hit?.tagName,id:hit?.id,cls:String(hit?.className||'').slice(0,100)},
      dockTop:dock?.getBoundingClientRect().top,scrollY,viewportHeight:innerHeight,
      totalScrollHeight:document.documentElement.scrollHeight};
    });
    if(!tap.ok)console.error('UNSAFE PROFILE TAP DIAGNOSTICS',JSON.stringify({width,name:test.name,...tap}));
    assert.equal(tap.ok,true,'Profile action needs a usable tap area above the fixed dock');
    await profileButton.click();
    try{
     await page.locator('#personProfile').waitFor({state:'visible',timeout:12000});
    }catch(error){
     console.error('Profile open diagnostics',JSON.stringify({
      width,name:test.name,url:page.url(),
      profileName:await page.locator('#profileName').textContent(),
      hasHidden:await page.locator('#personProfile').evaluate(el=>el.classList.contains('hidden')),
      directoryVisible:await page.locator('#directoryPage').isVisible(),
      historyState:await page.evaluate(()=>history.state),
      cardCount:await page.locator('#peopleCards article.card').count(),
      trace:await page.evaluate(()=>window.__whoProfileTrace?.slice(-50)),
      centerHit:await matching.locator('button').first().evaluate(btn=>{
       const box=btn.getBoundingClientRect();const el=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
       return {button:{left:box.left,top:box.top,width:box.width,height:box.height},
        hit:{tag:el?.tagName,id:el?.id,cls:String(el?.className||'').slice(0,100)}};
      }),
      jsErrors:errors.slice(-8)
     }));
     throw error;
    }
    assert.equal(await page.locator('#profileName').innerText(),test.name);
    const host=page.locator('#profileEvidenceReviews');
    if(test.kind==='role' || test.kind==='work'){
     const scope=host.locator('.claim-scope-review');
     assert.equal(await scope.count(),1,'Unscored role and FOIA sources have exactly one explicit research-scope explanation');
     assert.match(await scope.innerText(),/Not applicable to the documented role or work/,'Not a personal 0\/100 rating');
     assert.equal(await host.locator('.claim-score, [data-evidence-claim-id], [data-rating-save]').count(),0,
      'Role-only/source-only record must never show real numerical score or interactive vote');
     await scope.locator('summary').click();
     assert.equal(await scope.locator('.claim-evidence-list li').count(),test.minSources,
      'Reader sees the source locations used for this scope decision');
     assert.equal(await scope.locator('a[href^="https://"]').count(),test.minSources);
     assert.match(await scope.innerText(),/further evidence could change the scope/i,
      'No-scoring policy must be revisitable for separate, genuinely attributable claim');
    }
    if(test.kind==='claim'){
     assert.equal(await host.locator('.claim-review').count(),1,test.name+' gets one specifically attributed claim');
     assert.match(await host.innerText(),test.name==='Christopher Mellon'?/Not applicable/:/Not assessed/,'No editor-approved real incident score');
     assert.match(await host.innerText(),test.name==='Christopher Mellon'?/Incident evidence votes do not apply/:/Voting not open/,
      'Records-access and policy claims must have no incident ballot; other pending claims must disable voting');
     assert.match(await host.innerText(),new RegExp(test.text,'i'),'Exact claim is present in profile');
     const detail=host.locator('.claim-review .claim-evidence-details');
     await detail.locator(':scope > summary').click();
     if(test.audit){
      const audit=detail.locator('.claim-audit-draft');
      assert.equal(await audit.count(),1,'Original government record comparison is visible for '+test.name);
      assert.match(await audit.innerText(),/Unsigned research check/);
      assert.match(await audit.innerText(),/Independent second-editor signoff: Pending/);
      assert.match(await audit.innerText(),/What remains unavailable or unverified/);
      assert.equal(await audit.locator('a[href^="https://"]').count(),1,'Original document available to readers');
      const triage=detail.locator('.claim-readiness-draft');
      assert.equal(await triage.count(),1,'Individual scoring readiness classification visible');
      assert.match(await triage.innerText(),/Independent reviewer: Not assigned/);
      assert.match(await triage.innerText(),/Approval: withheld/);
      assert.match(await triage.innerText(),/Before any rating/);
      assert.equal(await triage.locator('input,button,[data-rating-save]').count(),0,'Triage must not open voting');
      const accessPanel=detail.locator('.claim-source-access');
      assert.equal(await accessPanel.count(),1,'Reader exposes original-source accessibility check for '+test.name);
      assert.match(await accessPanel.innerText(),/Full original reviewed: No/);
      assert.match(await accessPanel.innerText(),/Independent approval: Pending/);
      assert.equal(await accessPanel.locator('a[href^="https://"]').count()>=1,true,'Original source link retained');
      assert.equal(await accessPanel.locator('button,input,[data-rating-save]').count(),0,'Original access check cannot create a vote');
      if(test.name==='Larry Warren')assert.match(await accessPanel.innerText(),/Publisher video and chapter metadata checked/);
      if(['David Grusch','Ryan Graves','David Fravor','Luis Elizondo','Tim Gallaudet','Michael Shellenberger'].includes(test.name)){
       assert.match(await accessPanel.innerText(),/Government hearing transcript text accessible/);
       assert.match(await accessPanel.innerText(),/Where in source/);
      }
      if(test.name==='Leslie Kean')assert.match(await accessPanel.innerText(),/Original signed publisher article accessible/);
      if(test.name==='Kevin Knuth')assert.match(await accessPanel.innerText(),/Original paper abstract accessible/);
      const newM18=[
       ['Jeremy Corbell',/Original broadcast interview transcript accessible/],
       ['George Knapp',/Original House written testimony PDF — selected pages visually inspected/],
       ['Mick West',/Original technical analysis post and model links accessible/],
       ['Christopher Mellon',/Original author policy opinion accessible/],
       ['Avi Loeb',/Original peer-reviewed PDF — selected pages visually inspected/],
       ['Steven Greer',/Contemporaneous publisher report accessible/],
       ['James Fox',/Original filmmaker interviews accessible/]
      ];
      const expectation=newM18.find(([name])=>name===test.name);
      if(expectation){
       assert.match(await accessPanel.innerText(),expectation[1],'M18 exact source-access scope displayed');
       assert.match(await accessPanel.innerText(),/Where in source/,'Exact original text/page locator visible');
       assert.match(await accessPanel.innerText(),/Full original reviewed: No/,'Full original case not wrongly approved');
      }
      if(test.name==='Avi Loeb')assert.match(await accessPanel.innerText(),/figures 15–16/,'Loeb chart and original paper scope cited');
      if(['Garry Nolan','Jacques Vallée'].includes(test.name)){
       assert.match(await accessPanel.innerText(),/Journal article indexed, original publisher direct access blocked/,'Honest ScienceDirect blocking');
       assert.match(await accessPanel.innerText(),/one coauthored paper and one parent sample/,'Nolan and Vallee material not independently duplicated');
      }
      if(test.name==='Nick Pope'){
       assert.match(await accessPanel.innerText(),/Original author essay directly accessible/,'M21 direct Nick Pope original essay now readable');
       assert.match(await accessPanel.innerText(),/1980 sightings took place before his MoD service/,'Access does not convert Pope into 1980 eyewitness');
       assert.match(await accessPanel.innerText(),/Full original reviewed: No/,'Nick Pope authored page opened but original 1980 case not independently verified');
      }
      if(['Ross Coulthart','Jake Barber','Bob Lazar'].includes(test.name))
       assert.match(await accessPanel.innerText(),/Original-source access unavailable/);
      if(test.name==='Christopher Mellon')assert.match(await triage.innerText(),/Not applicable to an incident evidence percentage/);
     }
     await detail.locator('.claim-evidence-list li').first().waitFor({state:'visible'});
     assert.equal(await detail.locator('.claim-evidence-list li').count()>=test.minSources,true,
      'Readers can inspect '+test.minSources+' source locations');
     assert.equal(await detail.locator('a[href^="https://"]').count()>=test.minSources,true,
      'All source items expose original HTTPS links');
     assert.equal(await host.locator('[data-evidence-claim-id]').count(),0,
      'No community voting backend control for draft claim');
     if(test.name==='Avi Loeb'){
      const links=await detail.locator('.claim-evidence-list a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
      assert(links.some(x=>x.includes('S0009254125000178')),'Readers see 2025 Loeb coauthored response');
      assert(links.some(x=>x.includes('S000925412500018X')),'Readers see different author independent 2025 volcanic challenge');
      assert.match(await detail.innerText(),/no recovered material can be definitively attributed to IM1/i);
     }
     if(test.name==='Garry Nolan'||test.name==='Jacques Vallée'){
      assert.match(await detail.innerText(),/terrestrial-normal isotope ratios|terrestrial values|terrestrial normal/i,
       'Same study displays limits of isotope observations');
     }
     if(test.name==='Kevin Knuth')assert.match(await detail.innerText(),/0\.78 seconds/i,'Conditional time assumption visible');

    }else if(test.kind==='role'){
     assert.equal(await host.locator('.claim-review').count(),0,'Documented government/science role does not fabricate event claim');
     assert.equal(await host.locator('.claim-role-card').count(),2,'Original institution records plus independent scope decision');
    }else if(test.kind==='policy'){
     assert.match(await host.innerText(),/Not applicable/,'Policy proposals never receive UAP-event scores');
     const detail=host.locator('.claim-review .claim-evidence-details');
     await detail.locator(':scope > summary').click();
     assert.equal(await detail.locator('.claim-audit-draft').count(),1,'Policy source comparison still visible without a numerical rating');
     assert.match(await detail.locator('.claim-audit-draft').innerText(),/Unsigned research check/);
     assert.equal(await detail.locator('.claim-readiness-draft').count(),1,'Policy recommendation still exposes its evidence-scoring reason');
     assert.equal(await detail.locator('.claim-source-access').count(),1,'Policy recommendation retains honest original access status');
     assert.match(await detail.locator('.claim-readiness-draft').innerText(),/Not applicable to an incident evidence percentage/);
     assert.equal(await host.locator('[data-evidence-claim-id]').count(),0);
    }else{
     assert.equal(await host.locator('.claim-review').count(),0,'FOIA archivist has no forced event claim');
     const work=host.locator('.claim-work-card');
     assert.equal(await work.count(),1);
     await work.locator('summary').click();
     await work.locator('.claim-evidence-list li').first().waitFor({state:'visible'});
     assert.equal(await work.locator('.claim-evidence-list li').count(),4,'Four inspectable FOIA/publisher records');
     const hrefs=await work.locator('.claim-evidence-list a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
     assert(hrefs.some(x=>x.includes('DODOIG-2023-000010.pdf')));
     assert(hrefs.some(x=>x.includes('DF-2022-00013-MDR_Log')));
     assert.equal(await host.locator('[data-evidence-claim-id]').count(),0);
    }
    let extent=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    if(extent.scroll>extent.inner+4){
     const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(node=>{
      const rect=node.getBoundingClientRect();
      return {tag:node.tagName,id:node.id,cls:String(node.className||'').slice(0,90),
       left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),
       scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,text:String(node.textContent||'').trim().slice(0,80)};
     }).filter(e=>e.right>window.innerWidth+4 && e.width>0 && e.left<window.innerWidth+4)
      .sort((a,b)=>b.right-a.right).slice(0,35));
     console.error('HORIZONTAL OVERFLOW DIAGNOSTICS',JSON.stringify({width,name:test.name,extent,offenders}));
    }
    assert(extent.scroll<=extent.inner+4,'No horizontal mobile overflow at '+width+'px on '+test.name);
    await page.locator('#directoryBack').click();
    await page.locator('#directoryPage').waitFor({state:'visible'});
    assert.equal(await dock.locator('.tab[aria-current="page"]').getAttribute('data-tab'),'peopleDirectory');
   }
   assert.deepEqual(errors,[],'No fatal page script errors on '+width+'px');
   await ctx.close();
   console.log('Who evidence browser acceptance OK '+width+'px; '+list.length+' profiles');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
