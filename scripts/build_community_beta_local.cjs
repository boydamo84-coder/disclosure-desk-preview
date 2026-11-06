'use strict';
// Creates an allowlisted static LOCAL-ONLY beta of the existing Disclosure Desk site.
// No network, no Netlify deploy, no Supabase mutations, no source feature flags changed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const staging=path.join(root,'.release-staging','public-site');
const beta=path.join(root,'.release-staging','community-beta-local');
assert.ok(!fs.existsSync(staging) && !fs.existsSync(beta),'Refuse to overwrite previous output');
cp.execFileSync(process.execPath,['scripts/build_public_release.cjs'],{cwd:root,stdio:'inherit'});
const siteManifest=JSON.parse(fs.readFileSync(path.join(staging,'release-manifest.json'),'utf8'));
assert.ok(siteManifest.files.length>=35 && siteManifest.files.length<=80);
for(const f of siteManifest.files){
 assert.doesNotMatch(f.path,/(^|\/)(?:scripts|supabase|finance_local|finance|docs|\.github)(\/|$)|\.(?:sql|env|zip|py|md)$/i);
}
fs.cpSync(staging,beta,{recursive:true,errorOnExist:true,force:false});
const file=path.join(beta,'assets','community-test-config.js');
let cfg=fs.readFileSync(file,'utf8');
assert.match(cfg,/const local=\['localhost','127\.0\.0\.1'\]\.includes\(location\.hostname\)/);
for(const [from,to] of [['privateChat:false,','privateChat:local,'],['discussions:false,','discussions:local,']]){
 assert.equal(cfg.split(from).length,2,'Unexpected original flag: '+from);
 cfg=cfg.replace(from,to);
}
assert.match(cfg,/privateChat:local/);
assert.match(cfg,/discussions:local/);
assert.doesNotMatch(cfg,/privateChat:true|discussions:true/,'No globally enabled community feature allowed');
assert.match(cfg,/profileAvatars:false/);
assert.match(cfg,/researchPublishing:false/);
fs.writeFileSync(file,cfg);
const html=fs.readFileSync(path.join(beta,'index.html'),'utf8');
for(const needle of ['assets/profile-private-chat.js','assets/community-discussions.js','ddProfileChatPanel']){
 assert.ok(html.includes(needle),'Existing community UI missing: '+needle);
}
const manifestPath=path.join(beta,'release-manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const row=manifest.files.find(x=>x.path==='assets/community-test-config.js');
assert.ok(row,'Feature configuration missing from public-only manifest');
const bytes=fs.readFileSync(file);
row.bytes=bytes.length;row.sha256=crypto.createHash('sha256').update(bytes).digest('hex');
manifest.totalBytes=manifest.files.reduce((n,x)=>n+x.bytes,0);
manifest.type='Disclosure Desk LOCAL-ONLY beta; NOT deployed; public host flags OFF';
manifest.betaRestrictions='Chat and Discussions enabled only on localhost / 127.0.0.1, using genuine existing Supabase backend. External hostnames disabled.';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
for(const f of manifest.files){
 const content=fs.readFileSync(path.join(beta,f.path));
 assert.equal(content.length,f.bytes,'Byte count mismatch '+f.path);
 assert.equal(crypto.createHash('sha256').update(content).digest('hex'),f.sha256,'Hash mismatch '+f.path);
}
console.log('PASS: '+manifest.files.length+' allowlisted website files; LIVE DD backend, local-only Chat + Discussions beta; public domain flags OFF; no Netlify deploy.');
