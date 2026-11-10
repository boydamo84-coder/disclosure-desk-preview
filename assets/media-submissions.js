/* Member nominations are private editorial submissions. No automatic publishing. */
(()=>{'use strict';
let client;
const db=()=>{const c=window.DD_COMMUNITY_TEST_CONFIG||{};return ['test','production'].includes(c.environment)&&window.supabase
 ?client||(client=window.supabase.createClient(c.url,c.publishableKey)):null};
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const categories=[['documentaries','Documentary'],['movies','Film'],['books','Book'],['podcasts','Podcast episode']];
function publicUrl(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(u.hostname))return null;
  u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(k))u.searchParams.delete(k);
  return u.href.length<=1800?u.href:null;
 }catch{return null}
}
function mount(host){
 if(!host||host.querySelector('.dd-link-submission'))return;
 const details=node('details');details.className='dd-link-submission';
 details.append(node('summary','＋ Suggest a link'));
 details.append(node('p','Found something worth watching or reading? Send a link for editorial review. Suggestions stay private until reviewed; they are not posted automatically.'));
 const form=node('form'),fields={};
 function field(label,el,name){const wrapper=node('label',label);wrapper.append(el);form.append(wrapper);fields[name]=el;return el}
 const category=field('What is it?',node('select'),'category');category.className='field';
 for(const [value,label] of categories){const o=node('option',label);o.value=value;category.append(o)}
 const link=field('Link',node('input'),'url');link.type='url';link.required=true;link.maxLength=1800;link.placeholder='https://…';link.className='field';link.autocomplete='url';
 const title=field('Title',node('input'),'title');title.required=true;title.minLength=3;title.maxLength=180;title.className='field';title.placeholder='Documentary, film, book or episode title';
 const extra=node('details'),extraTitle=node('summary','Add a note (optional)'),notes=node('textarea');notes.maxLength=500;notes.rows=3;notes.className='field';notes.setAttribute('aria-label','Why should we feature it?');extra.append(extraTitle,notes);form.append(extra);
 const submit=node('button','Send suggestion');submit.type='submit';submit.className='action';
 const status=node('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(submit,status);details.append(form);host.append(details);
 let busy=false,identity=0,lastOwner=null;
 function feedback(text,state){status.textContent=text;status.dataset.state=state||'';status.className=state==='success'?'dd-nomination-receipt':''}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const url=publicUrl(link.value.trim()),name=title.value.trim();
  if(!url||name.length<3){feedback('Enter a public HTTPS link and a title of at least three characters.','error');return}
  const c=db();if(!c){feedback('Suggestions are unavailable right now. Your link is still here.','error');return}
  busy=true;submit.disabled=true;const stamp=identity;
  try{
   const {data,error}=await c.auth.getUser();
   if(error||!data?.user||data.user.is_anonymous){feedback('Sign in from Profile, then return here to send your suggestion.','error');return}
   const owner=data.user.id;
   if(stamp!==identity)throw Error('Your sign-in changed. Please try again.');
   const result=await c.rpc('dd_media_suggest',{p_category:category.value,p_url:url,p_title:name,p_notes:notes.value.trim()});
   const now=await c.auth.getUser();
   if(stamp!==identity||now?.data?.user?.id!==owner)return;
   if(result.error)throw result.error;
   if(!/^[a-f0-9-]{36}$/i.test(String(result.data||'')))throw Error('The server did not confirm receipt. Keep your link and try again later.');
   feedback('Suggestion received for editorial review. Thank you!','success');form.reset();
  }catch(error){
   if(stamp!==identity)return;
   const message=String(error?.message||'');
   feedback(/duplicate|already suggested/i.test(message)?'You have already suggested this link.':/limit/i.test(message)?'You can send up to 10 suggestions in 24 hours. Please try again later.':/schema cache|could not find.*function|does not exist/i.test(message)?'Link submissions are being prepared. Keep your link and try again after the next update.':'Could not send your suggestion. Your link is still here; please try again.','error');
  }finally{busy=false;submit.disabled=false}
 });
 const admin=node('details');admin.className='dd-link-submission';admin.hidden=true;
 admin.append(node('summary','Review link suggestions'));
 const adminList=node('div'),adminStatus=node('p'),refresh=node('button','Refresh suggestions');refresh.type='button';refresh.className='outline';adminStatus.setAttribute('role','status');admin.append(refresh,adminStatus,adminList);host.append(admin);
 async function loadQueue(){
  const c=db();if(!c)return;const stamp=identity;adminStatus.textContent='Loading…';
  const result=await c.rpc('dd_media_suggestion_queue');
  if(stamp!==identity)return;adminList.replaceChildren();
  if(result.error){adminStatus.textContent='Review queue unavailable.';return}
  const rows=Array.isArray(result.data)?result.data:[];adminStatus.textContent=rows.length?rows.length+' awaiting review.':'No suggestions awaiting review.';
  for(const row of rows){
   const card=node('article');card.className='card';card.style.padding='14px';card.append(node('strong',row.title),node('p',row.category));
   const safe=publicUrl(row.url);if(safe){const a=node('a','Open suggested link ↗');a.href=safe;a.target='_blank';a.rel='noopener noreferrer nofollow ugc';card.append(a)}
   if(row.notes)card.append(node('p',row.notes));
   for(const [value,label] of [['reviewed','Mark reviewed'],['declined','Not selected']]){
    const button=node('button',label);button.type='button';button.className='outline';
    button.onclick=async()=>{button.disabled=true;const result=await c.rpc('dd_media_suggestion_review',{p_id:row.id,p_status:value});if(stamp!==identity)return;if(result.error){adminStatus.textContent='Could not update this suggestion.';button.disabled=false}else void loadQueue()};card.append(button);
   }adminList.append(card);
  }
 }
 refresh.onclick=()=>void loadQueue();admin.addEventListener('toggle',()=>{if(admin.open)void loadQueue()});
 async function syncOwner(){
  const c=db();if(!c)return;const stamp=identity;
  const auth=await c.auth.getUser();if(stamp!==identity)return;lastOwner=auth?.data?.user?.id||null;
  if(!auth?.data?.user||auth.data.user.is_anonymous)return;
  const result=await c.rpc('dd_discussions_is_owner');if(stamp!==identity)return;admin.hidden=result.error||result.data!==true;
 }
 db()?.auth.onAuthStateChange((event,session)=>{const next=session?.user?.id||null;if(event==='TOKEN_REFRESHED'||next===lastOwner)return;if(lastOwner&&next!==lastOwner)form.reset();lastOwner=next;identity++;feedback('');admin.hidden=true;admin.open=false;adminList.replaceChildren();Promise.resolve().then(syncOwner)});
 void syncOwner();
}
window.DDMediaSubmissions=Object.freeze({mount,publicUrl});
})();
