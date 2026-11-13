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
let viewerId=undefined,identityRevision=0,ownerSectionIds=new Set(),flaggedThisSession=new Set(),replyParent=null;
let globalSort='popular',globalRows=[],globalTotal=0,globalRequest=0,globalLoading=false,globalReturn=false;
let drawerRequest=0,drawerTimer=null;
let discussionView='feed';
const DD_FORUM_VIEW_KEY='dd-forum-overview-tab-v1:';

const DD_FORUM_FAV_KEY='dd-forum-favourite-sections-v1:';
const DD_FORUM_ORDER_KEY='dd-forum-subject-order-v1';
function favouriteKey(){return DD_FORUM_FAV_KEY+(typeof viewerId==='string'&&viewerId.trim()?viewerId.slice(0,64):'guest')}
function favouriteIds(){
 try{
  const ids=JSON.parse(localStorage.getItem(favouriteKey())||'[]');
  return new Set(Array.isArray(ids)?ids.filter(isId).slice(0,100):[]);
 }catch{return new Set()}
}
function toggleFavourite(item){
 if(!isId(item?.id))return;
 const ids=favouriteIds();
 if(ids.has(item.id))ids.delete(item.id);else ids.add(item.id);
 try{localStorage.setItem(favouriteKey(),JSON.stringify([...ids]))}catch(e){say('Favourite saved for this visit; device storage unavailable.')}
 const restoreFocus=$('ddForumSubjectsDrawer')?.open&&document.activeElement?.dataset?.sectionFavourite===item.id;
 drawSections();
 if(restoreFocus)$('ddForumDrawerList')?.querySelector('[data-section-favourite="'+item.id+'"]')?.focus?.({preventScroll:true});
}
function favouriteButton(parent,item,selected,compact=false){
 const star=nodeAction(parent,selected?'★':'☆',()=>toggleFavourite(item),
  'dd-forum-subject-star'+(selected?' is-favourite':'')+(compact?' dd-forum-subject-star-compact':''));
 star.dataset.sectionFavourite=item.id;
 star.setAttribute('aria-pressed',String(selected));
 star.setAttribute('aria-label',(selected?'Remove ':'Add ')+String(item.title||'Subject')+(selected?' from favourites':' to favourites'));
 star.setAttribute('title',selected?'Remove from favourites':'Add subject to favourites');
 return star;
}
function orderSections(rows){
 // Existing subject order is stable; newly discovered subjects append to the
 // bottom, even if the server happens to return them newest-first. Whenever
 // creation time is available, honour chronological order for the first view.
 const eligible=(Array.isArray(rows)?rows:[]).filter(row=>isId(row?.id));
 const when=row=>Date.parse(row.created_at||row.createdAt||row.created_on||'');
 let saved=[];
 try{
  const parsed=JSON.parse(localStorage.getItem(DD_FORUM_ORDER_KEY)||'[]');
  if(Array.isArray(parsed))saved=parsed.filter(isId).slice(0,200);
 }catch{}
 if(!saved.length){
  eligible.sort((a,b)=>{
   const at=when(a),bt=when(b);
   return Number.isFinite(at)&&Number.isFinite(bt)?at-bt:0;
  });
  saved=eligible.map(row=>row.id);
 }else{
  const known=new Set(saved);
  const newcomers=eligible.filter(row=>!known.has(row.id)).sort((a,b)=>{
   const at=when(a),bt=when(b);
   return Number.isFinite(at)&&Number.isFinite(bt)?at-bt:0;
  });
  saved.push(...newcomers.map(row=>row.id));
 }
 const present=new Set(eligible.map(x=>x.id));
 saved=saved.filter(id=>present.has(id));
 try{localStorage.setItem(DD_FORUM_ORDER_KEY,JSON.stringify(saved.slice(-200)))}catch{}
 const rank=new Map(saved.map((id,index)=>[id,index]));
 return eligible.sort((a,b)=>(rank.get(a.id)??1e6)-(rank.get(b.id)??1e6));
}
function resizeReplyComposer(input){
 if(!input?.style||!Number.isFinite(Number(input.scrollHeight)))return;
 input.style.height='auto';
 const style=typeof window.getComputedStyle==='function'?window.getComputedStyle(input):null;
 const line=parseFloat(style?.lineHeight)||21;
 const padding=(parseFloat(style?.paddingTop)||10)+(parseFloat(style?.paddingBottom)||10)+
               (parseFloat(style?.borderTopWidth)||1)+(parseFloat(style?.borderBottomWidth)||1);
 const max=3*line+padding,min=line+padding;
 const natural=Number(input.scrollHeight);
 input.style.height=Math.max(min,Math.min(natural,max))+'px';
 input.style.overflowY=natural>max?'auto':'hidden';
}

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
function dialogFeedback(button,message,isError=false){
 say(message);
 const dialog=button?.closest?.('dialog');
 const status=dialog?.querySelector?.('[data-dd-form-status]');
 if(status){
  status.textContent=String(message||'').slice(0,350);
  status.dataset.error=String(Boolean(isError));
  status.hidden=false;
 }
}
function clearDialogFeedback(dialog){
 const status=dialog?.querySelector?.('[data-dd-form-status]');
 if(status){status.textContent='';status.dataset.error='false';status.hidden=true}
}
async function change(button,operation,ok,onSuccess){
 button.disabled=true;dialogFeedback(button,'Checking your account…');
 const identityAtStart=identityRevision;
 try{
  const actor=await registered();
  if(identityAtStart!==identityRevision||(viewerId!==undefined&&viewerId!==actor.id))
   throw Error('Account changed. Please try again.');
  const result=await operation();
  if(identityAtStart!==identityRevision)throw Error('Account changed. Please refresh.');
  if(result===false)throw Error('Action not permitted or no change was made.');
  if(typeof onSuccess==='function')onSuccess(result);
  dialogFeedback(button,ok);await refresh();return true;
 }catch(e){dialogFeedback(button,String(e?.message||'Unable to save.').slice(0,320),true);return false}
 finally{button.disabled=false}
}
function link(parent,url,label){
 const valid=safeLink(url);if(!valid)return;
 const a=mk('a',label||new URL(valid).hostname,'dd-forum-link');a.href=valid;
 a.target='_blank';a.rel='noopener noreferrer nofollow ugc';parent.append(a);
}
function updateCommunityContext(){
 const favourites=favouriteIds();
 const nav=$('ddForumSubjectNav');
 if(nav){
  nav.replaceChildren();
  for(const item of sections){
   const row=mk('div',undefined,'dd-community-subject-row');
   const b=nodeAction(row,item.title||'Untitled subject',()=>openSection(item),'dd-community-subject-link');
   b.setAttribute('aria-current',section?.id===item.id?'page':'false');
   const count=mk('span',String(item.thread_count||0),'dd-community-subject-count');
   count.setAttribute('aria-label',(item.thread_count||0)+' posts');b.append(count);
   favouriteButton(row,item,favourites.has(item.id),true);nav.append(row);
  }
 }
 const saved=sections.filter(item=>favourites.has(item.id));
 const group=$('ddForumFavouriteGroup'),savedNav=$('ddForumFavouritesNav');
 if(group)group.hidden=!saved.length;
 if(savedNav){
  savedNav.replaceChildren();
  for(const item of saved){
   const link=nodeAction(savedNav,'★ '+(item.title||'Subject'),()=>openSection(item),'dd-community-favourite-link');
   link.setAttribute('aria-label','Open favourite subject '+String(item.title||'Subject'));
   link.setAttribute('aria-current',section?.id===item.id?'page':'false');
  }
 }
 const all=$('ddForumBrowseAll');if(all)all.setAttribute('aria-current',section?'false':'page');
 const title=$('ddForumContextTitle'),description=$('ddForumContextDescription'),count=$('ddForumContextCount');
 if(title)title.textContent=section?.title||'A place for curious minds';
 if(description)description.textContent=section?.description||'Explore the evidence, compare ideas and learn from other researchers.';
 if(count)count.textContent=section?(section.thread_count||0)+' posts · '+(section.topic||'Open discussion'):sections.length?sections.length+' subjects to explore':'';
 renderSubjectsDrawer();
}
// M90 two independent overview tabs; shared Discussions cards/actions untouched.
function discussionViewKey(){return DD_FORUM_VIEW_KEY+(typeof viewerId==='string'&&viewerId.trim()?viewerId.slice(0,64):'guest')}
function savedDiscussionView(){
 try{return localStorage.getItem(discussionViewKey())==='sections'?'sections':'feed'}catch{return 'feed'}
}
function showDiscussionView(view,persist=false,loadIfNeeded=false){
 const next=view==='sections'?'sections':'feed';
 discussionView=next;
 const feed=$('ddForumFeedView'),directory=$('ddForumDirectoryView');
 if(feed)feed.hidden=next!=='feed';
 if(directory)directory.hidden=next!=='sections';
 for(const [name,id] of [['feed','ddForumFeedTab'],['sections','ddForumSectionsTab']]){
  const button=$(id);if(!button)continue;
  const active=next===name;
  button.setAttribute('aria-selected',String(active));
  button.setAttribute('tabindex',active?'0':'-1');
  button.classList?.toggle?.('is-active',active);
 }
 const tabs=$('ddForumViewTabs');if(tabs)tabs.hidden=!!section;
 if(persist){try{localStorage.setItem(discussionViewKey(),next)}catch{}}
 if(loadIfNeeded&&next==='feed'&&!section&&!thread&&!globalLoading&&!globalRows.length)void loadGlobalFeed(true);
}
// Subject drawer: no duplicate posts, same section RPC, same account-scoped stars.
function renderSubjectsDrawer(){
 const nav=$('ddForumDrawerList'),fav=$('ddForumDrawerFavouriteNav'),group=$('ddForumDrawerFavouriteGroup');
 if(!nav||!fav||!group)return;
 const q=String($('ddForumDrawerSearch')?.value||'').trim().toLowerCase(),stars=favouriteIds();
 const visible=sections.filter(s=>[s.title,s.description,s.topic].join(' ').toLowerCase().includes(q));
 function rowInto(parent,item,saved=false){
  const row=mk('div',undefined,'dd-community-drawer-subject-row');
  const go=nodeAction(row,item.title||'Untitled subject',()=>{closeSubjectsDrawer();void openSection(item)},'dd-community-drawer-subject-link');
  go.dataset.drawerSection=item.id;
  go.setAttribute('aria-label',(saved?'Open favourite discussion subject: ':'Open discussion subject: ')+String(item.title||'Untitled subject'));
  go.setAttribute('aria-current',section?.id===item.id?'page':'false');
  go.append(mk('span',String(item.thread_count||0)+' posts','dd-community-drawer-subject-count'));
  const star=favouriteButton(row,item,stars.has(item.id),true);star.classList?.add?.('dd-community-drawer-star');
  parent.append(row);
 }
 nav.replaceChildren();
 if(!visible.length)empty(nav,sections.length?'No matching subjects.':'No subjects yet.');
 for(const item of visible)rowInto(nav,item);
 fav.replaceChildren();const picked=visible.filter(s=>stars.has(s.id));group.hidden=!picked.length;
 for(const item of picked)rowInto(fav,item,true);
 const status=$('ddForumDrawerStatus');
 if(status&&!status.dataset.loading)status.textContent=sections.length+' subjects available';
}
function closeSubjectsDrawer(){
 const modal=$('ddForumSubjectsDrawer');
 ++drawerRequest;
 if(drawerTimer!==null){window.clearInterval?.(drawerTimer);drawerTimer=null}
 if(modal?.open)modal.close?.();
 $('ddForumSubjectsMenu')?.setAttribute('aria-expanded','false');
}
async function refreshSubjectsDrawer(){
 const modal=$('ddForumSubjectsDrawer'),status=$('ddForumDrawerStatus');
 if(!modal?.open)return;
 const stamp=++drawerRequest,identity=identityRevision;
 if(status){status.dataset.loading='true';status.textContent='Checking for new subjects…'}
 try{
  const rows=await rpc('dd_discussions_sections',{p_limit:100});
  if(stamp!==drawerRequest||identity!==identityRevision||!modal.open)return;
  if(!Array.isArray(rows))throw Error('Unexpected subjects');
  sections=orderSections(rows);drawSections();
  if(status)status.textContent=sections.length+' subjects · up to date';
 }catch(e){
  if(stamp===drawerRequest&&status)status.textContent='Refresh unavailable; existing subjects still accessible.';
 }finally{if(stamp===drawerRequest&&status)delete status.dataset.loading}
}
function openSubjectsDrawer(){
 const modal=$('ddForumSubjectsDrawer');
 if(!modal?.showModal||modal.open)return;
 if($('ddForumDrawerSearch'))$('ddForumDrawerSearch').value='';
 renderSubjectsDrawer();modal.showModal();
 $('ddForumSubjectsMenu')?.setAttribute('aria-expanded','true');
 $('ddForumSubjectsClose')?.focus?.({preventScroll:true}); // Don't raise mobile keyboard.
 void refreshSubjectsDrawer();
 if(typeof window.setInterval==='function')drawerTimer=window.setInterval(()=>{
  if(modal.open)void refreshSubjectsDrawer();
 },60000);
}

async function openSection(item){
 if(!isId(item?.id))return;globalReturn=false;++globalRequest;section=item;thread=null;
 const threadBack=$('ddForumBackThreads');if(threadBack)threadBack.textContent='← Back to posts';updateCommunityContext();setCreateButtons();feedPage=0;feedQuery='';feedTotal=0;
 if($('ddForumFeedSearch'))$('ddForumFeedSearch').value='';
 $('ddForumViewTabs').hidden=true;
 $('ddForumSectionsPane').hidden=true;$('ddForumThreadPane').hidden=false;
 $('ddForumThreadTitle').textContent=item.title||'Discussions';
 $('ddForumSectionInfo').textContent=(item.description||'')+(item.is_steward?' · You organise this subject.':'');
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
function chooseReply(target,focusComposer=false){
 if(!thread)return;
 replyParent=target&&isId(target.id)?target.id:null;
 const form=$('ddForumReplyCreate'),input=form?.elements?.namedItem('body');
 // Place the *one* original composer directly after the selected comment.
 // Never scroll the page to a shared box at the end of the thread.
 const anchor=replyParent
  ? $('ddForumReplies')?.querySelector('[data-dd-forum-reply-id="'+replyParent+'"]')
  : $('ddForumReplies');
 if(form){(anchor||$('ddForumReplies')||$('ddForumReplyContent'))?.after(form);form.hidden=false;}
 const submit=form?.querySelector?.('button[type="submit"]');if(submit)submit.textContent=replyParent?'Post reply':'Post comment';
 const cancel=$('ddForumReplyCancel');if(cancel)cancel.hidden=!replyParent;
 let note=$('ddForumReplyContext');
 if(!note&&form){note=mk('p','','dd-forum-reply-context');note.id='ddForumReplyContext';form.prepend(note)}
 if(note){note.textContent=replyParent?'Replying to '+String(target.author_name||'this comment')+' in “'+String(thread.title||'Discussion')+'”':'Commenting on “'+String(thread.title||'Discussion')+'”';note.hidden=!replyParent}
 if(input){input.placeholder=replyParent?'Write a reply to '+String(target.author_name||'this comment')+'…':'Add a comment to this post…';resizeReplyComposer(input);if(target||focusComposer)input.focus({preventScroll:true});window.DDCommunityVotes?.keepCommentComposerVisible?.(form)}
}
function closeReplyComposer(){
 replyParent=null;
 const form=$('ddForumReplyCreate'),input=form?.elements?.namedItem('body');
 if(!form)return;
 form.reset();form.hidden=true;
 $('ddForumReplies')?.after(form);
 if($('ddForumReplyCancel'))$('ddForumReplyCancel').hidden=true;
 if($('ddForumReplyContext'))$('ddForumReplyContext').hidden=true;
 if(input)resizeReplyComposer(input);
}
function appendReplyCard(list,row,replyLookup){
 const card=mk('article',undefined,'dd-forum-item dd-forum-reply-card');
 card.dataset.ddForumReplyId=String(row.id||'');
 const main=mk('div',undefined,'dd-forum-post-main'),tools=mk('div',undefined,'dd-forum-actions dd-action-rail');
 main.append(makePostHead(row,'reply',tools));
 const parentId=String(row.parent_id||row.parent_reply_id||'');
 if(isId(parentId)&&replyLookup?.has(parentId)){
  card.classList.add('dd-forum-nested-reply');
  let depth=1,ancestor=replyLookup.get(parentId),seen=new Set([String(row.id)]);
  while(depth<3&&ancestor&&!seen.has(String(ancestor.id))){seen.add(String(ancestor.id));const next=String(ancestor.parent_id||ancestor.parent_reply_id||'');if(!replyLookup.has(next))break;ancestor=replyLookup.get(next);depth++}
  card.style?.setProperty?.('--dd-comment-depth',String(depth));
  main.append(mk('small','↳ Reply to '+String(replyLookup.get(parentId).author_name||'another comment'),'dd-forum-reply-target'));
 }
 main.append(mk('p',row.body||'','dd-forum-body'));
 actionsFor(tools,'reply',row,true,tools.flagHost);
 nodeAction(tools,'↳ Reply',()=>chooseReply(row),'dd-forum-icon-button dd-forum-reply-action');
 card.append(main,tools);list.append(card);
}
async function openThread(item){
 if(!isId(item?.id))return;thread=item;replyParent=null;setCreateButtons();
 $('ddForumThreadPane').classList?.add?.('dd-forum-detail-open');
 $('ddForumThreadTitle').textContent=item.title||'Discussion';
 $('ddForumPostCreate').hidden=true;
 $('ddForumPostList').hidden=true;
 $('ddForumSortLabel').hidden=true;
 $('ddForumStewardPanel').hidden=true;
 $('ddForumReplyPane').hidden=false;
 const pane=$('ddForumReplyContent');pane.replaceChildren();
 const main=mk('div',undefined,'dd-forum-post-main'),tools=mk('div',undefined,'dd-forum-actions dd-action-rail');
 main.append(makePostHead(item,'thread',tools),mk('h3',item.title||'Discussion'));
 photo(main,item);
 main.append(mk('p',item.body||'','dd-forum-body'));
 link(main,item.link_url,'Original source · '+(safeLink(item.link_url)?new URL(safeLink(item.link_url)).hostname:''));
 actionsFor(tools,'thread',item,true,tools.flagHost);
 pane.append(main,tools);
 const replyForm=$('ddForumReplyCreate');
 replyForm.hidden=false;
 // Keep comments directly beneath the full post. The composer follows the
 // comment list by default, and moves immediately below an individual comment
 // only when replying to that comment.
 $('ddForumReplies')?.after?.(replyForm);
 replyForm.reset();
 chooseReply(null);
 await loadReplies();
}
async function loadReplies(){
 if(!thread)return;
 const id=thread.id,stamp=++epoch,list=$('ddForumReplies');
 // A refresh must not destroy an in-progress inline reply draft.
 const activeForm=$('ddForumReplyCreate');
 if(activeForm&&list.contains(activeForm))list.after?.(activeForm);
 empty(list,'Loading replies…');
 try{
  const rows=await rpc('dd_discussions_replies',{p_thread_id:id,p_limit:100});
  if(stamp!==epoch||thread?.id!==id)return;
  let expanded=true; // All available comments appear automatically when opening a post.
  const all=Array.isArray(rows)?rows:[];
  const lookup=new Map(all.filter(r=>isId(r.id)).map(r=>[r.id,r]));
  const children=new Map(),ordered=[],seen=new Set();
  for(const row of all){const key=row.parent_id||row.parent_reply_id;const parent=lookup.has(key)&&key!==row.id?key:null;if(!children.has(parent))children.set(parent,[]);children.get(parent).push(row)}
  function visit(row){if(seen.has(row.id))return;seen.add(row.id);ordered.push(row);for(const child of children.get(row.id)||[])visit(child)}
  for(const row of children.get(null)||[])visit(row);
  for(const row of all)visit(row); // Preserve orphaned/cyclic rows without duplicating a comment.
  function display(){
   // Keep the composer connected while replacing comment cards on refresh.
   const activeForm=$('ddForumReplyCreate');
   if(activeForm&&list.contains(activeForm))list.after?.(activeForm);
   list.replaceChildren();
   if(!all.length){empty(list,'No replies yet. Start the discussion.');return}
   const visible=expanded?ordered:ordered.slice(0,4);
   for(const row of visible)appendReplyCard(list,row,lookup);
   window.DDRefreshBoardStars?.();
   if(replyParent&&activeForm&&!activeForm.hidden){
    const anchor=list.querySelector('[data-dd-forum-reply-id="'+replyParent+'"]');
    if(anchor)anchor.after(activeForm);
   }
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
 const authorName=row.author_name||'Community member';
  const avatar=mk('span',authorName.charAt(0).toUpperCase(),'dd-forum-avatar');
  avatar.setAttribute('aria-hidden','true');author.append(avatar);
  window.DDMemberAvatars?.decorate?.(avatar,authorName);
  author.append(mk('small',authorName+' · '+new Date(row.created_at).toLocaleDateString()+
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
 title.textContent=mode==='edit'?'Edit '+type:mode==='delete'?'Delete '+type:
  mode==='escalate'?'Escalate to site owner':'Report '+type;
 description.textContent=mode==='edit'?'Edit the public text of your own '+type+'. Changes are limited to 30 minutes after publication.':
  mode==='delete'?'Remove your own '+type+' from public view? It cannot be restored by your account. Minimal moderation history may remain.':
  mode==='escalate'?'Describe the serious issue for the overall site administrator. This does not give a section steward the power to delete other members’ work.':
  row.is_mine?'You cannot flag your own post. Use Edit or Delete to manage your own content. Reports are for other members’ content.':
  'Flag this content for independent moderation review. Reporting does not immediately delete another member’s post.';
 textWrap.hidden=mode!=='edit'&&mode!=='escalate';
 const ownFlag=mode==='flag'&&row.is_mine;
 reasonWrap.hidden=mode!=='flag'||ownFlag;
 submit.hidden=ownFlag;
 clearDialogFeedback(dialog);
 $('ddForumActionTextLabel').textContent=mode==='escalate'?'Reason for escalation':'Edit your text';
 text.maxLength=mode==='escalate'?500:kind==='thread'?5000:2000;
 text.minLength=mode==='escalate'?10:2;
 text.value=mode==='edit'?String(row.body||''):'';
 if(mode==='flag')reason.value='spam';
 submit.textContent=mode==='edit'?'Save changes':mode==='delete'?'Delete '+type:
  mode==='escalate'?'Send to site owner':'Submit report';
 submit.className=mode==='delete'?'outline dd-forum-danger-action':'action';
 form.onsubmit=async event=>{
  event.preventDefault();
  if(ownFlag){dialogFeedback(submit,'You cannot report your own post. This is a moderation safeguard.',true);return}
  let operation,feedback;
  if(mode==='edit'){
   const value=text.value.trim();
   if(value.length<2||value.length>text.maxLength){dialogFeedback(submit,'Check your edited text length.',true);return}
   operation=()=>rpc('dd_discussions_edit_own',{p_kind:kind,p_id:row.id,p_body:value});
   feedback='Your '+type+' was updated.';
  }else if(mode==='delete'){
   operation=()=>rpc('dd_discussions_withdraw_own',{p_kind:kind,p_id:row.id});
   feedback='Your '+type+' was removed from public view.';
  }else if(mode==='escalate'){
   const value=text.value.trim();
   if(value.length<10||value.length>500){dialogFeedback(submit,'Explain the concern in 10–500 characters.',true);return}
   operation=()=>rpc('dd_discussions_escalate',{p_kind:kind,p_id:row.id,p_reason:value});
   feedback='Concern sent to the site owner.';
  }else{
   const selected=reason.value;
   if(!['spam','abuse','privacy','harassment','harmful','other'].includes(selected)){dialogFeedback(submit,'Select a valid report reason.',true);return}
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
  if(mode==='edit'||mode==='escalate')text.focus?.();
  else if(mode==='flag'&&!ownFlag)reason.focus?.();
  else if(!ownFlag)submit.focus?.();
  else dialog.querySelector?.('[data-dd-forum-close]')?.focus?.();
 }
}
function actionsFor(parent,kind,row,inDetail=false,flagHost=null){
 if(!isId(row.id))return;
 const flagged=flaggedThisSession.has(kind+':'+row.id);
 const flag=nodeAction(flagHost||parent,'⚑',b=>openPostAction(b,kind,row,'flag'),'dd-forum-post-flag');
 flag.setAttribute('aria-label',flagged?'Already reported this '+kind:'Report this '+kind);
 flag.setAttribute('title',flagged?'Reported this session':'Report this '+kind);
 flag.setAttribute('aria-pressed',String(flagged));
 flag.disabled=flagged||row.is_mine===true;
  if(row.is_mine)flag.title='You cannot flag your own content';
 setActionIcon(flag,'flag','⚑');
 if(flagged)flag.classList?.add('is-flagged');
 const like=nodeAction(parent,'▲ '+(row.likes||0),b=>vote(kind,row,1,b),'dd-forum-icon-button dd-forum-vote');
 const dislike=nodeAction(parent,'▼ '+(row.dislikes||0),b=>vote(kind,row,-1,b),'dd-forum-icon-button dd-forum-vote');
 like.setAttribute('aria-label','Upvote this '+kind+' · '+(row.likes||0)+' votes');
 dislike.setAttribute('aria-label','Downvote this '+kind+' · '+(row.dislikes||0)+' votes');
 like.setAttribute('aria-pressed',String(Number(row.my_vote)===1));
 dislike.setAttribute('aria-pressed',String(Number(row.my_vote)===-1));
 if(kind==='thread'){
  const commentCount=Number.isFinite(Number(row.reply_count))?Number(row.reply_count):0;
  const comments=nodeAction(parent,'💬 '+commentCount,async()=>{
   if(inDetail&&thread?.id===row.id){chooseReply(null,true);return}
   if(!section&&isId(row.section_id))await openGlobalThread(row);
   else await openThread(row);
   if(thread?.id===row.id)chooseReply(null,true);
  },'dd-forum-icon-button dd-forum-comments-action');
  comments.setAttribute('aria-label','Read or add comments · '+commentCount+' comments');
  comments.setAttribute('title','Comments');
  const star=nodeAction(parent,'☆',()=>saveThread(row),'dd-forum-icon-button dd-forum-star-action');
  star.dataset.bookmarkUrl=permalink(row)||'';star.dataset.bookmarkLabel=String(row.title||'Discussion');
  const starIcon=mk('span','☆');starIcon.dataset.starIcon='';star.replaceChildren(starIcon);
  // Keep [data-star-icon] intact for the shared saved ☆/★ feedback.
  star.setAttribute('aria-label','Save post to an Investigation Board');
  star.setAttribute('title','Add to Board');
  const share=nodeAction(parent,'↗ Share',()=>shareThread(row),'dd-forum-icon-button dd-forum-share-action');
  share.setAttribute('aria-label','Share this post');
  share.setAttribute('title','Share');
  setActionIcon(share,'share','⤴');
  // Owner screenshot contract: adjacent votes, 💬 count, ☆ Board, Share.
  parent.insertBefore(comments,star);
 }
 if(kind==='reply'&&thread){
  // A reply's source is its parent discussion; Board and Share never
  // fabricate a link to a separate, non-existent public comment page.
  const board=nodeAction(parent,'☆',()=>saveThread(thread),'dd-forum-icon-button dd-forum-star-action');
  board.dataset.bookmarkUrl=permalink(thread)||'';board.dataset.bookmarkLabel=String(thread.title||'Discussion');
  const boardIcon=mk('span','☆');boardIcon.dataset.starIcon='';board.replaceChildren(boardIcon);
  board.setAttribute('aria-label','Save parent discussion to Investigation Board');
  board.setAttribute('title','Add discussion to Board');
  const shared=nodeAction(parent,'↗ Share',()=>shareThread(thread),'dd-forum-icon-button dd-forum-share-action');
  shared.setAttribute('aria-label','Share parent discussion');
  shared.setAttribute('title','Share discussion');
  setActionIcon(shared,'share','⤴');
 }
 parent.append(mk('span',undefined,'dd-forum-spacer'));
 if(row.is_mine){
  // One More menu per owned post OR reply, matching all other comment bars.
  // Edit expires after 30 minutes; Delete remains available to the author.
  const more=mk('details',undefined,'dd-comment-more dd-forum-owner-more');
  const summary=mk('summary','⋯','dd-comment-more-trigger dd-forum-more-trigger');
  summary.setAttribute('aria-label','More options for my '+(kind==='thread'?'post':'reply'));
  summary.setAttribute('title','More options for my '+(kind==='thread'?'post':'reply'));
  const options=mk('div',undefined,'dd-comment-more-panel');
  options.setAttribute('role','group');options.setAttribute('aria-label','My '+(kind==='thread'?'post':'reply')+' options');
  const posted=Date.parse(row.created_at);
  const editable=Number.isFinite(posted)&&Date.now()>=posted&&Date.now()-posted<30*60*1000;
  if(editable){
   const edit=nodeAction(options,'Edit '+(kind==='thread'?'post':'reply'),()=>{
    more.open=false;openPostAction(summary,kind,row,'edit');
   },'dd-comment-edit-button');
   edit.setAttribute('aria-label','Edit my '+kind);
  }
  const remove=nodeAction(options,'Delete '+(kind==='thread'?'post':'reply'),()=>{
   more.open=false;openPostAction(summary,kind,row,'delete');
  },'dd-comment-delete-button');
  remove.setAttribute('aria-label','Delete my '+kind);
  if(section?.is_steward){
   const moderation=nodeAction(options,'Moderator tools',()=>{
    more.open=false;openStewardTools(summary,kind,row);
   },'dd-comment-moderate-button');
   moderation.setAttribute('aria-label','Moderator tools');
  }
  more.append(summary,options);parent.append(more);
 }else if(section?.is_steward){
  // Stewards may still moderate other people's posts but never Edit/Delete
  // another author's content through the owner-only menu.
  const more=nodeAction(parent,'⋯',b=>openStewardTools(b,kind,row),'dd-forum-icon-button dd-forum-more-trigger');
  more.setAttribute('aria-label','More post tools');
  more.setAttribute('aria-haspopup','dialog');
  more.setAttribute('aria-controls','ddForumMoreDialog');
 }
}
function openStewardTools(opener,kind,row){
 if(!section?.is_steward)return;
 const dialog=$('ddForumMoreDialog'),list=$('ddForumMoreActions');
 if(!dialog?.showModal||!list)return;
 clearDialogFeedback(dialog);
 list.replaceChildren();
 if(kind==='thread'){
  const pin=nodeAction(list,row.is_pinned?'Unpin post':'Pin post',async button=>{
   const saved=await change(button,()=>rpc('dd_discussions_pin',{
    p_thread_id:row.id,p_pinned:!row.is_pinned
   }),'Post pin updated.');
   if(saved)dialog.close();
  });
  pin.setAttribute('aria-label',row.is_pinned?'Unpin this discussion':'Pin this discussion');
 }
 nodeAction(list,'Escalate to site owner',()=>{
  dialog.close();
  openPostAction(opener,kind,row,'escalate');
 });
 if(!dialog.open)dialog.showModal();
}
function openSectionAdminDialog(sectionRow,opener){
 if(!ownerSectionIds.has(sectionRow.id))return;
 const dialog=$('ddForumAdminDialog'),form=$('ddForumAdminForm');
 if(!dialog?.showModal||!form)return;
 clearDialogFeedback(dialog);
 $('ddForumAdminDescription').textContent='Remove “'+sectionRow.title+'” and hide all its public posts and replies. A site administrator can later restore it; moderation history is retained.';
 const reason=$('ddForumAdminReason'),submit=$('ddForumAdminSubmit');
 reason.value='';
 form.onsubmit=async event=>{
  event.preventDefault();
  if(!ownerSectionIds.has(sectionRow.id)){dialogFeedback(submit,'Site administrator permission required.',true);return}
  const value=reason.value.trim();
  if(value.length<8||value.length>500){dialogFeedback(submit,'Enter a reason of 8–500 characters.',true);return}
  const saved=await change(submit,()=>rpc('dd_discussions_owner_review',{
   p_kind:'section',p_id:sectionRow.id,p_status:'removed',p_reason:value
  }),'Section removed from public Discussions.');
  if(saved)dialog.close();
 };
 dialog.dataset.returnFocus=opener?.id||'';
 if(!dialog.open){dialog.showModal();reason.focus?.()}
}
// One shared Discussion post-card renderer for subject and across-subject feeds.
function renderDiscussionCard(list,row,fromAll=false){
 const card=mk('article',undefined,'dd-forum-item dd-forum-post-card');
 const main=mk('div',undefined,'dd-forum-post-main'),actions=mk('div',undefined,'dd-forum-actions dd-action-rail');
 main.append(makePostHead(row,'thread',actions));
 if(fromAll){
  const subject=sections.find(s=>s.id===row.section_id)||
   {id:row.section_id,title:row.section_title||'Discussion subject',description:'',topic:'',is_steward:false};
  const chip=nodeAction(main,'◈ '+(subject.title||'Discussion subject'),()=>openSection(subject),'dd-community-global-subject');
  chip.setAttribute('aria-label','View posts in subject: '+String(subject.title||'Discussion subject'));
 }
 const title=nodeAction(main,row.title||'Untitled topic',()=>fromAll?openGlobalThread(row):openThread(row),'dd-forum-title');
 title.setAttribute('aria-label','Read discussion: '+String(row.title||'Untitled topic'));
 main.append(mk('p',String(row.body||'').slice(0,330),'dd-forum-body'));
 photo(main,row);
 link(main,row.link_url,safeLink(row.link_url)?'Source · '+new URL(safeLink(row.link_url)).hostname:'');
 card.append(main);actionsFor(actions,'thread',row,false,actions.flagHost);card.append(actions);list.append(card);
}
async function openGlobalThread(row){
 if(!isId(row?.id)||!isId(row?.section_id))return;
 const subject=sections.find(s=>s.id===row.section_id)||
  {id:row.section_id,title:row.section_title||'Discussion subject',description:'',topic:'',is_steward:false};
 const identityBefore=identityRevision;
 await openSection(subject);
 if(identityRevision!==identityBefore||section?.id!==subject.id)return;
 globalReturn=true;
 $('ddForumBackThreads').textContent='← Back to '+(globalSort==='new'?'New':globalSort==='top'?'Top':'Popular');
 await openThread(row); // Existing post detail retains automatic nested replies.
}
async function loadGlobalFeed(reset=false){
 const list=$('ddForumGlobalFeed'),more=$('ddForumGlobalLoadMore'),status=$('ddForumGlobalStatus');
 if(!list||!more||!status||section||thread||!ready||discussionView!=='feed')return;
 if(globalLoading&&!reset)return;
 if(reset){globalRows=[];globalTotal=0;list.replaceChildren()}
 const stamp=++globalRequest,offset=globalRows.length,mode=globalSort;
 globalLoading=true;status.textContent='Loading '+mode+' discussions…';more.hidden=true;
 try{
  const rows=await rpc('dd_discussions_global_feed',{p_limit:10,p_offset:offset,p_sort:mode});
  if(stamp!==globalRequest||section||thread||discussionView!=='feed')return;
  if(!Array.isArray(rows))throw Error('Unexpected global feed response');
  const found=new Set(globalRows.map(row=>row.id));
  for(const row of rows)if(isId(row?.id)&&isId(row?.section_id)&&!found.has(row.id)){
   globalRows.push(row);found.add(row.id)
  }
  if(rows.length)globalTotal=Number(rows[0].total_count)||globalRows.length;
  list.replaceChildren();
  if(!globalRows.length)empty(list,'No public discussions yet. Explore the subjects below.');
  for(const row of globalRows)renderDiscussionCard(list,row,true);
  window.DDRefreshBoardStars?.();
  status.textContent=globalRows.length?'Showing '+globalRows.length+' of '+globalTotal+' posts · '+mode:'Browse subjects below to begin a conversation.';
  more.hidden=!rows.length||globalRows.length>=globalTotal;
 }catch(error){
  if(stamp!==globalRequest)return;
  if(!globalRows.length)empty(list,'Across-subject posts are temporarily unavailable. Browse subjects below.');
  status.textContent='Discussion feed unavailable. Other Discussions remain accessible.';
  more.hidden=true;
 }finally{if(stamp===globalRequest)globalLoading=false}
}

async function loadThreads(){
 if(!section)return;
 const id=section.id,stamp=++epoch,list=$('ddForumPostList');empty(list,'Loading discussions…');
 $('ddForumReplyPane').hidden=true;
 $('ddForumThreadPane').classList?.remove?.('dd-forum-detail-open');
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
  if(!rows?.length)empty(list,'No posts found. Try another search or start the conversation.');
  for(const row of rows||[])renderDiscussionCard(list,row);
  window.DDRefreshBoardStars?.();
  if(count)count.textContent='Page '+(feedPage+1)+' · '+feedTotal+' posts'+(!feedModern?' · first 100 while upgrade is pending':'');
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
 updateCommunityContext();
 const root=$('ddForumSections');root.replaceChildren();
 const query=$('ddForumSearch').value.trim().toLowerCase();
 const shown=sections.filter(s=>[s.title,s.description,s.topic,s.slug].join(' ').toLowerCase().includes(query));
 if(!shown.length)empty(root,sections.length?'No matching sections.':'No sections yet. Start one!');
 for(const s of shown){
  const card=mk('article',undefined,'dd-forum-item dd-forum-section-card');
  const open=nodeAction(card,s.title||'Untitled',()=>openSection(s),'dd-forum-title');
  open.setAttribute('aria-label','Browse subject: '+String(s.title||'Untitled'));
  card.append(mk('p',String(s.description||'').slice(0,250),'dd-forum-body'));
  const meta=mk('small',(s.topic||'Research')+' · '+(s.thread_count||0)+' posts'+(s.is_steward?' · Your section':''),'muted');
  card.append(meta);
  const mark=mk('span',String(s.title||'S').charAt(0).toUpperCase(),'dd-community-subject-mark');mark.setAttribute('aria-hidden','true');card.append(mark);
  favouriteButton(card,s,favouriteIds().has(s.id));
  const jump=mk('a','Open subject →','dd-forum-section-arrow dd-forum-section-open');
  jump.href='?dd_tab=discussionsPage&dd_section='+encodeURIComponent(s.id);
  jump.setAttribute('aria-label','Open subject: '+String(s.title||'Untitled'));
  jump.addEventListener('click',event=>{event.preventDefault();void openSection(s)});
  card.append(jump);
  if(ownerSectionIds.has(s.id)){
   const adminActions=mk('div',undefined,'dd-forum-section-admin');
   nodeAction(adminActions,'Delete section',button=>openSectionAdminDialog(s,button),'outline dd-forum-danger-action');
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
 closeSubjectsDrawer();
 viewerId=next;identityRevision++;epoch++;++globalRequest;globalLoading=false;globalRows=[];globalTotal=0;globalReturn=false;section=null;thread=null;ownerSectionIds=new Set();flaggedThisSession=new Set();setCreateButtons();sections=[];feedPage=0;feedQuery='';deepLinkHandled=false;
 showDiscussionView(savedDiscussionView(),false,false);
 for(const id of ['ddForumSectionDialog','ddForumPostDialog','ddForumActionDialog','ddForumMoreDialog','ddForumAdminDialog']){const dialog=$(id);if(dialog?.open)dialog.close()}
 updateCommunityContext();
 const sectionsPane=$('ddForumSectionsPane'),threadPane=$('ddForumThreadPane');
 if(sectionsPane)sectionsPane.hidden=false;
 if(threadPane)threadPane.hidden=true;
 for(const name of ['ddForumStewardPanel','ddForumReplyPane']){const el=$(name);if(el)el.hidden=true}
 for(const name of ['ddForumSections','ddForumPostList','ddForumReplies','ddForumGlobalFeed'])$(name)?.replaceChildren();
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
  sections=orderSections(rows);drawSections();
  say(sections.length+' subjects available.');await openDeepLink();
   if(!section&&!thread&&discussionView==='feed')await loadGlobalFeed(true);
 }catch(e){say(e?.message||'Sections temporarily unavailable.')}
}
function setCreateButtons(){const button=$('ddForumNewPost');if(button)button.hidden=!section||!!thread}
async function openComposer(id,opener){
 try{await registered()}catch(e){say(e?.message||'Sign in to publish.');return}
 const dialog=$(id);if(!dialog||dialog.open)return;
 if(!dialog.showModal){say('Your browser does not support this form window.');return}
 clearDialogFeedback(dialog);
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
 // Keep the destination available when the account SDK is temporarily offline.
 // Reads and composer actions still fail closed through rpc()/registered().
 if(ready||!$('discussionsPage'))return;
 ready=true;
 const page=$('discussionsPage');page.removeAttribute('hidden');
 const witness=document.querySelector('.nav .tab[data-tab="witness"]');
 const tab=mk('button','', 'tab');tab.type='button';tab.dataset.tab='discussionsPage';
 tab.append(mk('span','☷','ico'),document.createTextNode('Discussions'));
 tab.onclick=()=>window.navigateTo?.('discussionsPage');
 witness?.after(tab);
 wireComposer('ddForumSectionDialog');wireComposer('ddForumPostDialog');wireComposer('ddForumActionDialog');
 wireComposer('ddForumMoreDialog');wireComposer('ddForumAdminDialog');
 const drawer=$('ddForumSubjectsDrawer');
 if(drawer){
  $('ddForumSubjectsMenu').onclick=()=>openSubjectsDrawer();
  $('ddForumSubjectsClose').onclick=()=>closeSubjectsDrawer();
  $('ddForumDrawerRefresh').onclick=()=>{void refreshSubjectsDrawer()};
  $('ddForumDrawerSearch').oninput=()=>renderSubjectsDrawer();
  drawer.addEventListener('click',event=>{if(event.target===drawer)closeSubjectsDrawer()});
  drawer.addEventListener('cancel',event=>{event.preventDefault();closeSubjectsDrawer()});
  drawer.addEventListener('close',()=>{
   ++drawerRequest;
   if(drawerTimer!==null){window.clearInterval?.(drawerTimer);drawerTimer=null}
   $('ddForumSubjectsMenu')?.setAttribute('aria-expanded','false');
  });
 }
 const tabs=$('ddForumViewTabs');
 const switchOverview=view=>{showDiscussionView(view,true,true)};
 $('ddForumFeedTab').onclick=()=>switchOverview('feed');
 $('ddForumSectionsTab').onclick=()=>switchOverview('sections');
 tabs?.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?'feed':event.key==='End'?'sections':discussionView==='feed'?'sections':'feed';
  switchOverview(next);$(next==='feed'?'ddForumFeedTab':'ddForumSectionsTab')?.focus?.({preventScroll:true});
 });
 showDiscussionView(savedDiscussionView(),false,false);
 const browseAll=$('ddForumBrowseAll');if(browseAll)browseAll.onclick=()=>{
  showDiscussionView('sections',true,false);$('ddForumBackSections').click();
 };
 $('ddForumNewSection').onclick=e=>{void openComposer('ddForumSectionDialog',e.currentTarget)};
 $('ddForumNewPost').onclick=e=>{void openComposer('ddForumPostDialog',e.currentTarget)};
 setCreateButtons();
 $('ddForumSearch').addEventListener('input',drawSections);
 const globalSelect=$('ddForumGlobalSort');if(globalSelect)globalSelect.onchange=event=>{
  const value=event.target.value;if(!['popular','new','top'].includes(value))return;
  globalSort=value;void loadGlobalFeed(true);
 };
 const globalMore=$('ddForumGlobalLoadMore');if(globalMore)globalMore.onclick=()=>{void loadGlobalFeed(false)};
 const cancelReply=$('ddForumReplyCancel');
 if(cancelReply)cancelReply.onclick=()=>{
  closeReplyComposer();
  $('ddForumReplyContent')?.querySelector('.dd-forum-comments-action')?.focus({preventScroll:true});
 };
 const replyInput=$('ddForumReplyText');
 if(replyInput){
  replyInput.addEventListener('input',()=>resizeReplyComposer(replyInput));
  replyInput.addEventListener('focus',()=>resizeReplyComposer(replyInput));
 }
 $('ddForumBackSections').onclick=()=>{
  thread=null;globalReturn=false;section=null;
  showDiscussionView(discussionView,false,false);
  updateCommunityContext();setCreateButtons();++epoch;
  $('ddForumSectionsPane').hidden=false;$('ddForumThreadPane').hidden=true;
  void refresh();
 };
 $('ddForumBackThreads').onclick=()=>{if(globalReturn){$('ddForumBackSections').click();return}thread=null;replyParent=null;$('ddForumReplyCreate').hidden=true;$('ddForumThreadPane').classList?.remove?.('dd-forum-detail-open');setCreateButtons();++epoch;$('ddForumPostCreate').hidden=false;$('ddForumPostList').hidden=false;$('ddForumSortLabel').hidden=false;$('ddForumStewardPanel').hidden=!section?.is_steward;$('ddForumReplyPane').hidden=true;$('ddForumThreadTitle').textContent=section?.title||'Section';void loadThreads()};
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
   if(ok===true){section.description=desc;section.topic=topic;$('ddForumSectionInfo').textContent=desc+' · You organise this subject.'}
   return ok;
  },'Your section details were updated.');
 };
 $('ddForumRefresh').onclick=()=>{void refresh()};
 $('ddForumSectionCreate').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const title=form.elements.namedItem('title').value.trim(),description=form.elements.namedItem('description').value.trim(),topic=form.elements.namedItem('topic').value.trim();
  const b=form.querySelector('button[type="submit"]');
  if(title.length<4||title.length>60||description.length>400||topic.length>40){
   dialogFeedback(b,'Section names must be 4–60 characters; descriptions 400 characters and categories 40 characters maximum.',true);return
  }
  if(!/^[A-Za-z][A-Za-z0-9 _-]*$/.test(title)){
   dialogFeedback(b,'Use letters, numbers, spaces, hyphens or underscores only in the section title. For example, “UAP UFO sightings” (without /).',true);return
  }
  let createdId=null;
  const saved=await change(b,()=>rpc('dd_discussions_create_section',{
   p_title:title,p_description:description,p_topic:topic
  }),'Section created.',result=>{
   if(!isId(result))throw Error('The server did not confirm a new section ID.');
   createdId=result;
  });
  if(saved){
   form.reset();$('ddForumSectionDialog').close();
   const newSection=sections.find(x=>x.id===createdId)||{
    id:createdId,title,description,topic,is_steward:true,thread_count:0
   };
   await openSection(newSection);
  }
 };
 $('ddForumPostCreate').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,b=form.querySelector('button[type="submit"]');
  if(!section){say('Choose a section first.');return}
  const title=form.elements.namedItem('title').value.trim(),body=form.elements.namedItem('body').value.trim(),url=form.elements.namedItem('link_url').value.trim();
  const tone=form.elements.namedItem('post_tone').value,image=form.elements.namedItem('image_url').value.trim();
  if(title.length<4||title.length>150||body.length<2||body.length>5000||!['serious','fun'].includes(tone)
   ||(url&&!safeLink(url))||(image&&!safeImage(image))){
   dialogFeedback(b,'Check title, post, Serious/Fun tag and optional direct HTTPS image URL.',true);return
  }
  const saved=await change(b,()=>rpc('dd_discussions_create_thread_v2',{
   p_section_id:section.id,p_title:title,p_body:body,p_url:url||null,p_tone:tone,p_image_url:image||null
  }),'Your discussion was published.');
  if(saved){form.reset();$('ddForumPostDialog').close()}
 };
 $('ddForumReplyCreate').onsubmit=event=>{
  event.preventDefault();if(!thread)return;
  const form=event.currentTarget,body=form.elements.namedItem('body').value.trim(),b=form.querySelector('button[type="submit"]');
  if(body.length<2||body.length>2000){say('Replies must be 2–2000 characters.');return}
  const parent=replyParent,originalThread=thread.id;
  const priorIds=new Set([...$('ddForumReplies').querySelectorAll('[data-dd-forum-reply-id]')].map(n=>n.dataset.ddForumReplyId));
  void change(b,()=>rpc('dd_discussions_reply',{p_thread_id:originalThread,p_body:body,p_parent_id:parent}),'Reply posted.',()=>{
   form.elements.namedItem('body')?.blur();
   form.reset();resizeReplyComposer(form.elements.namedItem('body'));if(thread?.id===originalThread)closeReplyComposer();
  }).then(saved=>{
   if(!saved||thread?.id!==originalThread)return;
   const fresh=[...$('ddForumReplies').querySelectorAll('[data-dd-forum-reply-id]')]
     .find(n=>!priorIds.has(n.dataset.ddForumReplyId)&&n.querySelector('.dd-forum-body')?.textContent===body);
   if(fresh)window.DDCommunityVotes?.revealPostedComment?.(fresh);
  });
 };
 db()?.auth?.onAuthStateChange?.((_event,session)=>onIdentityChange(session));
 if(!$('discussionsPage').classList.contains('hidden'))void refresh();
}
window.DDDiscussions=Object.freeze({refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
