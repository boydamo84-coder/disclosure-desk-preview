/* M68: source-enquiry digest. Reuses the ONE manually verified public tracker.
 * No mailbox polling or contact-person details. Never infer responses.
 */
(()=>{'use strict';
const slots=[...document.querySelectorAll('[data-dd-outreach-digest]')];
if(!slots.length)return;
const make=(tag,cls,text)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(text!==undefined)n.textContent=String(text);return n;
};
const labels={
 sent_unacknowledged:'Sent · acknowledgement unverified',
 acknowledged:'Acknowledged',
 records_released:'Referral records released',
 response_received:'Reply received',
 closed_with_unresolved_questions:'Response reviewed · unresolved'
};
function valid(x){
 return x&&typeof x.id==='string'&&/^[a-z0-9-]{4,80}$/.test(x.id)&&
 typeof x.agency==='string'&&x.agency.length<=160&&
 typeof x.title==='string'&&x.title.length<=180&&
 Object.prototype.hasOwnProperty.call(labels,x.status)&&
 /^\d{4}-\d{2}-\d{2}$/.test(x.lastVerified||'');
}
function render(slot,data){
 const label=make('p','dd-outreach-digest-note',
  'Research correspondence, not government endorsement or proof of an unexplained phenomenon. The statuses below are manually documented, not live agency tracking.');
 const grid=make('div','dd-outreach-digest-grid');
 for(const item of data.records){
  const article=make('article','dd-outreach-digest-card');
  article.dataset.outreachId=item.id;
  article.append(make('strong','',item.agency));
  article.append(make('p','dd-outreach-digest-topic',item.title));
  const badge=make('span','dd-outreach-digest-state',labels[item.status]);
  badge.dataset.status=item.status;article.append(badge);
  const date=make('p','dd-outreach-digest-date','Last reviewed: '+item.lastVerified);
  article.append(date);
  const link=make('a','','Read the enquiry and source trail');
  link.href='/sources#dd-source-enquiry-'+encodeURIComponent(item.id);
  article.append(link);grid.append(article);
 }
 const footer=make('p','dd-outreach-digest-note',
  'Public log updated '+data.lastUpdated+'; a reply does not mean records were released or permission granted.');
 const all=make('a','','Open the complete Source Verification Tracker');
 all.href='/sources#sourceVerification';
 footer.append(document.createTextNode(' · '),all);
 slot.replaceChildren(label,grid,footer);
}
fetch('/data/public-source-verification.json',{cache:'no-store'}).then(r=>{
 if(!r.ok)throw Error('Tracker unavailable');
 return r.json();
}).then(data=>{
 if(data.schemaVersion!==1||!Array.isArray(data.records)||data.records.length<1||
 data.records.length>25||!data.records.every(valid)||!data.disclosure?.ownerApprovalRequiredForLiveDeploy||
 !/^\d{4}-\d{2}-\d{2}$/.test(data.lastUpdated||''))throw Error('Unverified tracker schema');
 slots.forEach(slot=>render(slot,data));
}).catch(()=>{
 slots.forEach(slot=>{
  const error=make('p','dd-outreach-digest-note',
   'The enquiry status feed is temporarily unavailable. No response status can be confirmed here.');
  const link=make('a','','Open the original Source Verification Tracker');
  link.href='/sources#sourceVerification';
  slot.replaceChildren(error,link);
 });
});
})();