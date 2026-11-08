'use strict';
// Milestone 28: per-tab public experience / 16-page site audit.
// Uses ONLY loopback localhost and synthetic anonymous viewing; no account login.
// Actual browser checks without Supabase/Netlify calls or production deployment.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const OUTPUT='browser-qa-artifacts';
const TAB_NAMES=[
 ['discover','News'],['archivePage','Archive'],['researchStudio','W.NE'],
 ['mapPage','Map'],['clips','Videos'],['livePage','LIVE'],
 ['boards','Boards'],['witness','Witness'],['watchRead','Watch & Read'],
 ['profilePage','Profile'],['hub','Explore'],['chatPage','Chat'],
 ['discussionsPage','Discussions (Explore deep link)']
];
const PAGES=[
 '/','/guide.html','/sources.html','/community-rules.html','/privacy.html',
 '/research-edition.html','/research/index.html','/research/guest-preview.html',
 '/research/import.html','/research/research-bible.html',
 '/research/research-workspace.html','/research/restore-copy.html',
 '/research/restore-library.html','/research/wne.html'
];
function info(text){console.log('M28 AUDIT '+text)}
function normalizeIssue(x){return [x.viewport,x.target,x.kind,x.label||''].join(' | ')}
(async()=>{
 fs.mkdirSync(OUTPUT,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={version:'M28',environment:'isolated localhost no live services',
  tabs:[],pages:[],issues:[],counts:{}};
 let fatal=null;
 try{
  for(const viewport of [{width:393,height:852},{width:852,height:393},{width:1280,height:800}]){
   const context=await browser.newContext({viewport,isMobile:viewport.width!==1280,
    hasTouch:viewport.width!==1280,locale:'en-GB',serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    return u.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   const pageErrors=[];
   page.on('pageerror',err=>pageErrors.push(String(err.message||err).slice(0,240)));
   await page.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch{}});
   await page.goto(BASE+'/?dd_tab=discover',{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('nav.nav .tab[data-tab="discover"]',{timeout:12000});
   const checks=await page.evaluate(()=>({
     tabCount:document.querySelectorAll('nav.nav .tab').length,
     navName:document.querySelector('nav.nav')?.getAttribute('aria-label')||''
   }));
   assert.equal(checks.tabCount,12,'Navigation has 12 approved tabs at '+viewport.width);
   assert.ok(checks.navName,'Nav has accessible name');
   for(const [tab,label] of TAB_NAMES){
    if(tab==='discussionsPage'){
      await page.goto(BASE+'/?dd_tab=discussionsPage',{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForFunction(()=>!document.getElementById('discussionsPage')?.classList.contains('hidden'),null,{timeout:10000});
    }else{
      // For all dock tabs: clicks use the real navigation handler.
      await page.locator('nav.nav .tab[data-tab="'+tab+'"]').click({timeout:12000});
      await page.locator('nav.nav .tab[data-tab="'+tab+'"][aria-current="page"]').waitFor({timeout:7000});
    }
    const audit=await page.evaluate(target=>{
      const active=document.getElementById(target);
      const root=document.documentElement,visible=e=>{
       if(e.closest('[hidden],.hidden,[aria-hidden="true"]'))return false;
       const style=getComputedStyle(e),r=e.getBoundingClientRect();
       return style.display!=='none'&&style.visibility!=='hidden'&&r.width>0&&r.height>0;
      };
      const missing=[];
      for(const el of document.querySelectorAll('button,a[href],[role="button"]')){
       if(!visible(el))continue;
       const name=(el.getAttribute('aria-label')||el.getAttribute('title')||
        el.getAttribute('aria-labelledby')?.split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ')||
        el.textContent||el.querySelector('img[alt]')?.getAttribute('alt')||'').trim();
       if(!name)missing.push({tag:el.tagName,id:el.id||'',cls:el.className?.toString().slice(0,70)||''});
      }
      const brokenControls=[];
      for(const el of document.querySelectorAll('[aria-controls]')){
       if(!visible(el))continue;
       for(const id of el.getAttribute('aria-controls').split(/\s+/)){
        if(id&&!document.getElementById(id))brokenControls.push({id:el.id||'',control:id});
       }
      }
      const activeCSS=active&&getComputedStyle(active);
      return {
       activePresent:!!active, activeVisible:!!active&&activeCSS.display!=='none'&&
        activeCSS.visibility!=='hidden'&&!active.classList.contains('hidden')&&!active.hidden,
       activeRect:active?.getBoundingClientRect().toJSON()||null,
       viewport:root.clientWidth,documentWidth:root.scrollWidth,
       missingNames:missing.slice(0,16),missingNameCount:missing.length,
       brokenControls:brokenControls.slice(0,16),brokenControlCount:brokenControls.length,
       visibleButtons:[...document.querySelectorAll('button')].filter(visible).length,
       focusable:[...document.querySelectorAll('button,a[href],input,textarea,select')].filter(visible).length
      };
    },tab);
    report.tabs.push({viewport:viewport.width,target:tab,label,...audit});
    assert.ok(audit.activePresent&&audit.activeVisible,tab+' must be visible at '+viewport.width);
    if(audit.documentWidth>audit.viewport+14)
     report.issues.push({viewport:viewport.width,target:tab,kind:'horizontal_overflow',
      label:audit.documentWidth+'/'+audit.viewport});
    if(audit.missingNameCount)
     report.issues.push({viewport:viewport.width,target:tab,kind:'unnamed_buttons_or_links',
      label:JSON.stringify(audit.missingNames.slice(0,5))+' count='+audit.missingNameCount});
    if(audit.brokenControlCount)
     report.issues.push({viewport:viewport.width,target:tab,kind:'missing_aria_controls',
      label:JSON.stringify(audit.brokenControls.slice(0,5))});
    info('TAB '+viewport.width+'px '+label+' width '+audit.documentWidth+'/'+audit.viewport+
      ' visible-controls '+audit.visibleButtons+' unnamed '+audit.missingNameCount+
      ' broken-controls '+audit.brokenControlCount);
   }
   for(const pathname of PAGES){
     const response=await page.goto(BASE+pathname,{waitUntil:'domcontentloaded',timeout:45000});
     assert.equal(response.status(),200,'missing public page '+pathname);
     const audit=await page.evaluate(()=>{
       const root=document.documentElement;
       const displayed=e=>{
        if(e.closest('[hidden],.hidden,[aria-hidden=true]'))return false;
        const cs=getComputedStyle(e),r=e.getBoundingClientRect();
        return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;
       };
       const unlabeled=[...document.querySelectorAll('button, a[href], input, textarea, select')]
        .filter(displayed).filter(el=>{
          const id=el.id;
          const label=(el.getAttribute('aria-label')||el.getAttribute('title')||
             (id&&document.querySelector('label[for="'+CSS.escape(id)+'"]')?.textContent)||
             el.closest('label')?.textContent||el.textContent||
             el.getAttribute('alt')||'').trim();
          return !label;
        }).slice(0,14).map(el=>({tag:el.tagName,id:el.id||'',type:el.getAttribute('type')||'',
          cls:el.className?.toString().slice(0,45)||''}));
       return {title:document.title.trim(),finalPath:location.pathname,viewport:root.clientWidth,
        documentWidth:root.scrollWidth,unlabeled,
        h1:!!document.querySelector('h1'),buttons:document.querySelectorAll('button').length,
        links:document.querySelectorAll('a[href]').length};
     });
     report.pages.push({viewport:viewport.width,path:pathname,...audit});
     // Auth-gated Research URLs may redirect before content renders; do not
     // describe that as validating private editing, restore or login actions.
     if(audit.finalPath!==pathname && !(pathname==='/'&&audit.finalPath==='/'))
       report.issues.push({viewport:viewport.width,target:pathname,kind:'auth_gate_or_redirect',label:audit.finalPath});
     if(audit.documentWidth>audit.viewport+14)
       report.issues.push({viewport:viewport.width,target:pathname,kind:'page_overflow',
         label:audit.documentWidth+'/'+audit.viewport});
     if(audit.unlabeled.length)
       report.issues.push({viewport:viewport.width,target:pathname,kind:'unlabeled_form_or_control',
         label:JSON.stringify(audit.unlabeled)});
     info('PAGE '+viewport.width+'px '+pathname+' width '+audit.documentWidth+'/'+audit.viewport+
        ' unlabeled '+audit.unlabeled.length+' links '+audit.links);
   }
   if(pageErrors.length)report.issues.push({
     viewport:viewport.width,target:'runtime',kind:'browser_script_exceptions',
     label:JSON.stringify(pageErrors.slice(0,9))
   });
   await context.close();
  }
  report.counts={tabChecks:report.tabs.length,pageChecks:report.pages.length,issues:report.issues.length,
    byKind:Object.fromEntries([...new Set(report.issues.map(x=>x.kind))]
       .map(kind=>[kind,report.issues.filter(x=>x.kind===kind).length]))};
  fs.writeFileSync(path.join(OUTPUT,'m28-page-by-page-audit.json'),JSON.stringify(report,null,2)+'\n');
  info('SUMMARY '+JSON.stringify(report.counts));
  for(const issue of report.issues.slice(0,65))info('FINDING '+normalizeIssue(issue));
  if(report.issues.some(x=>['horizontal_overflow','page_overflow'].includes(x.kind)))
    throw Error('Fixable horizontal overflow found; see M28 findings');
  console.log('PASS M28 offline public experience inventory with '+report.counts.tabChecks+
    ' tab journeys and '+report.counts.pageChecks+' public page loads. '+report.counts.issues+
    ' findings recorded (review required); no live requests.');
 }catch(err){fatal=err;throw err;}finally{await browser.close()}
})().catch(error=>{console.error('FAIL M28 PAGE-BY-PAGE:',error.stack||error);process.exitCode=1});
