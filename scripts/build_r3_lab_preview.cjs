'use strict';
// Offline only: assemble a self-contained local UI preview from the production-
// independent R3 experiment. This NEVER touches the public website release.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'.r3-lab-preview');
if(fs.existsSync(out))throw Error('R3 preview already exists; refusing to overwrite');
const srcDir=path.join(root,'experiments','r3');
const src=fs.readFileSync(path.join(srcDir,'hypothesis-lab.cjs'),'utf8');
if(!src.includes('module.exports={createNotebook,addHypothesis,reviseHypothesis,revision,'))
 throw Error('Expected audited Hypothesis Lab CommonJS export not found');
if(/\brequire\s*\(|\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b/.test(src))
 throw Error('Unexpected dependencies/storage in offline hypothesis engine');
fs.mkdirSync(out,{recursive:true});
for(const [from,to] of [
 ['hypothesis-lab-preview.html','index.html'],
 ['hypothesis-ui.js','hypothesis-ui.js'],
 ['hypothesis-vault.js','hypothesis-vault.js'],
 ['hypothesis-ui.css','hypothesis-ui.css'],
 ['README_TESTING.txt','README_TESTING.txt']
])fs.copyFileSync(path.join(srcDir,from),path.join(out,to),fs.constants.COPYFILE_EXCL);
// Use the EXACT approved R2 navigation CSS, not a hand-drawn approximation.
// Script intentionally stays standalone; no public-site routing from localhost.
fs.copyFileSync(path.join(root,'assets','secondary-editorial-nav.css'),
 path.join(out,'editorial-dock.css'),fs.constants.COPYFILE_EXCL);
const wrapped=`'use strict';(function(){const module={exports:{}};\n${src}\nObject.defineProperty(window,'DDHypothesisLab',{value:module.exports,configurable:false,writable:false});})();\n`;
fs.writeFileSync(path.join(out,'hypothesis-engine.js'),wrapped,{flag:'wx'});
// R3 source gap analysis is bundled from its actual tested offline engine.
// Public source catalogue is embedded at build time: no browser fetch.
const gapSource=fs.readFileSync(path.join(srcDir,'research-gap-finder.cjs'),'utf8');
const bridgeSource=fs.readFileSync(path.join(srcDir,'research-gap-bridge.cjs'),'utf8');
if(/\brequire\s*\(|\bfetch\s*\(/.test(gapSource+bridgeSource))
 throw Error('Unexpected dependency/network access in offline source bridge');
fs.writeFileSync(path.join(out,'research-gap-finder.js'),
 `'use strict';(function(){const module={exports:{}};\n${gapSource}\nObject.defineProperty(window,'DDResearchGapFinder',{value:module.exports,configurable:false,writable:false});})();\n`,
 {flag:'wx'});
fs.writeFileSync(path.join(out,'research-gap-bridge.js'),
 `'use strict';(function(){const module={exports:{}};\n${bridgeSource}\nObject.defineProperty(window,'DDResearchGapBridge',{value:module.exports.createBridge({gapFinder:window.DDResearchGapFinder,notebookEngine:window.DDHypothesisLab}),configurable:false,writable:false});})();\n`,
 {flag:'wx'});
const rawCatalogue=JSON.parse(fs.readFileSync(path.join(root,'data','curated-historical-cases.json'),'utf8'));
if(!Array.isArray(rawCatalogue)||rawCatalogue.length>5000)
 throw Error('R3 public catalogue must be a bounded public case list');
const permitted=['id','kind','title','url','year','eventMonth','eventDay',
 'eventTime','eventTimestamp','locationPrecision','lat','lon','witnessIndependence',
 'instrumentMetadata'];
const cases=rawCatalogue.map(record=>{
 const selected=Object.fromEntries(permitted.filter(k=>Object.prototype.hasOwnProperty.call(record,k))
  .map(k=>[k,record[k]]));
 selected.sources=Array.isArray(record.sources)?
  record.sources.slice(0,30).map(s=>({url:s?.url,title:s?.title})):[];
 // Only count public witness statements; never ship witness accounts or names
 // into this offline alpha as an accidental private-data import.
 if(Array.isArray(record.witnessAccounts))
  selected.witnessAccounts=record.witnessAccounts.slice(0,10).map(()=>({}));
 return selected;
});
fs.writeFileSync(path.join(out,'curated-public-cases.js'),
 `'use strict';Object.defineProperty(window,'DDPublicCuratedCases',{value:Object.freeze(${JSON.stringify(cases)}),configurable:false,writable:false});\n`,
 {flag:'wx'});
// A locally served ZIP keeps the same 127.0.0.1:4175 origin to retain the
// encrypted browser vault. Fingerprint all CSS/JS so Chrome never silently
// reuses stale scripts or styles when the code changes between ZIPs.
const assets=['hypothesis-engine.js','research-gap-finder.js','research-gap-bridge.js',
 'curated-public-cases.js','hypothesis-vault.js','hypothesis-ui.js',
 'hypothesis-ui.css','editorial-dock.css'];
const digest=crypto.createHash('sha256');
for(const file of assets)digest.update(fs.readFileSync(path.join(out,file)));
const build=digest.digest('hex').slice(0,12);
const htmlPath=path.join(out,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
for(const file of assets){
 const match='"./'+file+'"';
 if(!html.includes(match))throw Error('Missing R3 asset '+file);
 html=html.replace(match,'"./'+file+'?v='+build+'"');
}
if(!html.includes('id="r3BuildStamp"'))throw Error('Missing visible R3 build identifier');
html=html.replace('R3 OFFLINE · NAV/PROMPT PATCH',
 'R3 NAV / PROMPT POLISH · BUILD '+build);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(path.join(out,'BUILD_INFO.txt'),[
 'Disclosure Desk R3 NAV / PROMPT POLISH',
 'Build: '+build,
 'Correct: original 14-tab R2 dock, navy/gold confirmations and research gaps.',
 'If you see a grey 127.0.0.1:4175 says popup: an OLD folder/server is active.',
 'Restart the Python server in the folder containing this BUILD_INFO.txt.',
 'Keep the same localhost origin to retain existing encrypted notebooks.'
].join(String.fromCharCode(10))+String.fromCharCode(10));
console.log('R3 version '+build+' with fingerprinted CSS/JS asset URLs');
const published=fs.readFileSync(path.join(root,'scripts','build_public_release.cjs'),'utf8');
if(published.includes('research-gap-bridge.cjs')||published.includes('research-gap-bridge.js')||
 published.includes('research-gap-finder.js')||published.includes("copy(\'curated-public-cases.js\')")||
 published.includes('hypothesis-lab-preview.html')||published.includes('hypothesis-ui.js')||
 published.includes('hypothesis-ui.css')||published.includes('hypothesis-engine.js')||
 published.includes('hypothesis-vault.js')||published.includes('editorial-dock.css'))
 throw Error('R3 prototype is unexpectedly listed in the production build');
console.log('PASS offline R3 UI preview assembled into .r3-lab-preview (not public release)');
