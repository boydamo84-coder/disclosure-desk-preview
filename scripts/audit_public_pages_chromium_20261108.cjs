'use strict';
// Offline Chromium audit for public informational pages.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const PAGES=['/index.html','/guide.html','/sources.html','/community-rules.html','/privacy.html',
 '/research-edition.html','/research/guest-preview.html','/research/index.html',
 '/research/research-bible.html'];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let checks=0,warnings=0;const unique=new Map();
  for(const viewport of [{width:393,height:852},{width:852,height:393},{width:1280,height:800}]){
   const context=await browser.newContext({viewport,isMobile:viewport.width!==1280,
    hasTouch:viewport.width!==1280,locale:'en-GB'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===BASE
    ?route.continue():route.abort('blockedbyclient'));
   const page=await context.newPage();
   for(const pathname of PAGES){
    const response=await page.goto(BASE+pathname,{waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(response.status(),200,pathname+' missing');
    const audit=await page.evaluate(()=>{
     const root=document.documentElement;
     return {title:document.title.trim(),h1:document.querySelector('h1')?.textContent?.trim()||'',
      viewport:root.clientWidth,actual:root.scrollWidth,
      anchors:[...document.querySelectorAll('a[href]')].map(a=>({
       href:a.getAttribute('href'),text:(a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,70),
       blank:a.target==='_blank',rel:a.rel
      })),missingAlt:[...document.images].filter(img=>!img.hasAttribute('alt')).length};
    });
    assert(audit.title,pathname+' missing title');
    assert(audit.actual<=audit.viewport+14,pathname+' horizontal overflow '+JSON.stringify({
      width:viewport.width,visible:audit.viewport,document: audit.actual}));
    checks+=2;
    if(!audit.h1){warnings++;console.log('AUDIT WARNING no H1 '+pathname)}
    if(audit.missingAlt){warnings++;console.log('AUDIT WARNING images without alt '+pathname+
      ': '+audit.missingAlt)}
    for(const a of audit.anchors){
     if(a.blank&&!/\bnoopener\b/.test(a.rel)){warnings++;
      console.log('AUDIT WARNING target blank missing noopener '+pathname+' '+a.href)}
     if(!a.text){warnings++;console.log('AUDIT WARNING unlabeled link '+pathname+' '+a.href)}
     if(!a.href||/^\s*(?:mailto:|tel:|https?:\/\/|\/\/|data:|javascript:)/i.test(a.href))continue;
     if(a.href.includes('$'+'{'))continue;
     const url=new URL(a.href,BASE+pathname);if(url.origin!==BASE)continue;
     let file=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
     // Netlify serves the known public HTML pages at clean canonical URLs.
     // Resolve only those reviewed routes; an arbitrary missing path stays missing.
     if(!path.extname(file)&&PAGES.includes(file+'.html'))file+='.html';
     const anchor=url.hash?decodeURIComponent(url.hash.slice(1)):'';
     const key=file+'#'+anchor;
     if(!unique.has(key))unique.set(key,{file,anchor,source:pathname});
    }
    console.log('AUDIT PAGE '+viewport.width+'px '+pathname+' links='+audit.anchors.length+
      ' width='+audit.actual+'/'+audit.viewport);
   }
   await context.close();
  }
  for(const [key,v] of unique){
   const rel=decodeURIComponent(v.file).replace(/^\/+/,'');
   const full=path.resolve(process.cwd(),rel);
   if(!full.startsWith(process.cwd()+path.sep)||!fs.existsSync(full)){
    warnings++;console.log('AUDIT WARNING broken internal link '+key+' from '+v.source);
    continue;
   }
   checks++;
   if(v.anchor&&path.extname(full)==='.html'){
    const body=fs.readFileSync(full,'utf8');
    if(!body.includes('id="'+v.anchor+'"')&&!body.includes("id='"+v.anchor+"'")){
     warnings++;console.log('AUDIT WARNING missing static anchor '+key+' from '+v.source);
    }else checks++;
   }
  }
  console.log('PASS AUDIT '+checks+' geometry/link checks, '+warnings+
   ' audit warnings, local-only / NO live requests or deployment');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL PUBLIC PAGE AUDIT:',e.stack||e);process.exitCode=1});
