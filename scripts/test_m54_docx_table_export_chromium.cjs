'use strict';
// M54: real browser Word creation, synthetic content only, NO live API or Drive.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const JSZip=require('../research/vendor-jszip-3.10.1.js');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:393,height:900}});
  // Give document.currentScript's relative import-worker URL a valid base.
  // Fulfil this fixture navigation locally; no external network is contacted.
  await page.route('**/*',route=>{
   if(route.request().isNavigationRequest()&&route.request().url()==='https://offline.example/research/m54-test.html')
    return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="en"><body><main>Local Word table test only</main></body></html>'});
   return route.abort();
  });
  await page.goto('https://offline.example/research/m54-test.html');
  for(const source of ['research/vendor-dompurify-3.4.17.js','research/vendor-docx-9.5.1.js','research/docx-tools.js'])
   await page.addScriptTag({content:fs.readFileSync(source,'utf8')});
  const bytes=await page.evaluate(async()=>{
   const table=(name)=>'<h3>CASE COMPARISON</h3><table><thead><tr><th>Field</th><th>'+name+'</th><th>Test Case B</th></tr></thead><tbody>'+
    '<tr><td>location</td><td>Northern Ireland</td><td>Scotland</td></tr>'+
    '<tr><td>description</td><td>Publicly released footage, still under assessment</td><td>Official archival evidence record</td></tr>'+
    '<tr><td>source</td><td><a href="https://www.archives.gov/research/topics/uaps">https://www.archives.gov/research/topics/uaps</a></td><td>Test source B</td></tr></tbody></table>'+
    '<p>Sources: [1] National Archives · [2] Test source B</p>';
   const html='<p>Test text before repeated tables</p>'+table('Test Case A')+table('Test Case A')+
    '<p>Text after repeated tables remains present.</p>';
   const file=await window.DDResearchDocx.exportFile({bookTitle:'M54 Export Test',chapters:[{title:'Section 1',html}]});
   return Array.from(new Uint8Array(await file.arrayBuffer()));
  });
  const zip=await JSZip.loadAsync(Buffer.from(bytes));
  const xml=await zip.file('word/document.xml').async('string');
  assert.equal((xml.match(/<w:tbl>/g)||[]).length,2,'intentional duplicate tables must be preserved');
  assert.equal((xml.match(/<w:tblLayout[^>]*w:type="fixed"/g)||[]).length,2,'table widths cannot expand to long URLs');
  assert.equal((xml.match(/<w:tblW[^>]*w:w="9000"/g)||[]).length,2,'page-fitting fixed width in twips');
  assert.equal((xml.match(/<w:gridCol[^>]*w:w="1800"/g)||[]).length,2,'narrow Field column');
  assert.equal((xml.match(/<w:gridCol[^>]*w:w="3600"/g)||[]).length,4,'wider case columns');
  assert.ok((xml.match(/<w:tblHeader/g)||[]).length>=2,'repeated headers on continuation pages');
  assert.ok((xml.match(/<w:cantSplit/g)||[]).length>=8,'do not split individual source rows across pages');
  assert.ok(xml.includes('Test text before repeated tables')&&xml.includes('Text after repeated tables remains present.'));
  assert.ok(xml.includes('Northern Ireland')&&xml.includes('Scotland')&&xml.includes('https://www.archives.gov/research/topics/uaps'));
  console.log('PASS M54 Chromium actual DOCX: two intentional comparison tables retained, source URLs preserved, 9000-twip fixed table, 1800/3600/3600 columns, repeat headers, unsplit rows.');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M54 Word layout',e.stack||e);process.exitCode=1});
