/* Disclosure Desk public like/dislike counters for comments and witness reports.
 * One registered account vote per item, enforced by database RPC, not JavaScript.
 * Voter identities are not public. No third-party analytics.
 */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const enabled=window.DD_COMMUNITY_FEATURES?.voting===true&&['test','production'].includes(cfg.environment);
const key=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
let db=null;
const client=()=>db||(db=enabled&&window.supabase?.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const waiting=new Map();
let timer=null;
function apply(w,result){
 if(!w?.isConnected)return;
 w.dataset.myVote=String(Number(result?.my_vote||0));
 const like=w.querySelector('[data-vote-value="1"]');
 const dislike=w.querySelector('[data-vote-value="-1"]');
 const n1=Number(result?.likes||0),n2=Number(result?.dislikes||0);
 like.textContent='▲ '+Math.max(0,n1);
 dislike.textContent='▼ '+Math.max(0,n2);
 like.setAttribute('aria-pressed',String(w.dataset.myVote==='1'));
 dislike.setAttribute('aria-pressed',String(w.dataset.myVote==='-1'));
 w.querySelector('.dd-vote-status').textContent='';
}
async function flush(){
 const lists=new Map(waiting);waiting.clear();timer=null;
 const c=client();if(!c)return;
 for(const [kind,group] of lists){
  const ids=[...group.keys()];
  if(!ids.length)continue;
  const {data,error}=await c.rpc('dd_vote_summary',{p_kind:kind,p_ids:ids});
  for(const [id,containers] of group){
   for(const widget of containers){
    if(!widget.isConnected)continue;
    if(error){
     widget.querySelector('.dd-vote-status').textContent='Voting unavailable';
     widget.querySelectorAll('button').forEach(b=>b.disabled=true);
    }else apply(widget,(data||[]).find(row=>row.target_id===id)||{likes:0,dislikes:0,my_vote:0});
   }
  }
 }
}
function fetchSummary(widget,kind,id){
 if(!waiting.has(kind))waiting.set(kind,new Map());
 const map=waiting.get(kind);
 if(!map.has(id))map.set(id,[]);
 map.get(id).push(widget);
 if(timer===null)timer=setTimeout(()=>void flush(),100);
}
function mount(host,kind,id){
 if(!enabled||!host||!['comment','witness'].includes(kind)||!key.test(String(id||'')))return;
 if(host.querySelector('[data-vote-item="'+String(id)+'"]'))return;
 const widget=make('div','dd-community-votes');
 widget.dataset.voteItem=id;
 widget.dataset.myVote='0';
 widget.setAttribute('role','group');
 widget.setAttribute('aria-label','Community upvote and downvote buttons');
 const buttons=[1,-1].map(value=>{
  const btn=make('button','dd-community-vote-button',value===1?'▲ …':'▼ …');
  btn.type='button';
  btn.dataset.voteValue=String(value);
  btn.setAttribute('aria-label',value===1?'Upvote this '+kind:'Downvote this '+kind);
  btn.setAttribute('aria-pressed','false');
  btn.addEventListener('click',async()=>{
   const c=client();if(!c)return;
   const {data:{user},error:authError}=await c.auth.getUser();
   if(authError||!user||user.is_anonymous){
    widget.querySelector('.dd-vote-status').textContent='Sign in to vote. Open My Account under Boards.';
    return;
   }
   const next=widget.dataset.myVote===String(value)?0:value;
   buttons.forEach(b=>b.disabled=true);
   widget.querySelector('.dd-vote-status').textContent='Saving vote…';
   try{
    const {data,error}=await c.rpc('dd_vote_set',{p_kind:kind,p_id:id,p_value:next});
    if(error)throw error;
    apply(widget,Array.isArray(data)?data[0]:data);
   }catch(err){
    widget.querySelector('.dd-vote-status').textContent='Vote not saved. '+String(err.message||'Try again.');
   }finally{buttons.forEach(b=>b.disabled=false)}
  });
  return btn;
 });
 const status=make('span','dd-vote-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 widget.append(...buttons,status);
 host.append(widget);
 fetchSummary(widget,kind,id);
}
// Shared presentation for ALL public comment cards (News, Cases, Videos, Hearings).
// The actual report handler stays with its host; voting stays in mount()/RPC.
// Like the Discussions cards: flag in the header, votes in a dark bottom rail.
function threadedComments(items){
 const source=Array.isArray(items)?items:[];
 const lookup=new Map(source.filter(x=>key.test(String(x?.id||''))).map(x=>[String(x.id),x]));
 const children=new Map(),roots=[];
 for(const item of source){
  const parent=lookup.get(String(item?.parent_id||''));
  if(parent&&parent!==item){
   if(!children.has(String(parent.id)))children.set(String(parent.id),[]);
   children.get(String(parent.id)).push(item);
  }else roots.push(item);
 }
 const out=[],seen=new Set();
 const visit=(item,depth)=>{
  const id=String(item.id||'');if(seen.has(id))return;seen.add(id);
  const parent=lookup.get(String(item.parent_id||''));
  out.push({...item,replyDepth:Math.min(depth,4),replyParentName:parent?.publicAlias||null});
  for(const child of children.get(id)||[])visit(child,depth+1);
 };
 for(const item of roots)visit(item,0);
 for(const item of source)if(!seen.has(String(item.id||'')))visit(item,0);
 return out;
}
function mountCommentCard(card,header,body,flag,id,onReply,context={}){
 if(!card||!header||!body||!flag)return false;
 const content=make('div','dd-comment-main');
 const rail=make('div','dd-comment-action-rail dd-action-rail');
 card.classList.add('dd-comment-card');
 header.classList.add('dd-comment-head');
 body.classList.add('dd-comment-body');
 flag.classList.remove('outline');
 flag.classList.add('dd-comment-flag');
 flag.setAttribute('aria-label',flag.disabled?'You cannot report your own comment':'Report this comment');
 flag.setAttribute('title',flag.disabled?'You cannot report your own comment':'Report this comment');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');
 svg.setAttribute('aria-hidden','true');
 svg.setAttribute('class','dd-comment-flag-icon');
 const shape=document.createElementNS('http://www.w3.org/2000/svg','path');
 shape.setAttribute('d','M4 22V5 M4 5c4-3 7 3 11 0s5-2 5-2v12c-4-3-6 3-10 0s-6-1-6-1');
 svg.append(shape);
 flag.replaceChildren(svg);
 header.append(flag);
 content.append(header,body);
 card.replaceChildren(content,rail);
 mount(rail,'comment',id);
 // Every public comment has the same star/share controls and a real
 // permalink to its parent discussion, not an invented external source.
 const caseId=String(context?.discussionKey||'');
 if(caseId.length>=1&&caseId.length<=180&&(/^(news|media|video|archive|case|hearing):/.test(caseId)||/^[a-z0-9][a-z0-9_-]{0,120}$/i.test(caseId))){
  const link=new URL('/',location.origin);
  link.searchParams.set('dd_tab',caseId.startsWith('news:')?'discover':caseId.startsWith('video:')?'clips':caseId.startsWith('media:')?'watchRead':caseId.startsWith('hearing:')?'livePage':caseId.startsWith('archive:')?'archivePage':'mapPage');
  link.searchParams.set('dd_discussion',caseId);
  link.searchParams.set('dd_comment',String(id));
  const label=String(context?.title||'Community discussion').slice(0,100);
  const star=make('button','dd-action-board');
  const icon=make('span','', '☆');icon.dataset.starIcon='';star.append(icon);
  star.dataset.bookmarkUrl=link.href;star.dataset.bookmarkLabel=label;
  star.type='button';star.title='Add this comment to an Investigation Board';
  star.setAttribute('aria-label','Add comment to Board');
  star.addEventListener('click',()=>window.DDSavePublicLinkToBoard?.(label,link.href));
  const share=make('button','dd-action-share');
  const shareSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  shareSvg.setAttribute('viewBox','0 0 24 24');shareSvg.setAttribute('aria-hidden','true');
  for(const [tag,attrs] of [
   ['circle',{cx:'18',cy:'5',r:'3'}],['circle',{cx:'6',cy:'12',r:'3'}],
   ['circle',{cx:'18',cy:'19',r:'3'}],['path',{d:'m8.7 10.4 6.6-3.8 M8.7 13.6l6.6 3.8'}]
  ]){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
   for(const [name,value] of Object.entries(attrs))el.setAttribute(name,value);shareSvg.append(el)}
  share.append(shareSvg);share.type='button';share.title='Share direct public comment link';
  share.setAttribute('aria-label','Share this public comment');
  share.addEventListener('click',()=>void window.DDSharePublicLink?.(label,link.href));
  rail.append(star,share);
 }
 // M73: public News, Archive, Video, Watch & Read and Case/Hearing comments
 // share the same own-comment controls as Discussions. dd_public_comments()
 // supplies is_mine from auth.uid(), but server-side RPC checks ownership again.
 if(context?.isMine===true){
  const notice=make('span','dd-comment-action-notice');
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const callOwner=async(name,args)=>{
   const c=client();
   if(!c)throw new Error('Sign-in service unavailable.');
   const {data,error}=await c.auth.getUser();
   if(error||!data?.user||data.user.is_anonymous)throw new Error('Sign in with a registered account.');
   const result=await c.rpc(name,args);
   if(result.error)throw result.error;
   if(result.data!==true&&!(Array.isArray(result.data)&&result.data[0]===true))
    throw new Error('This comment could not be changed. Refresh and check your account.');
   return true;
  };
  const changed=async()=>{
   if(typeof context.onChanged==='function')await context.onChanged();
   else if(card.isConnected)card.remove();
  };
  // One owner-only More menu on EVERY authored public comment, even after the
  // 30-minute edit window. Do not put permanent Delete outside the menu.
  const more=make('details','dd-comment-more dd-owner-more');
  const summary=make('summary','dd-comment-more-trigger','⋯');
  summary.setAttribute('aria-label','More options for my comment');
  summary.setAttribute('title','More options for my comment');
  const menu=make('div','dd-comment-more-panel');
  menu.setAttribute('role','group');menu.setAttribute('aria-label','My comment options');
  const posted=Date.parse(String(context.createdAt||''));
  const editable=Number.isFinite(posted)&&Date.now()>=posted&&Date.now()-posted<30*60*1000;
  if(editable){
   const edit=make('button','dd-comment-edit-button','Edit comment');
   edit.type='button';menu.append(edit);
   edit.addEventListener('click',()=>{
    more.open=false;
    if(card.querySelector('.dd-comment-edit-form'))return;
    const form=make('form','dd-comment-edit-form');
    const label=make('label','','Edit my comment');
    const input=make('textarea','dd-comment-edit-input');
    input.value=String(context.body||body.textContent||'');
    input.minLength=3;input.maxLength=2000;input.required=true;input.rows=3;
    const controls=make('div','dd-comment-edit-actions');
    const save=make('button','dd-comment-edit-save','Save changes');save.type='submit';
    const cancel=make('button','dd-comment-edit-cancel','Cancel');cancel.type='button';
    cancel.onclick=()=>form.remove();
    controls.append(cancel,save);label.append(input);
    form.append(label,controls);card.append(form);input.focus({preventScroll:true});
    form.onsubmit=async event=>{
     event.preventDefault();
     const value=input.value.trim();
     if(value.length<3||value.length>2000)return;
     save.disabled=true;notice.textContent='Saving edit…';
     try{
      await callOwner('dd_edit_my_comment',{p_id:id,p_body:value});
      notice.textContent='Comment updated.';
      await changed();
     }catch(err){notice.textContent='Edit unavailable. '+String(err?.message||'Try again.')}
     finally{save.disabled=false}
    };
   });
  }
  const deletion=make('button','dd-comment-delete-button','Delete comment');
  deletion.type='button';deletion.title='Delete my comment';
  deletion.setAttribute('aria-label','Delete my comment');
  deletion.addEventListener('click',async()=>{
   more.open=false;
   if(!await window.DDConfirm?.show?.({title:'Delete your comment?',message:'This cannot be undone. Existing replies by other members will remain visible.',confirmText:'Delete comment'}))return;
   deletion.disabled=true;notice.textContent='Deleting…';
   try{
    await callOwner('dd_delete_my_comment',{p_id:id});
    notice.textContent='Comment deleted.';
    await changed();
   }catch(err){notice.textContent='Could not delete comment. '+String(err?.message||'Try again.')}
   finally{deletion.disabled=false}
  });
  menu.append(deletion);more.append(summary,menu);rail.append(more);
  rail.append(notice);
 }
 if(typeof onReply==='function'){
  const reply=make('button','dd-comment-reply-button','↳ Reply');
  reply.type='button';reply.setAttribute('aria-label','Reply to this comment');
  reply.addEventListener('click',()=>onReply(id));
  rail.append(reply);
 }
 return true;
}
// M79: one mobile keyboard/posted-reply viewport controller shared by every
// public comment surface. It never changes comment data or triggers a write.
function commentScrollContainer(element){
 let node=element?.parentElement;
 while(node&&node!==document.body&&node!==document.documentElement){
  const style=window.getComputedStyle(node);
  if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+2)return node;
  node=node.parentElement;
 }
 return null;
}
function commentViewportBounds(){
 const visual=window.visualViewport;
 return {top:visual?.offsetTop||0,bottom:(visual?.offsetTop||0)+(visual?.height||window.innerHeight)};
}
function scrollCommentBy(target,dy,smooth){
 if(!Number.isFinite(dy)||Math.abs(dy)<4)return false;
 const parent=commentScrollContainer(target);
 const behavior=smooth&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'smooth':'auto';
 if(parent)parent.scrollBy({top:dy,behavior});
 else window.scrollBy({top:dy,behavior});
 return true;
}
function keepCommentComposerVisible(form){
 if(!form?.isConnected||form.hidden)return false;
 const actions=form.querySelector('.dd-reply-compose-actions,.dd-forum-reply-actions,button[type="submit"]');
 if(!actions||!actions.getClientRects().length)return false;
 const rect=actions.getBoundingClientRect();
 const bounds=commentViewportBounds();
 // Also respect a scrollable Case/Hearing dialog or other nested container.
 const scroller=commentScrollContainer(actions);
 const containerBottom=scroller?scroller.getBoundingClientRect().bottom-12:Infinity;
 // Allow for keyboard chrome and a small comfortable tap margin.
 const delta=Math.ceil(rect.bottom-Math.min(bounds.bottom-18,containerBottom));
 if(delta<8)return false;
 return scrollCommentBy(actions,delta,false);
}
function revealPostedComment(card){
 if(!card?.isConnected)return false;
 const restore=()=>{
  if(!card.isConnected)return;
  const bounds=commentViewportBounds();
  const rect=card.getBoundingClientRect();
  // Leave clearance for the site's news ticker and bottom navigation above
  // the Android AdMob banner without shifting a comment already in view.
  const top=bounds.top+70;
  const bottom=bounds.bottom-Math.min(185,Math.max(90,(bounds.bottom-bounds.top)*0.22));
  let dy=0;
  if(rect.top<top)dy=rect.top-top;
  else if(rect.bottom>bottom)dy=rect.bottom-bottom;
  scrollCommentBy(card,dy,true);
 };
 // Let a successful submit blur/close the Android keyboard and complete DOM
 // reflow before making a SMALL, post-only scroll. Nothing happens on failure.
 window.setTimeout(restore,240);
 return true;
}
(function watchCommentKeyboard(){
 const selector='.dd-news-inline-comments form,#ddCaseDiscussionForm,#ddForumReplyCreate';
 let frame=0;
 const update=()=>{
  const active=document.activeElement;
  const form=active?.closest?.(selector);
  if(!form)return;
  if(frame)window.cancelAnimationFrame(frame);
  frame=window.requestAnimationFrame(()=>{frame=0;keepCommentComposerVisible(form)});
 };
 document.addEventListener('focusin',update,true);
 document.addEventListener('input',update,true);
 window.visualViewport?.addEventListener('resize',update);
})();

window.DDCommunityVotes=Object.freeze({mount,mountCommentCard,threadedComments,keepCommentComposerVisible,revealPostedComment});
})();
