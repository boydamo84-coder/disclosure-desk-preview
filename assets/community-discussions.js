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
let viewerId=undefined,identityRevision=0,ownerSectionIds=new Set(),flaggedThisSession=new Set();
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
 if(!row?.image_url)return;
 const url=safeImage(row.image_url);
 const frame=mk('div',undefined,'dd-forum-image-wrap');
 function fallback(message){
  frame.replaceChildren();
  const note=mk('div',undefined,'dd-forum-image-fallback');
  note.append(mk('strong',message),mk('small','Some image hosts block embedding or the link points to a web page.'));
  if(url){
   const a=mk('a','Open the original image ↗');
   a.href=url;a.target='_blank';a.rel='noopener noreferrer nofollow ugc';note.append(a);
  }else note.append(mk('small','A direct HTTPS image URL is required.'));
  frame.append(note);
 }
 if(!url)fallback('Image link unavailable');
 else{
  const img=mk('img');img.src=url;img.loading='lazy';img.decoding='async';
  img.referrerPolicy='no-referrer';img.alt='Community-supplied image · source unverified';
  img.addEventListener?.('error',()=>fallback('Image preview unavailable'));
  frame.append(img,mk('small','Member-supplied image · verify the original source','muted small'));
 }
 parent.append(frame);
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
async function change(button,operation,ok,onSuccess){
 button.disabled=true;say('Checking your account…');
 const identityAtStart=identityRevision;
 try{
  const actor=await registered();
  if(identityAtStart!==identityRevision||(viewerId!==undefined&&viewerId!==actor.id))
   throw Error('Account changed. Please try again.');
  const result=await operation();
  if(identityAtStart!==identityRevision)throw Error('Account changed. Please refresh.');
  if(result===false)throw Error('Action not permitted or no change was made.');
  if(typeof onSuccess==='function')onSuccess(result);
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
function appendReplyCard(list,row){
 const card=mk('article',undefined,'dd-forum-item dd-forum-reply-card');
 const main=mk('div',undefined,'dd-forum-post-main'),tools=mk('div',undefined,'dd-forum-actions');
 main.append(makePostHead(row,'reply',tools),mk('p',row.body||'','dd-forum-body'));
 actionsFor(tools,'reply',row,true,tools.flagHost);
 card.append(main,tools);list.append(card);
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
 const main=mk('div',undefined,'dd-forum-post-main'),tools=mk('div',undefined,'dd-forum-actions');
 main.append(makePostHead(item,'thread',tools),mk('h3',item.title||'Discussion'));
 photo(main,item);
 main.append(mk('p',item.body||'','dd-forum-body'));
 link(main,item.link_url,'Original source · '+(safeLink(item.link_url)?new URL(safeLink(item.link_url)).hostname:''));
 actionsFor(tools,'thread',item,true,tools.flagHost);
 pane.append(main,tools);
 $('ddForumReplyCreate').reset();
 await loadReplies();
}
async function loadReplies(){
 if(!thread)return;
 const id=thread.id,stamp=++epoch,list=$('ddForumReplies');empty(list,'Loading replies…');
 try{
  const rows=await rpc('dd_discussions_replies',{p_thread_id:id,p_limit:100});
  if(stamp!==epoch||thread?.id!==id)return;
  let expanded=false;
  const all=Array.isArray(rows)?rows:[];
  function display(){
   list.replaceChildren();
   if(!all.length){empty(list,'No replies yet. Start the discussion.');return}
   const visible=expanded?all:all.slice(0,4);
   for(const row of visible)appendReplyCard(list,row);
   if(all.length>4){
    const toggle=nodeAction(list,expanded?'⌃ Show fewer replies':'⌄ Read '+(all.length-4)+' more replies',()=>{
     expanded=!expanded;display();
    },'dd-forum-comment-expand');
    toggle.setAttribute('aria-expanded',String(expanded));
   }
   if(all.length===100)list.append(mk('small','Showing the first 100 replies in this conversation.','muted small'));
  }
  display();
 }catch(e){say(e?.message||'Replies temporarily unavailable.')}
}
function renderReplyPreview(card,row,stamp,sectionId){
 const total=Math.max(0,Number(row.reply_count)||0);
 if(!total)return;
 const panel=mk('section',undefined,'dd-forum-reply-preview'),heading=mk('h5',total+' '+(total===1?'comment':'comments'));
 const body=mk('div',undefined,'dd-forum-preview-list');
 panel.append(heading,body);card.append(panel);
 let loadedRows=[],expanded=false,loading=false,loadedLimit=0;
 function display(){
  body.replaceChildren();
  for(const reply of expanded?loadedRows:loadedRows.slice(0,4)){
   const line=mk('p',undefined,'dd-forum-preview-line');
   line.append(mk('strong',reply.author_name||'Community member'),mk('span','  '+String(reply.body||'').slice(0,expanded?2000:240)));
   body.append(line);
  }
  if(total>4){
   const more=nodeAction(body,expanded?'⌃ Show fewer comments':'⌄ Read more comments ('+total+')',async()=>{
    if(!expanded&&loadedLimit<100)await fetchReplies(100);
    expanded=!expanded;display();
   },'dd-forum-comment-expand');
   more.setAttribute('aria-expanded',String(expanded));
  }
  if(expanded&&total>100){
   const view=nodeAction(body,'Open full discussion →',()=>openThread(row),'dd-forum-comment-expand');
   view.setAttribute('aria-label','Open discussion to read all available comments');
  }
 }
 async function fetchReplies(limit){
  if(loading||loadedLimit>=limit)return;
  loading=true;
  try{
   const incoming=await rpc('dd_discussions_replies',{p_thread_id:row.id,p_limit:limit});
   if(stamp!==epoch||section?.id!==sectionId||thread)return;
   loadedRows=Array.isArray(incoming)?incoming:[];loadedLimit=limit;display();
  }catch{if(stamp===epoch)body.replaceChildren(mk('small','Unable to load comments. Open the discussion to retry.','muted small'))}
  finally{loading=false}
 }
 const load=()=>{void fetchReplies(4)};
 if(typeof window.IntersectionObserver==='function'){
  const observer=new window.IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();load()}
  },{rootMargin:'180px'});
  observer.observe(card);
 }else load();
}
async function vote(kind,row,value,button){
 const next=Number(row.my_vote)===value?0:value;
 await change(button,()=>rpc('dd_discussions_vote',{p_kind:kind,p_id:row.id,p_value:next}), 'Vote saved.');
}
function setActionIcon(button,name,fallback){
 const shapes={
  flag:['path','M4 22V5 M4 5c4-3 7 3 11 0s5-2 5-2v12c-4-3-6 3-10 0s-6-1-6-1'],
  star:['path','m12 2 3.1 6.3 7 1-5 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-1z'],
  share:['circle','18,5,3','circle','6,12,3','circle','18,19,3','path','m8.7 10.4 6.6-3.8 M8.7 13.6l6.6 3.8'],
  trash:['path','M3 6h18 M8 6V4h8v2 M6 6l1 15h10l1-15 M10 10v7 M14 10v7'],
  comment:['path','M21 11a8 8 0 0 1-8 8H6l-4 3V11a9.5 9.5 0 0 1 19 0z']
 };
 const parts=shapes[name];
 if(!parts||typeof document.createElementNS!=='function'){button.textContent=fallback;return}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('class','dd-forum-action-svg');
 for(let i=0;i<parts.length;){
  const tag=parts[i++],value=parts[i++];
  const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  if(tag==='path')el.setAttribute('d',value);
  else if(tag==='circle'){
   const [cx,cy,r]=value.split(',');
   el.setAttribute('cx',cx);el.setAttribute('cy',cy);el.setAttribute('r',r);
  }
  svg.append(el);
 }
 button.replaceChildren(svg);
}
function makePostHead(row,kind,actions){
 const head=mk('div',undefined,'dd-forum-post-head');
 const author=mk('div',undefined,'dd-forum-post-author');
 if(kind==='thread'){
  const tone=toneBadge(row);if(tone)author.append(tone);
 }
 author.append(mk('small',(row.author_name||'Community member')+' · '+new Date(row.created_at).toLocaleDateString()+
  (row.is_pinned?' · Pinned':''),'muted'));
 head.append(author);
 const flag=mk('div',undefined,'dd-forum-head-flag');
 head.append(flag);
 actions.flagHost=flag;
 return head;
}
function openPostAction(opener,kind,row,mode){
 const dialog=$('ddForumActionDialog'),form=$('ddForumActionForm');
 if(!dialog?.showModal||!form){say('Post action unavailable in this browser.');return}
 const title=$('ddForumActionDialogTitle'),description=$('ddForumActionDescription'),
  textWrap=$('ddForumEditWrap'),text=$('ddForumEditText'),
  reasonWrap=$('ddForumReasonWrap'),reason=$('ddForumFlagReason'),
  submit=$('ddForumActionSubmit');
 const type=kind==='thread'?'post':'reply';
 title.textContent=mode==='edit'?'Edit '+type:mode==='delete'?'Delete '+type:'Report '+type;
 description.textContent=mode==='edit'?'Edit the public text of your own '+type+'. Changes are limited to 30 minutes after publication.':
  mode==='delete'?'Remove your own '+type+' from public view? It cannot be restored by your account. Minimal moderation history may remain.':
  'Flag this content for independent moderation review. Reporting does not immediately delete another member’s post.';
 textWrap.hidden=mode!=='edit';reasonWrap.hidden=mode!=='flag';
 text.maxLength=kind==='thread'?5000:2000;
 text.value=mode==='edit'?String(row.body||''):'';
 if(mode==='flag')reason.value='spam';
 submit.textContent=mode==='edit'?'Save changes':mode==='delete'?'Delete '+type:'Submit report';
 submit.className=mode==='delete'?'outline dd-forum-danger-action':'action';
 form.onsubmit=async event=>{
  event.preventDefault();
  let operation,feedback;
  if(mode==='edit'){
   const value=text.value.trim();
   if(value.length<2||value.length>text.maxLength){say('Check your edited text length.');return}
   operation=()=>rpc('dd_discussions_edit_own',{p_kind:kind,p_id:row.id,p_body:value});
   feedback='Your '+type+' was updated.';
  }else if(mode==='delete'){
   operation=()=>rpc('dd_discussions_withdraw_own',{p_kind:kind,p_id:row.id});
   feedback='Your '+type+' was removed from public view.';
  }else{
   const selected=reason.value;
   if(!['spam','abuse','privacy','harassment','harmful','other'].includes(selected)){say('Select a valid report reason.');return}
   operation=()=>rpc('dd_discussions_flag',{p_kind:kind,p_id:row.id,p_reason:selected});
   feedback='Your report was sent for moderation.';
  }
  const saved=await change(submit,operation,feedback,()=>{
   if(mode==='flag')flaggedThisSession.add(kind+':'+row.id);
  });
  if(!saved)return;
  if(mode==='flag'){
   opener.setAttribute('aria-pressed','true');
   opener.classList?.add('is-flagged');
  }
  if(mode==='delete'&&kind==='thread'&&thread?.id===row.id){
   thread=null;setCreateButtons();
   $('ddForumReplyPane').hidden=true;$('ddForumPostList').hidden=false;$('ddForumSortLabel').hidden=false;
  }
  dialog.close();
 };
 if(!dialog.open){
  dialog.showModal();
  dialog.addEventListener('close',()=>opener?.focus?.(),{once:true});
  if(mode==='edit')text.focus?.();
  else if(mode==='flag')reason.focus?.();
  else submit.focus?.();
 }
}
function actionsFor(parent,kind,row,inDetail=false,flagHost=null){
 if(!isId(row.id))return;
 const flagged=flaggedThisSession.has(kind+':'+row.id);
 const flag=nodeAction(flagHost||parent,'⚑',b=>openPostAction(b,kind,row,'flag'),'dd-forum-post-flag');
 flag.setAttribute('aria-label',flagged?'Already reported this '+kind:'Report this '+kind);
 flag.setAttribute('title',flagged?'Reported this session':'Report this '+kind);
 flag.setAttribute('aria-pressed',String(flagged));
 setActionIcon(flag,'flag','⚑');
 if(flagged)flag.classList?.add('is-flagged');
 const like=nodeAction(parent,'👍 '+(row.likes||0),b=>vote(kind,row,1,b),'dd-forum-icon-button dd-forum-vote');
 const dislike=nodeAction(parent,'👎 '+(row.dislikes||0),b=>vote(kind,row,-1,b),'dd-forum-icon-button dd-forum-vote');
 like.setAttribute('aria-label','Like this '+kind+' · '+(row.likes||0)+' likes');
 dislike.setAttribute('aria-label','Dislike this '+kind+' · '+(row.dislikes||0)+' dislikes');
 like.setAttribute('aria-pressed',String(Number(row.my_vote)===1));
 dislike.setAttribute('aria-pressed',String(Number(row.my_vote)===-1));
 if(kind==='thread'){
  const commentCount=Number.isFinite(Number(row.reply_count))?Number(row.reply_count):0;
  const comments=nodeAction(parent,'💬 '+commentCount,()=>openThread(row),'dd-forum-icon-button');
  comments.setAttribute('aria-label','Read '+commentCount+' comments');
  const star=nodeAction(parent,'☆',()=>saveThread(row),'dd-forum-icon-button');
  setActionIcon(star,'star','☆');
  star.setAttribute('aria-label','Save post to an Investigation Board');
  star.setAttribute('title','Add to Board');
  const share=nodeAction(parent,'⤴',()=>shareThread(row),'dd-forum-icon-button');
  setActionIcon(share,'share','⤴');
  share.setAttribute('aria-label','Share this post');
  share.setAttribute('title','Share');
 }
 parent.append(mk('span',undefined,'dd-forum-spacer'));
 if(row.is_mine){
  const posted=Date.parse(row.created_at);
  if(Number.isFinite(posted)&&Date.now()>=posted&&Date.now()-posted<30*60*1000){
   const edit=nodeAction(parent,'Edit',b=>openPostAction(b,kind,row,'edit'),'dd-forum-icon-button');
   edit.setAttribute('aria-label','Edit my '+kind);
  }
  const remove=nodeAction(parent,'🗑',b=>openPostAction(b,kind,row,'delete'),'dd-forum-icon-button dd-forum-danger');
  setActionIcon(remove,'trash','🗑');
  remove.setAttribute('aria-label','Delete my '+kind);
  remove.setAttribute('title','Delete');
 }
 if(section?.is_steward){
  const more=mk('details',undefined,'dd-forum-more');
  const summary=mk('summary','⋯');summary.setAttribute('aria-label','More moderation actions');
  const menu=mk('div',undefined,'dd-forum-more-options');
  if(kind==='thread')nodeAction(menu,row.is_pinned?'Unpin post':'Pin post',
   b=>change(b,()=>rpc('dd_discussions_pin',{p_thread_id:row.id,p_pinned:!row.is_pinned}),'Pin updated.'));
  nodeAction(menu,'Escalate to site owner',async b=>{
   const message=prompt('Explain the serious concern to the site owner (at least 10 characters):');
   if(!message||message.trim().length<10){say('Please give a reason of at least 10 characters.');return}
   await change(b,()=>rpc('dd_discussions_escalate',{
    p_kind:kind,p_id:row.id,p_reason:message.trim().slice(0,500)
   }),'Concern sent to the site owner.');
  });
  more.append(summary,menu);parent.append(more);
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
   if(!/dd_discussions_threads_v2|could not find the function|schema cache/i.test(String(err.message)))throw err;
   const all=await rpc('dd_discussions_threads',{p_section_id:id,p_limit:100,p_sort:sort});
   const filtered=(all||[]).filter(r=>(r.title+' '+r.body).toLowerCase().includes(feedQuery.toLowerCase()));
   feedModern=false;feedTotal=filtered.length;rows=filtered.slice(feedPage*20,(feedPage+1)*20);
  }
  if(stamp!==epoch||section?.id!==id||thread)return;
  list.replaceChildren();
  if(!rows?.length)empty(list,'No matching topics. Try a different search or start the conversation.');
  for(const row of rows||[]){
   const card=mk('article',undefined,'dd-forum-item dd-forum-post-card');
   const main=mk('div',undefined,'dd-forum-post-main'),actions=mk('div',undefined,'dd-forum-actions');
   main.append(makePostHead(row,'thread',actions));
   const title=nodeAction(main,row.title||'Untitled topic',()=>openThread(row),'dd-forum-title');
   title.setAttribute('aria-label','Read discussion: '+String(row.title||'Untitled topic'));
   main.append(mk('p',String(row.body||'').slice(0,330),'dd-forum-body'));
   photo(main,row);
   link(main,row.link_url,safeLink(row.link_url)?'Source · '+new URL(safeLink(row.link_url)).hostname:'');
   card.append(main);
   renderReplyPreview(card,row,stamp,id);
   actionsFor(actions,'thread',row,false,actions.flagHost);
   card.append(actions);list.append(card);
  }
  if(count)count.textContent='Page '+(feedPage+1)+' · '+feedTotal+' topics'+(!feedModern?' · first 100 while upgrade is pending':'');
  if(prev)prev.disabled=feedPage===0;
  if(next)next.disabled=(feedPage+1)*20>=feedTotal;
 }catch(e){say(e?.message||'Discussions temporarily unavailable.')}
}
async function loadOwnerSections(){
 // The RPC is denied for non-admins by the database. A section steward is not a site owner.
 try{
  const {data,error}=await db().auth.getUser();
  if(error||!data?.user||data.user.is_anonymous)return new Set();
  const list=await rpc('dd_discussions_owner_sections',{p_limit:100});
  return new Set((Array.isArray(list)?list:[]).map(x=>x.section_id).filter(isId));
 }catch{return new Set()}
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
  card.append(meta);
  const jump=mk('a','Open section →','dd-forum-section-arrow dd-forum-section-open');
  jump.href='?dd_tab=discussionsPage&dd_section='+encodeURIComponent(s.id);
  jump.setAttribute('aria-label','Open section: '+String(s.title||'Untitled'));
  jump.addEventListener('click',event=>{event.preventDefault();void openSection(s)});
  card.append(jump);
  if(ownerSectionIds.has(s.id)){
   const adminActions=mk('div',undefined,'dd-forum-section-admin');
   nodeAction(adminActions,'Delete section',async button=>{
    if(!ownerSectionIds.has(s.id))return;
    if(!confirm('SITE ADMIN ONLY: Remove this section and hide all its public posts and replies? Moderation history remains, and only an administrator can restore it.'))return;
    const reason=prompt('Enter a reason for removing this section (at least 8 characters):');
    if(!reason||reason.trim().length<8){say('An administrator reason of at least 8 characters is required.');return}
    await change(button,()=>rpc('dd_discussions_owner_review',{
     p_kind:'section',p_id:s.id,p_status:'removed',p_reason:reason.trim().slice(0,500)
    }),'Section removed from public Discussions.');
   },'outline dd-forum-danger-action');
   card.append(adminActions);
  }
  root.append(card);
 }
}
async function openDeepLink(){
 if(deepLinkHandled||section||thread||typeof location==='undefined')return;
 const params=new URLSearchParams(location.search);
 const id=params.get('dd_thread'),sectionId=params.get('dd_section');
 if(!isId(id)&&!isId(sectionId))return;
 deepLinkHandled=true;
 if(!isId(id)){
  const target=sections.find(s=>s.id===sectionId);
  if(target)await openSection(target);else say('Discussion section not found.');
  return;
 }
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
 viewerId=next;identityRevision++;epoch++;section=null;thread=null;ownerSectionIds=new Set();flaggedThisSession=new Set();setCreateButtons();sections=[];feedPage=0;feedQuery='';deepLinkHandled=false;
 for(const id of ['ddForumSectionDialog','ddForumPostDialog','ddForumActionDialog']){const dialog=$(id);if(dialog?.open)dialog.close()}
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
  const ownerIds=await loadOwnerSections();
  if(stamp!==epoch)return;
  ownerSectionIds=ownerIds;
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
 dialog.querySelectorAll?.('[data-dd-forum-close]')?.forEach(b=>b.addEventListener('click',()=>dialog.close()));
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
 wireComposer('ddForumSectionDialog');wireComposer('ddForumPostDialog');wireComposer('ddForumActionDialog');
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