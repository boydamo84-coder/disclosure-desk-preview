'use strict';
/* M68 live DOM test, actual Who page + source page, offline local HTTP only. */
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'});
   const api=[],errors=[],unexpectedScripts=[];
   await ctx.route('**/*',route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===BASE)return route.continue();
    if(req.resourceType()==='script'||url.hostname.includes('supabase.co'))
      unexpectedScripts.push(url.href);
    return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#peopleCards .card').first().waitFor();
   await page.locator('#ddWhoOutreachStatus li.dd-who-outreach-item').first().waitFor();
   assert.equal(await page.locator('#ddWhoOutreachStatus li.dd-who-outreach-item').count(),5);
   const first=page.locator('#ddWhoOutreachStatus li[data-enquiry-id="osd-151-pages"]');
   assert.match(await first.innerText(),/Reply received/);
   const brazil=page.locator('#ddWhoOutreachStatus li[data-enquiry-id="brazil-arquivo-nacional-sian"]');
   assert.match(await brazil.innerText(),/Reply received/);
   const nara=page.locator('#ddWhoOutreachStatus li[data-enquiry-id="nara-mj12-revision"]');
   assert.match(await nara.innerText(),/acknowledgement not verified/);
   assert.equal(await page.locator('#ddWhoProgrammesDisclosure').evaluate(x=>x.open),false,
    'Avoid automatically loading 23 long cards on mobile without request');
   assert.equal(await page.locator('#ddWhoProgrammeCards article').count(),0);
   await page.locator('[data-dd-who-programme-jump="Vatican"]').click();
   await page.locator('#ddWhoProgrammeCards article.dd-who-programme-card').first().waitFor({timeout:12000});
   assert.equal(await page.locator('#ddWhoProgrammeCards article.dd-who-programme-card').count(),1);
   assert.equal(await page.locator('#ddWhoProgrammeCards article#dd-who-prog-vatican').count(),1);
   const text=await page.locator('#dd-who-prog-vatican').innerText();
   assert.match(text,/Vatican/);
   assert.match(text,/not a verified UAP-investigation agency/i);
   assert.match(text,/alleged 1933/i);
   await page.locator('#dd-who-prog-vatican details.dd-who-programme-comparison > summary').click();
   assert.match(await page.locator('#dd-who-prog-vatican .dd-who-programme-comparison').innerText(),/Grusch/);
   const pageStatus=await page.locator('#ddWhoProgrammeStatus').innerText();
   assert.match(pageStatus,/1 matching documented entries/);
   await page.locator('#ddWhoProgrammeSearch').fill('');
   await page.locator('#ddWhoProgrammeCards article.dd-who-programme-card').nth(22).waitFor();
   assert.equal(await page.locator('#ddWhoProgrammeCards article.dd-who-programme-card').count(),23);
   assert.equal(await page.locator('#ddWhoProgrammeLeads > li').count(),14);
   assert.equal(await page.locator('#ddWhoProgrammes .dd-m64-ballot').count(),0,
    'Institutions are not voter-scored people or incident statements');
   assert.equal(await page.locator('#ddWhoProgrammes [data-m64-save]').count(),0);
   await page.locator('[data-dd-who-programme-jump="Brazil"]').click();
   assert.equal(await page.locator('#ddWhoProgrammeCards article').count(),1);
   assert.match(await page.locator('#ddWhoProgrammeCards article').first().innerText(),/Brazilian Air Force/);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14);
   const size=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,width:innerWidth}));
   assert(size.actual<=size.width+3,'No overflow Who page '+width+' '+JSON.stringify(size));
   await page.goto(BASE+'/sources.html#dd-enquiry-osd-151-pages',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#dd-enquiry-osd-151-pages').waitFor({timeout:12000});
   assert.equal(await page.locator('#ddVerificationList > article.dd-verification-card').count(),5);
   assert.equal((await page.locator('#dd-enquiry-osd-151-pages').innerText()).includes('Pentagon'),true);
   assert.deepEqual(unexpectedScripts,[],'No external scripts or Supabase calls');
   assert.deepEqual(errors,[],'No JS runtime errors');
   await ctx.close();
   console.log('M68 CHROMIUM PASS '+width+'px: Vatican and 23 sourced institutions, 14 honest research leads, 5 correspondence statuses, no voting, deep-linked sources, no overflow');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
