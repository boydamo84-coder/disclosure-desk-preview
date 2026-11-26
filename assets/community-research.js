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
let client,epoch=0,offset=0,authEpoch=0;
const engagementEnabled=window.DD_COMMUNITY_FEATURES?.researchEngagement===true;
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
// Read explicit public columns, never private member or review metadata.
// Member actions are separately gated; the existing backend enforces RLS.
async function verifiedMember(){
 const auth=db()?.auth;
 if(!auth||typeof auth.getSession!=='function'||typeof auth.getUser!=='function')return null;
 const gen=authEpoch;
 const start=await auth.getSession(),session=start.data?.session;
 if(start.error||!session||!uuid.test(String(session.user?.id||''))||typeof session.access_token!=='string'||!session.access_token)return null;
 const token=session.access_token;
 const verified=await auth.getUser(token),user=verified.data?.user;
 if(verified.error||!user||user.is_anonymous!==false||user.id!==session.user.id)return null;
 const now=await auth.getSession();
 if(now.error||now.data?.session?.user?.id!==user.id||now.data?.session?.access_token!==token||gen!==authEpoch)return null;
 return {id:user.id,token,gen};
}
// An immutable verified token is used for this one action; a mutable SDK
// session cannot silently change the actor. No credentials are stored or logged.
async function memberRequest(token,method,path,payload){
 const base=new URL(cfg.url);
 const loopback=cfg.environment==='test'&&['127.0.0.1','localhost'].includes(base.hostname)&&base.protocol==='http:';
 if(base.protocol!=='https:'&&!loopback)throw Error('Research service unavailable');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(new URL('/rest/v1/'+path,base),{
   method,credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal,
   headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+token,...(!path.startsWith('rpc/')?{Prefer:'return=minimal'}:{}),...(payload?{'Content-Type':'application/json'}:{})},
   ...(payload?{body:JSON.stringify(payload)}:{})
  });
  let data=null;
  try{data=await response.json()}catch{}
  if(response.status>=500||response.status===408)throw Error('Outcome unknown');
  return {ok:response.ok,code:data?.code,data};
 }finally{clearTimeout(timer);}
}
async function setReaction(token,id,value,stillBound){
 const filter='dd_cr_reactions?report_id=eq.'+id;
 if(value===0)return memberRequest(token,'DELETE',filter);
 const result=await memberRequest(token,'POST','dd_cr_reactions?select=report_id,reaction',{report_id:id,reaction:value});
 if(!result.ok&&result.code==='23505'){
  if(!stillBound())throw Error('Account changed during reaction');
  return memberRequest(token,'PATCH',filter,{reaction:value});
 }
 return result;
}

function mountFeedback(article,id,current){
 const panel=el('section',undefined,'dd-cr-feedback');
 panel.setAttribute('aria-label','Reader feedback');
 const tally=el('p','Loading reader feedback…','muted small'),commentList=el('div');
 const note=el('p','Likes and dislikes are reader feedback, not an evidence credibility score.','muted small');
 const message=el('p');message.setAttribute('role','status');
 const next=button('Load more comments',()=>void load(false));next.hidden=true;
 const retry=button('Refresh reader feedback',()=>void load(true));retry.hidden=true;
 panel.append(el('h3','Reader feedback'),note,tally,el('h3','Comments'),commentList,next,retry,message);
 article.querySelector('.card-body').append(panel);
 let offset=0,busy=false,seen=new Set(),member=null,actionBusy=false,actionBlocked=false;
 const memberNotice=el('p',engagementEnabled?'Checking member access…':'Member feedback controls are not enabled in this preview.','muted small');
 const memberBox=el('div');memberBox.hidden=true;
 const actionStatus=el('p');actionStatus.setAttribute('role','status');
 const reactionBar=el('div',undefined,'dd-cr-actions');
 const like=button('Like',()=>void act('reaction',1)),dislike=button('Dislike',()=>void act('reaction',-1)),clear=button('Clear my reaction',()=>void act('reaction',0));
 reactionBar.append(like,dislike,clear);
 const labeled=(label,input)=>{
  const wrapper=el('label');wrapper.style.cssText='display:grid;gap:4px;margin:8px 0';
  wrapper.append(el('span',label),input);input.style.cssText='width:100%;box-sizing:border-box';return wrapper;
 };
 const comment=el('textarea');comment.rows=3;comment.maxLength=2000;
 const reason=el('textarea');reason.rows=2;reason.maxLength=1000;
 const post=button('Post comment',()=>void act('comment',comment.value.trim()));
 const report=button('Report research',()=>void act('flag',reason.value.trim()));
 const feedbackHint=el('p','Report this version for a moderation reason, not simply because you disagree. Five distinct member reports hide it pending review.','muted small');
 memberBox.append(reactionBar,labeled('Your public comment',comment),post,feedbackHint,labeled('Reason for reporting this research',reason),report);
 panel.append(memberNotice,memberBox,actionStatus);
 const updateActions=()=>{
  const disabled=!member||busy||actionBusy||actionBlocked;
  for(const b of [like,dislike,clear])b.disabled=disabled;
  comment.disabled=disabled;reason.disabled=disabled;
  post.disabled=disabled||!comment.value.trim()||comment.value.trim().length>2000;
  report.disabled=disabled||!reason.value.trim()||reason.value.trim().length>1000;
 };
 comment.addEventListener('input',updateActions);reason.addEventListener('input',updateActions);
 updateActions();
 const active=()=>current===epoch&&article.isConnected&&!page.hidden;
 const stillPublic=async()=>{
  if(!active())return false;
  const row=await fetchPublic(id);
  if(!active())return false;
  if(row)return true;
  article.remove();say('This publication is unavailable.');return false;
 };
 const initMember=async()=>{
  if(!engagementEnabled)return;
  try{
   const identity=await verifiedMember();if(!active())return;
   if(!identity){memberNotice.textContent='Sign in with a member account to like, dislike, comment or report.';return;}
   member={id:identity.id,gen:identity.gen};memberNotice.textContent='Member feedback';memberBox.hidden=false;updateActions();
  }catch{if(active())memberNotice.textContent='Member access unavailable. Refresh or sign in again.';}
 };
 async function act(kind,value){
  if(!engagementEnabled||!active()||!member||actionBusy||actionBlocked)return;
  if(kind==='comment'&&(typeof value!=='string'||!value||value.length>2000))return;
  if(kind==='flag'&&(typeof value!=='string'||!value||value.length>1000))return;
  if(kind==='reaction'&&![1,-1,0].includes(value))return;
  const intended=member;actionBusy=true;updateActions();actionStatus.textContent='Checking account and publication…';
  let sent=false;
  try{
   if(!await stillPublic())return;
   const verified=await verifiedMember();if(!active())return;
   if(!verified||verified.id!==intended.id||verified.gen!==intended.gen||verified.gen!==authEpoch){
    member=null;comment.value='';reason.value='';memberBox.hidden=true;
    memberNotice.textContent='Account changed. Reopen the publication to continue.';actionStatus.textContent='Action cancelled. Nothing was sent.';return;
   }
   // No awaited work between the final identity check and issuing the request.
   sent=true;
   const result=kind==='reaction'?await setReaction(verified.token,id,value,()=>active()&&authEpoch===intended.gen)
    :kind==='comment'?await memberRequest(verified.token,'POST','dd_cr_comments?select=id,author_label,body_text,status',{report_id:id,body_text:value})
    :await memberRequest(verified.token,'POST','rpc/dd_cr_flag',{p_id:id,p_reason:value});
   if(!active()||authEpoch!==intended.gen)return;
   if(!result.ok){actionStatus.textContent='Action rejected. Check your membership or try again later.';return;}
   if(kind==='flag'){
    if(typeof result.data?.accepted!=='boolean'||typeof result.data?.hidden!=='boolean')throw Error('Unknown report outcome');
    reason.value='';
    if(result.data.hidden){article.remove();say('This publication is unavailable.');return;}
    actionStatus.textContent=result.data.accepted?'Report submitted for moderation.':'You have already reported this version in the current review round.';
   }else if(kind==='comment'){
    comment.value='';actionStatus.textContent='Comment submitted.';
   }else actionStatus.textContent='Reaction request completed. Feedback refreshed.';
   await load(true);
  }catch{
   if(!active())return;
   if(sent){
    actionBlocked=true;comment.value='';reason.value='';
    actionStatus.textContent='The action outcome is uncertain. Refresh the publication before any further feedback.';
   }else actionStatus.textContent='Account or publication could not be checked. Nothing was sent.';
  }finally{actionBusy=false;updateActions();}
 }
 const count=async reaction=>{
  const {count,error}=await db().from('dd_cr_reactions')
   .select('reaction',{count:'exact',head:true}).eq('report_id',id).eq('reaction',reaction);
  if(error||!Number.isSafeInteger(count)||count<0)throw Error('Feedback unavailable');
  return count;
 };
 async function load(reset){
  if(busy||!active())return;
  busy=true;updateActions();next.disabled=true;retry.hidden=true;message.textContent='Loading visible comments…';
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
  finally{busy=false;next.disabled=false;updateActions();}
 }
 void load(true);void initMember();
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

// Owner-only queue, separately disabled by default. No new grants or RPCs.
function mountModeration(){
 if(window.DD_COMMUNITY_FEATURES?.researchModeration!==true)return null;
 const profile=$('profilePage'),admin=$('ddProfileAdmin'),anchor=$('ddAdminDiscussions');
 if(!profile||!admin||!anchor)return null;
 const root=el('details',undefined,'dd-profile-card');root.id='ddCRModeration';
 const title=el('summary','Community Research · Owner review');
 const intro=el('p','Review research hidden by five distinct member reports. Only the site-owner allowlist may view or decide these cases. This queue shows up to 30 pending versions.','muted small');
 const notice=el('p','Open to check owner access.','muted small');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 const queue=el('div',undefined,'dd-forum-list');
 const reload=button('Refresh research review',()=>void load());
 root.append(title,intro,reload,notice,queue);anchor.after(root);
 let rev=0,busy=false;
 const visible=()=>root.open&&root.isConnected&&!admin.hidden&&!profile.hidden&&!profile.classList.contains('hidden');
 const active=ticket=>ticket===rev&&visible();
 const say=s=>{notice.textContent=s};
 const clear=(message='Open to check owner access.')=>{
  ++rev;busy=false;queue.replaceChildren();reload.disabled=false;say(message);
 };
 const close=()=>{root.open=false;clear('Owner review closed. Reopen to check access.');};
 // Closing the panel, leaving Profile, logging out and loss of the parent
 // Admin Centre all discard the sensitive DOM and any unfinished explanation.
 root.addEventListener('toggle',()=>{if(visible())void load();else clear();});
 window.addEventListener('dd-public-section-change',e=>{if(e.detail.section!=='profilePage')close();});
 const visibility=new MutationObserver(()=>{if(!visible()&&root.open)close();});
 visibility.observe(profile,{attributes:true,attributeFilter:['class','hidden']});
 visibility.observe(admin,{attributes:true,attributeFilter:['class','hidden']});
 // Keep only fields returned by the existing queue, never render an object as HTML.
 const valid=t=>typeof t==='string';
 function project(row){
  if(!row||!uuid.test(String(row.id||''))||!Number.isInteger(row.version_no)||row.version_no<1||row.version_no>100
   ||!Number.isSafeInteger(row.flag_count)||row.flag_count<5||!Array.isArray(row.flag_reasons)
   ||row.flag_reasons.length!==row.flag_count||!row.flag_reasons.every(x=>valid(x)&&x.length<=2000)
   ||!valid(row.title)||!row.title.trim()||row.title.length>320||!valid(row.author_label)||!row.author_label.trim()||row.author_label.length>160
   ||!valid(row.abstract)||row.abstract.length>3000||!valid(row.category)||row.category.length>100
   ||!valid(row.body_text)||row.body_text.length>240000||!valid(row.references_text)||row.references_text.length>40000
   ||!valid(row.created_at)||!(row.revision_of===null||uuid.test(String(row.revision_of||''))))throw Error('Invalid moderation queue');
  return {id:row.id,version_no:row.version_no,title:row.title,author_label:row.author_label,category:row.category,
   abstract:row.abstract,body_text:row.body_text,references_text:row.references_text,created_at:row.created_at,
   revision_of:row.revision_of,flag_count:row.flag_count,flag_reasons:row.flag_reasons.slice()};
 }
 async function readQueue(identity){
  const result=await memberRequest(identity.token,'POST','rpc/dd_cr_moderation_queue',{});
  if(!result.ok||!Array.isArray(result.data)||result.data.length>30)throw Error('Owner queue unavailable');
  const items=result.data.map(project);
  if(new Set(items.map(x=>x.id)).size!==items.length)throw Error('Invalid moderation queue');
  return items;
 }
 const same=(x,y)=>x&&y&&x.id===y.id&&x.gen===y.gen;
 async function load(success=''){
  if(!visible()||busy)return;
  const ticket=++rev;busy=true;queue.replaceChildren();reload.disabled=true;say('Checking site-owner access…');
  try{
   const identity=await verifiedMember();if(!active(ticket))return;
   if(!identity){say('Sign in with the authorised site-owner account.');return;}
   const items=await readQueue(identity);
   const confirmed=await verifiedMember();if(!active(ticket))return;
   if(!same(identity,confirmed)){clear('Account changed. Reopen owner review.');return;}
   for(const item of items)queue.append(caseCard(item,{id:identity.id,gen:identity.gen},ticket));
   say((success?success+' ':'')+(items.length?items.length+' pending research version(s) shown.':'No research awaiting review.'));
  }catch{if(active(ticket)){queue.replaceChildren();say('Owner review unavailable. Only the authorised site owner may load this queue.');}}
  finally{if(active(ticket)){busy=false;reload.disabled=false;queue.querySelectorAll('select,textarea,input').forEach(n=>{n.disabled=false});queue.querySelectorAll('button').forEach(n=>{n.disabled=true});}}
 }
 function caseCard(item,identity,ticket){
  const card=el('article',undefined,'dd-forum-item');card.dataset.reviewId=item.id;
  const dt=new Date(item.created_at);
  const meta=el('p',item.category+' · '+item.author_label+' · v'+item.version_no+' · '+(Number.isNaN(dt.getTime())?'Date unavailable':dt.toLocaleDateString()),'muted small');
  const evidence=el('details');evidence.append(el('summary','Read full research and references'),el('h4','Research text'),el('div',item.body_text,'dd-cr-text'));
  if(item.references_text)evidence.append(el('h4','References'),el('div',item.references_text,'dd-cr-text'));
  const flags=el('details');flags.append(el('summary',item.flag_count+' report reasons'));
  const reasons=el('ol');for(const reason of item.flag_reasons)reasons.append(el('li',reason,'dd-cr-text'));flags.append(reasons);
  const decision=el('select');decision.className='field';decision.setAttribute('aria-label','Review decision');
  for(const [value,label] of [['','Choose decision'],['restore','Restore to public research'],['reject','Reject · keep hidden']]){
   const option=el('option',label);option.value=value;decision.append(option);
  }
  const explanation=el('textarea');explanation.className='field';explanation.rows=3;explanation.maxLength=1000;explanation.setAttribute('aria-label','Decision reason');
  const confirmBox=el('input');confirmBox.type='checkbox';const confirmLabel=el('label');confirmLabel.append(confirmBox,document.createTextNode(' I have reviewed this specific version and its reporting reasons.'));
  const submit=button('Confirm review decision',()=>void decide());
  const hint=el('p','Restore starts a fresh reporting round. Reject keeps the version hidden; the moderation audit remains.','muted small');
  card.append(el('h4',item.title),meta,el('p',item.abstract),evidence,flags,hint,el('p','Review decision','muted small'),decision,el('p','Explain your decision (8–1000 characters)','muted small'),explanation,confirmLabel,el('div'),submit);
  const can=()=>['restore','reject'].includes(decision.value)&&explanation.value.trim().length>=8&&explanation.value.trim().length<=1000&&confirmBox.checked;
  const update=()=>{submit.disabled=busy||!can();};
  submit.disabled=true;
  for(const n of [decision,explanation,confirmBox])n.addEventListener('input',()=>{if(n!==confirmBox)confirmBox.checked=false;update();});
  async function decide(){
   if(!active(ticket)||busy||!can())return;
   const action=decision.value,reason=explanation.value.trim();busy=true;reload.disabled=true;
   queue.querySelectorAll('button,select,textarea,input').forEach(n=>{n.disabled=true});
   say('Rechecking owner, case and review reasons…');let sent=false;
   try{
    const before=await verifiedMember();if(!active(ticket))return;
    if(!same(before,identity)){close();return;}
    const now=await readQueue(before);
    if(!active(ticket))return;
    const exact=now.find(x=>x.id===item.id);
    if(!exact||JSON.stringify(exact)!==JSON.stringify(item)){
     clear('Case changed. Refresh and review the latest version before deciding.');return;
    }
    const verified=await verifiedMember();if(!active(ticket))return;
    if(!same(verified,identity)){close();return;}
    sent=true;
    const result=await memberRequest(verified.token,'POST','rpc/dd_cr_review',{p_id:item.id,p_action:action,p_reason:reason});
    if(!active(ticket))return;
    const after=await verifiedMember();if(!active(ticket))return;
    if(!same(after,identity)){close();return;}
    if(!result.ok||result.data!==true){clear('Decision not confirmed. Refresh to check the current queue.');return;}
    busy=false;
    await load(action==='restore'?'Version restored.':'Version rejected and kept hidden.');
   }catch{
    if(active(ticket)){
     clear(sent?'Decision outcome uncertain. Refresh the queue before any further decision.':'Owner or case could not be verified. No decision was sent.');
    }
   }finally{if(active(ticket)){busy=false;reload.disabled=false;update();}}
  }
  return card;
 }
 return {clear:close};
}

nav.hidden=false;
const moderation=mountModeration();
if(engagementEnabled||moderation){
 let currentActor,known=false;
 db()?.auth?.onAuthStateChange?.((_event,session)=>{
  const actor=session?.user?.id?session.user.id+'|'+String(session.user.is_anonymous):null;
  if(!known){known=true;currentActor=actor;return;}
  if(actor===currentActor)return;
  currentActor=actor;++authEpoch;moderation?.clear();
  // Avoid auth calls inside the SDK's auth-state callback. Re-rendering also
  // discards any old account's unsent text.
  if(!page.hidden&&viewId())setTimeout(()=>void refresh(),0);
 });
}
$('ddCRWrite').onclick=()=>ddOnPublicTabClick('researchStudio');
$('ddCRSearchGo').onclick=()=>void list();
$('ddCRSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void list()}});
$('ddCRCategory').onchange=()=>void list();
more.onclick=()=>void list(true);back.onclick=()=>setRoute(null);
window.addEventListener('dd-public-section-change',e=>{if(e.detail.section==='communityResearchPage')void refresh();else ++epoch});
window.DDCommunityResearch=Object.freeze({refresh});
if(!page.hidden)void refresh();
})();
