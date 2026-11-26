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
   ||!Number.isSafeInteger(row.review_round)||row.review_round<1||!Number.isSafeInteger(row.flag_count)||row.flag_count<5||!Array.isArray(row.flag_reasons)
   ||row.flag_reasons.length!==row.flag_count||!row.flag_reasons.every(x=>valid(x)&&x.length<=2000)
   ||!valid(row.title)||!row.title.trim()||row.title.length>320||!valid(row.author_label)||!row.author_label.trim()||row.author_label.length>160
   ||!valid(row.abstract)||row.abstract.length>3000||!valid(row.category)||row.category.length>100
   ||!valid(row.body_text)||row.body_text.length>240000||!valid(row.references_text)||row.references_text.length>40000
   ||!valid(row.created_at)||!(row.revision_of===null||uuid.test(String(row.revision_of||''))))throw Error('Invalid moderation queue');
  return {id:row.id,version_no:row.version_no,title:row.title,author_label:row.author_label,category:row.category,
   abstract:row.abstract,body_text:row.body_text,references_text:row.references_text,created_at:row.created_at,
   revision_of:row.revision_of,review_round:row.review_round,flag_count:row.flag_count,flag_reasons:row.flag_reasons.slice()};
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
  const hint=el('p','Review round '+item.review_round+'. Restore starts a fresh reporting round. Reject keeps the version hidden; the moderation audit remains.','muted small');
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
    const result=await memberRequest(verified.token,'POST','rpc/dd_cr_review',{p_id:item.id,p_action:action,p_reason:reason,p_expected_round:item.review_round});
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


// Author tools use a separate, read-only ownership projection, never public
// author labels or a query of all visible reports to infer ownership.
function mountAuthor(){
 if(window.DD_COMMUNITY_FEATURES?.researchAuthorTools!==true)return null;
 const profile=$('profilePage'),privatePanel=$('ddProfilePrivate'),grid=privatePanel?.querySelector('.dd-profile-grid');
 if(!profile||!privatePanel||!grid)return null;
 const root=el('details',undefined,'dd-profile-card dd-profile-fold');root.id='ddCRAuthor';
 const notice=el('p','Open to view your published research.','muted small');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 const list=el('div',undefined,'dd-profile-list');
 const newest=button('Refresh newest publications',()=>void load(null));
 const older=button('Older publications',()=>{if(next)void load(next)});older.hidden=true;
 root.append(el('summary','My Published Research'),el('p','Your own submissions and version history, including hidden and withdrawn versions. Private W.NE files are not included.','muted small'),newest,notice,list,older);grid.prepend(root);
 let rev=0,busy=false,next=null;
 const visible=()=>root.open&&root.isConnected&&!privatePanel.hidden&&!profile.hidden&&!profile.classList.contains('hidden');
 const active=ticket=>ticket===rev&&visible();
 const say=msg=>{notice.textContent=msg};
 function clear(msg='Open to view your published research.'){
  ++rev;busy=false;next=null;list.replaceChildren();newest.disabled=false;older.disabled=false;older.hidden=true;say(msg);
 }
 function close(){root.open=false;clear();}
 root.addEventListener('toggle',()=>{if(visible())void load(null);else clear()});
 window.addEventListener('dd-public-section-change',e=>{if(e.detail.section!=='profilePage')close()});
 const observer=new MutationObserver(()=>{if(root.open&&!visible())close()});
 observer.observe(profile,{attributes:true,attributeFilter:['class','hidden']});
 observer.observe(privatePanel,{attributes:true,attributeFilter:['hidden','class']});
 const same=(a,b)=>a&&b&&a.id===b.id&&a.gen===b.gen;
 const valid=t=>typeof t==='string';
 const statuses=['pending','published','flagged','rejected','withdrawn'];
 const categories=['Case analysis','Document analysis','Scientific research','Historical research','FOIA research','Other research'];
 const labels={pending:'Pending',published:'Published',flagged:'Hidden pending moderation',rejected:'Rejected',withdrawn:'Withdrawn'};
 function project(row){
  if(!row||!uuid.test(String(row.id||''))||!valid(row.title)||!row.title.trim()||row.title.length>320
   ||!valid(row.author_label)||!row.author_label.trim()||row.author_label.length>160||!categories.includes(row.category)
   ||!statuses.includes(row.status)||!Number.isInteger(row.version_no)||row.version_no<1||row.version_no>100
   ||!(row.revision_of===null||uuid.test(String(row.revision_of||'')))||!valid(row.created_at)||!Number.isFinite(Date.parse(row.created_at))
   ||typeof row.has_active_successor!=='boolean')throw Error('Invalid author list');
  return {id:row.id,title:row.title,author_label:row.author_label,category:row.category,status:row.status,version_no:row.version_no,
   revision_of:row.revision_of,created_at:row.created_at,has_active_successor:row.has_active_successor};
 }
 async function readMine(identity,cursor){
  const result=await memberRequest(identity.token,'POST','rpc/dd_cr_my_publications',{
   p_expected_account:identity.id,p_before_created:cursor?.created_at??null,p_before_id:cursor?.id??null});
  if(!result.ok||!Array.isArray(result.data)||result.data.length>21)throw Error('Author list unavailable');
  const items=result.data.map(project);
  if(new Set(items.map(x=>x.id)).size!==items.length)throw Error('Invalid author list');
  return items;
 }
 function lock(value){
  busy=value;newest.disabled=value;older.disabled=value;
  for(const control of list.querySelectorAll('button,textarea,input,select'))control.disabled=value;
 }
 async function load(cursor,success=''){
  if(!visible()||busy)return;
  const ticket=++rev;next=null;list.replaceChildren();older.hidden=true;lock(true);say('Checking author access…');
  try{
   const identity=await verifiedMember();if(!active(ticket))return;
   if(!identity){say('Sign in with your member account.');return;}
   const items=await readMine(identity,cursor);
   const after=await verifiedMember();if(!active(ticket))return;
   if(!same(identity,after)){close();return;}
   const shown=items.slice(0,20);
   if(items.length>20){next={id:shown[19].id,created_at:shown[19].created_at};older.hidden=false;}
   for(const row of shown)list.append(cardFor(row,{id:identity.id,gen:identity.gen},cursor,ticket));
   say((success?success+' ':'')+(shown.length?shown.length+' of your research version(s) shown.':'No publications on this page.'));
  }catch{if(active(ticket)){list.replaceChildren();say('Your publications could not be loaded. Refresh or sign in again.');}}
  finally{if(active(ticket)){lock(false);list.querySelectorAll('[data-author-confirm]').forEach(n=>{n.disabled=true});}}
 }
 async function currentItem(item,identity,cursor,ticket){
  const before=await verifiedMember();if(!active(ticket))return null;
  if(!same(before,identity)){close();return null;}
  const items=await readMine(before,cursor);if(!active(ticket))return null;
  const exact=items.slice(0,20).find(x=>x.id===item.id);
  if(!exact||JSON.stringify(exact)!==JSON.stringify(item)){
   clear('Publication changed. Refresh your list before continuing.');return null;
  }
  const checked=await verifiedMember();if(!active(ticket))return null;
  if(!same(checked,identity)){close();return null;}
  return checked;
 }
 function cardFor(item,identity,cursor,ticket){
  const card=el('article',undefined,'dd-forum-item');card.dataset.authorPublicationId=item.id;
  card.append(el('h4',item.title+' · v'+item.version_no),el('p',labels[item.status]+' · '+item.category+' · '+new Date(item.created_at).toLocaleDateString(),'muted small'));
  if(item.revision_of)card.append(el('p','Revision of an earlier version.','muted small'));
  if(item.has_active_successor)card.append(el('p','This version has a newer active revision.','muted small'));
  if(item.status==='published'){
   const url=new URL(location.href);url.searchParams.set('dd_tab','communityResearchPage');url.searchParams.set('dd_publication',item.id);url.hash='';
   const view=el('a','Open public version','outline');view.href=url.pathname+url.search;card.append(view);
  }
  if(item.status==='published'&&!item.has_active_successor&&item.version_no<100){
   const editor=el('div');const prep=button('Prepare revision draft',()=>void prepare());
   card.append(prep,editor);
   async function prepare(){
    if(!active(ticket)||busy)return;
    editor.replaceChildren();lock(true);say('Checking latest owned published version…');
    try{
     if(!await currentItem(item,identity,cursor,ticket)||!active(ticket))return;
     const row=await fetchPublic(item.id,true);
     const after=await verifiedMember();if(!active(ticket))return;
     if(!same(after,identity)){close();return;}
     if(!row||row.id!==item.id||row.version_no!==item.version_no||row.title!==item.title||row.category!==item.category||typeof row.abstract!=='string'||typeof row.body_text!=='string'||typeof row.references_text!=='string'){
      clear('Publication unavailable or changed. Refresh before preparing a revision.');return;
     }
     editor.append(el('h4','Local revision draft · v'+(item.version_no+1)),el('p','Edit the previous public text and copy it into W.NE. This draft exists only in this open panel. Nothing will be published or saved automatically.','muted small'));
     const inputs=[];
     for(const [label,value,limit,rows] of [['Revision title',row.title,160,2],['Revision abstract',row.abstract,1500,3],['Revision research text',row.body_text,120000,8],['Revision references',row.references_text,20000,3]]){
      const wrap=el('label');wrap.style.cssText='display:grid;gap:4px;margin:8px 0';
      const field=el('textarea');field.className='field';field.rows=rows;field.maxLength=limit;field.value=value;
      wrap.append(el('span',label),field);editor.append(wrap);inputs.push(field);
     }
     const copy=button('Copy revision draft text',async()=>{
      if(!active(ticket)||busy)return;
      lock(true);
      try{
       if(!await currentItem(item,identity,cursor,ticket)||!active(ticket))return;
       const [title,abstract,body,refs]=inputs.map(n=>n.value);
       if(!title.trim()||!abstract.trim()||!body.trim()){say('Title, abstract and text are required.');return;}
       const text='Title: '+title+'\nCategory: '+item.category+'\nAbstract: '+abstract+'\n\n'+body+'\n\nReferences:\n'+refs;
       if(!navigator.clipboard?.writeText){say('Clipboard unavailable. Select and copy the draft text manually.');return;}
       await navigator.clipboard.writeText(text);
       if(active(ticket))say('Revision text copied. Paste it into W.NE. Publication is not enabled.');
      }catch{if(active(ticket))say('Could not copy. Select the draft fields manually.');}
      finally{if(active(ticket)){lock(false);list.querySelectorAll('[data-author-confirm]').forEach(n=>{n.disabled=true});}}
     });
     const discard=button('Discard local revision draft',()=>{editor.replaceChildren();say('Local revision draft discarded.');});
     editor.append(copy,discard);say('Revision draft prepared. No publication was sent.');
    }catch{if(active(ticket)){editor.replaceChildren();say('Could not prepare the revision. Refresh your list.');}}
    finally{if(active(ticket)){lock(false);list.querySelectorAll('[data-author-confirm]').forEach(n=>{n.disabled=true});}}
   }
  }
  if(['published','pending','flagged'].includes(item.status)){
   const withdraw=el('details');withdraw.append(el('summary','Withdraw all versions'),el('p','This removes the entire version chain from public view, including older citable versions and any active successor. It does not delete your private W.NE files. Rejected versions remain rejected.','muted small'));
   const reason=el('textarea');reason.rows=3;reason.maxLength=1000;reason.className='field';reason.setAttribute('aria-label','Withdrawal reason');
   const phrase=el('input');phrase.type='text';phrase.className='field';phrase.autocomplete='off';phrase.maxLength=8;phrase.setAttribute('aria-label','Type WITHDRAW to confirm');
   const confirm=button('Confirm entire-chain withdrawal',()=>void send());confirm.dataset.authorConfirm='';confirm.disabled=true;
   const can=()=>reason.value.trim().length>=8&&reason.value.trim().length<=1000&&phrase.value==='WITHDRAW';
   for(const n of [reason,phrase])n.addEventListener('input',()=>{confirm.disabled=busy||!can();});
   withdraw.append(el('p','Reason (8–1000 characters)','muted small'),reason,el('p','Type WITHDRAW to confirm','muted small'),phrase,confirm);
   card.append(withdraw);
   async function send(){
    if(!active(ticket)||busy||!can())return;
    const explanation=reason.value.trim();lock(true);say('Checking account and current version before withdrawing…');
    let sent=false;
    try{
     const verified=await currentItem(item,identity,cursor,ticket);if(!verified||!active(ticket))return;
     sent=true;
     const result=await memberRequest(verified.token,'POST','rpc/dd_cr_withdraw',{p_id:item.id,p_reason:explanation});
     if(!active(ticket))return;
     const after=await verifiedMember();if(!active(ticket))return;
     if(!same(after,identity)){close();return;}
     if(!result.ok||!Number.isSafeInteger(result.data)||result.data<1){
      clear('Withdrawal not confirmed. Refresh your list to check status.');return;
     }
     busy=false;await load(null,result.data+' active version(s) withdrawn.');
    }catch{if(active(ticket))clear(sent?'Withdrawal outcome uncertain. Refresh your list before any further action.':'Account or publication could not be checked. Nothing was sent.');}
    finally{if(active(ticket)){lock(false);list.querySelectorAll('[data-author-confirm]').forEach(n=>{n.disabled=true});}}
   }
  }
  return card;
 }
 return {clear:close};
}


// Local manual PDF pilot; the module and PDF parser are deliberately absent
// from the public package allowlist. No hosted configs or URL/storage switch.
function mountPdfPilot(){
 const trigger=$('ddCRUpload');
 if(!trigger||cfg.environment!=='test'||window.DD_COMMUNITY_FEATURES?.researchPdfPreview!==true
  ||!['127.0.0.1','localhost'].includes(location.hostname))return null;
 let panel=null,generation=0;
 function clear(){++generation;panel?.close();panel=null;trigger.disabled=false;trigger.textContent='Upload Research · local PDF review';}
 trigger.disabled=false;trigger.textContent='Upload Research · local PDF review';
 trigger.onclick=async()=>{
  clear();const gen=generation;trigger.disabled=true;
  try{
   const module=await import('/docs/community-research/pdf-upload-preview.mjs');
   if(gen!==generation||page.hidden)return;
   panel=module.mountPdfReview(trigger.parentElement.parentElement);
  }catch{if(gen===generation)say('Local PDF review unavailable. No file was sent.');}
  finally{if(gen===generation)trigger.disabled=false;}
 };
 window.addEventListener('dd-public-section-change',e=>{if(e.detail.section!=='communityResearchPage')clear();});
 return {clear};
}

nav.hidden=false;
const moderation=mountModeration(),authorTools=mountAuthor(),pdfPilot=mountPdfPilot();
if(engagementEnabled||moderation||authorTools||pdfPilot){
 let currentActor,known=false;
 db()?.auth?.onAuthStateChange?.((_event,session)=>{
  const actor=session?.user?.id?session.user.id+'|'+String(session.user.is_anonymous):null;
  if(!known){known=true;currentActor=actor;return;}
  if(actor===currentActor)return;
  currentActor=actor;++authEpoch;moderation?.clear();authorTools?.clear();pdfPilot?.clear();
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
