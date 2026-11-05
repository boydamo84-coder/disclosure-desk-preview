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
let client=null,section=null,thread=null,sections=[],sort='recent',epoch=0,ready=false;
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
  say(ok);await refresh();
 }catch(e){say(e?.message||'Unable to save.')}
 finally{button.disabled=false}
}
function link(parent,url,label){
 const valid=safeLink(url);if(!valid)return;
 const a=mk('a',label||new URL(valid).hostname,'dd-forum-link');a.href=valid;
 a.target='_blank';a.rel='noopener noreferrer nofollow ugc';parent.append(a);
}
async function openSection(item){
 if(!isId(item?.id))return;section=item;thread=null;
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
 if(!isId(item?.id))return;thread=item;
 $('ddForumThreadTitle').textContent=item.title||'Discussion';
 $('ddForumPostCreate').hidden=true;
 $('ddForumPostList').hidden=true;
 $('ddForumSortLabel').hidden=true;
 $('ddForumStewardPanel').hidden=true;
 $('ddForumReplyPane').hidden=false;
 const pane=$('ddForumReplyContent');pane.replaceChildren();
 pane.append(mk('p',item.body||'','dd-forum-body'));
 link(pane,item.link_url,'Original source · '+(safeLink(item.link_url)?new URL(safeLink(item.link_url)).hostname:''));
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
function actionsFor(parent,kind,row){
 if(!isId(row.id))return;
 const like=nodeAction(parent,'👍 '+(row.likes||0),b=>vote(kind,row,1,b));
 const dislike=nodeAction(parent,'👎 '+(row.dislikes||0),b=>vote(kind,row,-1,b));
 like.setAttribute('aria-pressed',String(Number(row.my_vote)===1));
 dislike.setAttribute('aria-pressed',String(Number(row.my_vote)===-1));
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
  nodeAction(parent,'Withdraw my '+(kind==='thread'?'post':'reply'),async b=>{
   if(!confirm('Withdraw your own content from public Discussions? This will hide it; minimal moderation history may remain.'))return;
   await change(b,()=>rpc('dd_discussions_withdraw_own',{p_kind:kind,p_id:row.id}),'Your content was withdrawn.');
   if(kind==='thread'&&thread?.id===row.id){thread=null;$('ddForumReplyPane').hidden=true;$('ddForumPostList').hidden=false;$('ddForumSortLabel').hidden=false;}
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
 try{
  const rows=await rpc('dd_discussions_threads',{p_section_id:id,p_limit:100,p_sort:sort});
  if(stamp!==epoch||section?.id!==id||thread)return;
  list.replaceChildren();
  if(!rows?.length)empty(list,'No topics yet. Be the first to post.');
  for(const r of rows||[]){
   const card=mk('article',undefined,'dd-forum-item');
   const meta=mk('small',(r.author_name||'Community member')+' · '+new Date(r.created_at).toLocaleDateString()+(r.is_pinned?' · Pinned':''),'muted');
   const title=nodeAction(card,r.title||'Untitled topic',()=>openThread(r),'dd-forum-title');
   title.setAttribute('aria-label','Read discussion: '+String(r.title||'Untitled topic'));
   const snippet=mk('p',String(r.body||'').slice(0,240),'dd-forum-body');
   const actions=mk('div',undefined,'dd-forum-actions');
   card.prepend(meta);card.append(snippet,actions);
   link(card,r.link_url,safeLink(r.link_url)?'Source · '+new URL(safeLink(r.link_url)).hostname:'');
   actionsFor(actions,'thread',r);list.append(card);
  }
 }catch(e){say(e?.message||'Discussions temporarily unavailable.')}
}
function drawSections(){
 const root=$('ddForumSections');root.replaceChildren();
 const query=$('ddForumSearch').value.trim().toLowerCase();
 const shown=sections.filter(s=>[s.title,s.description,s.topic,s.slug].join(' ').toLowerCase().includes(query));
 if(!shown.length)empty(root,sections.length?'No matching sections.':'No sections yet. Start one!');
 for(const s of shown){
  const card=mk('article',undefined,'dd-forum-item');
  nodeAction(card,s.title||'Untitled',()=>openSection(s),'dd-forum-title');
  card.append(mk('p',String(s.description||'').slice(0,250),'dd-forum-body'));
  const meta=mk('small',(s.topic||'Research')+' · '+(s.thread_count||0)+' topics'+(s.is_steward?' · Your section':''),'muted');
  card.append(meta);root.append(card);
 }
}
function onIdentityChange(session){
 const next=session?.user?.id||null;
 if(viewerId===next)return; // Token refresh should not discard an open public discussion.
 viewerId=next;identityRevision++;epoch++;section=null;thread=null;sections=[];
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
  say(sections.length+' sections available.');
 }catch(e){say(e?.message||'Sections temporarily unavailable.')}
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
 $('ddForumSearch').addEventListener('input',drawSections);
 $('ddForumBackSections').onclick=()=>{thread=null;section=null;++epoch;$('ddForumSectionsPane').hidden=false;$('ddForumThreadPane').hidden=true;void refresh()};
 $('ddForumBackThreads').onclick=()=>{thread=null;++epoch;$('ddForumPostCreate').hidden=false;$('ddForumPostList').hidden=false;$('ddForumSortLabel').hidden=false;$('ddForumStewardPanel').hidden=!section?.is_steward;$('ddForumReplyPane').hidden=true;$('ddForumThreadTitle').textContent=section?.title||'Section';void loadThreads()};
 $('ddForumSort').onchange=event=>{sort=event.target.value;void loadThreads()};
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
 $('ddForumSectionCreate').onsubmit=event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const title=form.elements.namedItem('title').value.trim(),description=form.elements.namedItem('description').value.trim(),topic=form.elements.namedItem('topic').value.trim();
  const b=form.querySelector('button[type="submit"]');
  if(title.length<4||title.length>60||description.length>400){say('Section names must be 4–60 characters and descriptions under 400.');return}
  void change(b,()=>rpc('dd_discussions_create_section',{p_title:title,p_description:description,p_topic:topic}),'Section created. You can organise it, but cannot ban or censor other members.');
 };
 $('ddForumPostCreate').onsubmit=event=>{
  event.preventDefault();
  const form=event.currentTarget,b=form.querySelector('button[type="submit"]');
  if(!section){say('Choose a section first.');return}
  const title=form.elements.namedItem('title').value.trim(),body=form.elements.namedItem('body').value.trim(),url=form.elements.namedItem('link_url').value.trim();
  if(title.length<4||title.length>150||body.length>5000||(url&&!safeLink(url))){say('Enter a 4–150 character title, under 5000 characters of text, and a valid http(s) link.');return}
  void change(b,()=>rpc('dd_discussions_create_thread',{p_section_id:section.id,p_title:title,p_body:body,p_url:url||null}),'Your discussion was published.');
 };
 $('ddForumReplyCreate').onsubmit=event=>{
  event.preventDefault();if(!thread)return;
  const form=event.currentTarget,body=form.elements.namedItem('body').value.trim(),b=form.querySelector('button[type="submit"]');
  if(body.length<2||body.length>2000){say('Replies must be 2–2000 characters.');return}
  void change(b,()=>rpc('dd_discussions_reply',{p_thread_id:thread.id,p_body:body,p_parent_id:null}),'Reply posted.');
 };
 db()?.auth?.onAuthStateChange?.((_event,session)=>onIdentityChange(session));
}
window.DDDiscussions=Object.freeze({refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();