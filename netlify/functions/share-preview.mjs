// Existing public permalinks, with a crawler-readable record-specific title.
// No cookies, user JWTs, private database tables, writes, or request-supplied URLs.
import catalog from '../../.release-staging/share-catalogue.cjs';
const ORIGIN='https://uapdisclosuredesk.com';
const IMAGE=ORIGIN+'/assets/share-desk.jpg';
const kinds={news:['discover','dd_news','News story'],archive:['archivePage','dd_archive_case','Evidence archive record'],video:['clips','dd_videos','Video'],case:['mapPage','case','Map case'],discussion:['discussionsPage','dd_thread','Community discussion'],witness:['mapPage','dd_witness','Public witness report'],media:['watchRead','dd_media','Watch & Read title']};
const talks={news:'discover',video:'clips',media:'watchRead',hearing:'livePage',archive:'archivePage',case:'mapPage',raw:'mapPage'};
const idPattern=/^[A-Za-z0-9_-]{1,150}$/;
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GITHUB='https://raw.githubusercontent.com/boydamo84-coder/disclosure-desk-preview/';
const DB='https://omqxizswzcwgzqaczlhe.supabase.co/rest/v1/';
const KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X'; // Same public key as browser; no privileged access.
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Public feed titles occasionally contain HTML entities; decode display text once,
// then HTML-escape all metadata and content below.
const clean=v=>String(v??'').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(all,token)=>{
 if(token[0]==='#'){const n=token[1].toLowerCase()==='x'?parseInt(token.slice(2),16):Number(token.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):all}
 return ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '})[token.toLowerCase()]??all;
}).replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,480);
function lookup(kind,id){return Object.hasOwn(catalog,kind)&&Object.hasOwn(catalog[kind],id)?catalog[kind][id]:null;}
export function parseSharePath(pathname){
 const parts=pathname.replace(/\/$/,'').split('/').slice(1);
 const [first,second,third,fourth]=parts;
 let kind,id,comment='',tab,name,params=new URLSearchParams();
 if(first==='talk'){
  if((parts.length!==3&&parts.length!==4)||!Object.hasOwn(talks,second)||!idPattern.test(third||'')||(fourth&&!uuidPattern.test(fourth)))return null;
  kind=second==='raw'?'case':second;id=third;comment=fourth||'';tab=talks[second];name=comment?'Public comment':'Public discussion';
  params.set('dd_tab',tab);params.set('dd_discussion',second==='raw'?id:second+':'+id);
  if(comment)params.set('dd_comment',comment);
 }else{
  if(parts.length!==2||!Object.hasOwn(kinds,first)||!idPattern.test(second||''))return null;
  kind=first;id=second;[tab,,name]=kinds[kind];
  if(['discussion','witness'].includes(kind)&&!uuidPattern.test(id))return null;
  if(kind!=='news')params.set('dd_tab',tab);
  params.set(kinds[kind][1],id);
 }
 return {kind,id,comment,discussion:first==='talk',name,target:'/?'+params.toString(),canonical:ORIGIN+'/'+parts.join('/')};
}
async function json(url,options={}){
 try{
  const res=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(2200)});
  if(!res.ok)return null;const length=Number(res.headers.get('content-length')||0);
  if(length>12_000_000)return null;
  const body=await res.text();if(body.length>12_000_000)return null;
  return JSON.parse(body);
 }catch{return null;}
}
async function publicRows(endpoint,query,body){
 const url=DB+endpoint+(query?'?'+new URLSearchParams(query):'');
 const data=await json(url,{headers:{apikey:KEY,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 return Array.isArray(data)?data:[];
}
async function exactPublicRecord(kind,id){
 if(kind==='discussion'){
  if(!uuidPattern.test(id))return null;
  const rows=await publicRows('rpc/dd_discussions_thread_v2',null,{p_thread_id:id});
  const row=rows.find(r=>r.id===id&&typeof r.title==='string');
  return row?[row.title,'Public community discussion']:null;
 }
 if(kind==='media'){
  const rows=await publicRows('rpc/dd_media_catalogue',null,{});
  const row=rows.find(r=>r.id===id&&['documentaries','movies','books','podcasts'].includes(r.category)&&typeof r.title==='string');
  return row?[row.title,'Watch & Read · '+(row.creator||row.category)]:null;
 }
 if(kind==='witness'){
  if(!uuidPattern.test(id))return null;
  const rows=await publicRows('dd_public_witness_reports',{id:'eq.'+id,select:'id,category,city,country',limit:'1'});
  const row=rows.find(r=>r.id===id);
  return row?['Witness report · '+row.category+' · '+[row.city,row.country].filter(Boolean).join(', '),'Unverified personal account · approximate town or city']:null;
 }
 if(kind==='hearing'){
  const stat=lookup(kind,id);if(stat)return stat;
  const rows=await publicRows('dd_live_events',{id:'eq.'+id,is_public:'eq.true',status:'in.(upcoming,live,ended)',select:'id,title,is_public,status',limit:'1'});
  const row=rows.find(r=>r.id===id&&r.is_public===true&&['upcoming','live','ended'].includes(r.status));
  return row?[row.title,'Public hearing or event']:null;
 }
 const local=lookup(kind,id);if(local)return local;
 if(kind==='news'){
  // Both are the exact public feed URLs already used by the news browser.
  const feeds=await Promise.all(['dev/mobile-video-performance-oct31','main'].map(branch=>json(GITHUB+branch+'/data/news-alerts.json')));
  for(const feed of feeds)if(Array.isArray(feed))for(const item of feed){
   for(const row of [item,...(Array.isArray(item?.relatedCoverage)?item.relatedCoverage:[])]){
    if(row?.id===id&&typeof row.headline==='string'&&typeof row.source==='string')return [row.headline,row.source];
   }
  }
 }
 if(kind==='video'){
  const feed=await json(GITHUB+'main/data/disclosure-clips.json');
  const row=Array.isArray(feed)&&feed.find(r=>r.id===id&&r.videoAvailable!==false&&typeof r.title==='string');
  if(row)return [row.title,row.publisher];
 }
 return null;
}
export async function renderShare(request){
 const method=request.method;
 if(method!=='GET'&&method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{allow:'GET, HEAD'}});
 const route=parseSharePath(new URL(request.url).pathname);
 if(!route)return new Response('Not found',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
 const record=await exactPublicRecord(route.kind,route.id);
 const title=clean(record?.[0])||route.name+' on Disclosure Desk';
 const description=record?(route.discussion?(route.comment?'Public comment on ':'Public discussion about ')+title+' · Disclosure Desk':clean(record[1]||route.name)+' · '+route.name+' on Disclosure Desk. Open the linked record and original sources.'):route.name+' · Open the linked record on Disclosure Desk. It may no longer be available.';
 const target=esc(route.target),pageTitle=title+' | Disclosure Desk';
 // No HTTP/meta-refresh redirect: the share crawler receives the actual
 // preview metadata in a 200 document. A human browser advances immediately
 // via script, and a plain functional link remains for no-JS visitors.
 const body='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>'+esc(pageTitle)+'</title><meta name="description" content="'+esc(description)+'"><meta property="og:type" content="website"><meta property="og:site_name" content="Disclosure Desk"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(route.canonical)+'"><meta property="og:image" content="'+IMAGE+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+IMAGE+'"><link rel="canonical" href="'+esc(route.canonical)+'"><link rel="icon" href="/assets/disclosure-desk-mark.svg"><style>body{background:#0b131c;color:#f4f1e8;font:16px system-ui,sans-serif;margin:0;padding:4rem 1.5rem}main{max-width:42rem;margin:auto}a{color:#e3c58a}h1{line-height:1.25}small{color:#b5c4d0}</style></head><body><main><small>DISCLOSURE DESK · '+esc(route.name)+'</small><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p><p><a id="open-record" href="'+target+'">Open on Disclosure Desk →</a></p></main><script>location.replace(document.getElementById("open-record").href)</script></body></html>';
 return new Response(method==='HEAD'?null:body,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'sha256-"+SCRIPT_HASH+"'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"}});
}
const SCRIPT_HASH='FXqsemziw3UewFZEPuak4ibAGKFT/rg4URQBrTPLlng=';
export default renderShare;
export const config={path:['/news/:id','/archive/:id','/video/:id','/case/:id','/discussion/:id','/witness/:id','/media/:id','/talk/:kind/:id','/talk/:kind/:id/:comment'],method:['GET','HEAD']};
