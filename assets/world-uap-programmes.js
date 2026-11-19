/* M58 international original-source directory. Public read-only: never stores opinions or calls an account API. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const safeUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const el=(tag,cl,txt)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=String(txt);return e};
const addLink=(box,label,url)=>{const href=safeUrl(url);if(!href)return;const a=el('a','source-link',label);a.href=href;a.target='_blank';a.rel='noopener noreferrer';box.append(a)};
let records=[],leads=[];
const search=$('programmeSearch'),group=$('programmeType'),result=$('programmeResults'),count=$('resultsCount');
function makeCard(item){
 const card=el('article','programme-card');card.id='p-'+item.id;
 const header=el('div','programme-head');
 const h3=el('h3','',String(item.flag||'🌍')+' '+String(item.name||''));header.append(h3);
 header.append(el('span','type',String(item.category||'Research').replaceAll('_',' ')));
 card.append(header);
 card.append(el('p','meta',String(item.country||'International')+' · '+String(item.period||'')+' · '+String(item.institutionalStatus||'historical').replaceAll('_',' ')));
 card.append(el('p','',item.description||''));
 const refs=el('section','source-section');refs.append(el('h4','','Original institutional sources'));
 for(const s of (item.sources||[])){
  const line=el('div','source-row');addLink(line,s.title||'Original record',s.url);
  if(s.scope)line.append(el('p','small',s.scope));refs.append(line);
 }
 card.append(refs);
 if(item.featuredCases?.length){
  const details=el('details','case-details');details.append(el('summary','','Cases & original records ('+item.featuredCases.length+')'));
  for(const c of item.featuredCases){
   const row=el('div','case-row');addLink(row,c.title,c.sourceUrl);
   row.append(el('p','small',c.description||'Original source, not proof of extraterrestrial origin.'));
   details.append(row);
  }
  card.append(details);
 }
 if(item.people?.length){
  const p=el('p','small','Related profiles: ');
  item.people.forEach((person,i)=>{if(i)p.append(document.createTextNode(' · '));addLink(p,String(person.id).replaceAll('-',' '),'/who-is-who.html?person='+person.id)});
  // External-only safeUrl prevents linking same-origin profile routes; use new URL to validate relative paths:
  p.replaceChildren(document.createTextNode('Related profiles: '));
  item.people.forEach((person,i)=>{
   if(!/^[a-z0-9-]{2,80}$/.test(person.id))return;
   if(i)p.append(document.createTextNode(' · '));
   const a=el('a','','Profile: '+person.id.replaceAll('-',' '));
   a.href='/who-is-who.html?person='+encodeURIComponent(person.id);p.append(a);
  });
  card.append(p);
 }
 return card;
}
function render(){
 const q=search.value.trim().toLocaleLowerCase(),selected=group.value;
 const chosen=records.filter(x=>(selected==='all'||x.category===selected)&&
  [x.name,x.country,x.description,x.period,x.kind,...(x.featuredCases||[]).map(y=>y.title)].join(' ').toLocaleLowerCase().includes(q));
 result.replaceChildren(...chosen.map(makeCard));
 count.textContent=chosen.length+' source-linked entries · '+new Set(chosen.map(x=>x.country)).size+' jurisdictions · '+records.length+' entries total';
 if(!chosen.length)result.append(el('p','empty','No matching entries. Try another search or type.'));
}
fetch('/data/programmes-places-m58.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catalogue could not be loaded');return r.json()}).then(data=>{
 if(!Array.isArray(data.records)||data.records.length<20)throw Error('Incomplete international catalogue');
 records=data.records;leads=Array.isArray(data.internationalResearchLeads)?data.internationalResearchLeads:[];
 const types=[...new Set(records.map(x=>x.category).filter(Boolean))].sort();
 types.forEach(type=>{const opt=el('option','',type.replaceAll('_',' '));opt.value=type;group.append(opt)});
 render();
 const queue=$('researchLeads');queue.replaceChildren(...leads.map(x=>{
  const li=el('li','',x.country+' — '+x.next);
  if(x.url){li.append(document.createTextNode(' · '));addLink(li,'Institutional context',x.url)}
  return li;
 }));
 $('leadsCount').textContent=String(leads.length);
}).catch(err=>{result.replaceChildren(el('p','empty','Catalogue unavailable: '+err.message));count.textContent='Offline catalogue unavailable'});
search.addEventListener('input',render);group.addEventListener('change',render);
})();