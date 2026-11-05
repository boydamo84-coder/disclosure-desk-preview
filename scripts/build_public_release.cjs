'use strict';
// Offline public website staging: never deploys, never touches real accounts.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.release-staging','public-site');
if(fs.existsSync(out))throw Error('Refusing to overwrite existing release staging folder');
const top=['index.html','sources.html','community-rules.html','privacy.html','research-edition.html',
 'cloud-boards.js','manifest.webmanifest','robots.txt','sitemap.xml','app-ads.txt'];
const data=['approved-live-events.json','curated-historical-cases.json','curated-official-videos.json',
 'disclosure-clips.json','disclosure-map.json','historical-news-archive.json',
 'international-source-registry.json','news-alerts.json'];
const webExt=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.woff2']);
const files=[];
function copy(rel){
 const src=path.resolve(root,rel),dest=path.resolve(out,rel);
 if(!src.startsWith(root+path.sep)||!dest.startsWith(out+path.sep))throw Error('Unsafe path '+rel);
 const stat=fs.lstatSync(src);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Non-regular source '+rel);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(src,dest,fs.constants.COPYFILE_EXCL);
 const bytes=fs.readFileSync(dest);
 files.push({path:rel,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
function websiteDir(dir){
 for(const d of fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!d.isFile()||!webExt.has(path.extname(d.name).toLowerCase()))
   throw Error('Unexpected web directory entry: '+dir+'/'+d.name);
  copy(dir+'/'+d.name);
 }
}
top.forEach(copy);websiteDir('assets');websiteDir('research');
data.forEach(p=>copy('data/'+p));
copy('research/data/curated-public-cases.json');
const cfg=fs.readFileSync(path.join(out,'assets/community-test-config.js'),'utf8');
for(const flag of ['privateChat:false','discussions:false','researchPublishing:false'])
 if(!cfg.includes(flag))throw Error('Unapproved feature activation detected: '+flag);
const manifest={type:'Disclosure Desk candidate static site - NOT DEPLOYED',files:files.sort((a,b)=>a.path.localeCompare(b.path)),
 totalBytes:files.reduce((n,f)=>n+f.bytes,0)};
fs.writeFileSync(path.join(out,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log('PASS allowlisted public staging: '+files.length+' files '+manifest.totalBytes+' bytes; NO deploy');
