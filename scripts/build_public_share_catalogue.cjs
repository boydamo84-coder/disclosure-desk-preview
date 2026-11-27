'use strict';
// Server-only index of already public catalogue metadata; no account data or network.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function(root){
 const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 function arrayAfter(prefix,strict=true){
  const start=html.indexOf(prefix)+prefix.length;
  if(start<prefix.length)throw Error('Missing public array: '+prefix);
  let end=start,depth=0,quote='',escaped=false;
  for(;end<html.length;end++){
   const c=html[end];
   if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue;}
   if(c==='"'||c==="'"){quote=c;continue;}
   if(c==='[')depth++;
   if(c===']'&&--depth===0){end++;break;}
  }
  const raw=html.slice(start,end);
  return strict?JSON.parse(raw):vm.runInNewContext('('+raw+')',Object.create(null),{timeout:100});
 }
 const idOk=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,150}$/.test(id);
 const tidy=v=>String(v||'').replace(/\s+/g,' ').trim().slice(0,480);
 const safe=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}};
 const index={news:{},archive:{},video:{},case:{},hearing:{}};
 const put=(kind,id,title,source)=>{
  if(idOk(id)&&typeof title==='string'&&title.trim()&&!Object.hasOwn(index[kind],id))
   Object.defineProperty(index[kind],id,{enumerable:true,value:[tidy(title),tidy(source)]});
 };
 for(const row of read('news-alerts'))for(const r of [row,...(row.relatedCoverage||[])])
  if(safe(r.url))put('news',r.id,r.headline,r.source);
 const pursue=read('pursue-index');
 for(const r of read('curated-historical-cases'))if(safe(r.url))put('archive',String(r.id),r.title,r.source);
 for(const r of pursue.records)if(safe(r.source))put('archive','pursue-'+r.key,r.title,'PURSUE · '+(r.agency||'U.S. government'));
 for(const r of read('historical-news-archive'))if(safe(r.url))put('archive',String(r.id),r.title,r.source);
 for(const r of [...read('disclosure-clips'),...read('curated-official-videos'),...arrayAfter('const disclosureClipSeed=',false)])
  if(r.videoAvailable!==false&&safe(r.source))put('video',r.id,r.title,r.publisher);
 for(const r of [...arrayAfter('const mapData='),...arrayAfter('mapData.push(...'),...read('disclosure-map')])
  if(!['Archaeology','History','Science'].includes(r.category))put('case',r.id,r.title,'Source-linked map case');
 for(const r of read('approved-live-events'))if(['upcoming','live','ended'].includes(r.status))put('hearing',r.id,r.title,'Public hearing or event');
 // A separate server bundle, not the website or APK. Only public title/source pairs.
 const out=path.join(root,'.release-staging','share-catalogue.cjs');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,'module.exports='+JSON.stringify(index)+';\n',{flag:'wx'});
 console.log('PASS public share catalogue:',Object.fromEntries(Object.entries(index).map(([k,v])=>[k,Object.keys(v).length])));
};
