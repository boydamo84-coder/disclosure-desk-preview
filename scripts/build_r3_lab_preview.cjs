'use strict';
// Offline only: assemble a self-contained local UI preview from the production-
// independent R3 experiment. This NEVER touches the public website release.
const fs=require('node:fs'),path=require('node:path');
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
 ['hypothesis-ui.css','hypothesis-ui.css']
])fs.copyFileSync(path.join(srcDir,from),path.join(out,to),fs.constants.COPYFILE_EXCL);
const wrapped=`'use strict';(function(){const module={exports:{}};\n${src}\nObject.defineProperty(window,'DDHypothesisLab',{value:module.exports,configurable:false,writable:false});})();\n`;
fs.writeFileSync(path.join(out,'hypothesis-engine.js'),wrapped,{flag:'wx'});
const published=fs.readFileSync(path.join(root,'scripts','build_public_release.cjs'),'utf8');
if(published.includes('hypothesis-lab-preview.html')||published.includes('hypothesis-ui.js')||
 published.includes('hypothesis-ui.css')||published.includes('hypothesis-engine.js'))
 throw Error('R3 prototype is unexpectedly listed in the production build');
console.log('PASS offline R3 UI preview assembled into .r3-lab-preview (not public release)');
