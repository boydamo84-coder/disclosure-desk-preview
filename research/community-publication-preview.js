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
// Text-only projection matching the draft database column limits.
// No network calls or publication permission are implied by this helper.
function publicTextPayload(input,consent){
 if(consent!==true)throw Error('Explicit publication consent required');
 const draft=publicationDraft(input);
 const body=draft.sections.map(s=>s.title+'\n'+s.text).join('\n\n');
 const refs=draft.citations.map(r=>r.title+' | '+r.url).join('\n');
 if(body.length>120000||refs.length>20000||new TextEncoder().encode(body+refs).length>180000)throw Error('Public text exceeds submission size limit');
 return Object.freeze({title:draft.title,abstract:draft.abstract,category:draft.category,body_text:body,references_text:refs,consent:true});
}
if(typeof module==='object'&&module.exports)module.exports={publicationDraft,publicTextPayload};
if(typeof window!=='undefined')window.DDCommunityPublicationDraft=Object.freeze({publicationDraft,publicTextPayload});

(()=>{
 if(typeof window==='undefined'||!['localhost','127.0.0.1'].includes(location.hostname))return;
 // Development-only preview. No account lookup, network request or publish endpoint.
 // Only an explicitly opted-in fictional test fixture may use local storage.
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
   const header=el('h2','Preview public research copy');dialog.append(header,el('p','Choose only the content you intend to publish. This is a local text-only prototype. No report text is sent or saved; images, formatting, embedded links and private metadata are excluded.'));
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
   const consent=el('input');consent.type='checkbox';
   const agreement=el('label');agreement.hidden=true;agreement.style.cssText='margin:12px 0';agreement.append(consent,document.createTextNode(' I have permission to publish this exact text, have checked for personal and confidential information, and understand my public username would accompany the publication.'));
   const review=el('button','Confirm reviewed public copy');review.type='button';review.hidden=true;review.disabled=true;
   let reviewed=null;
   // Explicitly opt-in, disposable browser fixture. No publishing client,
   // real account, database, or network. All outcomes and accounts are invented.
   // Persist only fictional metadata to exercise interruption/restart handling.
   const simulate=window.DDCommunityReceiptFixture===true;
   const sampleAccount=window.DDCommunityReceiptFixtureAccount==='sample-b'?'sample-b':'sample-a';
   const storageKey='dd.community.receipt.fixture.pending.v1';
   const generationKey='dd.community.receipt.fixture.generation.v1';
   const sampleId=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
   const readGeneration=()=>{
    const value=window.localStorage.getItem(generationKey);
    if(value!==null&&!sampleId.test(value))throw Error('Invalid fixture generation');
    return value;
   };
   const readPending=()=>{
    const raw=window.localStorage.getItem(storageKey);
    if(raw===null)return null;
    const item=JSON.parse(raw);
    if(!item||typeof item!=='object'||Object.keys(item).sort().join(',')!=='account,id,number,state,version'
    ||item.version!==1||!['sample-a','sample-b'].includes(item.account)
    ||typeof item.id!=='string'||!sampleId.test(item.id)
    ||!Number.isSafeInteger(item.number)||item.number<1||item.state!=='unknown')throw Error('Invalid fixture pending state');
    return item;
   };
   const formFields=[title,abstract,category,refs,...choices.map(c=>c.box)];
   const simulation=el('fieldset');simulation.hidden=true;
   simulation.append(el('legend','Local receipt simulation — nothing is published'));
   const outcome=el('select');
   for(const [value,label] of [['received','Simulated receipt received'],['unknown','Simulated connection interrupted'],['rejected','Simulated rejection']]){
    const option=el('option',label);option.value=value;outcome.append(option);
   }
   labeled(simulation,'Sample result',outcome);
   const send=el('button','Simulate one submission');send.type='button';
   const reconcile=el('button','Check simulated receipt');reconcile.type='button';reconcile.hidden=true;
   const receipt=el('p');receipt.setAttribute('role','status');
   simulation.append(send,reconcile,receipt);
   let attempt=null,confirmed=null,reviewGeneration=null,sequence=0,storageBlocked=false,busy=false;
   const lock=(value)=>{
    for(const field of [...formFields,consent,check])field.disabled=value;
    if(value)review.disabled=true;
   };
   const block=(message)=>{
    storageBlocked=true;confirmed=null;simulation.hidden=false;send.disabled=true;reconcile.hidden=true;lock(true);
    receipt.textContent=message;
   };
   const storageProblem=()=>block('Sample receipt storage is unavailable or inconsistent. No simulated submission is allowed.');
   // Same-origin browser tabs coordinate only fictional fixture state. A local
   // lock is not a substitute for server-side idempotency or authorization.
   const runExclusive=async work=>{
    if(!simulate||busy||storageBlocked)return;
    if(typeof navigator.locks?.request!=='function'){block('Sample multi-tab coordination is unavailable. No simulated submission is allowed.');return;}
    busy=true;send.disabled=true;reconcile.disabled=true;outcome.disabled=true;lock(true);
    try{
     await navigator.locks.request(storageKey,{mode:'exclusive'},()=>{
      if(dialog.open&&simulation.isConnected)work();
     });
    }catch(e){if(dialog.open&&simulation.isConnected)storageProblem();}
    finally{
     busy=false;reconcile.disabled=false;outcome.disabled=false;
     if(dialog.open&&simulation.isConnected&&!storageBlocked&&!attempt&&confirmed){lock(false);send.disabled=false;review.disabled=!consent.checked;}
    }
   };
   const showUnknown=()=>{
    simulation.hidden=false;send.disabled=true;reconcile.hidden=false;lock(true);
    receipt.textContent='Sample '+attempt.number+': outcome unknown. Do not submit again. Check the same simulated receipt.';
   };
   const restorePending=()=>{
    if(!simulate)return false;
    try{
     const item=readPending();
     if(!item)return false;
     if(item.account!==sampleAccount){
      block('A different sample account has an unresolved attempt. Return to the original sample account.');
      return true;
     }
     attempt=item;sequence=Math.max(sequence,item.number);confirmed=null;outcome.value='unknown';showUnknown();
     return true;
    }catch(e){storageProblem();return true;}
   };
   const resetSimulation=()=>{
    if(storageBlocked||attempt?.state==='unknown')return false;
    attempt=null;confirmed=null;reviewGeneration=null;simulation.hidden=true;receipt.textContent='';
    send.disabled=false;reconcile.hidden=true;lock(false);
    return true;
   };
   const invalidate=()=>{
    if(!resetSimulation())return false;
    reviewed=null;consent.checked=false;agreement.hidden=true;review.hidden=true;review.disabled=true;preview.hidden=true;
    status.textContent='Generate a fresh preview to review your changes.';
    return true;
   };
   for(const field of formFields)field.addEventListener('input',invalidate);
   consent.onchange=()=>{if(!resetSimulation())return;review.disabled=!consent.checked||!reviewed;status.textContent=consent.checked?'Ready to confirm reviewed copy.':'Confirmation required.'};
   const showResult=()=>{
    if(!attempt||storageBlocked)return;
    const result=outcome.value;
    try{
     const current=readPending();
     if(!current||current.id!==attempt.id||current.account!==sampleAccount||current.number!==attempt.number)throw Error('Pending attempt changed');
     if(result==='unknown'){showUnknown();return;}
     // Clear only after a definitive fictional result. An interrupted check retains the same ID.
     window.localStorage.removeItem(storageKey);
     if(readPending()!==null)throw Error('Pending attempt remains');
    }catch(e){storageProblem();return;}
    attempt.state=result;
    reconcile.hidden=true;lock(false);review.disabled=true;
    receipt.textContent=result==='received'
     ?'Sample '+attempt.number+': simulated receipt received. This is not a real publication or public link.'
     :'Sample '+attempt.number+': simulated rejection. Generate and review a fresh copy before another attempt.';
   };
   send.onclick=()=>{
    if(!simulate||busy||!confirmed||attempt||storageBlocked||!consent.checked)return;
    void runExclusive(()=>{
     if(!confirmed||attempt||storageBlocked||!consent.checked)return;
     if(restorePending())return;
     // Even a receipt that resolved immediately in another tab invalidates
     // previously reviewed copies. Compare and advance within the same lock.
     if(readGeneration()!==reviewGeneration){
      invalidate();status.textContent='A different sample attempt changed since review. Generate and confirm a fresh preview.';
      return;
     }
     // Fictional markers only. Advance the generation before the attempt.
     // Never store report text, real identity or session credentials.
     const pending={version:1,account:sampleAccount,id:crypto.randomUUID(),number:++sequence,state:'unknown'};
     window.localStorage.setItem(generationKey,pending.id);
     if(readGeneration()!==pending.id)throw Error('Generation was not saved');
     window.localStorage.setItem(storageKey,JSON.stringify(pending));
     const stored=readPending();
     if(!stored||stored.id!==pending.id||stored.account!==pending.account)throw Error('Pending marker was not saved');
     attempt=stored;
     send.disabled=true;review.disabled=true;confirmed=null;showResult();
    });
   };
   reconcile.onclick=()=>{
    if(!simulate||busy||storageBlocked||!attempt||attempt.state!=='unknown')return;
    void runExclusive(showResult);
   };
   review.onclick=()=>{
    if(storageBlocked||busy||attempt?.state==='unknown'||!reviewed||!consent.checked)return;
    try{
     const payload=publicTextPayload(reviewed,true);
     status.textContent='Public copy confirmed locally. Nothing has been submitted or published.';
     if(simulate&&!attempt){
      if(restorePending())return;
      try{reviewGeneration=readGeneration();}catch(e){storageProblem();return;}
      confirmed=payload;simulation.hidden=false;
     }
    }
    catch(e){status.textContent=e.message}
   };
   check.onclick=()=>{
    if(busy||!invalidate())return;
    preview.replaceChildren();status.textContent='';
    try{
     const citations=refs.value.split('\n').filter(x=>x.trim()).map(line=>{const i=line.indexOf('|');if(i<0)throw Error('Use title | URL for each reference');return {title:line.slice(0,i),url:line.slice(i+1)}});
     const draft=window.DDCommunityPublicationDraft.publicationDraft({title:title.value,abstract:abstract.value,category:category.value,sections:choices.filter(x=>x.box.checked).map(x=>({title:x.title,text:x.text})),citations});
     preview.append(el('h3',draft.title),el('p',draft.category),el('p',draft.abstract));
     for(const section of draft.sections)preview.append(el('h4',section.title),el('p',section.text));
     if(draft.citations.length){preview.append(el('h4','References'));for(const ref of draft.citations)preview.append(el('p',ref.title+' — '+ref.url))}
     publicTextPayload(draft,true);reviewed=draft;preview.hidden=false;agreement.hidden=false;review.hidden=false;status.textContent='Local preview ready. Review the complete text before confirming. Submission is not enabled.';
    }catch(e){status.textContent=e.message}
   };
   dialog.append(check,document.createTextNode(' '),close,preview,agreement,review,status);
   if(simulate){dialog.append(simulation);restorePending();}
   dialog.showModal();
  };
  dialog.addEventListener('close',()=>dialog.replaceChildren());
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
