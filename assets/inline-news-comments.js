/* Shared card discussions: News previews; Archive, Watch & Read and Videos fold out on demand. */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
let db;
const client=()=>{if(!['test','production'].includes(cfg.environment)||!cfg.url||!cfg.publishableKey||!window.supabase)return null;return db||(db=window.supabase.createClient(cfg.url,cfg.publishableKey));};
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
const states=new WeakMap();
const drafts=new Map(); // Preserve expansion and unfinished text when news cards are refreshed.
function mount(container){
 if(states.has(container))return;
 const id=container.dataset.newsComments;
 if(!id)return;
 const previous=drafts.get(id)||{expanded:false,draft:''};
 const collapsible=container.dataset.commentsCollapsed==='true';
 const discussionTitle=String(container.dataset.commentsTitle||container.closest('article')?.querySelector('h3,.news-headline-link')?.textContent||'Community discussion').trim().slice(0,100);
 const state={expanded:previous.expanded,items:[],busy:false,loaded:false,replyTo:null};
 states.set(container,state);
 const toggle=el('button','💬 0');toggle.type='button';toggle.className='outline';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Read or add comments');toggle.title='Comments';
 const entries=el('div');entries.className='dd-inline-comments-preview';
 const form=el('form');form.hidden=true;
 const body=el('textarea');body.placeholder='Add a comment or source reference…';body.rows=collapsible?1:3;body.maxLength=2000;body.minLength=3;body.required=true;body.style.cssText='display:block;width:100%;box-sizing:border-box;margin:8px 0';
 body.value=previous.draft;
 const fitBody=()=>{if(collapsible){body.style.height='auto';body.style.height=Math.min(94,Math.max(44,body.scrollHeight))+'px'}};
 body.addEventListener('input',()=>{drafts.set(id,{expanded:state.expanded,draft:body.value});fitBody()});
 const post=el('button','Post comment');post.type='submit';post.className='outline';
 const message=el('p');message.className='muted small';message.setAttribute('role','status');
 const replyContext=el('p');replyContext.className='dd-comment-reply-context muted small';replyContext.hidden=true;
 form.append(replyContext,body,post);
 // Mount Comments in the same full-width action rail as Board / Compare / Share.
 const rail=container.closest('article')?.querySelector('.dd-news-main-actions, .dd-media-actions, .dd-archive-action-rail, .clip-utility-actions');
 if(rail){const star=rail.querySelector('.dd-action-board');if(star)rail.insertBefore(toggle,star);else rail.append(toggle)}else container.append(toggle);
 toggle.classList.add('dd-inline-comments-toggle');toggle.setAttribute('aria-controls','dd-news-comments-'+id.replace(/[^a-z0-9-]/gi,'-'));container.id=toggle.getAttribute('aria-controls');
 container.append(form,entries,message);
 function render(){
  toggle.textContent='💬 '+(state.loaded?state.items.length:collapsible?'':'…')+(collapsible?(state.expanded?' ▴':' ▾'):'');
  if(collapsible){container.hidden=!state.expanded;toggle.classList.add('dd-comments-dropdown')}
  toggle.setAttribute('aria-label',(state.expanded?'Hide':'Read or add')+' comments'+(state.loaded?' ('+state.items.length+')':''));
  // Never lose a typed draft when refreshing the visible comment list.
  if(entries.contains(form))container.insertBefore(form,entries);
  toggle.setAttribute('aria-expanded',String(state.expanded));
  form.hidden=!state.expanded;
  if(state.expanded)fitBody();
  entries.replaceChildren();
  const ordered=window.DDCommunityVotes?.threadedComments?.(state.items)||state.items;
  const shown=state.expanded?ordered:collapsible?[]:ordered.slice(-2);
  replyContext.hidden=!state.replyTo;
  replyContext.textContent=state.replyTo?'Replying to '+state.replyTo.alias+' · this will appear beneath that comment.':'';
  post.textContent=state.replyTo?'Post reply':'Post comment';
  if(!shown.length&&(!collapsible||state.expanded)){const note=el('p','No comments yet.');note.className='muted small';entries.append(note);}
  for(const item of shown){
   const card=el('div');card.className='card';card.style.cssText='margin:8px 0';card.dataset.ddNewsCommentId=String(item.id||'');
   if(item.replyDepth>0)card.classList.add('dd-comment-nested');
   const alias=item.publicAlias||'Community member';
   const header=el('div');header.className='muted small';header.style.cssText='display:flex;align-items:center;min-width:0';
   const avatar=el('span',item.publicAlias?alias.charAt(0).toUpperCase():'?');
   avatar.className='dd-forum-avatar';avatar.setAttribute('aria-hidden','true');
   const byline=el('span',alias+' · '+new Date(item.created_at).toLocaleDateString());
   header.append(avatar,byline);
   if(item.replyParentName){const context=el('small','↳ to '+item.replyParentName);context.className='dd-comment-parent-label';header.append(context)}
   if(item.publicAlias)window.DDMemberAvatars?.decorate?.(avatar,item.publicAlias);
   const text=el('p',item.body);text.style.whiteSpace='pre-wrap';
   const flag=el('button','⚑ Flag');flag.type='button';flag.className='outline';
   if(item.is_mine){flag.disabled=true;flag.title='You cannot flag your own comment';}
   flag.onclick=async()=>{const c=client();if(!c)return;const {data:{user}}=await c.auth.getUser();if(!user||user.is_anonymous){message.textContent='Sign in with a registered account to flag comments.';return}
    const reason=prompt('Flag reason: privacy, abuse, spam, harmful, copyright or other','spam');
    if(!reason)return;const selected=reason.trim().toLowerCase();
    if(!['privacy','abuse','spam','harmful','copyright','other'].includes(selected)){message.textContent='Choose a listed reason.';return}
    const {error}=await c.from('dd_case_comment_flags').insert({comment_id:item.id,reporter_id:user.id,reason:selected});
    const issue=String(error?.message||'');
    message.textContent=!error?'Flag recorded. Five distinct account flags will hide this comment for review.'
      :/own comment/i.test(issue)?'You cannot flag your own comment.'
      :/unique|duplicate/i.test(issue)?'You have already flagged this comment.'
      :/flagging limit/i.test(issue)?'Flagging limit reached. Please try again later.'
      :'Flag could not be submitted. Please try again.';
    if(!error)void refresh();
   };
   if(!window.DDCommunityVotes?.mountCommentCard?.(card,header,text,flag,item.id,(parentId)=>{
    const target=state.items.find(x=>x.id===parentId);if(!target)return;
    state.replyTo={id:target.id,alias:target.publicAlias||'this commenter'};
    state.expanded=true;drafts.set(id,{expanded:true,draft:body.value});render();
    body.focus({preventScroll:true});
   },{discussionKey:id,title:discussionTitle})){
    card.append(header,text,flag);window.DDCommunityVotes?.mount(card,'comment',item.id);
   }
   entries.append(card);
  }
  window.DDRefreshBoardStars?.();
  if(state.replyTo){
   const target=entries.querySelector('[data-dd-news-comment-id="'+state.replyTo.id+'"]');
   if(target)target.after(form);
  }else if(form.parentElement!==container)container.insertBefore(form,entries);
 }
 async function refresh(){
  const c=client();if(!c){message.textContent='Comments are not configured.';return}
  const {data,error}=await c.rpc('dd_public_comments',{p_case_id:id,p_limit:100});
  if(!container.isConnected)return;
  if(error){message.textContent='Comments temporarily unavailable.';return}
  const aliases=await window.DDPublicProfiles?.namesFor('comment',data||[])||{};
  if(!container.isConnected)return;
  state.loaded=true;state.items=(data||[]).map(x=>({...x,publicAlias:aliases[x.id]||null}));render();
 }
 toggle.onclick=()=>{
  if(collapsible){state.expanded=!state.expanded;if(!state.expanded)state.replyTo=null;}
  else if(state.replyTo){state.replyTo=null;state.expanded=true;}
  else state.expanded=!state.expanded;
  drafts.set(id,{expanded:state.expanded,draft:body.value});render();
  if(state.expanded){body.focus({preventScroll:true});if(!state.loaded)void refresh()}
 };
 form.onsubmit=async ev=>{ev.preventDefault();if(state.busy)return;const c=client();if(!c)return;
   const {data:{user}}=await c.auth.getUser();if(!user||user.is_anonymous){message.textContent='Sign in with a registered account to comment.';return}
   state.busy=true;post.disabled=true;
   const replyingTo=state.replyTo;
   const {error}=await c.from('dd_case_comments').insert({case_id:id,author_id:user.id,parent_id:replyingTo?.id||null,body:body.value.trim(),status:'approved'});
   if(!error){body.value='';state.replyTo=null;drafts.set(id,{expanded:true,draft:''});message.textContent=replyingTo?'Reply posted.':'Comment posted.';await refresh()}else{
     const issue=String(error.message||'');
     message.textContent=/duplicate comment/i.test(issue)?'You have already posted this comment.'
        :/limit reached/i.test(issue)?'Posting limit reached. Please try again later.'
        :'Unable to post. Please try again.';
   }
   state.busy=false;post.disabled=false;
 };
 render();
 if(state.expanded)void refresh();
 else if(!collapsible&&typeof IntersectionObserver==='function'){
  const visible=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){visible.disconnect();if(!state.loaded)void refresh()}},{rootMargin:'250px'});
  visible.observe(container);
 }else if(!collapsible)void refresh();
}
function scan(){document.querySelectorAll('[data-news-comments]').forEach(n=>{if(!states.has(n))mount(n)})}
const mo=new MutationObserver(scan);
function init(){
 scan();
 const roots=['newsGrid','ddWatchReadMount','archiveList','clipsFeed'].map(id=>document.getElementById(id)).filter(Boolean);
 for(const root of roots.length?roots:[document.body])mo.observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();