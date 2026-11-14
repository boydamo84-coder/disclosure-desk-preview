'use strict';
// Development Android builds use exactly the approved public release allowlist.
// This takes the source branch's pending HTML/CSS/JS into the APK without
// publishing Netlify or mixing old live HTML with new dev JavaScript.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const input=path.join(root,'.release-staging','public-site');
const output=path.join(root,'android-test','app','src','main','assets','dd-site');
if(!fs.existsSync(path.join(input,'release-manifest.json')))
 throw Error('First run node scripts/build_public_release.cjs on the selected development branch.');
if(fs.existsSync(output))throw Error('Refusing to overwrite existing Android snapshot; use a clean workspace.');
const manifest=JSON.parse(fs.readFileSync(path.join(input,'release-manifest.json'),'utf8'));
if(manifest.type!=='Disclosure Desk candidate static site - NOT DEPLOYED'||!Array.isArray(manifest.files))
 throw Error('Unrecognised public bundle manifest');
if(!manifest.files.some(x=>x.path==='index.html')||!manifest.files.some(x=>x.path==='assets/confirmation-dialog.js'))
 throw Error('Android snapshot is missing the current site and M74 confirmation dialog.');
const names=new Set();
let bytes=0;
for(const item of manifest.files){
 const rel=item.path;
 if(typeof rel!=='string'||!rel||rel.startsWith('/')||rel.includes('\\')||rel.split('/').some(x=>x==='.'||x==='..')||names.has(rel))
  throw Error('Unsafe or repeated public asset in manifest: '+rel);
 names.add(rel);
 const source=path.resolve(input,rel),dest=path.resolve(output,rel);
 if(!source.startsWith(input+path.sep)||!dest.startsWith(output+path.sep))
  throw Error('Unsafe public bundle path: '+rel);
 const stat=fs.lstatSync(source);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unexpected asset type: '+rel);
 const payload=fs.readFileSync(source),actual=crypto.createHash('sha256').update(payload).digest('hex');
 if(payload.length!==item.bytes||actual!==item.sha256)throw Error('Public bundle integrity mismatch: '+rel);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,payload,{flag:'wx'});
 bytes+=payload.length;
}
if(bytes!==manifest.totalBytes)throw Error('Manifest total byte length mismatch.');
const snapshot={type:'Disclosure Desk embedded Android development snapshot',branch:process.env.GITHUB_REF_NAME||'local',
 commit:process.env.GITHUB_SHA||'local',createdAt:new Date().toISOString(),
 files:manifest.files.map(x=>x.path),totalBytes:bytes};
fs.writeFileSync(path.join(output,'snapshot-manifest.json'),JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
console.log('PASS Android internal snapshot: '+snapshot.files.length+' approved public files; '+bytes+' bytes; zero Netlify deployments.');
