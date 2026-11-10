/* Member links publish immediately; five distinct reports hide them for owner review. */
(()=>{'use strict';
let client,identity=0,lastOwner=null,dialog=null,activeReport=null,reportVersion=0;
const db=()=>{const c=window.DD_COMMUNITY_TEST_CONFIG||{};return ['test','production'].includes(c.environment)&&window.supabase
 ?client||(client=window.supabase.createClient(c.url,c.publishableKey)):null};
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const categories=[['documentaries','Documentary'],['movies','Film'],['books','Book'],['podcasts','Podcast episode']];
const changed=detail=>window.dispatchEvent(new CustomEvent('dd-media-catalogue-changed',{detail}));
function publicUrl(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(u.hostname)||/(^|[.])(localhost|local|internal|test)$/i.test(u.hostname))return null;
  u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(k))u.searchParams.delete(k);
  return u.href.length<=1800?u.href:null;
 }catch{return null}
}
async function member(){const c=db();if(!c)throw Error('Service unavailable. Please try again.');const r=await c.auth.getUser();if(r.error||!r.data?.user||r.data.user.is_anonymous)throw Error('Sign in from Profile to continue.');return {c,id:r.data.user.id};}
async function still(id,stamp){const r=await db()?.auth.getUser();return stamp===identity&&r?.data?.user?.id===id;}
function errorText(error){const t=String(error?.message||'');return /already added|duplicate|already suggested/i.test(t)?'This title or link is already listed.':/limit/i.test(t)?'Daily limit reached. Please try again later.':/own suggestion/i.test(t)?'You cannot report your own suggestion.':/already hidden|unavailable or/i.test(t)?'This title is already hidden or unavailable.':/Sign in/.test(t)?t:'Could not complete this action. Please try again.';}
function report(item){
 if(!dialog){
  dialog=node('dialog');dialog.className='dd-media-report-dialog';dialog.setAttribute('aria-labelledby','ddMediaReportTitle');
  const title=node('h2','Report title');title.id='ddMediaReportTitle';const help=node('p','Five reports from different registered members hide a title for owner review. One account counts once.');
  const label=node('label','Reason'),select=node('select');select.className='field';select.setAttribute('aria-label','Report reason');
  for(const [value,text] of [['spam','Spam or duplicate'],['abuse','Abusive content'],['privacy','Private information'],['harassment','Harassment'],['harmful','Harmful content'],['other','Other']]){const o=node('option',text);o.value=value;select.append(o)}label.append(select);
  const message=node('p');message.setAttribute('role','status');const cancel=node('button','Cancel'),send=node('button','Send report');cancel.type=send.type='button';cancel.className='outline';send.className='action';
  cancel.onclick=()=>dialog.close();dialog.append(title,help,label,message,cancel,send);document.body.append(dialog);
  send.onclick=async()=>{
   const target=activeReport,stamp=identity,ticket=reportVersion;if(!target)return;send.disabled=true;message.textContent='Sending…';
   try{const {c,id}=await member();if(stamp!==identity||ticket!==reportVersion)return;const result=await c.rpc('dd_media_report',{p_id:target.id,p_reason:select.value});if(!await still(id,stamp)||ticket!==reportVersion)return;if(result.error)throw result.error;
    if(!result.data||typeof result.data.reported!=='boolean')throw Error('Receipt missing');
    message.textContent=result.data.hidden?'Report recorded. This title is now hidden for owner review.':result.data.already_reported?'You have already reported this title.':'Report recorded. Thank you.';
    changed({});
   }catch(e){if(stamp===identity&&ticket===reportVersion)message.textContent=errorText(e)}finally{if(ticket===reportVersion)send.disabled=false}
  };
  dialog.addEventListener('close',()=>{activeReport=null;reportVersion++});
  dialog._reset=()=>{message.textContent='';select.value='spam';send.disabled=false};
 }
 reportVersion++;activeReport=item;dialog.querySelector('h2').textContent='Report '+item.title;dialog._reset();dialog.showModal();
}
function attachReport(rail,item){const b=node('button','⚑ Report');b.type='button';b.className='outline dd-media-report';b.setAttribute('aria-label','Report '+item.title);b.onclick=()=>report(item);rail.append(b);}
function mount(host){
 if(!host||host.querySelector('.dd-link-submission'))return;
 const details=node('details');details.className='dd-link-submission';details.append(node('summary','＋ Add a link'));
 details.append(node('p','Add a documentary, film, book or podcast. Valid links appear immediately unless the title or link is already listed. Five reports from different members hide an item for review. Your optional note stays private.'));
 const form=node('form');
 function field(label,el){const wrapper=node('label',label);wrapper.append(el);form.append(wrapper);return el}
 const category=field('What is it?',node('select'));category.className='field';
 for(const [value,label] of categories){const o=node('option',label);o.value=value;category.append(o)}
 const link=field('Public link',node('input'));link.type='url';link.required=true;link.maxLength=1800;link.placeholder='https://…';link.className='field';link.autocomplete='url';
 const title=field('Title',node('input'));title.required=true;title.minLength=3;title.maxLength=180;title.className='field';title.placeholder='Documentary, film, book or episode title';
 const extra=node('details'),notes=node('textarea');notes.maxLength=500;notes.rows=3;notes.className='field';notes.setAttribute('aria-label','Private note for the site owner');extra.append(node('summary','Private note (optional)'),notes);form.append(extra);
 const submit=node('button','Add to catalogue');submit.type='submit';submit.className='action';const status=node('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(submit,status);details.append(form);host.append(details);
 let busy=false;
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;const url=publicUrl(link.value.trim()),name=title.value.trim();
  if(!url||name.length<3){status.textContent='Enter a public HTTPS link and a title of at least three characters.';return}
  busy=true;submit.disabled=true;const stamp=identity;
  try{const {c,id}=await member();if(stamp!==identity)return;const result=await c.rpc('dd_media_suggest',{p_category:category.value,p_url:url,p_title:name,p_notes:notes.value.trim()});if(!await still(id,stamp))return;if(result.error)throw result.error;
   if(!/^[a-f0-9-]{36}$/i.test(String(result.data||'')))throw Error('Receipt missing');
   status.textContent='Added to Watch & Read.';status.className='dd-nomination-receipt';const chosen=category.value;form.reset();changed({category:chosen,newest:true});
  }catch(e){if(stamp===identity){status.className='';status.textContent=errorText(e)}}finally{busy=false;submit.disabled=false}
 };
 const admin=node('details');admin.className='dd-link-submission';admin.hidden=true;admin.append(node('summary','Review reported titles'));
 const adminList=node('div'),adminStatus=node('p'),refresh=node('button','Refresh reports');refresh.type='button';refresh.className='outline';adminStatus.setAttribute('role','status');admin.append(refresh,adminStatus,adminList);host.append(admin);
 async function loadQueue(){
  const stamp=identity;adminStatus.textContent='Loading…';try{const {c,id}=await member();const result=await c.rpc('dd_media_review_queue');if(!await still(id,stamp))return;adminList.replaceChildren();if(result.error)throw result.error;
   const rows=Array.isArray(result.data)?result.data:[];adminStatus.textContent=rows.length?rows.length+' hidden titles awaiting review.':'No reported titles awaiting review.';
   for(const row of rows){const card=node('article');card.className='card';card.style.padding='14px';card.append(node('strong',row.title),node('p',row.category+' · '+row.report_count+' reports'));
    const url=publicUrl(row.url);if(url){const a=node('a','Open link ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer nofollow ugc';card.append(a)}
    for(const [value,label] of [['restore','Restore title'],['remove','Remove title']]){const b=node('button',label);b.type='button';b.className='outline';b.onclick=async()=>{b.disabled=true;try{if(!await still(id,stamp))return;const answer=await c.rpc('dd_media_review',{p_id:row.id,p_decision:value});if(!await still(id,stamp))return;if(answer.error||answer.data!==true)throw answer.error||Error('Review not confirmed');changed({});await loadQueue()}catch(e){if(stamp===identity){adminStatus.textContent=errorText(e);b.disabled=false}}};card.append(b)}adminList.append(card);
   }
  }catch(e){if(stamp===identity){adminList.replaceChildren();adminStatus.textContent=errorText(e)}}
 }
 refresh.onclick=()=>void loadQueue();admin.addEventListener('toggle',()=>{if(admin.open)void loadQueue()});
 async function syncOwner(){const c=db();if(!c)return;const stamp=identity;const auth=await c.auth.getUser();if(stamp!==identity)return;lastOwner=auth?.data?.user?.id||null;if(!lastOwner||auth.data.user.is_anonymous)return;const result=await c.rpc('dd_discussions_is_owner');if(stamp===identity)admin.hidden=!!result.error||result.data!==true;}
 db()?.auth.onAuthStateChange((event,session)=>{const next=session?.user?.id||null;if(event==='TOKEN_REFRESHED'||next===lastOwner)return;if(lastOwner&&next!==lastOwner)form.reset();lastOwner=next;identity++;status.textContent='';admin.hidden=true;admin.open=false;adminList.replaceChildren();if(dialog?.open)dialog.close();Promise.resolve().then(syncOwner)});
 void syncOwner();
}
window.DDMediaSubmissions=Object.freeze({mount,publicUrl,attachReport});
})();
