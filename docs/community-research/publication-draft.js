'use strict';
// Local preview projection only; not a server-side authorization or privacy scanner.
function publicationDraft(input){
 const limits={title:160,abstract:1500,sectionTitle:160,section:50000,sections:30,citations:100,total:180000};
 const clean=(value,max,label)=>{
  if(typeof value!=='string')throw Error(label+' must be text');
  const v=value.trim();
  if(!v||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))throw Error('Invalid '+label);
  return v;
 };
 if(!input||typeof input!=='object')throw Error('Publication details required');
 const categories=['Case analysis','Document analysis','Scientific research','Historical research','FOIA research','Other research'];
 if(!categories.includes(input.category))throw Error('Select a category');
 if(!Array.isArray(input.sections)||!input.sections.length||input.sections.length>limits.sections)throw Error('Select 1–30 sections');
 const sections=input.sections.map(s=>({title:clean(s.title,limits.sectionTitle,'section title'),text:clean(s.text,limits.section,'section text')}));
 const refs=input.citations??[];
 if(!Array.isArray(refs)||refs.length>limits.citations)throw Error('Too many citations');
 const seen=new Set(),citations=[];
 for(const r of refs){
  const title=clean(r.title,limits.title,'citation title'),raw=clean(r.url,2048,'citation URL');
  // Conservative initial preview: DNS hostnames only; no credentials, ports, IP literals or local names.
  const m=raw.match(/^https:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?=[/?#]|$)(?:[/?#][^\s\\]*)?$/i);
  if(!m||!/\.[a-z]{2,63}$/i.test(m[1])||/\.(local|internal|localhost|test|invalid|onion)$/i.test(m[1]))throw Error('Citation must use a public HTTPS address');
  if(!seen.has(raw)){seen.add(raw);citations.push({title,url:raw})}
 }
 const out={format:'dd-community-research-v1',title:clean(input.title,limits.title,'title'),abstract:clean(input.abstract,limits.abstract,'abstract'),category:input.category,sections,citations};
 if(JSON.stringify(out).length>limits.total)throw Error('Publication exceeds preview size limit');
 return out;
}
if(typeof module==='object'&&module.exports)module.exports={publicationDraft};
if(typeof window!=='undefined')window.DDCommunityPublicationDraft=Object.freeze({publicationDraft});
