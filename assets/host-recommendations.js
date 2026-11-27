/* Transparent automated host picks. Read-only topic matching; never cast a
 * member vote, adjust a ranking or write to a public account. */
((root,factory)=>{
 const api=factory();
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 api.mount(root);
})(typeof window==='object'?window:null,()=>{
 'use strict';
 const hosts=Object.freeze({investigator:'The Investigator',scientist:'The Scientist',historian:'The Historian',sceptic:'The Sceptic',explorer:'The Explorer'});
 const focus=Object.freeze({investigator:'Sources and evidence',scientist:'Science and measurement',historian:'Archive and history',sceptic:'Verification and alternative explanations',explorer:'Research and discovery'});
 const dayMs=86400000;
 const allowedOfficial=['aaro.mil','war.gov','defense.gov','dvidshub.net','nasa.gov','archives.gov','cia.gov','congress.gov','gov.uk','esa.int','energy.gov'];
 const allowedReports=['reuters.com','apnews.com','bbc.com','bbc.co.uk','cbsnews.com','abcnews.go.com','theguardian.com','independent.co.uk','npr.org','news.sky.com','foxnews.com','space.com','scientificamerican.com','nature.com','science.org','theprint.in','newsnationnow.com'];
 const namedReports=new Set(['reuters','associated press','ap news','bbc news','bbc','cbs news','abc news','the guardian','the independent','npr','sky news','fox news','space.com','scientific american','nature','science','theprint','newsnation']);
 const block=/\b(video game|gta|playstation|xbox|netflix|movie trailer|box office|horoscope|fiction|game guide|conspiracy theory exposed|click here)\b/i;
 const topic=/\b(foia|declassif\w*|disclosure|records?|documents?|archives?|histor\w*|congress|hearings?|pentagon|aaro|nasa|science|scientific|astronom\w*|radar|sensor\w*|research|study|studies|evidence|investigat\w*|verification|analysis|debunk\w*|explanation\w*|footage)\b/i;
 const idOk=id=>typeof id==='string'&&id.length>0&&id.length<=160&&/^[A-Za-z0-9_-]+$/.test(id);
 const uuidOk=id=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
 const hasHost=(list,host)=>list.some(site=>host===site||host.endsWith('.'+site));
 function hostOf(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u.hostname.toLowerCase():''}catch{return ''}}
 function isAttributed(row){
  const host=hostOf(row.publisherUrl||row.url);
  if(hasHost(allowedOfficial,host)||hasHost(allowedReports,host))return true;
  // Approved feed can retain Google News publisher attribution without a direct publisher URL.
  try {const u=new URL(row.url);return hostOf(row.url)==='news.google.com'&&u.pathname.startsWith('/rss/articles/')&&namedReports.has(String(row.source||'').trim().toLowerCase())}catch{return false}
 }
 function persona(title){
  if(/\b(debunk\w*|verification|verify|uncertain\w*|alternative explanation|limitations)\b/i.test(title))return 'sceptic';
  if(/\b(radar|sensor\w*|infrared|science|scientific|astronom\w*|nasa|measurement|analys\w*)\b/i.test(title))return 'scientist';
  if(/\b(archive\w*|foia|histor\w*|declassif\w*)\b/i.test(title))return 'historian';
  if(/\b(records?|documents?|evidence|congress|hearings?|pentagon|aaro|sources?)\b/i.test(title))return 'investigator';
  return 'explorer';
 }
 function hash(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0;}
 function selectPicks(kind,pool,day){
  if(!['news','video'].includes(kind)||!Array.isArray(pool)||!/^\d{4}-\d{2}-\d{2}$/.test(day||''))return [];
  const start=Date.parse(day+'T00:00:00Z');if(!Number.isFinite(start))return [];
  const eligible=[];
  for(const row of pool){
   if(!row||!idOk(row.id))continue;
   const title=String(kind==='news'?row.headline:row.title||'').slice(0,350);
   if(title.length<4||block.test(title))continue;
   if(kind==='news'){
    const date=Date.parse(row.date);
    // Restrict to a recent attributed, research-relevant report. Topic match
    // does not establish factual accuracy or verification of publisher claims.
    if(!Number.isFinite(date)||date>=start+dayMs||date<start-7*dayMs||!topic.test(title)||!isAttributed(row))continue;
    eligible.push({id:row.id,title,host:persona(title),date});
   }else{
    if(row.evidenceStatus!=='official'||row.group!=='Official'||row.videoAvailable===false||!hasHost(allowedOfficial,hostOf(row.source)))continue;
    const date=Date.parse(row.publishedAt);
    if(Number.isFinite(date)&&date>=start+dayMs)continue;
    eligible.push({id:row.id,title,host:persona(title),date:Number.isFinite(date)?date:0});
   }
  }
  // Pick from a bounded, most-recent canonical pool, independent of UI sort/filter.
  eligible.sort((a,b)=>b.date-a.date||(a.id<b.id?-1:1));
  const seen=new Set(),unique=eligible.filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true}).slice(0,kind==='news'?16:24);
  unique.sort((a,b)=>hash(day+kind+a.id)-hash(day+kind+b.id)||(a.id<b.id?-1:1));
  const selected=[];
  for(const x of unique)if(!selected.some(y=>y.host===x.host)&&selected.length<2)selected.push(x);
  for(const x of unique)if(!selected.some(y=>y.id===x.id)&&selected.length<2)selected.push(x);
  return selected;
 }
 function validateStatus(data){
  if(!data||typeof data.active!=='boolean'||!/^\d{4}-\d{2}-\d{2}$/.test(data.day||'')||!Array.isArray(data.discussions)||data.discussions.length>1)return null;
  return {active:data.active,day:data.day,discussions:data.active?data.discussions.filter(x=>uuidOk(x?.id)&&Object.hasOwn(hosts,x.host)):[]};
 }
 function mount(win){
  const cfg=win.DD_COMMUNITY_TEST_CONFIG||{},flags=win.DD_COMMUNITY_FEATURES||{};
  if(flags.hostRecommendations!==true||flags.discussionHosts!==true||!cfg.url||!cfg.publishableKey||!win.supabase||!['production','test'].includes(cfg.environment))return;
  const doc=win.document, contexts=new Map();
  let status=null, lastAttempt=0, pending=null, client=null;
  const create=(tag,text,cls)=>{const n=doc.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
  function badge(parent,host){
   const old=parent.querySelector(':scope > .dd-host-recommendation');
   if(!Object.hasOwn(hosts,host)){old?.remove();return}
   if(old?.dataset.host===host)return;
   old?.remove();
   const group=create('div',null,'dd-host-recommendation');group.dataset.host=host;
   const a=create('a','Automated host pick · '+hosts[host],'dd-host-recommendation-label');
   a.href='/discussion-hosts#'+host;
   group.append(a,create('small',focus[host]+' · topic match, not a member vote or verification.','dd-host-recommendation-note'));
   parent.append(group);
  }
  function strip(node,picks,kind){
   if(!node)return;
   const signature=picks.map(p=>p.id+':'+p.host).join('|');
   if(node.dataset.picksSignature===signature)return;
   const open=node.open;
   node.replaceChildren();node.dataset.picksSignature=signature;node.hidden=!picks.length;
   if(!picks.length)return;
   node.append(create('summary','Today’s automated host picks · '+picks.length));
   const list=create('ul',null,'dd-host-pick-list');
   for(const p of picks){
    const li=create('li'),link=create('a',p.title);
    const target=new URL('/',win.location.origin);target.searchParams.set(kind==='news'?'dd_news':'dd_videos',p.id);link.href=target.href;
    li.append(create('small',hosts[p.host]+' · '+focus[p.host]),link);list.append(li);
   }
   node.append(list,create('small','Automated topic matches for research; not member likes or factual endorsements.','dd-host-recommendation-note'));
   node.open=open;
  }
  function render(){
   const active=status?.active===true;
   for(const [kind,ctx] of contexts){
    const picks=active?selectPicks(kind,ctx.pool,status.day):[];
    const selected=new Map(picks.map(p=>[p.id,p.host]));
    for(const card of ctx.grid.querySelectorAll(kind==='news'?'[data-news-id]':'[data-video-id]')){
     const body=card.querySelector(kind==='news'?'.card-body':'.clip-info');
     if(body)badge(body,selected.get(kind==='news'?card.dataset.newsId:card.dataset.videoId));
    }
    strip(ctx.strip,picks,kind);
   }
   const discussions=new Map(active?status.discussions.map(p=>[p.id,p.host]):[]);
   for(const target of doc.querySelectorAll('[data-dd-host-thread]'))badge(target,discussions.get(target.dataset.ddHostThread));
  }
  function refresh(force=false){
   if(pending)return pending;
   if(!force&&Date.now()-lastAttempt<120000)return Promise.resolve();
   lastAttempt=Date.now();
   pending=(async()=>{
    try{
     client??=win.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
     const query=client.rpc('dd_host_public_picks');
     const {data,error}=await (typeof query.abortSignal==='function'&&win.AbortSignal?.timeout?query.abortSignal(win.AbortSignal.timeout(8000)):query);
     status=error?null:validateStatus(data);
    }catch{status=null}
    finally{pending=null;render()}
   })();
   return pending;
  }
  win.DDHostPicks=Object.freeze({
   catalogue(kind,grid,pool,summary){if(!grid||!['news','video'].includes(kind))return;contexts.set(kind,{grid,pool:Array.isArray(pool)?pool:[],strip:summary});render();void refresh();},
   discussion(node){if(node){const pick=status?.active&&status.discussions.find(x=>x.id===node.dataset.ddHostThread);badge(node,pick?.host);void refresh()}},
   refresh
  });
  const start=()=>{win.ddSyncHostRecommendationCards?.();void refresh()};
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
  const timer=win.setInterval(()=>{if(doc.visibilityState==='visible')void refresh()},120000);
  doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='visible')void refresh()});
  win.addEventListener('pagehide',()=>win.clearInterval(timer),{once:true});
 }
 return Object.freeze({hosts,focus,selectPicks,validateStatus,mount});
});
