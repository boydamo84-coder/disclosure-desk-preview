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
// A locally served ZIP keeps the same 127.0.0.1:4175 origin to retain the
// encrypted browser vault. Fingerprint all CSS/JS so Chrome never silently
// reuses stale scripts or styles when the code changes between ZIPs.
const assets=['hypothesis-engine.js','hypothesis-vault.js','hypothesis-ui.js',
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
fs.writeFileSync(path.join(out,'BUILD_INFO.txt'),
 'Disclosure Desk R3 NAV / PROMPT POLISH\\n'+
 'Build: '+build+'\\n'+
 'Correct interface: 14-tab original R2 dock, custom navy/gold confirmation.\\n'+
 'If Chrome displays a grey \\"127.0.0.1:4175 says\\" prompt, you are\\n'+
 'serving an OLD folder or an OLD server process, not this build.\\n'+
 'Stop old Termux server with CTRL+C; start Python from folder containing\\n'+
 'this file. Keep the same 127.0.0.1:4175 origin for encrypted vault.\\n');
console.log('R3 version '+build+' with fingerprinted CSS/JS asset URLs');
const published=fs.readFileSync(path.join(root,'scripts','build_public_release.cjs'),'utf8');
if(published.includes('hypothesis-lab-preview.html')||published.includes('hypothesis-ui.js')||
 published.includes('hypothesis-ui.css')||published.includes('hypothesis-engine.js')||
 published.includes('hypothesis-vault.js')||published.includes('editorial-dock.css'))
 throw Error('R3 prototype is unexpectedly listed in the production build');
console.log('PASS offline R3 UI preview assembled into .r3-lab-preview (not public release)');
