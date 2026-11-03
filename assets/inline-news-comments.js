/* Inline news discussions: two-comment preview, expand, post, flag. */
(()=>{'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
let db;
const client=()=>{if(cfg.environment!=='test'||!cfg.url||!cfg.publishableKey||!window.supabase)return null;return db||(db=window.supabase.createClient(cfg.url,cfg.publishableKey));};
const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
const states=new WeakMap();
const drafts=new Map(); // Preserve expansion and unfinished text when news cards are refreshed.
function mount(container){
 if(states.has(container))return;
 const id=container.dataset.newsComments;
 if(!id)return;
 const previous=drafts.get(id)||{expanded:false,draft:''};
 const state={expanded:previous.expanded,items:[],busy:false};
 states.set(container,state);
 const toggle=el('button','Comments ▼');toggle.type='button';toggle.className='outline';toggle.setAttribute('aria-expanded','false');
 const entries=el('div');entries.className='dd-inline-comments-preview';
 const form=el('form');form.hidden=true;
 const body=el('textarea');body.placeholder='Add a comment or source reference…';body.rows=3;body.maxLength=2000;body.minLength=3;body.required=true;body.style.cssText='display:block;width:100%;box-sizing:border-box;margin:8px 0';
 body.value=previous.draft;
 body.addEventListener('input',()=>drafts.set(id,{expanded:state.expanded,draft:body.value}));
 const post=el('button','Post comment');post.type='submit';post.className='outline';
 const message=el('p');message.className='muted small';message.setAttribute('role','status');
 form.append(body,post);container.append(toggle,entries,form,message);
 function render(){
  toggle.textContent='Comments ('+state.items.length+') '+(state.expanded?'▲':'▼');
  toggle.setAttribute('aria-expanded',String(state.expanded));
  form.hidden=!state.expanded;
  entries.replaceChildren();
  const shown=state.expanded?state.items:state.items.slice(-2);
  if(!shown.length){const note=el('p','No comments yet.');note.className='muted small';entries.append(note);}
  for(const item of shown){
   const card=el('div');card.className='card';card.style.cssText='padding:10px;margin:8px 0';
   const header=el('small',(item.publicAlias||'Community member')+' · '+new Date(item.created_at).toLocaleDateString());header.className='muted';
   const text=el('p',item.body);text.style.whiteSpace='pre-wrap';
   const flag=el('button','⚑ Flag');flag.type='button';flag.className='outline';
   if(item.is_mine){flag.disabled=true;flag.title='You cannot flag your own comment';}
   flag.onclick=async()=>{const c=client();if(!c)return;const {data:{user}}=await c.auth.getUser();if(!user||user.is_anonymous){message.textContent='Sign in with a registered account to flag comments.';return}
    const reason=prompt('Flag reason: privacy, abuse, spam, harmful, copyright or other','spam');
    if(!reason)return;const selected=reason.trim().toLowerCase();
    if(!['privacy','abuse','spam','harmful','copyright','other'].includes(selected)){message.textContent='Choose a listed reason.';return}
    const {error}=await c.from('dd_case_comment_flags').insert({comment_id:item.id,reporter_id:user.id,reason:selected});
    const issue=String(error?.message||'');
    message.textContent=!error?'Sent for moderator review.'
      :/own comment/i.test(issue)?'You cannot flag your own comment.'
      :/unique|duplicate/i.test(issue)?'You have already flagged this comment.'
      :/flagging limit/i.test(issue)?'Flagging limit reached. Please try again later.'
      :'Flag could not be submitted. Please try again.';
   };
   card.append(header,text,flag);window.DDCommunityVotes?.mount(card,'comment',item.id);entries.append(card);
  }
 }
 async function refresh(){
  const c=client();if(!c){message.textContent='Comments are not configured.';return}
  const {data,error}=await c.rpc('dd_public_comments',{p_case_id:id,p_limit:100});
  if(!container.isConnected)return;
  if(error){message.textContent='Comments temporarily unavailable.';return}
  const aliases=await window.DDPublicProfiles?.namesFor('comment',data||[])||{};
  if(!container.isConnected)return;
  state.items=(data||[]).map(x=>({...x,publicAlias:aliases[x.id]||null}));render();
 }
 toggle.onclick=()=>{state.expanded=!state.expanded;drafts.set(id,{expanded:state.expanded,draft:body.value});render()};
 form.onsubmit=async ev=>{ev.preventDefault();if(state.busy)return;const c=client();if(!c)return;
   const {data:{user}}=await c.auth.getUser();if(!user||user.is_anonymous){message.textContent='Sign in with a registered account to comment.';return}
   state.busy=true;post.disabled=true;
   const {error}=await c.from('dd_case_comments').insert({case_id:id,author_id:user.id,body:body.value.trim(),status:'approved'});
   if(!error){body.value='';drafts.set(id,{expanded:true,draft:''});message.textContent='Comment posted.';await refresh()}else{
     const issue=String(error.message||'');
     message.textContent=/duplicate comment/i.test(issue)?'You have already posted this comment.'
        :/limit reached/i.test(issue)?'Posting limit reached. Please try again later.'
        :'Unable to post. Please try again.';
   }
   state.busy=false;post.disabled=false;
 };
 render();refresh();
}
const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){observer.unobserve(e.target);mount(e.target)}}},{rootMargin:'350px'});
function scan(){document.querySelectorAll('[data-news-comments]').forEach(n=>{if(!states.has(n))observer.observe(n)})}
const mo=new MutationObserver(()=>scan());
function init(){scan();const root=document.getElementById('newsGrid');if(root)mo.observe(root,{childList:true});mo.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();