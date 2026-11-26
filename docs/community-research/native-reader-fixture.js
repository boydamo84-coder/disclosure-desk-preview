'use strict';
// Only an isolated browser harness may mount this development reader.
// This is deliberately outside the public package and has no network/auth code.
(function(){
 if(!['localhost','127.0.0.1'].includes(location.hostname))return;
 const mount=window.DDCommunityResearchTestMount;
 if(!mount||typeof mount.fetchPublic!=='function'||typeof mount.listPublic!=='function')return;
 const api=window.DDCommunityResearchTransfer;
 if(!api||typeof window.DDSavePublicLinkToBoard!=='function'||typeof window.DDSharePublicLink!=='function')return;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 const section=el('section');section.id='ddCommunityResearchDevelopment';section.setAttribute('aria-label','Community Research development fixture');
 section.className='section';section.hidden=true;
 const head=el('h2','Community Research · development fixture');
 const note=el('p','Fictional records only. Do not publish or share these sample links. Existing Board and reference actions are tested in a disposable browser.');
 const status=el('p');status.setAttribute('role','status');
 const results=el('div');
 const returnButton=el('button','Back to Research');returnButton.type='button';returnButton.className='outline';
 section.append(head,note,returnButton,status,results);
 const research=document.getElementById('originalResearchPage');
 if(!research)return;
 research.append(section);
 const open=el('button','Community Research · development fixture');open.type='button';open.className='outline';research.prepend(open);
 const hub=research.querySelector('.dd-original-research-hub');
 let serial=0;
 async function draw(){
  const current=++serial;results.replaceChildren();status.textContent='Loading sample research…';
  try{
   const rows=await mount.listPublic();
   if(current!==serial)return;
   let count=0;
   for(const row of rows){
    let ref;try{ref=api.source(row)}catch{continue}
    count++;
    const article=el('article');article.className='card';
    const body=el('div');body.className='card-body';
    body.append(el('h3',ref.title),el('p',ref.publisher),el('p',String(row.abstract||'')));
    const read=el('details');read.append(el('summary','Read research'),el('p',String(row.body_text||'')));
    body.append(read);
    const actions=el('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
    const adapters={
     fetchPublic:mount.fetchPublic,
     board:record=>{window.DDSavePublicLinkToBoard(record.boardTitle,record.url);return true},
     citation:record=>ddSaveSiteCitation(record.title,record.url),
     share:record=>mount.previewShare(record.url)
    };
    for(const [kind,label] of [['board','Add to Investigation Board'],['citation','Save to W.NE citations'],['share','Preview share link']]){
     const b=el('button',label);b.type='button';b.className='outline';b.onclick=async()=>{
      b.disabled=true;
      try{
       await api.transfer(ref.id,kind,adapters);
       status.textContent=kind==='board'?'Choose an Investigation Board to finish saving.':kind==='citation'?'Saved to W.NE references in this test browser.':'Sample link prepared; not shared.';
      }catch(e){status.textContent=e.message;await drawUnavailable(ref.id)}
      finally{b.disabled=false}
     };actions.append(b);
    }
    body.append(actions);article.append(body);article.dataset.publicationId=ref.id;results.append(article);
   }
   status.textContent=count+' sample public research reports';
  }catch{if(current===serial)status.textContent='Sample library unavailable';}
 }
 async function drawUnavailable(id){try{const row=await mount.fetchPublic(id);api.source(row)}catch{results.querySelector('[data-publication-id="'+id+'"]')?.remove()}}
 open.onclick=()=>{if(hub)hub.hidden=true;open.hidden=true;section.hidden=false;void draw()};
 returnButton.onclick=()=>{++serial;section.hidden=true;open.hidden=false;if(hub)hub.hidden=false;results.replaceChildren();open.focus()};
})();
