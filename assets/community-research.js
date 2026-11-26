'use strict';
// Development-only adapter. A caller must supply a freshly fetched PUBLIC row.
// Never transfer a private draft, moderation record, attachment or arbitrary URL.
(function(root){
 const canonical='https://uapdisclosuredesk.com/';
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 function source(row){
  if(!row||row.status!=='published'||!uuid.test(String(row.id||'')))throw Error('Published research is unavailable');
  if(!Number.isInteger(row.version_no)||row.version_no<1||row.version_no>100)throw Error('Invalid publication version');
  const title=typeof row.title==='string'?row.title.trim():'';
  const author=typeof row.author_label==='string'?row.author_label.trim():'';
  if(!title||title.length>160||!author||author.length>80)throw Error('Invalid public research metadata');
  const url=new URL(canonical);url.searchParams.set('dd_tab','communityResearchPage');url.searchParams.set('dd_publication',row.id.toLowerCase());
  const suffix=' · v'+row.version_no;
  return Object.freeze({id:row.id.toLowerCase(),title:title.slice(0,160-suffix.length)+suffix,boardTitle:title.slice(0,120-suffix.length)+suffix,url:url.href,publisher:author+' · Community Research'});
 }
 async function transfer(id,action,adapters){
  if(!uuid.test(String(id||'')))throw Error('Invalid publication ID');
  if(!['board','citation','share'].includes(action))throw Error('Invalid research action');
  if(!adapters||typeof adapters.fetchPublic!=='function'||typeof adapters[action]!=='function')throw Error('Research action unavailable');
  const row=await adapters.fetchPublic(id.toLowerCase());
  const record=source(row);
  if(record.id!==id.toLowerCase())throw Error('Publication identity mismatch');
  const result=await adapters[action](record);
  if(result===false)throw Error('Research action could not be completed');
  return record;
 }
 const api=Object.freeze({source,transfer});
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DDCommunityResearchTransfer=api;
})(typeof window==='undefined'?null:window);

// Native reader development candidate; no public activation while flag is off.
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
if(window.DD_COMMUNITY_FEATURES?.researchPublishing!==true||!['test','production'].includes(cfg.environment)||!cfg.url||!cfg.publishableKey)return;
const $=id=>document.getElementById(id);
const nav=document.querySelector('[data-tab="communityResearchPage"]'),page=$('communityResearchPage');
if(!nav||!page)return;
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);if(cls)n.className=cls;return n};
const status=$('ddCRStatus'),results=$('ddCRResults'),more=$('ddCRMore'),filters=$('ddCRFilters'),back=$('ddCRBack');
const api=window.DDCommunityResearchTransfer,fields='id,title,author_label,abstract,category,status,version_no,created_at';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let client,epoch=0,offset=0;
const db=()=>client||(client=window.supabase?.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
function say(msg){status.textContent=msg}
function button(label,fn){const b=el('button',label,'outline');b.type='button';b.onclick=fn;return b}
function viewId(){return new URLSearchParams(location.search).get('dd_publication')}
function setRoute(id){
 const u=new URL(location.href);u.searchParams.set('dd_tab','communityResearchPage');
 if(id)u.searchParams.set('dd_publication',id);else u.searchParams.delete('dd_publication');
 if(u.href!==location.href)history.pushState({...history.state,ddSection:'communityResearchPage',ddSiteHop:true},'',u.pathname+u.search+u.hash);
 void refresh();
}
async function fetchPublic(id,full=false){
 if(!uuid.test(String(id||'')))return null;
 const query=db()?.from('dd_cr_submissions');
 if(!query)throw Error('Research service unavailable');
 const {data,error}=await query.select(fields+(full?',body_text,references_text':'')).eq('id',id).eq('status','published').maybeSingle();
 if(error)throw Error('Research service unavailable');
 return data?.status==='published'?data:null;
}
// Public feedback only. Member actions remain disabled pending account-safe
// write controls. Read explicit columns, never private member or review metadata.
function mountFeedback(article,id,current){
 const panel=el('section',undefined,'dd-cr-feedback');
 panel.setAttribute('aria-label','Reader feedback');
 const tally=el('p','Loading reader feedback…','muted small'),commentList=el('div');
 const note=el('p','Likes and dislikes are reader feedback, not an evidence credibility score. Member feedback controls are not enabled in this preview.','muted small');
 const message=el('p');message.setAttribute('role','status');
 const next=button('Load more comments',()=>void load(false));next.hidden=true;
 const retry=button('Refresh reader feedback',()=>void load(true));retry.hidden=true;
 panel.append(el('h3','Reader feedback'),note,tally,el('h3','Comments'),commentList,next,retry,message);
 article.querySelector('.card-body').append(panel);
 let offset=0,busy=false,seen=new Set();
 const active=()=>current===epoch&&article.isConnected&&!page.hidden;
 const stillPublic=async()=>{
  if(!active())return false;
  const row=await fetchPublic(id);
  if(!active())return false;
  if(row)return true;
  article.remove();say('This publication is unavailable.');return false;
 };
 const count=async reaction=>{
  const {count,error}=await db().from('dd_cr_reactions')
   .select('reaction',{count:'exact',head:true}).eq('report_id',id).eq('reaction',reaction);
  if(error||!Number.isSafeInteger(count)||count<0)throw Error('Feedback unavailable');
  return count;
 };
 async function load(reset){
  if(busy||!active())return;
  busy=true;next.disabled=true;retry.hidden=true;message.textContent='Loading visible comments…';
  if(reset){offset=0;seen=new Set();commentList.replaceChildren();next.hidden=true;tally.textContent='Loading reader feedback…';}
  try{
   if(!await stillPublic())return;
   const [likes,dislikes,response]=await Promise.all([count(1),count(-1),
    db().from('dd_cr_comments').select('id,author_label,body_text,created_at,status')
     .eq('report_id',id).eq('status','visible').order('created_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+19)
   ]);
   if(response.error||!Array.isArray(response.data))throw Error('Feedback unavailable');
   if(!await stillPublic())return;
   tally.textContent=likes+' '+(likes===1?'like':'likes')+' · '+dislikes+' '+(dislikes===1?'dislike':'dislikes');
   for(const row of response.data){
    if(row.status!=='visible'||!uuid.test(String(row.id||''))||typeof row.author_label!=='string'
     ||!row.author_label.trim()||row.author_label.length>80||typeof row.body_text!=='string'
     ||!row.body_text.trim()||row.body_text.length>2000||seen.has(row.id))continue;
    seen.add(row.id);
    const comment=el('div',undefined,'dd-cr-comment');
    comment.append(el('p',row.author_label,'muted small'),el('div',row.body_text,'dd-cr-text'));
    commentList.append(comment);
   }
   offset+=response.data.length;next.hidden=response.data.length<20;
   message.textContent=seen.size?seen.size+' visible comments shown.':'No visible comments yet.';
  }catch{if(active()){message.textContent='Reader feedback unavailable. Try refreshing.';retry.hidden=false;}}
  finally{busy=false;next.disabled=false;}
 }
 void load(true);
}
function card(row,full=false){
 const ref=api.source(row),article=el('article',undefined,'card'),body=el('div',undefined,'card-body');
 article.dataset.publicationId=ref.id;
 body.append(el('p','COMMUNITY RESEARCH · '+String(row.category||'Research'),'muted small'),el('h3',ref.title),el('p',ref.publisher,'muted small'),el('p',String(row.abstract||'')));
 if(full){
  body.append(el('h3','Published research'),el('div',String(row.body_text||''),'dd-cr-text'));
  if(row.references_text)body.append(el('h3','References'),el('div',String(row.references_text),'dd-cr-text'));
 }
 const actions=el('div',undefined,'dd-cr-actions');
 if(!full)actions.append(button('Read research',()=>setRoute(ref.id)));
 const adapters={fetchPublic:id=>fetchPublic(id),board:r=>{if(typeof window.DDSavePublicLinkToBoard!=='function')return false;window.DDSavePublicLinkToBoard(r.boardTitle,r.url);return true},citation:r=>typeof ddSaveSiteCitation==='function'&&ddSaveSiteCitation(r.title,r.url),share:r=>typeof window.DDSharePublicLink==='function'?window.DDSharePublicLink(r.title,r.url):false};
 for(const [kind,label] of [['board','Add to Board'],['citation','Add to W.NE citations'],['share','Share']]){
  const b=button(label,async()=>{b.disabled=true;try{
   await api.transfer(ref.id,kind,adapters);
   say(kind==='board'?'Choose a Board to finish saving.':kind==='citation'?'Saved in W.NE references on this device.':'Share action opened.');
  }catch{say('This research is unavailable or the action could not be completed.');try{if(!await fetchPublic(ref.id))article.remove()}catch{}}
  finally{b.disabled=false}});actions.append(b);
 }
 body.append(actions);article.append(body);return article;
}
async function list(append=false){
 const current=++epoch;more.hidden=true;filters.hidden=false;back.hidden=true;
 if(!append){offset=0;results.replaceChildren()}
 say('Loading published research…');
 try{
  let query=db()?.from('dd_cr_submissions');
  if(!query)throw Error('Research service unavailable');
  query=query.select(fields).eq('status','published').order('created_at',{ascending:false}).order('id',{ascending:false});
  const q=$('ddCRSearch').value.trim().replace(/[%_\\]/g,' ').trim(),category=$('ddCRCategory').value;
  if(q)query=query.ilike('title','%'+q+'%');
  if(category)query=query.eq('category',category);
  const {data,error}=await query.range(offset,offset+19);
  if(current!==epoch)return;
  if(error||!Array.isArray(data))throw Error();
  for(const row of data){try{results.append(card(row))}catch{}}
  offset+=data.length;more.hidden=data.length<20;
  say(results.children.length?results.children.length+' published reports shown.':'No published research matches your search.');
 }catch{if(current===epoch)say('Research service unavailable. Try again later.')}
}
async function refresh(){
 if(page.hidden)return;
 const id=viewId();
 if(!id)return list();
 const current=++epoch;results.replaceChildren();filters.hidden=true;back.hidden=false;more.hidden=true;say('Loading published research…');
 try{
  const row=await fetchPublic(id,true);if(current!==epoch)return;
  if(!row){say('This publication is unavailable.');return}
  const article=card(row,true);results.append(article);say('Published version '+row.version_no+' · Community research');
  mountFeedback(article,row.id,current);
 }catch{if(current===epoch)say('This publication is unavailable.')}
}
nav.hidden=false;
$('ddCRWrite').onclick=()=>ddOnPublicTabClick('researchStudio');
$('ddCRSearchGo').onclick=()=>void list();
$('ddCRSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void list()}});
$('ddCRCategory').onchange=()=>void list();
more.onclick=()=>void list(true);back.onclick=()=>setRoute(null);
window.addEventListener('dd-public-section-change',e=>{if(e.detail.section==='communityResearchPage')void refresh();else ++epoch});
window.DDCommunityResearch=Object.freeze({refresh});
if(!page.hidden)void refresh();
})();
