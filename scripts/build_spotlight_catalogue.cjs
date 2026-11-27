'use strict';
// Build a deliberately small, source-derived public catalogue. No network calls.
// The rotation consumes this public metadata only — never private notebooks.
const fs=require('node:fs'),path=require('node:path');
const safeSource=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}};
const historicalIds=['featured-rendlesham-1980','featured-roswell-1947','featured-nimitz-2004','us-jal-1628'];
const links={
 'featured-rendlesham-1980':'/rendlesham-forest-1980.html',
 'featured-roswell-1947':'/roswell-1947.html',
 'featured-nimitz-2004':'/?dd_tab=archivePage&dd_archive_case=featured-nimitz-2004',
 'us-jal-1628':'/?dd_tab=archivePage&dd_archive_case=us-jal-1628'
};
function generate(root){
 const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
 const cases=read('data/curated-historical-cases.json');
 const historical=historicalIds.map(id=>{
  const r=cases.find(x=>x.id===id);
  if(!r||!safeSource(r.url))throw Error('Missing reviewed spotlight historical record: '+id);
  return {id,kind:'historical',title:r.title.replace(/^FEATURED INVESTIGATION · /,''),subtitle:String(r.year)+' · '+r.source,
   summary:r.description,source:r.url,href:links[id],art:id.includes('rendlesham')?'forest':id.includes('roswell')?'desert':id.includes('nimitz')?'sea':'sky'};
 });
 // These established map cases link to the existing public source reader, not invented archive IDs.
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const start=index.indexOf('const mapData=')+'const mapData='.length;
 let end=start,depth=0,quoted=false,escaped=false;
 for(;end<index.length;end++){const c=index[end];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}if(c==='"'){quoted=true;continue;}if(c==='[')depth++;if(c===']'&&--depth===0){end++;break;}}
 const map=JSON.parse(index.slice(start,end));
 for(const id of ['c10','c5']){
  const r=map.find(x=>x.id===id),doc=r?.documents?.find(x=>safeSource(x.url)&&x.url.endsWith('.pdf'));
  if(!r||!doc)throw Error('Missing source-linked map case: '+id);
  historical.push({id,kind:'historical',title:r.title,subtitle:String(r.year)+' · Reported encounter',
   summary:r.desc+'. Explore the reported case and its linked source material.',source:doc.url,
   href:'/?case='+id,art:'sky'});
 }
 const data=read('data/pursue-index.json'),releases=new Map(data.releases.filter(r=>Number.isInteger(r.number)&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)).map(r=>[r.number,r.date]));
 const newest=[...releases.keys()].sort((a,b)=>b-a).slice(0,2),seen=new Set();
 const rank=r=>r.kind==='Video'?4:/unresolved|radar|AARO|unidentified/i.test(r.title)?3:/report|memorandum/i.test(r.title)?2:1;
 const candidates=data.records.filter(r=>r&&/^r\d{2}-[a-z0-9-]{2,75}$/.test(r.key)&&releases.has(r.release)&&
  ['Document','Video','Image','Audio'].includes(r.kind)&&typeof r.identifier==='string'&&r.identifier&&typeof r.title==='string'&&r.title.trim()&&safeSource(r.source)&&
  ['www.war.gov','www.dvidshub.net'].includes(new URL(r.source).host)&&!seen.has(r.key)&&seen.add(r.key));
 const prioritize=(a,b)=>b.release-a.release||rank(b)-rank(a)||Number(b.title.includes(releases.get(b.release).slice(0,4)))-Number(a.title.includes(releases.get(a.release).slice(0,4)))||a.key.localeCompare(b.key,'en');
 const recent=candidates.filter(r=>newest.includes(r.release)).sort(prioritize);
 // Prefer recent videos / reported encounters, while retaining variety and allowing future releases.
 const byRelease=newest.map(n=>recent.filter(r=>r.release===n).slice(0,16));
 // Interleave the two newest releases so each batch includes the newest drop
 // and another recently published record whenever both have enough items.
 const eligible=[];
 for(let i=0;i<16;i++)for(const group of byRelease)if(group[i])eligible.push(group[i]);
 if(eligible.length<4)for(const r of candidates.sort(prioritize))if(!eligible.includes(r)&&eligible.length<4)eligible.push(r);
 const pursue=eligible.slice(0,32).map(r=>({
  id:'pursue-'+r.key,kind:'pursue',title:r.title.replace(r.identifier+', ','').replace(r.identifier+'-',''),subtitle:'Release '+String(r.release).padStart(2,'0')+' · '+releases.get(r.release),
  source:r.source,href:'/?dd_tab=archivePage&dd_archive_case=pursue-'+r.key,identifier:r.identifier,
  summary:r.identifier+' · '+r.kind+' · '+(r.agency||'U.S. government')+'. Open the original release and its catalogue context.',
  release:r.release,published:releases.get(r.release),art:r.kind==='Video'?'video':'record'
 }));
 if(historical.length<4||pursue.length<4)throw Error('Spotlight requires four distinct items per category');
 return {version:1,historical,pursue};
}
module.exports=generate;
