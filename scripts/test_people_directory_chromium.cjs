'use strict';
// Local loopback Chromium acceptance: mobile/desktop directory, shareable links,
// optional third-party YouTube iframe and browser Back. No real accounts.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===BASE)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#peopleCards article.card').first().waitFor();

   const dock=page.locator('#ddWebSecondaryNav');
   await dock.waitFor({state:'visible'});
   const dockIds=await dock.locator('.tab').evaluateAll(nodes=>nodes.map(n=>n.dataset.tab));
   assert.deepEqual(dockIds,[
    'discover','archivePage','peopleDirectory','researchStudio','mapPage',
    'clips','livePage','boards','witness','discussionsPage','watchRead',
    'chatPage','profilePage','hub'
   ],"Standalone Who's Who must show the ORIGINAL fourteen-tab editorial dock");
   assert.equal(await dock.locator('.tab.active[aria-current="page"]').getAttribute('data-tab'),
    'peopleDirectory',"Who's Who must remain highlighted in the dock");
   assert.equal(await page.locator('#ddWebNavNext').isVisible(),true,
    'Scroll arrow reveals hidden premium navigation tabs');
   const initialRailScroll=await dock.locator('.nav-inner').evaluate(el=>el.scrollLeft);
   await page.locator('#ddWebNavNext').click();
   await page.waitForFunction(x=>document.querySelector('#ddWebSecondaryNav .nav-inner').scrollLeft>x+12,initialRailScroll);
   assert.equal(await dock.locator('.tab[aria-current="page"]').getAttribute('data-tab'),
    'peopleDirectory','Arrows scroll the dock without changing sections');
   await page.locator('#ddWebNavPrev').click();
   await page.waitForFunction(x=>document.querySelector('#ddWebSecondaryNav .nav-inner').scrollLeft<x-12,65);
   if(width===393){
    await page.locator('#peopleSearch').focus();
    assert.equal(await dock.isVisible(),false,'Mobile keyboard focus must hide the dock');
    await page.locator('#peopleSearch').evaluate(el=>el.blur());
    await dock.waitFor({state:'visible'});
    const routeTest=await ctx.newPage();
    await routeTest.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
    await routeTest.locator('#ddWebSecondaryNav .tab[data-tab="mapPage"]').click();
    await routeTest.waitForURL('**/?dd_tab=mapPage',{timeout:15000});
    assert.equal(new URL(routeTest.url()).searchParams.get('dd_tab'),'mapPage',
     'Standalone Map button uses the existing Home app router');
    await routeTest.close();
    const nativeTest=await ctx.newPage();
    await nativeTest.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
    await nativeTest.locator('#ddWebSecondaryNav').waitFor({state:'visible'});
    await nativeTest.evaluate(()=>{
     const nav=document.createElement('nav');nav.id='ddAndroidEditorialNav';document.body.appendChild(nav);
    });
    await nativeTest.waitForFunction(()=>{
     const el=document.getElementById('ddWebSecondaryNav');
     return el&&getComputedStyle(el).display==='none';
    });
    assert.equal(await nativeTest.locator('#ddWebSecondaryNav').isVisible(),false,
     'Website dock hides if M12.3 Android adds the original premium dock');
    await nativeTest.close();
   }

   assert.equal(await page.locator('#peopleCards article.card').count(),50,'All fifty source-linked cards appear');
   assert.equal(await page.locator('iframe').count(),0,'No publisher player loads by default');
   const widths=await page.evaluate(()=>({a:document.documentElement.scrollWidth,b:window.innerWidth}));
   assert(widths.a<=widths.b+3,'Directory must not horizontally overflow '+width+'px');
   await page.locator('#peopleSearch').fill('Mick West');
   const cardCredit=page.locator('#peopleCards .card-photo-credit');
   assert.equal(await cardCredit.locator('a').count(),2,
    'CC photo card shows linked source and separate licence');
   assert.match(await cardCredit.innerText(),/Karl Withakay/i,
    'Photographer must be visible on the card rather than tooltip only');
   assert.match(await cardCredit.innerText(),/Display cropped to fit/,
    'Thumbnail crop/modification must be disclosed');
   assert.match(await cardCredit.locator('a').nth(0).getAttribute('href'),
    /^https:\/\/commons.wikimedia.org\/wiki\/File:/);
   assert.equal(await cardCredit.locator('a').nth(1).getAttribute('href'),
    'https://creativecommons.org/licenses/by-sa/4.0/');
   assert.equal(await page.locator('#peopleCards article.card').count(),1,'Name search filters');
   await page.locator('#peopleCards button').click();
   await page.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await page.locator('#profileName').textContent(),'Mick West','Correct person detail');
   const profileCredit=page.locator('#profilePhotoCredit');
   assert.equal(await profileCredit.locator('a').count(),2,
    'Detailed photo attribution links to source and CC licence deed');
   assert.match(await profileCredit.innerText(),/Karl Withakay.*CC BY-SA 4\.0.*Display cropped to fit/);
   assert.equal(await profileCredit.locator('a').nth(1).getAttribute('href'),
    'https://creativecommons.org/licenses/by-sa/4.0/');
   assert.equal(await page.locator('#profileTimeline li').count()>=3,true,'Dated history present');
   assert.equal(await page.locator('#profileBiography p').count()>=3,true,'Full story present');
   assert.equal(await page.locator('#profilePodcasts .source-entry').count()>=1,true,'A real podcast link appears');
   assert.match(await page.locator('#profileFilms').innerText(),/No film or documentary appearance has yet been verified/,'Unknown film credit is explicit');
   assert.equal(await page.locator('#profileVideoPlayers .video-card').count()>=1,true,'Publisher video card');
   assert.equal(await page.locator('iframe').count(),0,'Lazy player does not contact YouTube yet');
   const u=new URL(page.url());assert.equal(u.searchParams.get('person'),'mick-west','Shareable profile URL');
   await page.locator('#profileVideoPlayers .video-card .video-play').first().click();
   const video=page.locator('#profileVideoPlayers iframe').first();
   await video.waitFor({state:'attached'});
   assert.match(await video.getAttribute('src'),/^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}$/);
   assert.equal(await page.locator('#profileVideoPlayers a[href*="youtube.com/watch"]').count()>=1,true,
    'Publisher video original link preserved');
   const detailWidths=await page.evaluate(()=>({a:document.documentElement.scrollWidth,b:window.innerWidth}));
   assert(detailWidths.a<=detailWidths.b+3,'Detailed profile must not horizontally overflow '+width+'px');
   await page.goBack({waitUntil:'domcontentloaded'});
   await page.locator('#directoryPage').waitFor({state:'visible'});
   await page.locator('#peopleSearch').fill('zz-qa-no-match');
   await page.locator('#peopleSearch').fill(''); // Forces a genuine clear/input event even after history form restore.
   await page.waitForFunction(()=>document.querySelectorAll('#peopleCards article.card').length===50,undefined,{timeout:8000})
    .catch(async error=>{
     console.log('Directory after Back diagnostic',await page.evaluate(()=>({
      url:location.href,query:document.getElementById('peopleSearch').value,
      category:document.getElementById('peopleCategory').value,
      status:document.getElementById('peopleStatus').textContent,
      cards:document.querySelectorAll('#peopleCards article.card').length,
      profileHidden:document.getElementById('personProfile').classList.contains('hidden'),
      history:history.state,scrollY:window.scrollY
     })));
     throw error;
    });
   await page.locator('#peopleCategory').selectOption('Congress');
   await page.waitForFunction(()=>document.querySelectorAll('#peopleCards article.card').length>=10);
   assert.equal(await page.locator('#peopleCards article.card').count()>=10,true,'Congressional oversight filter');
   await page.locator('#peopleCategory').selectOption('Scientist');
   assert.equal(await page.locator('#peopleCards article.card').count()>=10,true,'Scientific research filter');
   await page.locator('#peopleCategory').selectOption('Pilot');
   assert.equal(await page.locator('#peopleCards article.card').count()>=2,true,'Role filtering');
   const direct=await ctx.newPage();
   await direct.goto(BASE+'/who-is-who.html?person=david-grusch',{waitUntil:'domcontentloaded'});
   await direct.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await direct.locator('#profileName').textContent(),'David Grusch',"Deep link to the correct person profile");
   assert.match(await direct.locator('#profileSocials').textContent(),/No personal social media account/,
    'No fake personal handles inferred where unverified');
   await direct.locator('#directoryBack').click();
   assert.equal(new URL(direct.url()).searchParams.has('person'),false,'Direct-link return replaces the URL safely');
   const portrait=await ctx.newPage();
   await portrait.goto(BASE+'/who-is-who.html?person=anna-paulina-luna',{waitUntil:'domcontentloaded'});
   await portrait.locator('#personProfile').waitFor({state:'visible'});
   assert.match(await portrait.locator('#profilePhotoCredit').innerText(),/Photo:/,'Portrait source attribution available');
   assert.equal(await portrait.locator('#profilePhotoCredit a').count(),1,
    'US federal public-domain portrait does not invent a Creative Commons deed');
   assert.match(await portrait.locator('#profileAvatar').textContent(),/AP/,'Blocked external images retain initials in offline browser QA');
   await portrait.close();

   // When switching detailed profiles, a previous asynchronous portrait load
   // must never hide the current person's initials, including on browser Back.
   const photoSwitch=await ctx.newPage();
   // Keep Commons images pending so synthetic load events can exercise both
   // the current and detached-image handlers deterministically, even offline.
   const releasePortraitRequests=[];
   await photoSwitch.route('**/Special:FilePath/**',async route=>{
    await new Promise(resolve=>releasePortraitRequests.push(resolve));
    try{await route.abort('blockedbyclient')}catch{}
   });
   await photoSwitch.goto(BASE+'/who-is-who.html?person=david-grusch',{waitUntil:'domcontentloaded'});
   await photoSwitch.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await photoSwitch.evaluate(()=>{
    window.__previousPortrait=document.querySelector('#profileAvatar img');
    return !!window.__previousPortrait;
   }),true,'David Grusch has a documented image reference');
   await photoSwitch.locator('#directoryBack').click();
   await photoSwitch.locator('#peopleSearch').fill('David Fravor');
   await photoSwitch.locator('#peopleCards button').first().click();
   assert.equal(await photoSwitch.locator('#profileName').textContent(),'David Fravor');
   await photoSwitch.evaluate(()=>window.__previousPortrait.dispatchEvent(new Event('load')));
   assert.equal(await photoSwitch.locator('#profileAvatar').evaluate(el=>el.classList.contains('has-photo')),false,
    'Stale image load from previous profile cannot hide current initials');
   assert.match(await photoSwitch.locator('#profileAvatar').textContent(),/DF/,'Fravor initials visible');
   await photoSwitch.locator('#directoryBack').click();
   await photoSwitch.locator('#peopleSearch').fill('Ryan Graves');
   await photoSwitch.locator('#peopleCards button').first().click();
   await photoSwitch.evaluate(()=>{
    const img=document.querySelector('#profileAvatar img');
    if(!img)throw new Error('Ryan portrait element missing');
    img.dispatchEvent(new Event('load'));
   });
   assert.equal(await photoSwitch.locator('#profileAvatar').evaluate(el=>el.classList.contains('has-photo')),true,
    'Current loaded portrait hides initials');
   await photoSwitch.locator('#directoryBack').click();
   await photoSwitch.locator('#peopleSearch').fill('David Fravor');
   await photoSwitch.locator('#peopleCards button').first().click();
   assert.equal(await photoSwitch.locator('#profileAvatar').evaluate(el=>el.classList.contains('has-photo')),false,
    'Switching loaded photo to no-photo profile resets class');
   assert.match(await photoSwitch.locator('#profileAvatar').textContent(),/DF/);
   for(const release of releasePortraitRequests)release();
   await photoSwitch.close();
   const legacy=await ctx.newPage();
   await legacy.goto(BASE+'/who-is-who.html?person=nick-pope',{waitUntil:'domcontentloaded'});
   await legacy.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await legacy.locator('#profileName').textContent(),'Nick Pope');
   assert.match(await legacy.locator('#profileBiography').innerText(),/6 April 2026/,'Historical memorial biography');
   assert.equal(await legacy.locator('#profileFilms .source-entry').count()>=1,true);
   assert.equal(await legacy.locator('#profileRelatedCases .dd-person-case-link').count(),1,
    "Pope's 2014 Rendlesham book authorship has a cited reference");
   await legacy.close();
   const warren=await ctx.newPage();
   await warren.goto(BASE+'/who-is-who.html?person=larry-warren',{waitUntil:'domcontentloaded'});
   await warren.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await warren.locator('#profileRelatedCases a[href="/rendlesham-forest-1980"]').count(),1);
   // M8 source-attributed reverse links: original citations and editorial caution.
   assert.equal(await warren.locator('#profileRelatedCases .dd-person-case-link').count(),1,
    'Warren profile has exactly one attributed retrospective Rendlesham relationship');
   assert.match(await warren.locator('#profileRelatedCases').innerText(),/Retrospective claimed participant/);
   assert(await warren.locator('#profileRelatedCases a[href^="https://"]').count()>=1);
   const fravor=await ctx.newPage();
   await fravor.goto(BASE+'/who-is-who.html?person=david-fravor',{waitUntil:'domcontentloaded'});
   await fravor.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await fravor.locator('#profileRelatedCases .dd-person-case-link').count(),1,
    "Fravor's Nimitz encounter is linked to the public congressional record");
   assert.match(await fravor.locator('#profileRelatedCases').innerText(),/First-person encounter account/);
   assert.equal(await fravor.locator('#profileRelatedCases a[href*="dd_archive_case=featured-nimitz-2004"]').count(),1);
   assert.equal(await fravor.locator('#profileRelatedCases a[href^="https://"]').count(),1);
   // Follow the real profile → case deep link, not merely the href string.
   await fravor.locator('#profileRelatedCases a[href*="dd_archive_case=featured-nimitz-2004"]').click();
   await fravor.waitForURL('**/?dd_tab=archivePage*',{timeout:18000});
   await fravor.locator('#archiveCaseDialog[open] #archiveCaseTitle').waitFor({timeout:18000});
   assert.match(await fravor.locator('#archiveCaseTitle').innerText(),/Nimitz/i,
    "Fravor's profile opens the actual Nimitz Archive case");
   const nimitzDna=fravor.locator('#archiveCaseBody details.dd-evidence-dna');
   await nimitzDna.locator('summary').first().click();
   assert.equal(await nimitzDna.locator('.dd-case-people article').count(),1,
    'Nimitz Archive has his source-attributed person record even without a claim draft');
   const nimitzGraph=nimitzDna.locator('details.dd-evidence-graph');
   assert.equal(await nimitzGraph.count(),1,'Nimitz shows a source graph without inventing a claim');
   await nimitzGraph.locator('summary').first().click();
   assert.match(await nimitzGraph.locator('[data-graph-summary]').innerText(),/1 attributed public person/i);
   assert.match(await nimitzGraph.locator('[data-graph-summary]').innerText(),/0 editorial draft statement/i);
   await fravor.close();
   await warren.close();
   await direct.locator('#directoryPage').waitFor({state:'visible'});
   assert.equal(new URL(direct.url()).searchParams.has('person'),false,'Return clears profile ID');
   const deadly=errors.filter(x=>/ReferenceError|SyntaxError|Cannot access|is not defined/.test(x));
   assert.deepEqual(deadly,[],'Fatal client errors: '+deadly.join(', '));
   console.log('PASS Who’s Who '+width+'px: 50 profiles, text/category filters, deep links, long bios, source history, click-only video, browser Back and no layout overflow');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL Who’s Who Chromium:',error.stack||error);process.exitCode=1});
