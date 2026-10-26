import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const root=process.cwd();
const types={'.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const relative=pathname.replace(/^\/disclosure-desk-preview\/?/,'').replace(/^\//,'')||'index.html';
 const file=resolve(root,relative);
 if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(readFileSync(file))}
 catch{res.writeHead(404).end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
let failures=[];
try{
 for(const [name,contextOptions] of [['mobile',devices['Pixel 7']],['desktop',{viewport:{width:1280,height:850}}]]){
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/disclosure-desk-preview/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-go="clips"]').first().click();
  await page.locator('#clipDiscoveryMode').selectOption('fresh');
  await page.locator('#clipDiscoveryMode').selectOption('recommended');
  await page.locator('#openImmersiveClips').click();
  await page.locator('#immersiveViewer').waitFor({state:'visible'});
  await page.locator('#immersiveAutoplay').check();
  await page.locator('#immersiveNext').click();
  await page.locator('#closeImmersive').click();
  await page.locator('#immersiveViewer').waitFor({state:'hidden'});
  if(errors.length)throw Error(name+' JavaScript runtime errors: '+errors.join('; '));
  console.log(name+': navigation, discovery controls, immersive viewer and autoplay passed');
  await context.close();
 }
}catch(e){failures.push(e.stack||String(e))}
finally{await browser.close();server.close()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
