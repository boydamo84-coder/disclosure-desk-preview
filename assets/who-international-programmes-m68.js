/* M68: reuse the existing source-linked international UAP programme index
 * inside Who's Who. Organisations are NOT people, evidence votes, or claims
 * of extraterrestrial proof. No member account/network except the site JSON.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const root=$('ddWhoInternationalProgrammes'),items=$('ddWhoProgrammeCards'),
 search=$('ddWhoProgrammeSearch'),filter=$('ddWhoProgrammeType'),
 progress=$('ddWhoProgrammeStatus'),leadBox=$('ddWhoProgrammeLeads'),
 leadCount=$('ddWhoLeadCount');
if(!root||!items||!search||!filter||!progress||!leadBox||!leadCount)return;
const make=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=String(txt);return node};
const safeUrl=raw=>{try{const u=new URL(String(raw));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const safeId=raw=>/^[a-z0-9][a-z0-9-]{1,85}$/.test(String(raw||''))?raw:null;
const kindLabel=kind=>({
 dedicated_unit:'Dedicated UAP office',historical_office:'Historical UFO unit',
 reporting_process:'Reporting process',government_archive:'Government archive',
 government_review:'Government review',government_case_record:'Official case record',
 historical_research:'Institutional / research context'})[kind]||'Documented institutional record';
let records=[],pending=[];
function sourceLink(parent,item){
 const href=safeUrl(item?.url);if(!href)return;
 const a=make('a','dd-who-programme-link',item.title||'Original institutional source');
 a.href=href;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);
}
function card(data){
 const outer=make('article','dd-who-programme-card');
 outer.dataset.programmeId=data.id||'';
 outer.dataset.programmeType=data.category||'';
 const h=make('h3','',String(data.flag||'🌍')+' '+String(data.name||'Programme'));
 outer.append(h);
 outer.append(make('p','dd-who-programme-meta',
  [data.country,kindLabel(data.category),data.period].filter(Boolean).join(' · ')));
 const details=make('details','dd-who-programme-detail');
 details.append(make('summary','','Read institutional background and original sources'));
 details.append(make('p','',data.description||'Original records and limitations should be checked.'));
 if(data.id==='vatican')details.append(make('p','dd-who-programme-caution',
  'Vatican astronomy and archives are documented research contexts, not a verified government UAP investigation programme. Allegations of secret craft records remain disputed.'));
 if(data.sources?.length){
  const label=make('h4','','Original sources');details.append(label);
  const refs=make('ul','','');
  for(const s of data.sources){
   if(!safeUrl(s?.url))continue;
   const li=make('li','','');sourceLink(li,s);
   if(s.scope)li.append(make('p','dd-who-programme-meta',s.scope));
   refs.append(li);
  }
  details.append(refs);
 }
 if(data.people?.length){
  const people=make('p','dd-who-programme-meta','Related people: ');
  for(const person of data.people){
   const id=safeId(person?.id);if(!id)continue;
   const a=make('a','',id.replaceAll('-',' '));a.href='/who-is-who.html?person='+encodeURIComponent(id);
   people.append(a,document.createTextNode(' · '));
  }
  details.append(people);
 }
 if(data.featuredCases?.length){
  const list=make('ul','','');
  for(const x of data.featuredCases){
   const href=safeUrl(x?.sourceUrl);if(!href)continue;
   const li=make('li','','');
   const a=make('a','',x.title||'Official case record');a.href=href;a.target='_blank';a.rel='noopener noreferrer';
   li.append(a);list.append(li);
  }
  if(list.childElementCount){details.append(make('h4','','Selected institutional files'));details.append(list)}
 }
 outer.append(details);
 return outer;
}
function render(){
 const query=search.value.trim().toLocaleLowerCase();
 const category=filter.value;
 const chosen=records.filter(x=>(category==='all'||x.category===category)&&
  [x.name,x.country,x.kind,x.description,x.period].join(' ').toLocaleLowerCase().includes(query));
 items.replaceChildren(...chosen.map(card));
 progress.textContent=chosen.length+' of '+records.length+
  ' sourced programme, archive and institutional entries displayed. These are not all dedicated UFO offices.';
 if(!chosen.length)items.append(make('p','dd-who-programme-meta','No records match. Try another country or organisation.'));
}
function leadCard(entry){
 const li=make('li','','');
 const name=make('strong','',entry.country||'Unattributed jurisdiction');li.append(name);
 li.append(make('p','dd-who-programme-meta',
   'Further verification required — '+String(entry.next||'Original records not yet verified.')));
 const url=safeUrl(entry.url);
 if(url){
  const a=make('a','','Related institutional context (not confirmation of a UFO office)');
  a.href=url;a.rel='noopener noreferrer';a.target='_blank';li.append(a);
 }
 return li;
}
fetch('/data/programmes-places-m58.json',{cache:'no-store'}).then(response=>{
 if(!response.ok)throw Error('Source catalogue is temporarily unavailable');
 return response.json();
}).then(index=>{
 if(index.schemaVersion!==1||!Array.isArray(index.records)||index.records.length<23||
   !Array.isArray(index.internationalResearchLeads))throw Error('Incomplete programme index');
 if(new Set(index.records.map(x=>x.id)).size!==index.records.length)throw Error('Duplicate official catalogue entries');
 records=index.records;
 const countries=new Set(records.map(x=>String(x.country||'').toLowerCase()));
 // Vatican has a full institutional entry; do not mislabel it as an extra unverified *programme*.
 pending=index.internationalResearchLeads.filter(x=>!countries.has(String(x.country||'').toLowerCase()));
 const types=[...new Set(records.map(x=>x.category).filter(Boolean))].sort();
 for(const type of types){
  const option=make('option','',kindLabel(type));option.value=type;filter.append(option);
 }
 $('ddWhoProgrammeTotal').textContent=String(records.length);
 leadCount.textContent=String(pending.length);
 leadBox.replaceChildren(...pending.map(leadCard));
 render();
}).catch(e=>{
 items.replaceChildren(make('p','dd-who-programme-meta','International catalogue unavailable: '+e.message));
 progress.textContent='The independent people directory is still available.';
});
search.addEventListener('input',render);
filter.addEventListener('change',render);
})();