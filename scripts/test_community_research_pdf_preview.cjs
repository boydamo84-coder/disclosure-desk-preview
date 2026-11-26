'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const root=process.cwd();
const writeRequests=[];
const mime={html:'text/html',js:'application/javascript',mjs:'application/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',wasm:'application/wasm',jpg:'image/jpeg',png:'image/png'};
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD'){writeRequests.push(req.method);return res.writeHead(405).end()}
 let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!f.startsWith(root+path.sep))return res.writeHead(404).end();
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)&&!path.extname(f))f+='.html';
 if(!fs.existsSync(f)||!fs.statSync(f).isFile())return res.writeHead(404).end();
 res.writeHead(200,{'content-type':mime[path.extname(f).slice(1)]||'application/octet-stream','cache-control':'no-store'});
 fs.createReadStream(f).pipe(res);
});
// Construct a genuine two-page, cross-reference indexed PDF with vector table,
// text and a small RGB image. This is a fictional test document, never uploaded.
function fixture({active=false,pages=2}={}){
 const objects=[];
 const stream=s=>'<< /Length '+Buffer.byteLength(s)+' >>\nstream\n'+s+'\nendstream';
 objects[1]='<< /Type /Catalog /Pages 2 0 R'+(active?' /OpenAction << /S /JavaScript /JS (void 0) >>':'')+' >>';
 objects[2]='<< /Type /Pages /Kids ['+Array.from({length:pages},(_,i)=>(9+i)+' 0 R').join(' ')+'] /Count '+pages+' >>';
 objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
 objects[4]=stream('q 0 0 1 rg 20 200 120 75 re f Q\n0 0 0 RG 1 w 20 90 250 90 re S 20 120 m 270 120 l S 20 150 m 270 150 l S 125 90 m 125 180 l S\nBT /F1 14 Tf 30 160 Td (Evidence table) Tj ET\nq 60 0 0 60 180 200 cm /Img1 Do Q');
 objects[5]=stream('q 1 0 0 rg 20 200 120 75 re f Q\nBT /F1 14 Tf 30 160 Td (Page two) Tj ET');
 const im='00ff00ff00000000ffffff00>';
 objects[6]='<< /Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length '+Buffer.byteLength(im)+' >>\nstream\n'+im+'\nendstream';
 objects[7]='<< /Producer (Disclosure Desk fictional PDF QA) >>';
 objects[8]='<< >>';
 for(let i=0;i<pages;i++)objects[9+i]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 3 0 R >> /XObject << /Img1 6 0 R >> >> /Contents '+(i===0?4:5)+' 0 R >>';
 let out='%PDF-1.7\n',offsets=[0];
 for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(out));out+=i+' 0 obj\n'+objects[i]+'\nendobj\n'}
 const xref=Buffer.byteLength(out);
 out+='xref\n0 '+objects.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+objects.length+' /Root 1 0 R /Info 7 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 return Buffer.from(out);
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const good=fixture(),hash=crypto.createHash('sha256').update(good).digest('hex');
 const cfg=(enabled,pdf)=>'window.DD_COMMUNITY_TEST_CONFIG={environment:"test",url:"https://fixture.invalid",publishableKey:"test-only"};window.DD_COMMUNITY_FEATURES={researchPublishing:'+enabled+',researchPdfPreview:'+pdf+'};';
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
   const allowed=[],external=[],writes=[];
   try{
    await context.route('**/*',async route=>{
     const r=route.request(),url=new URL(r.url());
     if(!['GET','HEAD'].includes(r.method())){writes.push({method:r.method(),path:url.pathname});return route.abort('blockedbyclient')}
     if(url.origin!==origin){external.push(url.origin);return route.abort('blockedbyclient')}
     allowed.push(url.pathname);return route.continue();
    });
    for(const [on,pdf] of [[false,true],[true,false]]){
     await context.route('**/assets/community-test-config.js?*',r=>r.fulfill({contentType:'application/javascript',body:cfg(on,pdf)}));
     const page=await context.newPage();
     await page.goto(origin+'/index.html?dd_tab=communityResearchPage');
     await page.waitForFunction(()=>document.readyState==='complete');
     assert.equal(await page.locator('#ddCRPdfReview').count(),0);
     assert.equal(await page.locator('#ddCRUpload').isEnabled(),false);
     await page.close();
     await context.unroute('**/assets/community-test-config.js?*');
    }
    await context.route('**/assets/community-test-config.js?*',r=>r.fulfill({contentType:'application/javascript',body:cfg(true,true)}));
    // Only an optional mock auth event emitter; no SDK/backend requests or member
    // mutation are used. PDF parsing and rendering below are genuine PDF.js.
    await context.addInitScript(()=>{
     window.DDPdfAuthEvents=[];
     window.supabase={createClient:()=>({
      auth:{onAuthStateChange(cb){window.DDPdfAuthEvents.push(cb);cb('INITIAL_SESSION',null);return {data:{subscription:{unsubscribe(){window.DDPdfAuthEvents=window.DDPdfAuthEvents.filter(x=>x!==cb)}}}}}},
      from(){throw Error('No database needed for local PDF review')}
     })};
    });
    const page=await context.newPage();
    await page.goto(origin+'/index.html?dd_tab=communityResearchPage');
    const trigger=page.locator('#ddCRUpload');
    await trigger.waitFor({state:'visible'});
    assert.equal(await trigger.isEnabled(),true);
    await trigger.click();
    const panel=page.locator('#ddCRPdfReview');
    await panel.waitFor();
    const input=panel.locator('input[type=file]'),confirm=panel.getByRole('button',{name:'Confirm local PDF review',exact:true});
    const status=panel.locator('[role=status]').first();
    const load=async(buffer,name='evidence.pdf',mimeType='application/pdf')=>input.setInputFiles({name,mimeType,buffer});
    const statusHas=async(re)=>{await panel.getByText(re).first().waitFor({timeout:40000})};
    const pixels=async(color)=>panel.locator('canvas').evaluate((c,col)=>{
     const {data}=c.getContext('2d').getImageData(0,0,c.width,c.height);let n=0;
     for(let j=0;j<data.length;j+=4){if(col==='blue'&&data[j]<30&&data[j+1]<30&&data[j+2]>220)n++;if(col==='red'&&data[j]>220&&data[j+1]<30&&data[j+2]<30)n++;if(col==='green'&&data[j]<30&&data[j+1]>220&&data[j+2]<30)n++;if(col==='black'&&data[j]<45&&data[j+1]<45&&data[j+2]<45)n++;}
     return n;
    },color);
    await panel.getByLabel('Research title').fill('Fictional source review');
    await panel.getByLabel('Research abstract').fill('Test evidence table and original image.');
    await panel.getByLabel('Research category').selectOption('Document analysis');
    const priorExternal=external.length,priorWrites=writes.length;
    await load(good);
    await statusHas(/Local PDF preview ready/);
    assert.match(await panel.innerText(),/PDF page 1 of 2/);
    assert.ok(await pixels('blue')>10000,'first-page blue vector');
    assert.ok(await pixels('green')>100,'embedded RGB image');
    assert.ok(await pixels('black')>500,'table grid/text');
    await panel.getByLabel(/I have the right/).check();
    await panel.getByLabel(/I reviewed the visible pages/).check();
    assert.equal(await confirm.isEnabled(),false,'every page must be rendered before confirmation');
    await panel.getByRole('button',{name:'Next PDF page'}).click();
    await statusHas(/PDF page 2 of 2/);
    assert.ok(await pixels('red')>10000,'second-page vector');
    assert.equal(await confirm.isEnabled(),true);
    await confirm.click();
    assert.match(await panel.innerText(),new RegExp(hash));
    assert.match(await panel.innerText(),/Nothing was uploaded/);
    assert.equal(await panel.getByRole('button',{name:/Upload unavailable/}).isEnabled(),false);
    await panel.getByLabel('Research title').fill('Changed metadata');
    assert.equal(await confirm.isEnabled(),false);
    assert.equal(await panel.getByLabel(/I have the right/).isChecked(),false);
    assert.equal(await panel.getByLabel(/I reviewed the visible pages/).isChecked(),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(writes.length,priorWrites,'No write requests during PDF review');
    // The local PDF module must only load its resources from its own origin.
    assert.ok(allowed.includes('/node_modules/pdfjs-dist/build/pdf.mjs'));
    assert.ok(allowed.includes('/node_modules/pdfjs-dist/build/pdf.worker.mjs'));
    assert.ok(!external.slice(priorExternal).includes('https://fixture.invalid'));
    console.log('PASS actual canvas/table/image, two pages, digest and metadata at '+width+'px');
    const failures=[
     [Buffer.from('This is a text file, not a PDF.'),/valid PDF header/],
     [Buffer.alloc(5000001,32),/no larger than 5 MB/],
     [good.subarray(0,good.length-8),/incomplete|trailing/],
     [fixture({active:true}),/Interactive actions|forms|embedded files/],
     [fixture({pages:101}),/1–100 pages/]
    ];
    for(const [buffer,message] of failures){
     await load(buffer);
     await statusHas(message);
     assert.equal(await confirm.isEnabled(),false);
     assert.equal(await panel.locator('canvas').isVisible(),false);
     assert.equal(await input.inputValue(),'');
    }
    console.log('PASS malformed, oversized, incomplete, active action and page-limit refusal at '+width+'px');
    await load(good);await statusHas(/Local PDF preview ready/);
    await panel.getByRole('button',{name:'Close PDF review'}).click();
    await panel.waitFor({state:'detached'});
    await trigger.click();await panel.waitFor();
    assert.equal(await panel.locator('input[type=file]').inputValue(),'');
    assert.equal(await panel.getByLabel('Research title').inputValue(),'');
    await load(good);await statusHas(/Local PDF preview ready/);
    const subscriberCount=await page.evaluate(()=>window.DDPdfAuthEvents.length);
    assert.ok(subscriberCount>0,'fixture has registered auth subscribers');
    await page.evaluate(()=>{for(const cb of [...window.DDPdfAuthEvents]){try{cb('SIGNED_IN',{user:{id:'fixture-member',is_anonymous:false}})}catch{ /* Other independent app listeners are not under test. */ }}});
    await panel.waitFor({state:'detached'});
    await trigger.click();await panel.waitFor();
    await load(good);await statusHas(/Local PDF preview ready/);
    await page.locator('[data-tab="originalResearchPage"]').click();
    await panel.waitFor({state:'detached'});
    assert.equal(writeRequests.length,0,'server received no write requests');
    console.log('PASS genuine PDF canvas, table grid, embedded image, multiple pages, size/page limits, active content refusal, digest, review and lifecycle at '+width+'px');
   }finally{await context.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
