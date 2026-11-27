'use strict';
// Public sponsorship regression: localhost only, external requests blocked.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve('.release-staging/public-site');
const mime={html:'text/html; charset=utf-8',css:'text/css',js:'text/javascript',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 let file=path.resolve(root,'.'+u.pathname);
 if(file===root||u.pathname.endsWith('/'))file=path.join(file,'index.html');
 else if(!path.extname(file))file+='.html';
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':mime[path.extname(file).slice(1)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
const email='mailto:support@uapdisclosuredesk.com?subject=Disclosure%20Desk%20sponsorship%20enquiry';
async function verifyCard(page,width){
 const card=page.locator('#sponsor-us');
 assert.equal(await card.count(),1);
 await card.waitFor({state:'visible'});
 assert.equal(await card.getByRole('heading',{name:'Sponsor Disclosure Desk'}).count(),1);
 assert.match(await card.innerText(),/does not influence our editorial decisions/);
 assert.match(await card.innerText(),/clearly identified/);
 assert.equal(await card.getByRole('link',{name:'Enquire about sponsorship'}).getAttribute('href'),email);
 const styles=await card.getByRole('link',{name:'Enquire about sponsorship'}).evaluate(n=>{
   const r=n.getBoundingClientRect(),s=getComputedStyle(n);
   return {height:r.height,left:r.left,right:r.right,viewport:innerWidth,bg:s.backgroundColor,color:s.color};
 });
 assert.equal(styles.bg,'rgb(25, 43, 58)');
 assert.equal(styles.color,'rgb(225, 197, 142)');
 assert.ok(styles.height>=44&&styles.left>=0&&styles.right<=styles.viewport,JSON.stringify(styles));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow at '+width);
 assert.equal(await page.locator('#collaboration-enquiry').count(),1);
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [320,393,1280]){
    const ctx=await browser.newContext({viewport:{width,height:880},serviceWorkers:'block'});
    try{
      await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort('blockedbyclient'));
      const page=await ctx.newPage();
      await page.goto(base+'/research-collaborations#sponsor-us',{waitUntil:'domcontentloaded'});
      await verifyCard(page,width);
      assert.equal(await page.locator('footer a',{hasText:'Sponsor Us'}).getAttribute('href'),'#sponsor-us');
      if(process.env.SPONSOR_SCREENSHOT_DIR&&width===393)await page.locator('#sponsor-us').screenshot({path:path.join(process.env.SPONSOR_SCREENSHOT_DIR,'standalone-card.png')});
      await page.goto(base+'/?dd_tab=originalResearchPage',{waitUntil:'domcontentloaded'});
      const hub=page.locator('[data-dd-research-panel="ddResearchCollab"]');
      await hub.waitFor({state:'visible',timeout:30000});
      await hub.click();
      await verifyCard(page,width);
      if(process.env.SPONSOR_SCREENSHOT_DIR&&width===393)await page.locator('#sponsor-us').screenshot({path:path.join(process.env.SPONSOR_SCREENSHOT_DIR,'native-card.png')});
      const footer=page.locator('.dd-site-footer-actions').getByRole('link',{name:'Sponsor Us',exact:true});
      assert.equal(await footer.getAttribute('href'),'/research-collaborations#sponsor-us');
      await footer.click();
      await page.waitForURL(base+'/research-collaborations#sponsor-us',{timeout:20000});
      await verifyCard(page,width);
      console.log('PASS sponsor card, quiet tap target, existing form and footer deep link at '+width+'px');
    }finally{await ctx.close()}
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
