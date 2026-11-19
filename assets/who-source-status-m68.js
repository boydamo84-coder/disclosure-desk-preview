/* M68: Who's Who public correspondence summary, read-only from canonical Sources tracker.
 * No user inbox, cookies, account/API data, client caching or inferred updates.
 */
(()=>{'use strict';
const region=document.getElementById('ddWhoOutreachStatus');
if(!region)return;
const e=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node};
const statusText=Object.freeze({
 sent_unacknowledged:'Sent — agency acknowledgement not verified',
 acknowledged:'Acknowledged — decision pending',
 response_received:'Reply received — read limits',
 closed_with_unresolved_questions:'Reply reviewed — questions remain'
});
function linkText(rec){
 const a=e('a','',rec.agency||'Source organisation');
 a.href='/sources#dd-enquiry-'+encodeURIComponent(rec.id);
 return a;
}
function render(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.records)||data.records.length<1||data.records.length>25)throw Error('Invalid source log');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(data.lastUpdated||''))throw Error('Dated record required');
 const items=[],seen=new Set();
 for(const rec of data.records){
  if(!rec||!/^[a-z0-9-]{4,80}$/.test(rec.id||'')||seen.has(rec.id)||
     !statusText[rec.status]||!rec.agency||!rec.title||
     !/^\d{4}-\d{2}-\d{2}$/.test(rec.lastVerified||''))
   throw Error('Invalid enquiry or status in source log');
  seen.add(rec.id);
  const li=e('li','dd-who-outreach-item');li.dataset.enquiryId=rec.id;
  li.append(linkText(rec),document.createTextNode(' — '+statusText[rec.status]));
  li.append(e('span','dd-who-outreach-updated',' · Last documented '+rec.lastVerified));
  items.push(li);
 }
 const label=e('p','muted small',
  'From our existing manually maintained research log (last updated '+data.lastUpdated+'). A reply does not prove formal FOIA acceptance, a disclosed document or permission to republish.');
 const list=e('ul','dd-who-outreach-list');
 list.append(...items);
 region.replaceChildren(label,list);
}
fetch('/data/public-source-verification.json',{cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('Source tracker temporarily unavailable');return r.json()})
 .then(render)
 .catch(err=>{
  region.replaceChildren();
  const p=e('p','muted small','The enquiry status cannot be confirmed from the source log right now. ');
  const link=e('a','','Open the full Source Verification Tracker');
  link.href='/sources#sourceVerification';p.append(link);region.append(p);
  console.warn('M68 source status unavailable',err.message);
 });
})();