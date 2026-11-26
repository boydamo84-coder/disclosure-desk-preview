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

(()=>{
 if(typeof window==='undefined'||!['localhost','127.0.0.1'].includes(location.hostname))return;
 // Development-only preview. No account lookup, network request, storage or publish endpoint.
 function init(){
  const menu=document.getElementById('wne-file-menu');
  if(!menu||document.getElementById('dd-community-publication-preview'))return;
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
  const button=el('button','Preview Community Research publication');button.type='button';button.id='dd-community-publication-preview';button.setAttribute('role','menuitem');
  const hint=el('small','Development preview · nothing is published');button.append(hint);
  const after=menu.querySelector('[data-file-action="export"]');if(after)after.after(button);else menu.append(button);
  const dialog=el('dialog');dialog.id='dd-publication-preview-dialog';dialog.setAttribute('aria-label','Preview public research copy');
  dialog.style.cssText='width:min(660px,94vw);max-height:86dvh;overflow:auto;padding:18px;border:1px solid #977f55;border-radius:12px;background:var(--paper,#fff);color:var(--ink,#222);overflow-wrap:anywhere';
  document.body.append(dialog);
  const plain=html=>{
   if(typeof html!=='string')return '';
   // Inert template: no attachment, image, link attributes or embedded metadata leaves the editor.
   const t=document.createElement('template');t.innerHTML=html;
   t.content.querySelectorAll('script,style,iframe,object,embed,template,svg,math,[hidden],[aria-hidden="true"]').forEach(n=>n.remove());
   t.content.querySelectorAll('br,p,div,li,h1,h2,h3,h4,h5,h6,tr').forEach(n=>n.append(document.createTextNode('\n')));
   return (t.content.textContent||'').trim();
  };
  const labeled=(parent,label,input)=>{const row=el('label');row.style.cssText='display:grid;gap:5px;margin:12px 0';row.append(el('span',label),input);input.style.cssText='width:100%;box-sizing:border-box;padding:8px';parent.append(row)};
  button.onclick=()=>{
   menu.hidden=true;dialog.replaceChildren();
   let documentCopy;
   try{documentCopy=window.wneCaptureDocument();if(!Array.isArray(documentCopy.chapters))throw Error('Open a report first.')}catch(e){dialog.append(el('p',e.message));const close=el('button','Close');close.onclick=()=>dialog.close();dialog.append(close);dialog.showModal();return}
   const header=el('h2','Preview public research copy');dialog.append(header,el('p','Choose only the content you intend to publish. This is a local text-only prototype. Nothing is sent or saved; images, formatting, embedded links and private metadata are excluded.'));
   const title=el('input');title.value=String(documentCopy.bookTitle||'').slice(0,160);title.maxLength=160;labeled(dialog,'Public title',title);
   const abstract=el('textarea');abstract.rows=3;abstract.maxLength=1500;labeled(dialog,'Abstract / summary',abstract);
   const category=el('select');for(const name of ['Case analysis','Document analysis','Scientific research','Historical research','FOIA research','Other research']){const opt=el('option',name);opt.value=name;category.append(opt)}labeled(dialog,'Category',category);
   const fields=el('fieldset');fields.append(el('legend','Select sections to include (none selected by default)'));const choices=[];
   for(const chapter of documentCopy.chapters){const text=plain(chapter.html);if(!text)continue;const row=el('label');row.style.cssText='display:block;margin:10px 0';const box=el('input');box.type='checkbox';row.append(box,document.createTextNode(' '+String(chapter.title||'Untitled section')));fields.append(row);choices.push({box,title:String(chapter.title||'Untitled section'),text});}
   dialog.append(fields);
   const refs=el('textarea');refs.rows=3;refs.placeholder='Source title | https://example.org/record';labeled(dialog,'Public references (one title | HTTPS URL per line)',refs);
   const status=el('p');status.setAttribute('role','status');
   const preview=el('div');preview.style.cssText='border:1px solid #977f55;border-radius:8px;padding:12px;margin:12px 0;white-space:pre-wrap';preview.hidden=true;
   const check=el('button','Generate public preview');check.type='button';
   const close=el('button','Close');close.type='button';close.onclick=()=>dialog.close();
   check.onclick=()=>{
    preview.hidden=true;preview.replaceChildren();status.textContent='';
    try{
     const citations=refs.value.split('\n').filter(x=>x.trim()).map(line=>{const i=line.indexOf('|');if(i<0)throw Error('Use title | URL for each reference');return {title:line.slice(0,i),url:line.slice(i+1)}});
     const draft=window.DDCommunityPublicationDraft.publicationDraft({title:title.value,abstract:abstract.value,category:category.value,sections:choices.filter(x=>x.box.checked).map(x=>({title:x.title,text:x.text})),citations});
     preview.append(el('h3',draft.title),el('p',draft.category),el('p',draft.abstract));
     for(const section of draft.sections)preview.append(el('h4',section.title),el('p',section.text));
     if(draft.citations.length){preview.append(el('h4','References'));for(const ref of draft.citations)preview.append(el('p',ref.title+' — '+ref.url))}
     preview.hidden=false;status.textContent='Local preview ready. Review the complete text for personal information. Submission is not enabled.';
    }catch(e){status.textContent=e.message}
   };
   dialog.append(check,document.createTextNode(' '),close,status,preview);
   dialog.showModal();
  };
  dialog.addEventListener('close',()=>dialog.replaceChildren());
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
