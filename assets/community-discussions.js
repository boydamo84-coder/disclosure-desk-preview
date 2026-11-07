/* Disclosure Desk public Discussions. Unpublished, OFF by default.
 * New user-created sections and threads are separate from NEWS comments,
 * public LIVE chat and private one-to-one Profile messages.
 * Every mutation must be enforced independently by server-side RPC permissions.
 */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{},flags=window.DD_COMMUNITY_FEATURES||{};
const enabled=flags.discussions===true&&['test','production'].includes(cfg.environment)&&!!cfg.url&&!!cfg.publishableKey;
if(!enabled)return; // No tab, requests, sign-in prompts or changed navigation until launch approval.
const $=id=>document.getElementById(id);
const mk=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);if(cls)x.className=cls;return x};
let client=null,section=null,thread=null,sections=[],sort='recent',epoch=0,ready=false,feedPage=0,feedQuery='',feedTotal=0,feedModern=true,deepLinkHandled=false,searchTimer=null;
let viewerId=undefined,identityRevision=0;
const db=()=>client||(client=window.supabase?.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
function say(s){const n=$('ddForumStatus');if(n)n.textContent=String(s).slice(0,220)}
function nodeAction(parent,label,fn,cls='outline'){
 const b=mk('button',label,cls);b.type='button';b.onclick=()=>{void fn(b)};parent.append(b);return b;
}
function empty(parent,text){parent.replaceChildren(mk('p',text,'muted small'))}
function isId(value){return /^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(String(value||''))}
function safeLink(value){
 try{const u=new URL(String(value||''));return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null}catch{return null}
}
function safeImage(value){
 try{
  const u=new URL(String(value||'')),h=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')
   ||String(value).length>1000||!h.includes('.')||!/[a-z]{2,}$/.test(h)
   ||/(^|[.])(?:localhost|local|internal|test)$/.test(h)
   ||/^\d+\.\d+\.\d+\.\d+$/.test(h))return null;
  return u.href;
 }catch{return null}
}
function photo(parent,row){
 const url=safeImage(row?.image_url);if(!url)return;
 const frame=mk('div',undefined,'dd-forum-image-wrap'),img=mk('img');
 img.src=url;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 img.alt='Image linked by a community member, not independently verified';
 img.addEventListener?.('error',()=>{frame.replaceChildren();frame.hidden=true});
 frame.append(img,mk('small','Community-supplied image · verify the original source','muted small'));parent.append(frame);
}
function permalink(row){
 return isId(row?.id)?'https://uapdisclosuredesk.com/?dd_tab=discussionsPage&dd_thread='+encodeURIComponent(row.id):null;
}
async function shareThread(row){
 const url=permalink(row);if(!url)return;
 try{
  if(navigator.share){await navigator.share({title:row.title||'Disclosure Desk discussion',url});return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);
   say('Discussion link copied. Links work after the public Discussions launch.');return}
 }catch(e){if(e?.name==='AbortError')return}
 prompt('Copy discussion link (available after public launch):',url);
}
function saveThread(row){
 if(!isId(row?.id))return;
 if(typeof window.DDSaveForumToBoard!=='function'){say('Investigation Boards are unavailable.');return}
 window.DDSaveForumToBoard(row.title||'Discussion',row.id);
 say('Choose a private Investigation Board to save this discussion.');
}
function toneBadge(row){
 const tone=row?.post_tone;
 if(!['serious','fun'].includes(tone))return null;
 return mk('span',tone==='serious'?'● Serious':'✦ Fun','dd-forum-tone dd-forum-tone-'+tone);
}
async function rpc(name,args){
 const c=db();if(!c)throw Error('Community service unavailable.');
 const {data,error}=await c.rpc(name,args||{});
 if(error)throw Error('Community service unavailable. '+String(error.message||'').slice(0,95));
 return data;
}
async function registered(){
 const c=db();if(!c)throw Error('Community service unavailable.');
 const {data,error}=await c.auth.getUser();
 if(error||!data?.user||data.user.is_anonymous)throw Error('Sign in to your registered account first.');
 return data.user;
}
async function change(button,operation,ok){
 button.disabled=true;say('Checking your account…');
 const identityAtStart=identityRevision;
 try{
  const actor=await registered();
  if(identityAtStart!==identityRevision||(viewerId!==undefined&&viewerId!==actor.id))
   throw Error('Account changed. Please try again.');
  const result=await operation();
  if(identityAtStart!==identityRevision)throw Error('Account changed. Please refresh.');
  if(result===false)throw Error('Action not permitted or no change was made.');
  say(ok);await refresh();return true;
 }catch(e){say(e?.message||'Unable to save.');return false}
 finally{button.disabled=false}
}
function link(parent,url,label){
 const valid=safeLink(url);if(!valid)return;
 const a=mk('a',label||new URL(valid).hostname,'dd-forum-link');a.href=valid;
 a.target='_blank';a.rel='noopener noreferrer nofollow ugc';parent.append(a);
}
async function openSection(item){
 if(!isId(item?.id))return;section=item;thread=null;setCreateButtons();feedPage=0;feedQuery='';feedTotal=0;
 if($('ddForumFeedSearch'))$('ddForumFeedSearch').value='';
 $('ddForumSectionsPane').hidden=true;$('ddForumThreadPane').hidden=false;
 $('ddForumThreadTitle').textContent=item.title||'Discussions';
 $('ddForumSectionInfo').textContent=(item.description||'')+(item.is_steward?' · You steward this section.':'');
 $('ddForumStewardPanel').hidden=!item.is_steward;
 $('ddForumStewardForm').elements.namedItem('description').value=item.description||'';
 $('ddForumStewardForm').elements.namedItem('topic').value=item.topic||'';
 $('ddForumPostList').hidden=false;
 $('ddForumSortLabel').hidden=false;
 $('ddForumPostCreate').hidden=false;
 $('ddForumPostCreate').reset();
 $('ddForumPostList').replaceChildren();
 await loadThreads();
}
async function openThread(item){
 if(!isId(item?.id))return;thread=item;setCreateButtons();
 $('ddForumThreadTitle').textContent=item.title||'Discussion';
 $('ddForumPostCreate').hidden=true;
 $('ddForumPostList').hidden=true;
 $('ddForumSortLabel').hidden=true;
 $('ddForumStewardPanel').hidden=true;
 $('ddForumReplyPane').hidden=false;
 const pane=$('ddForumReplyContent');pane.replaceChildren();
 const badge=toneBadge(item);if(badge)pane.append(badge);
 pane.append(mk('h3',item.title||'Discussion'));photo(pane,item);
 pane.append(mk('p',item.body||'','dd-forum-body'));
 link(pane,item.link_url,'Original source · '+(safeLink(item.link_url)?new URL(safeLink(item.link_url)).hostname:''));
 const tools=mk('div',undefined,'dd-forum-actions');actionsFor(tools,'thread',item,true);pane.append(tools);
 $('ddForumReplyCreate').reset();
 await loadReplies();
}
async function loadReplies(){
 if(!thread)return;
 const id=thread.id,stamp=++epoch,list=$('ddForumReplies');empty(list,'Loading replies…');
 try{
  const rows=await rpc('dd_discussions_replies',{p_thread_id:id,p_limit:100});
  if(stamp!==epoch||thread?.id!==id)return;
  list.replaceChildren();
  if(!rows?.length)empty(list,'No replies yet. Start the discussion.');
  for(const r of rows||[]){
   const card=mk('article',undefined,'dd-forum-item');
   const header=mk('small',(r.author_name||'Community member')+' · '+new Date(r.created_at).toLocaleDateString(),'muted');
   const body=mk('p',r.body||'');body.className='dd-forum-body';
   const tools=mk('div',undefined,'dd-forum-actions');
   card.append(header,body,tools);
   actionsFor(tools,'reply',r);
   list.append(card);
  }
 }catch(e){say(e?.message||'Replies temporarily unavailable.')}
}
async function vote(kind,row,value,button){
 const next=Number(row.my_vote)===value?0:value;
 await change(button,()=>rpc('dd_discussions_vote',{p_kind:kind,p_id:row.id,p_value:next}), 'Vote saved.');
}
function actionsFor(parent,kind,row,inDetail=false){
 if(!isId(row.id))return;
 const like=nodeAction(parent,'👍 '+(row.likes||0),b=>vote(kind,row,1,b));
 const dislike=nodeAction(parent,'👎 '+(row.dislikes||0),b=>vote(kind,row,-1,b));
 like.setAttribute('aria-pressed',String(Number(row.my_vote)===1));
 dislike.setAttribute('aria-pressed',String(Number(row.my_vote)===-1));
 if(kind==='thread'){
  if(!inDetail)nodeAction(parent,'💬 '+(Number.isFinite(Number(row.reply_count))?row.reply_count:'Comments'),()=>openThread(row),'outline dd-forum-action-comment');
  nodeAction(parent,'↗ Share',()=>shareThread(row),'outline dd-forum-action-share');
  nodeAction(parent,'☆ Add to Board',()=>saveThread(row),'outline dd-forum-action-save');
 }
 nodeAction(parent,'⚑ Flag',async b=>{
  const reason=prompt('Reason: spam, abuse, privacy, harassment, harmful or other','spam');
  if(!reason)return;
  const code=reason.trim().toLowerCase();
  if(!['spam','abuse','privacy','harassment','harmful','other'].includes(code)){say('Choose a listed reason.');return}
  await change(b,()=>rpc('dd_discussions_flag',{p_kind:kind,p_id:row.id,p_reason:code}),'Report recorded for community moderation.');
 });
 if(row.is_mine){
  const posted=Date.parse(row.created_at);
  if(Number.isFinite(posted)&&Date.now()>=posted&&Date.now()-posted<30*60*1000)
   nodeAction(parent,'Edit my '+(kind==='thread'?'post':'reply'),async b=>{
    const edited=prompt('Edit your own text (up to '+(kind==='thread'?'5000':'2000')+' characters):',row.body||'');
    if(edited===null)return;
    if(edited.trim().length<2||edited.trim().length>(kind==='thread'?5000:2000)){say('Check your text length.');return}
    await change(b,()=>rpc('dd_discussions_edit_own',{p_kind:kind,p_id:row.id,p_body:edited.trim()}),'Your text was updated.');
   });
  nodeAction(parent,'Delete my '+(kind==='thread'?'post':'reply'),async b=>{
   if(!confirm('Remove your own '+(kind==='thread'?'post':'reply')+' from public view? Minimal moderation history may remain. You cannot restore this yourself.'))return;
   await change(b,()=>rpc('dd_discussions_withdraw_own',{p_kind:kind,p_id:row.id}),'Your content was withdrawn.');
   if(kind==='thread'&&thread?.id===row.id){thread=null;setCreateButtons();$('ddForumReplyPane').hidden=true;$('ddForumPostList').hidden=false;$('ddForumSortLabel').hidden=false;}
  });
 }
 if(section?.is_steward){
  if(kind==='thread')nodeAction(parent,row.is_pinned?'Unpin':'Pin',b=>change(b,()=>rpc('dd_discussions_pin',{p_thread_id:row.id,p_pinned:!row.is_pinned}),'Section pin saved.'));
  nodeAction(parent,'Escalate to site owner',async b=>{
   const reason=prompt('Explain this serious concern for the overall site admin (minimum 10 characters):');
   if(!reason||reason.trim().length<10)return;
   await change(b,()=>rpc('dd_discussions_escalate',{p_kind:kind,p_id:row.id,p_reason:reason.trim().slice(0,500)}),'Concern sent to overall administrator.');
  });
 }
}
async function loadThreads(){
 if(!section)return;
 const id=section.id,stamp=++epoch,list=$('ddForumPostList');empty(list,'Loading discussions…');
 $('ddForumReplyPane').hidden=true;
 const count=$('ddForumPageStatus'),prev=$('ddForumPrev'),next=$('ddForumNext');
 if(count)count.textContent='Loading…';
 try{
  let rows;
  try{
   rows=await rpc('dd_discussions_threads_v2',{
    p_section_id:id,p_limit:20,p_offset:feedPage*20,p_sort:sort,p_search:feedQuery
   });
   feedModern=true;
   feedTotal=rows.length?Number(rows[0].total_count)||0:feedPage?feedTotal:0;
  }catch(err){
   // The v1 forum continues working when v2 has not yet been installed.
   if(!/dd_discussions_threads_v2|could not find the function|schema cache/i.test(String(err.message)))throw err;
   const all=await rpc('dd_discussions_threads',{p_section_id:id,p_limit:100,p_sort:sort});
   const filtered=(all||[]).filter(r=>(r.title+' '+r.body).toLowerCase().includes(feedQuery.toLowerCase()));
   feedModern=false;feedTotal=filtered.length;rows=filtered.slice(feedPage*20,(feedPage+1)*20);
  }
  if(stamp!==epoch||section?.id!==id||thread)return;
  list.replaceChildren();
  if(!rows?.length)empty(list,'No matching topics. Try a different search or start the conversation.');
  for(const r of rows||[]){
   const card=mk('article',undefined,'dd-forum-item dd-forum-post-card');
   const meta=mk('small',(r.author_name||'Community member')+' · '+new Date(r.created_at).toLocaleDateString()+(r.is_pinned?' · Pinned':''),'muted');
   const title=nodeAction(card,r.title||'Untitled topic',()=>openThread(r),'dd-forum-title');
   title.setAttribute('aria-label','Read discussion: '+String(r.title||'Untitled topic'));
   card.prepend(meta);
   const tag=toneBadge(r);if(tag)card.prepend(tag);
   photo(card,r);
   const snippet=mk('p',String(r.body||'').slice(0,240),'dd-forum-body');
   const actions=mk('div',undefined,'dd-forum-actions');
   card.append(snippet);
   link(card,r.link_url,safeLink(r.link_url)?'Source · '+new URL(safeLink(r.link_url)).hostname:'');
   card.append(actions);actionsFor(actions,'thread',r);list.append(card);
  }
  if(count)count.textContent='Page '+(feedPage+1)+' · '+feedTotal+' topics'+(!feedModern?' · first 100 while upgrade is pending':'');
  if(prev)prev.disabled=feedPage===0;
  if(next)next.disabled=(feedPage+1)*20>=feedTotal;
 }catch(e){say(e?.message||'Discussions temporarily unavailable.')}
}
function drawSections(){
 const root=$('ddForumSections');root.replaceChildren();
 const query=$('ddForumSearch').value.trim().toLowerCase();
 const shown=sections.filter(s=>[s.title,s.description,s.topic,s.slug].join(' ').toLowerCase().includes(query));
 if(!shown.length)empty(root,sections.length?'No matching sections.':'No sections yet. Start one!');
 for(const s of shown){
  const card=mk('article',undefined,'dd-forum-item dd-forum-section-card');
  const open=nodeAction(card,s.title||'Untitled',()=>openSection(s),'dd-forum-title');
  open.setAttribute('aria-label','Browse section: '+String(s.title||'Untitled'));
  card.append(mk('p',String(s.description||'').slice(0,250),'dd-forum-body'));
  const meta=mk('small',(s.topic||'Research')+' · '+(s.thread_count||0)+' topics'+(s.is_steward?' · Your section':''),'muted');
  card.append(meta,mk('span','Open section →','dd-forum-section-arrow'));root.append(card);
 }
}
async function openDeepLink(){
 if(deepLinkHandled||section||thread||typeof location==='undefined')return;
 const id=new URLSearchParams(location.search).get('dd_thread');if(!isId(id))return;
 deepLinkHandled=true;
 try{
  const row=(await rpc('dd_discussions_thread_v2',{p_thread_id:id}))?.[0];
  if(!row||!isId(row.section_id)){say('Discussion no longer available.');return}
  const target=sections.find(s=>s.id===row.section_id)||{id:row.section_id,title:'Discussion',description:'',topic:'',is_steward:false};
  await openSection(target);await openThread(row);
 }catch(e){say('This discussion link is unavailable until the upgraded forum is enabled.')}
}
function onIdentityChange(session){
 const next=session?.user?.id||null;
 if(viewerId===next)return; // Token refresh should not discard an open public discussion.
 viewerId=next;identityRevision++;epoch++;section=null;thread=null;setCreateButtons();sections=[];feedPage=0;feedQuery='';deepLinkHandled=false;
 for(const id of ['ddForumSectionDialog','ddForumPostDialog']){const dialog=$(id);if(dialog?.open)dialog.close()}
 const sectionsPane=$('ddForumSectionsPane'),threadPane=$('ddForumThreadPane');
 if(sectionsPane)sectionsPane.hidden=false;
 if(threadPane)threadPane.hidden=true;
 for(const name of ['ddForumStewardPanel','ddForumReplyPane']){const el=$(name);if(el)el.hidden=true}
 for(const name of ['ddForumSections','ddForumPostList','ddForumReplies'])$(name)?.replaceChildren();
 const info=$('ddForumSectionInfo');if(info)info.textContent='';
 say('Account changed. Reloading public discussions…');
 if(ready)void refresh();
}
async function refresh(){
 if(!ready||!$('discussionsPage')||$('discussionsPage').classList.contains('hidden'))return;
 if(thread){await loadReplies();return}
 if(section){await loadThreads();return}
 const stamp=++epoch;
 try{
  const rows=await rpc('dd_discussions_sections',{p_limit:100});
  if(stamp!==epoch)return;
  sections=Array.isArray(rows)?rows:[];drawSections();
  say(sections.length+' sections available.');await openDeepLink();
 }catch(e){say(e?.message||'Sections temporarily unavailable.')}
}
function setCreateButtons(){const button=$('ddForumNewPost');if(button)button.hidden=!section||!!thread}
async function openComposer(id,opener){
 try{await registered()}catch(e){say(e?.message||'Sign in to publish.');return}
 const dialog=$(id);if(!dialog||dialog.open)return;
 if(!dialog.showModal){say('Your browser does not support this form window.');return}
 dialog.dataset.returnFocus=opener?.id||'';dialog.showModal();
 dialog.querySelector('input,textarea')?.focus();
}
function wireComposer(id){
 const dialog=$(id);if(!dialog)return;
 dialog.querySelectorAll('[data-dd-forum-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>$(dialog.dataset.returnFocus||'')?.focus());
}
function init(){
 if(ready||!$('discussionsPage')||!db())return;
 ready=true;
 const page=$('discussionsPage');page.removeAttribute('hidden');
 const witness=document.querySelector('.nav .tab[data-tab="witness"]');
 const tab=mk('button','', 'tab');tab.type='button';tab.dataset.tab='discussionsPage';
 tab.append(mk('span','☷','ico'),document.createTextNode('Discussions'));
 tab.onclick=()=>window.navigateTo?.('discussionsPage');
 witness?.after(tab);
 wireComposer('ddForumSectionDialog');wireComposer('ddForumPostDialog');
 $('ddForumNewSection').onclick=e=>{void openComposer('ddForumSectionDialog',e.currentTarget)};
 $('ddForumNewPost').onclick=e=>{void openComposer('ddForumPostDialog',e.currentTarget)};
 setCreateButtons();
 $('ddForumSearch').addEventListener('input',drawSections);
 $('ddForumBackSections').onclick=()=>{thread=null;section=null;setCreateButtons();++epoch;$('ddForumSectionsPane').hidden=false;$('ddForumThreadPane').hidden=true;void refresh()};
 $('ddForumBackThreads').onclick=()=>{thread=null;setCreateButtons();++epoch;$('ddForumPostCreate').hidden=false;$('ddForumPostList').hidden=false;$('ddForumSortLabel').hidden=false;$('ddForumStewardPanel').hidden=!section?.is_steward;$('ddForumReplyPane').hidden=true;$('ddForumThreadTitle').textContent=section?.title||'Section';void loadThreads()};
 $('ddForumSort').onchange=event=>{sort=event.target.value;feedPage=0;void loadThreads()};
 const feedSearch=$('ddForumFeedSearch');
 if(feedSearch)feedSearch.oninput=event=>{
  const value=event.target.value.trim().slice(0,80);
  window.clearTimeout(searchTimer);searchTimer=window.setTimeout(()=>{feedQuery=value;feedPage=0;void loadThreads()},200);
 };
 if($('ddForumPrev'))$('ddForumPrev').onclick=()=>{if(feedPage>0){feedPage--;void loadThreads()}};
 if($('ddForumNext'))$('ddForumNext').onclick=()=>{if((feedPage+1)*20<feedTotal){feedPage++;void loadThreads()}};

 $('ddForumStewardForm').onsubmit=event=>{
  event.preventDefault();
  if(!section?.is_steward){say('Only the current section steward can organise this section.');return}
  const form=event.currentTarget,b=form.querySelector('button[type="submit"]');
  const desc=form.elements.namedItem('description').value.trim(),topic=form.elements.namedItem('topic').value.trim();
  if(desc.length>400||topic.length>40){say('Section description and category are too long.');return}
  void change(b,async()=>{
   const ok=await rpc('dd_discussions_update_section',{p_section_id:section.id,p_description:desc,p_topic:topic});
   if(ok===true){section.description=desc;section.topic=topic;$('ddForumSectionInfo').textContent=desc+' · You steward this section.'}
   return ok;
  },'Your section details were updated.');
 };
 $('ddForumRefresh').onclick=()=>{void refresh()};
 $('ddForumSectionCreate').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const title=form.elements.namedItem('title').value.trim(),description=form.elements.namedItem('description').value.trim(),topic=form.elements.namedItem('topic').value.trim();
  const b=form.querySelector('button[type="submit"]');
  if(title.length<4||title.length>60||description.length>400){say('Section names must be 4–60 characters and descriptions under 400.');return}
  const saved=await change(b,()=>rpc('dd_discussions_create_section',{p_title:title,p_description:description,p_topic:topic}),'Section created. You can organise it, but cannot ban or censor other members.');
  if(saved){form.reset();$('ddForumSectionDialog').close()}
 };
 $('ddForumPostCreate').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,b=form.querySelector('button[type="submit"]');
  if(!section){say('Choose a section first.');return}
  const title=form.elements.namedItem('title').value.trim(),body=form.elements.namedItem('body').value.trim(),url=form.elements.namedItem('link_url').value.trim();
  const tone=form.elements.namedItem('post_tone').value,image=form.elements.namedItem('image_url').value.trim();
  if(title.length<4||title.length>150||body.length<2||body.length>5000||!['serious','fun'].includes(tone)
   ||(url&&!safeLink(url))||(image&&!safeImage(image))){say('Check title, post, Serious/Fun tag and optional HTTPS image.');return}
  const saved=await change(b,()=>rpc('dd_discussions_create_thread_v2',{
   p_section_id:section.id,p_title:title,p_body:body,p_url:url||null,p_tone:tone,p_image_url:image||null
  }),'Your discussion was published.');
  if(saved){form.reset();$('ddForumPostDialog').close()}
 };
 $('ddForumReplyCreate').onsubmit=event=>{
  event.preventDefault();if(!thread)return;
  const form=event.currentTarget,body=form.elements.namedItem('body').value.trim(),b=form.querySelector('button[type="submit"]');
  if(body.length<2||body.length>2000){say('Replies must be 2–2000 characters.');return}
  void change(b,()=>rpc('dd_discussions_reply',{p_thread_id:thread.id,p_body:body,p_parent_id:null}),'Reply posted.');
 };
 db()?.auth?.onAuthStateChange?.((_event,session)=>onIdentityChange(session));
 if(!$('discussionsPage').classList.contains('hidden'))void refresh();
}
window.DDDiscussions=Object.freeze({refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();