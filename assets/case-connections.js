/* Disclosure Desk Case Connections v1. Source-first, read-only, no private data.
 * Matching a report to another is a research lead, not an independent corroboration.
 * Browser global DDCaseConnections; CommonJS export for local no-deploy QA.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DDCaseConnections=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const stop=new Set(('ufo uap unidentified sighting sightings observed observation observations report reports reported case cases file files project official government archive archives record records history historical investigation investigations incident incidents event events flying object objects unknown unexplained research featured official usaf research source sources released document documents sighted sighting about from with and the for are was were into this that there their what where when near around above below north south east west ministry force national air military records public regional agency agencies state states story stories entry entries sightings recorded years year group data information collection collections documentado informe relato relatos objeto avistamento avistamentos relato anomalous ufos').split(/\s+/));
 const weakPlaces=new Set(['unknown','unknown location','location not verified','not specified','various','worldwide','global','multiple locations','united kingdom','england','united states','usa','brazil','france','canada','ireland','australia','united states of america','n/a']);
 const safeText=x=>String(x==null?'':x);
 function tokens(value){
  return [...new Set((safeText(value).toLocaleLowerCase('en-GB').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').match(/[\p{L}\p{N}]{4,}/gu)||[]).map(w=>w.replace(/s$/,'')).filter(w=>w.length>=4&&!stop.has(w)))].slice(0,65);
 }
 function loc(r){
  const raw=safeText(r.city||r.location||'').trim().toLocaleLowerCase('en-GB');
  // A country/region alone is not a town-level match.
  let first=raw.split(/[,;|]/)[0].replace(/\s+/g,' ').trim();
  if(first.length<4||weakPlaces.has(first)||/^(unknown|not specified|multiple|various)\b/.test(first))return '';
  return first;
 }
 function geo(r){
  const lat=Number(r.lat),lon=Number(r.lon??r.long);
  if((r.lat===null||r.lat===undefined||r.lat==='')||(r.lon===null||r.lon===undefined)&&
     (r.long===null||r.long===undefined))return null;
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
  // Exact (0,0) generally indicates an unfilled placeholder.
  if(lat===0&&lon===0)return null;
  return {lat,lon};
 }
 function distance(a,b){
  const rad=Math.PI/180,p1=a.lat*rad,p2=b.lat*rad;
  const x=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin((b.lon-a.lon)*rad/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
 }
 function toEntry(r,index){
  const id=safeText(r.id).trim();
  const title=safeText(r.title),desc=safeText(r.description).slice(0,1400);
  const titleSet=tokens(title.replace(/^(featured investigation|official records)\s*[-·:]+/i,''));
  const descriptionSet=tokens(desc);
  const year=Number.isInteger(r.year)?r.year:Number(r.year);
  return {r,id,index,title,titleSet:new Set(titleSet),descriptionSet:new Set(descriptionSet),
   terms:new Set([...titleSet,...descriptionSet].slice(0,75)),
   year:Number.isInteger(year)&&year>=1800&&year<=2100?year:null,
   locality:loc(r),coords:geo(r),category:safeText(r.category).toLocaleLowerCase('en-GB').trim()};
 }
 function build(records){
  const entries=(Array.isArray(records)?records:[]).filter(r=>r&&r.id!=null&&r.title).map(toEntry);
  const byId=new Map(),postings=new Map(),localityIndex=new Map(),geoIndex=new Map(),frequency=new Map();
  for(const e of entries){
   if(byId.has(e.id))continue;
   byId.set(e.id,e);
   for(const t of e.terms){if(!postings.has(t))postings.set(t,[]);postings.get(t).push(e);frequency.set(t,(frequency.get(t)||0)+1)}
   if(e.locality){if(!localityIndex.has(e.locality))localityIndex.set(e.locality,[]);localityIndex.get(e.locality).push(e)}
   if(e.coords){const cell=cellOf(e.coords);if(!geoIndex.has(cell))geoIndex.set(cell,[]);geoIndex.get(cell).push(e)}
  }
  function cellOf(g){return Math.floor(g.lat)+'|'+Math.floor(g.lon)}
  function candidates(target){
   const set=new Map(), n=byId.size;
   const add=e=>{if(e.id!==target.id)set.set(e.id,e)};
   // Inverted index: rare descriptive words rather than every-pair comparisons.
   const terms=[...target.terms].filter(t=>(frequency.get(t)||0)<=Math.max(20,Math.min(700,Math.floor(n*.08))))
    .sort((a,b)=>(frequency.get(a)||0)-(frequency.get(b)||0)).slice(0,24);
   for(const t of terms)for(const e of postings.get(t)||[])add(e);
   if(target.locality)for(const e of localityIndex.get(target.locality)||[])add(e);
   if(target.coords){
    const lat=Math.floor(target.coords.lat),lon=Math.floor(target.coords.lon);
    // ~250km (at many latitudes) with exact haversine test below.
    // Longitude varies strongly with latitude; widen only at high latitudes.
    const radiusLon=Math.min(12,Math.ceil(2.5/Math.max(.15,Math.cos(target.coords.lat*Math.PI/180))));
    for(let i=-3;i<=3;i++)for(let j=-radiusLon;j<=radiusLon;j++){
     for(const e of geoIndex.get((lat+i)+'|'+(lon+j))||[])add(e);
    }
   }
   return [...set.values()];
  }
  function compare(target,other,n){
   if(target.id===other.id)return null;
   const yearGap=target.year===null||other.year===null?null:Math.abs(target.year-other.year);
   const sameLocality=!!target.locality&&target.locality===other.locality;
   const distanceKm=target.coords&&other.coords?distance(target.coords,other.coords):null;
   const nearCoords=distanceKm!==null&&distanceKm<=250;
   const near=nearCoords||sameLocality;
   // Terms in titles are a stronger signal than repeated general descriptions.
   const sharedTitle=[...target.titleSet].filter(t=>other.titleSet.has(t) &&
     (frequency.get(t)||n)<Math.max(15,n*.12)).slice(0,6);
   const sharedDesc=[...target.terms].filter(t=>other.terms.has(t)&&
     (frequency.get(t)||n)<Math.max(12,n*.04)&&!sharedTitle.includes(t)).slice(0,8);
   const relevantTopic=sharedTitle.length>0||sharedDesc.length>=2;
   const sameCategory=!!target.category&&target.category===other.category;
   // One nearby report may be interesting even without shared text, but
   // never recommend solely because two records have similar catalogue years.
   if(!near&&!relevantTopic)return null;
   let score=0;
   const reasons=[];
   if(sameLocality){score+=27;reasons.push('Same named locality (source place label)')}
   if(distanceKm!==null&&distanceKm<=250){
    score+=distanceKm<=25?30:distanceKm<=100?18:7;
    reasons.push('Approx. '+Math.round(distanceKm)+' km between listed coordinates');
   }
   if(sharedTitle.length){score+=Math.min(36,sharedTitle.length*13);reasons.push('Shared specific title terms: '+sharedTitle.slice(0,3).join(', '))}
   if(sharedDesc.length>=2){score+=Math.min(24,sharedDesc.length*4);reasons.push('Similar record descriptions: '+sharedDesc.slice(0,4).join(', '))}
   if(yearGap!==null&&yearGap<=5){score+=yearGap<=1?10:yearGap<=3?6:3;reasons.push('Catalogue years '+(yearGap===0?'match':'within '+yearGap+' years'))}
   if(sameCategory&&(near||relevantTopic)){score+=3;reasons.push('Same archive subject category')}
   const possibleDuplicate=yearGap!==null&&yearGap<=1&&(sameLocality||distanceKm!==null&&distanceKm<=30)&&sharedTitle.length>=2;
   // Do not confuse identical publisher source URL with an independent sighting.
   if(possibleDuplicate)reasons.unshift('Possible overlapping record — verify original documents');
   return {record:other.r,id:other.id,score,reasons,shared:sharedTitle,nearYear:yearGap!==null&&yearGap<=2,yearGap,
    distanceKm:distanceKm===null?null:Math.round(distanceKm),sameLocality,
    similar:relevantTopic,nearby:near,timeLinked:yearGap!==null&&yearGap<=3&&(near||relevantTopic),
    possibleDuplicate};
  }
  function search(item,options){
   const opts=options||{},limit=Math.max(1,Math.min(40,Number(opts.limit)||12));
   const mode=['all','nearby','similar','time'].includes(opts.mode)?opts.mode:'all';
   const target=byId.get(safeText(item&&item.id)) || (item&&item.id!=null?toEntry(item,-1):null);
   if(!target)return [];
   const results=[];
   for(const e of candidates(target)){
    const match=compare(target,e,byId.size);
    if(!match)continue;
    if(mode==='nearby'&&!match.nearby)continue;
    if(mode==='similar'&&!match.similar)continue;
    if(mode==='time'&&!match.timeLinked)continue;
    results.push(match);
   }
   results.sort((a,b)=>b.score-a.score||Number(a.yearGap??999)-Number(b.yearGap??999)||a.id.localeCompare(b.id));
   return results.slice(0,limit);
  }
  return Object.freeze({search,size:byId.size,withCoordinates:entries.filter(e=>e.coords).length,withLocality:entries.filter(e=>e.locality).length});
 }
 return Object.freeze({build,version:'1.0'});
});
