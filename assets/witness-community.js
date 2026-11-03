/* Disclosure Desk public witness reports.
 * Private drafts remain on-device and NEVER publish automatically.
 * Public submission requires a registered account + explicit opt-in.
 * Server geocodes the city, enforces rolling 24-hour limits, rounds coordinates.
 * All report reads use the limited approved-public view (no author_id).
 */
(()=>{
'use strict';
const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
const feature=window.DD_COMMUNITY_FEATURES||{};
const enabled=feature.witnessPublic===true&&['test','production'].includes(cfg.environment);
const make=(tag,cls,content)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=content;return x;};
const reportKey=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
let db=null,publicRows=[],busy=false,refreshTimer=null,detail=null;
const client=()=>db||(db=window.supabase?.createClient(cfg.url,cfg.publishableKey,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
}));
function note(text,bad=false){
 const target=document.getElementById('ddWitnessPublicStatus')||document.getElementById('formStatus');
 if(!target)return;
 target.textContent=text;target.dataset.error=bad?'yes':'no';
}
function cases(){
 return publicRows.map(x=>({
  id:'witness:'+x.id,
  witnessId:x.id,
  isWitness:true,
  title:'Witness report · '+x.category,
  category:'Witness Reports',
  city:x.city+', '+x.country,
  lat:Number(x.lat),lon:Number(x.lon),
  desc:String(x.story||'').slice(0,260),
  year:new Date(x.event_date+'T12:00:00Z').getUTCFullYear(),
  eventDate:x.event_date,
  reportedAt:x.created_at?.slice(0,10)||x.event_date,
  locationPrecision:'approximate town or city',
  documents:[],quotes:[]
 }));
}
function clean(raw){
 if(!raw||!reportKey.test(String(raw.id||'')))return null;
 const date=String(raw.event_date||'');
 const lat=Number(raw.lat),lon=Number(raw.lon);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)
  ||!Number.isFinite(lat)||!Number.isFinite(lon)
  ||Math.abs(lat)>90||Math.abs(lon)>180
  ||!Number.isFinite(new Date(date+'T12:00:00Z').getTime()))return null;
 return {id:raw.id,city:String(raw.city||'').slice(0,80),
  country:String(raw.country||'').slice(0,80),
  category:String(raw.category||'').slice(0,80),
  event_date:date,approximate_time:String(raw.approximate_time||''),
  story:String(raw.story||'').slice(0,3500),anonymous:raw.anonymous!==false,
  created_at:String(raw.created_at||''),lat,lon};
}
async function load(){
 if(!enabled||!client())return;
 const {data,error}=await client().from('dd_public_witness_reports')
  .select('id,category,event_date,approximate_time,city,country,story,anonymous,lat,lon,created_at')
  .order('created_at',{ascending:false}).limit(500);
 if(error){
  note('Public witness reports are not available yet. Private draft saving still works.',true);
  return;
 }
 publicRows=(data||[]).map(clean).filter(Boolean);
 const count=document.getElementById('ddWitnessPublicCount');
 if(count)count.textContent=publicRows.length+' published report'+(publicRows.length===1?'':'s')+' in the latest map sample';
 window.ddWitnessRefreshMap?.();
}
function mountVotes(){
 if(!window.DDCommunityVotes)return;
 document.querySelectorAll('[data-dd-witness-vote]').forEach(host=>{
  window.DDCommunityVotes.mount(host,'witness',host.dataset.ddWitnessVote);
 });
}
function hideDetail(){
 if(detail){detail.remove();detail=null;document.body.style.overflow='';}
}
function open(id,{report=false}={}){
 if(!reportKey.test(String(id||'')))return;
 const item=publicRows.find(x=>x.id===id);
 if(!item)return;
 hideDetail();
 detail=make('section','dd-witness-report-dialog');
 detail.setAttribute('role','dialog');
 detail.setAttribute('aria-modal','true');
 detail.setAttribute('aria-label','Public witness report');
 const card=make('article','card dd-witness-report');
 const inner=make('div','card-body');
 const close=make('button','outline','✕ Close');
 close.type='button';close.addEventListener('click',hideDetail);
 inner.append(close,make('h2','',item.category));
 inner.append(make('p','muted small',item.city+', '+item.country+' · '+item.event_date));
 inner.append(make('p','dd-witness-warning','Unverified personal account; location shown is an approximate town or city.'));
 const body=make('p');body.style.whiteSpace='pre-wrap';body.textContent=item.story;inner.append(body);
 const votes=make('div');votes.dataset.ddWitnessVote=item.id;inner.append(votes);
 const flagBox=make('div','dd-witness-report-actions');
 const flag=make('button','outline','⚑ Flag this report');
 flag.type='button';
 const reasons=make('select','field');
 reasons.setAttribute('aria-label','Reason for reporting this witness submission');
 [['','Select report reason'],['spam','Spam / fabrication'],['abuse','Abusive content'],['privacy','Private or identifying details'],['harassment','Harassment'],['other','Other rule violation']].forEach(([v,l])=>{const option=make('option','',l);option.value=v;reasons.append(option)});
 const submit=make('button','outline','Submit flag');
 submit.type='button';
 const status=make('p','muted small');status.setAttribute('role','status');
 const reasonBox=make('div');reasonBox.hidden=!report;
 reasonBox.append(reasons,submit,status);
 flag.onclick=()=>{reasonBox.hidden=false;reasons.focus()};
 submit.onclick=async()=>{
  if(!enabled||!client())return;
  const {data:{user},error}=await client().auth.getUser();
  if(error||!user||user.is_anonymous){
   status.textContent='Please sign in under Boards → My Account before flagging.';return;
  }
  if(!reasons.value){status.textContent='Choose a reason first.';return;}
  submit.disabled=true;status.textContent='Submitting your report…';
  try{
   const {error:flagError}=await client().from('dd_witness_report_flags')
    .insert({report_id:item.id,reporter_id:user.id,reason:reasons.value});
   if(flagError)throw flagError;
   status.textContent='Report flagged. Thank you for helping moderate the community.';
   submit.disabled=true;
   // After the fifth unique flag, server hides the report from map/list.
   await load();
   if(!publicRows.some(x=>x.id===item.id)){
    status.textContent='This report is now hidden pending moderation.';
   }
  }catch(e){
   status.textContent='Flag was not accepted. You may already have flagged this report.';
   submit.disabled=false;
  }
 };
 flagBox.append(flag);inner.append(flagBox,reasonBox);
 const rules=make('a','outline','Community Rules');
 rules.href='/community-rules.html#flagging';inner.append(rules);
 card.append(inner);detail.append(card);document.body.append(detail);
 detail.addEventListener('click',e=>{if(e.target===detail)hideDetail()});
 document.body.style.overflow='hidden';
 mountVotes();close.focus();
 if(report){flag.onclick()}
}
// Supabase functions.invoke wraps non-2xx responses in an HTTP error. Read the
// safe server-supplied message (409 duplicate, 429 quota, 422 invalid location)
// instead of exposing a generic "non-2xx" error to the researcher.
async function submissionError(error){
 try{
  const response=error?.context;
  if(response&&typeof response.clone==='function'){
   const body=await response.clone().json();
   if(body&&typeof body.error==='string')return body.error;
  }
 }catch(_){}
 return String(error?.message||'Please try again.');
}
async function publish(){
 if(!enabled){note('Public witness submissions are not available yet. Your private draft is safe.',true);return;}
 if(busy)return;
 const form=document.getElementById('witnessForm');
 const consent=document.getElementById('witnessPublicConsent');
 if(!form?.reportValidity()||!consent?.checked){
  note('Review the report, tick the public-sharing agreement and confirm a town and country.',true);return;
 }
 const country=document.getElementById('reportCountry')?.value.trim()||'';
 if(country.length<2||country.length>80){
  note('Enter the broad country or region for your town. No postcode or address.',true);return;
 }
 const c=client();
 if(!c){note('Publishing service unavailable. Save as a private draft instead.',true);return}
 const {data:{user},error:loginError}=await c.auth.getUser();
 if(loginError||!user||user.is_anonymous){
  note('Sign in with a registered Disclosure Desk account under Boards → My Account before publishing.',true);
  return;
 }
 const body={
  category:document.getElementById('reportType').value,
  event_date:document.getElementById('reportDate').value,
  approximate_time:document.getElementById('reportTime').value,
  city:document.getElementById('reportCity').value.trim(),
  country,
  story:document.getElementById('reportStory').value.trim(),
  anonymous:document.getElementById('anonymous').checked,
  publicConsent:true
 };
 // Browser never sends latitude or longitude, even when the user knows a precise address.
 busy=true;
 const button=document.getElementById('ddWitnessPublish');
 button.disabled=true;note('Verifying account and broad town location…');
 try{
  const {data,error}=await c.functions.invoke('dd-witness-submit',{body});
  if(error)throw error;
  if(!data?.ok||!reportKey.test(String(data.id||'')))throw Error(data?.error||'Unable to confirm public submission.');
  note('Published to the community map. Your approximate location is '+data.city+', '+data.country+'.');
  form.reset();
  document.getElementById('anonymous').checked=true;
  await load();
  document.getElementById('mapViewMode').value='witness';
  document.getElementById('mapViewMode').dispatchEvent(new Event('change',{bubbles:true}));
 }catch(error){
  const msg=await submissionError(error);
  // Do not clear or overwrite the report on error. The form remains editable.
  note('Not published. Your form has not been cleared. '+String(msg).slice(0,190),true);
 }finally{button.disabled=false;busy=false}
}
function init(){
 const form=document.getElementById('witnessForm'),btn=document.getElementById('ddWitnessPublish');
 if(!form||!btn)return;
 const count=make('p','muted small');count.id='ddWitnessPublicCount';
 count.textContent='Checking published witness reports…';
 const countHost=document.getElementById('myDrafts')?.parentElement;
 countHost?.prepend(count);
 const status=make('p','muted small');status.id='ddWitnessPublicStatus';
 status.setAttribute('role','status');
 btn.parentElement?.append(status);
 if(!enabled){btn.hidden=true;count.textContent='Public submission is not yet enabled. Private drafts remain on this device.';return}
 btn.addEventListener('click',()=>void publish());
 document.addEventListener('click',e=>{
  const opener=e.target.closest('[data-dd-witness-open]');
  if(opener){e.preventDefault();open(opener.dataset.ddWitnessOpen);return}
  const flag=e.target.closest('[data-dd-witness-flag]');
  if(flag){e.preventDefault();open(flag.dataset.ddWitnessFlag,{report:true})}
 });
 void load();
 refreshTimer=setInterval(()=>{if(document.visibilityState==='visible')void load()},3*60*1000);
 window.addEventListener('pagehide',()=>{if(refreshTimer)clearInterval(refreshTimer);hideDetail()},{once:true});
}
window.DDWitnessReports=Object.freeze({cases,open,mountVotes,refresh:load});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
