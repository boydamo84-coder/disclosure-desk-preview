/* Disclosure Desk M68 — worldwide institutions inside Who's Who.
 * Reuses ONLY the verified M58 public dataset. No rating of institutions or people.
 * Read-only, on-demand; independent of evidence-voting, auth, ad or editor services.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const wrap=$('ddWhoProgrammes'),toggle=$('ddWhoProgrammesDisclosure');
if(!wrap||!toggle)return;
const input=$('ddWhoProgrammeSearch'),filter=$('ddWhoProgrammeType'),
  status=$('ddWhoProgrammeStatus'),cards=$('ddWhoProgrammeCards'),
  leads=$('ddWhoProgrammeLeads'),leadsCount=$('ddWhoProgrammeLeadsCount');
let records=[],research=[],loaded=false,loading=null;
const typeLabels=Object.freeze({
 dedicated_unit:'Dedicated UAP office',
 historical_office:'Historical government office',
 reporting_process:'Official reporting process',
 government_archive:'Government archive',
 government_review:'Government review',
 government_case_record:'Official case record',
 historical_research:'Institutional and historical research'
});
const e=(tag,cls,value)=>{
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(value!==undefined)node.textContent=String(value);return node;
};
function safeUrl(value){
 try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}
 catch{return null}
}
function addLink(parent,value,link,cls){
 const href=safeUrl(link);
 if(!href)return;
 const a=e('a',cls||'',value);a.href=href;a.target='_blank';a.rel='noopener noreferrer';
 parent.append(a);
}
function sourceBox(entry){
 const box=e('details','dd-who-programme-sources');
 box.append(e('summary','',(entry.sources?.length||0)+' cited original sources and references'));
 for(const src of (entry.sources||[])){
  const row=e('div','dd-who-programme-source-row');
  addLink(row,src.title||'Source publication',src.url,'dd-who-programme-link');
  if(src.role)row.append(e('p','muted small','Source scope: '+src.role));
  if(src.scope)row.append(e('p','muted small',src.scope));
  box.append(row);
 }
 return box;
}
function caseBox(entry){
 if(!entry.featuredCases?.length)return null;
 const box=e('details','dd-who-programme-sources');
 box.append(e('summary','',entry.featuredCases.length+' linked case or government record'+(entry.featuredCases.length>1?'s':'')));
 for(const item of entry.featuredCases){
  const line=e('div','dd-who-programme-source-row');
  addLink(line,item.title||'Original case',item.sourceUrl,'dd-who-programme-link');
  if(item.description)line.append(e('p','muted small',item.description));
  box.append(line);
 }
 return box;
}
function comparisonBox(entry){
 if(!entry.comparisons?.length)return null;
 const box=e('details','dd-who-programme-comparison');
 box.append(e('summary','','Compare attributed statements and published responses'));
 for(const item of entry.comparisons){
  const row=e('div','dd-who-programme-comparison-row');
  row.append(e('h4','',item.topic||'Public claims and original-source comparison'));
  row.append(e('p','','Reported position: '+(item.sideA||'No summary available')));
  row.append(e('p','','Public response: '+(item.sideB||'No summary available')));
  if(item.caution)row.append(e('p','muted small',item.caution));
  for(const url of item.sources||[])addLink(row,'Read the supporting publication',url,'dd-who-programme-link');
  box.append(row);
 }
 return box;
}
function relatedPeople(entry){
 if(!entry.people?.length)return null;
 const box=e('p','muted small');
 box.append(e('strong','','Related public accounts or people: '));
 let count=0;
 for(const p of entry.people){
  if(!/^[a-z0-9-]{2,80}$/.test(p.id||''))continue;
  if(count++)box.append(document.createTextNode(' · '));
  const a=e('a','','Profile: '+p.id.replaceAll('-',' '));
  a.href='/who-is-who.html?person='+encodeURIComponent(p.id);
  box.append(a);
 }
 if(!count)return null;
 box.append(document.createTextNode(' · A linked statement does not imply institutional employment or endorsement.'));
 return box;
}
function makeCard(entry){
 const card=e('article','dd-who-programme-card');
 card.id='dd-who-prog-'+entry.id;
 const head=e('div','dd-who-programme-head');
 head.append(e('h3','',String(entry.flag||'🌍')+' '+String(entry.name||'Untitled organisation')));
 head.append(e('span','dd-who-programme-kind',typeLabels[entry.category]||'Institutional context'));
 card.append(head);
 card.append(e('p','muted small',String(entry.country||'International')+' · '+String(entry.period||'Period to verify')));
 card.append(e('p','',entry.description||'Original institutional references and research context.'));
 if(entry.id==='vatican')card.append(e('p','dd-who-programme-caution',
  'The Observatory and Apostolic Archive are not a verified UAP-investigation agency. The alleged 1933 Italian incident and the archived response are presented as contrasting attributed accounts, not established findings.'));
 if(entry.institutionalStatus)card.append(e('p','muted small',
  'Catalogue classification: '+String(entry.institutionalStatus).replaceAll('_',' ')));
 card.append(sourceBox(entry));
 const cases=caseBox(entry);if(cases)card.append(cases);
 const comparisons=comparisonBox(entry);if(comparisons)card.append(comparisons);
 const people=relatedPeople(entry);if(people)card.append(people);
 return card;
}
function showLeads(){
 leads.replaceChildren();
 for(const item of research){
  const li=e('li','');
  li.append(e('strong','',String(item.country||'Unknown jurisdiction')+' — awaiting original-source verification'));
  li.append(e('p','muted small',item.next||'No verified current programme has been confirmed.'));
  if(item.url)addLink(li,'Institutional context (not proof of a UAP office)',item.url,'dd-who-programme-link');
  leads.append(li);
 }
 leadsCount.textContent=String(research.length);
}
function render(){
 const q=input.value.trim().toLocaleLowerCase();
 const category=filter.value;
 const chosen=records.filter(item=>(category==='all'||item.category===category)&&
  [item.country,item.name,item.kind,item.period,item.description,
   ...(item.sources||[]).map(s=>s.title),
   ...(item.featuredCases||[]).map(s=>s.title),
   ...(item.comparisons||[]).map(s=>s.topic)].join(' ').toLocaleLowerCase().includes(q));
 cards.replaceChildren(...chosen.map(makeCard));
 status.textContent=chosen.length+' matching documented entries · '+new Set(chosen.map(x=>x.country)).size+
  ' jurisdictions shown · '+records.length+' sourced catalogue entries';
 if(!chosen.length)cards.append(e('p','muted small','No matching entry. Try another country or category.'));
}
async function load(){
 if(loading)return loading;
 loading=fetch('/data/programmes-places-m58.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw Error('Original-source register unavailable');return r.json()})
  .then(data=>{
   if(!Array.isArray(data.records)||data.records.length<23||
      !Array.isArray(data.internationalResearchLeads)||data.internationalResearchLeads.length<14||
      !data.records.some(r=>r.id==='vatican'&&r.sources?.length>=4))
     throw Error('Programme register incomplete; no partial catalogue displayed');
   const ids=data.records.map(r=>r.id);
   if(new Set(ids).size!==ids.length)throw Error('Duplicate organisation IDs');
   records=data.records;research=data.internationalResearchLeads;loaded=true;
   const kinds=[...new Set(records.map(r=>r.category).filter(Boolean))].sort();
   for(const kind of kinds){
    const opt=e('option','',typeLabels[kind]||kind.replaceAll('_',' '));opt.value=kind;filter.append(opt);
   }
   render();showLeads();
  })
  .catch(err=>{
   status.textContent='Cannot open the programme list: '+err.message;
   cards.replaceChildren(e('p','muted small','The original-source directory could not be loaded. The separate full directory is still available.'));
  });
 return loading;
}
toggle.addEventListener('toggle',()=>{if(toggle.open&&!loaded)void load()});
input.addEventListener('input',()=>{if(loaded)render()});
filter.addEventListener('change',()=>{if(loaded)render()});
for(const button of wrap.querySelectorAll('[data-dd-who-programme-jump]')){
 button.addEventListener('click',async()=>{
  toggle.open=true;
  await load();
  if(!loaded)return;
  input.value=button.dataset.ddWhoProgrammeJump||'';
  filter.value='all';
  render();
  input.scrollIntoView({block:'start',behavior:'instant'});
  input.focus({preventScroll:true});
 });
}
if(location.hash==='#ddWhoProgrammes'||location.hash.startsWith('#dd-who-prog-')){
 toggle.open=true;
 void load().then(()=>{
  const target=document.getElementById(location.hash.slice(1));
  target?.scrollIntoView({block:'start',behavior:'instant'});
 });
}
})();