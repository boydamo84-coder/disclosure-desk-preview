/* Disclosure Desk M04 | Cross-device "My Research" dashboard.
 * Test-host only. Never cache private draft text, W.NE originals or author IDs.
 * Every server action is confirmed by auth.getUser() and RLS; never trust DOM IDs.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const kinds={case:'Case investigation',archive:'Archive research',hypothesis:'Hypothesis',methods:'Methods and data'};
const pageSize=20;
function linkNode(url){
 try{
  const u=new URL(String(url||''));
  if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||
   /(?:^|\.)(localhost|local|internal|test)$/i.test(u.hostname)||
   /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname))return null;
  const a=document.createElement('a');
  a.href=u.href;a.textContent=u.href;a.target='_blank';a.rel='noopener noreferrer nofollow ugc';
  return a;
 }catch{return null}
}
function showSources(urls){
 const list=$('myResearchSources');list.replaceChildren();
 for(const raw of Array.isArray(urls)?urls:[]){
  const a=linkNode(raw);if(!a)continue;
  const li=document.createElement('li');li.append(a);list.append(li);
 }
 if(!list.children.length){
  const li=document.createElement('li');li.textContent='No public source links in this copy.';
  list.append(li);
 }
}
function message(e){return String(e?.message||e||'Research service unavailable.').slice(0,260)}
function init(){
 const recovery=window.DDCommunityResearchRecovery;
 const draftApi=window.DDCommunityResearchDrafts;
 const publication=window.DDCommunityResearchPublication;
 const availability=$('myResearchAvailability');
 if(!recovery?.enabled||!draftApi?.enabled||!publication?.enabled)return;
 const board=$('myResearchBoard'),details=$('myResearchDetails');
 board.hidden=false;
 availability.textContent='Controlled test workspace · Account-backed recovery is being verified. No live public publication is enabled.';
 let owner=null,drafts=[],papers=[],paperPage=0,draftPage=0,draftHasMore=false,tab='drafts',selected=null,
  versions=[],editionPage=0,loading=false,runToken=0,detailToken=0;
 const status=$('myResearchCount'),records=$('myResearchRecords'),empty=$('myResearchEmpty');
 function closeDetail(){
  detailToken++;
  selected=null;versions=[];editionPage=0;details.hidden=true;
  $('myResearchDetailHeading').textContent='';
  $('myResearchDetailText').textContent='';
  $('myResearchDetailDescription').textContent='';
  $('myResearchSources').replaceChildren();
  $('myResearchDraftEditor').hidden=true;
  $('myResearchPublishedTools').hidden=true;
  $('myResearchWithdrawal').hidden=true;
  $('myResearchWithdrawType').value='';$('myResearchWithdrawConfirm').checked=false;
  // Hidden private editor values remain readable by JS even after the panel closes.
  // Erase them on account switch, navigation, backgrounding and detail close.
  for(const id of ['myResearchDraftTitle','myResearchDraftAbstract','myResearchDraftText','myResearchDraftSources'])$(id).value='';
  $('myResearchDraftStatus').textContent='';
  $('myResearchEditionPicker').replaceChildren();
  $('myResearchEditionStatus').textContent='';
  $('myResearchDraftSave').disabled=false;
 }
 function clearAll(reason){
  owner=null;drafts=[];papers=[];paperPage=0;draftPage=0;draftHasMore=false;runToken++;closeDetail();
  records.replaceChildren();empty.hidden=false;empty.textContent=reason||'Sign in again to view your research.';
  status.textContent='Your research is not currently loaded.';
 }
 async function ensureOwner(){
  const user=await recovery.account();
  if(owner===null||owner!==user){
   clearAll('Account changed. Refresh to load your own research.');
   throw Error('Account changed; refresh your private research before continuing.');
  }
  return user;
 }
 function setTab(name){
  if(!['drafts','published','withdrawn'].includes(name))return;
  tab=name;
  for(const key of ['drafts','published','withdrawn']){
   const el=$(key==='drafts'?'myResearchDraftTab':key==='published'?'myResearchPublishedTab':'myResearchWithdrawnTab');
   el.setAttribute('aria-selected',String(tab===key));
  }
  closeDetail();render();
 }
 function createCard(kind,item){
  const article=document.createElement('article');article.className='item';
  const small=document.createElement('small');
  small.textContent=kind==='drafts'?'PRIVATE DRAFT · NOT PUBLISHED':
   (item.status==='withdrawn'?'WITHDRAWN · PRIVATE HISTORY':
     'PUBLISHED · EDITION '+item.currentEdition);
  const heading=document.createElement('h3');heading.textContent=item.title;
  const summary=document.createElement('p');summary.textContent=kind==='drafts'?
   (item.abstract||'Private working copy without an abstract yet.').slice(0,230):
   (item.abstract||'No paper summary available.').slice(0,230);
  const meta=document.createElement('p');meta.className='muted';
  meta.textContent=kind==='drafts'?
   'Saved revision '+item.revision+' · '+(kinds[item.paper_type]||'Research'):
   'Edition '+item.currentEdition+' · '+(kinds[item.type]||'Research');
  const button=document.createElement('button');button.type='button';
  button.textContent=kind==='drafts'?'Review private draft':'View editions and manage';
  button.addEventListener('click',()=>{void openItem(kind,item)});
  article.append(small,heading,summary,meta,button);
  return article;
 }
 function render(){
  records.replaceChildren();
  const query=$('myResearchSearch').value.trim().toLowerCase();
  const list=tab==='drafts'?drafts:papers.filter(p=>(tab==='published')===(p.status==='published'));
  const shown=list.filter(p=>(String(p.title)+' '+String(p.abstract||'')+' '+
   String(p.paper_type||p.type)).toLowerCase().includes(query));
  for(const item of shown)records.append(createCard(tab,item));
  empty.hidden=shown.length>0;
  empty.textContent=tab==='drafts'?
   'No matching drafts on this page. Use Previous or Next to browse your saved Disclosure Desk research. W.NE manuscripts stay in a separate private library.':
   'No matching '+(tab==='published'?'published':'withdrawn')+' papers on this page. Older results may appear on another page.';
  $('myResearchPrev').disabled=loading||(tab==='drafts'?draftPage===0:paperPage===0);
  $('myResearchNext').disabled=loading||(tab==='drafts'?!draftHasMore:papers.length<pageSize);
  status.textContent=tab==='drafts'?
   'Private-draft page '+(draftPage+1)+' · '+shown.length+' matching draft(s) on this page. '+(draftHasMore?'More private drafts available.':'End of private drafts.'):
   'Published-paper page '+(paperPage+1)+' · '+shown.length+' matching '+tab+
    ' records from '+papers.length+' server results. Use Next page to continue.';
 }
 async function refresh(){
  if(loading)return;
  loading=true;$('myResearchRefresh').disabled=true;
  const token=++runToken;
  closeDetail();status.textContent='Checking your signed-in research records…';
  try{
   const start=await recovery.account();
   const [draftResult,publicPapers]=await Promise.all([
    draftApi.listMinePaged?
      draftApi.listMinePaged({page:0,pageSize}):
      draftApi.listMine().then(items=>({items,hasMore:false,page:0})),
    recovery.listMyPapers({page:0,pageSize})
   ]);
   const finish=await recovery.account();
   if(token!==runToken||start!==finish)throw Error('Account changed while loading. Reload to protect your private records.');
   if(!draftResult||!Array.isArray(draftResult.items)||draftResult.items.length>pageSize)throw Error('Private draft page did not match the expected response.');
   owner=start;drafts=draftResult.items;draftHasMore=draftResult.hasMore===true;draftPage=0;papers=publicPapers;paperPage=0;
   availability.textContent='Your private research index loaded from the test server. W.NE originals remain separate.';
   render();
  }catch(e){
   clearAll(message(e));
   availability.textContent='My Research could not be loaded: '+message(e);
  }finally{loading=false;$('myResearchRefresh').disabled=false;render()}
 }
 async function changePage(direction){
  if(loading)return;
  const draftsTab=tab==='drafts',next=(draftsTab?draftPage:paperPage)+direction;
  if(next<0||(draftsTab?next>50000:next>25))return;
  loading=true;render();closeDetail();
  let failure=null;
  try{
   const before=await ensureOwner();
   if(draftsTab){
    if(!draftApi.listMinePaged)throw Error('Full private draft pagination is not available.');
    const result=await draftApi.listMinePaged({page:next,pageSize});
    const after=await ensureOwner();
    if(before!==after||!result||!Array.isArray(result.items)||result.items.length>pageSize)
     throw Error('Private draft page was not verified.');
    drafts=result.items;draftHasMore=result.hasMore===true;draftPage=next;
   }else{
    const list=await recovery.listMyPapers({page:next,pageSize});
    const after=await ensureOwner();
    if(before!==after)throw Error('Account changed during paper pagination.');
    papers=list;paperPage=next;
   }
  }catch(e){failure='Page not loaded: '+message(e)}
  finally{loading=false;render();if(failure)status.textContent=failure}
 }
 function renderEdition(edition){
  $('myResearchDetailHeading').textContent=edition.title;
  $('myResearchDetailDescription').textContent=
   'Published edition '+edition.edition+' · '+(kinds[edition.type]||'Research')+
   ' · '+(edition.publishedAt?new Date(edition.publishedAt).toLocaleDateString('en-GB'):'');
  $('myResearchDetailText').textContent=edition.body;
  showSources(edition.sourceUrls);
 }
 function optionsForVersions(){
  const select=$('myResearchEditionPicker');select.replaceChildren();
  for(const e of versions){
   const opt=document.createElement('option');opt.value=String(e.edition);
   opt.textContent='Edition '+e.edition+(selected&&e.edition===selected.paper.currentEdition?' · current':'');
   select.append(opt);
  }
  if(versions.length)renderEdition(versions[0]);
  $('myResearchEditionNext').disabled=versions.length<pageSize;
  $('myResearchEditionStatus').textContent=versions.length+
   ' recorded edition(s) loaded. Earlier public editions remain unmodified.';
 }
 async function openItem(kind,item){
  closeDetail();
  const requestToken=detailToken;
  try{
   await ensureOwner();
   if(kind==='drafts'){
    if(!drafts.some(d=>d.id===item.id)||!idPattern.test(item.id))
     throw Error('This draft is not in your current private list.');
    const draft=await draftApi.getMine(item.id);
    await ensureOwner();
    if(requestToken!==detailToken) return;
    if(!draft||draft.id!==item.id)throw Error('Private draft not found for this account.');
    selected={kind:'drafts',draft};
    $('myResearchDetailBadge').textContent='PRIVATE · DRAFT REVISION '+draft.revision;
    $('myResearchDetailHeading').textContent=draft.title;
    $('myResearchDetailDescription').textContent='A saved Disclosure Desk private draft, separate from W.NE.';
    $('myResearchDetailText').textContent=draft.body||'This draft has no written body yet.';
    showSources(draft.source_urls);
    $('myResearchDraftTitle').value=draft.title;
    $('myResearchDraftAbstract').value=draft.abstract||'';
    $('myResearchDraftText').value=draft.body||'';
    $('myResearchDraftType').value=draft.paper_type;
    $('myResearchDraftSources').value=(draft.source_urls||[]).join('\n');
    $('myResearchDraftStatus').textContent='Editing only the private server draft; this does not publish or change W.NE.';
    $('myResearchDraftEditor').hidden=false;
   }else{
    if(!papers.some(p=>p.paperId===item.paperId))throw Error('This paper is not in your owner-verified portfolio.');
    const editions=await recovery.listEditions(item.paperId,{page:0,pageSize});
    await ensureOwner();
    if(requestToken!==detailToken) return;
    if(!editions.length)throw Error('No verifiable editions are available for this paper.');
    selected={kind:'papers',paper:item};
    versions=editions;editionPage=0;
    $('myResearchDetailBadge').textContent=item.status.toUpperCase()+' · EDITION '+item.currentEdition;
    $('myResearchPublishedTools').hidden=false;
    $('myResearchWithdrawal').hidden=item.status!=='published';
    optionsForVersions();
    $('myResearchEditionStatus').textContent+=' Original links and text remain in each snapshot.';
   }
   details.hidden=false;
   details.scrollIntoView?.({block:'start',behavior:'instant'});
  }catch(e){if(requestToken===detailToken){closeDetail();status.textContent='Could not open research: '+message(e)}}
 }
 async function saveDraft(event){
  event.preventDefault();
  if(!selected||selected.kind!=='drafts')return;
  const item=selected.draft;
  $('myResearchDraftSave').disabled=true;
  try{
   await ensureOwner();
   const title=$('myResearchDraftTitle').value.trim(),
    abstract=$('myResearchDraftAbstract').value.trim(),
    body=$('myResearchDraftText').value,
    paper_type=$('myResearchDraftType').value,
    urls=$('myResearchDraftSources').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   if(title.length<8||title.length>140||abstract.length>600||body.length>30000||urls.length>12)
    throw Error('Draft exceeds title, abstract, content or source limits.');
   if(!urls.every(s=>linkNode(s)!==null))throw Error('Use valid original HTTPS sources.');
   const saved=await draftApi.saveMine({title,abstract,body,paper_type,source_urls:urls},{
    id:item.id,expectedRevision:item.revision
   });
   await ensureOwner();
   const readBack=await draftApi.getMine(item.id);
   if(!readBack||saved.revision!==item.revision+1||readBack.revision!==saved.revision)
    throw Error('Saved revision could not be verified; do not retry without refreshing.');
   selected={kind:'drafts',draft:readBack};
   const summary={id:readBack.id,title:readBack.title,abstract:readBack.abstract,
    paper_type:readBack.paper_type,revision:readBack.revision,
    created_at:readBack.created_at,updated_at:readBack.updated_at};
   drafts=drafts.map(d=>d.id===readBack.id?summary:d);
   $('myResearchDetailHeading').textContent=readBack.title;
   $('myResearchDetailBadge').textContent='PRIVATE · DRAFT REVISION '+readBack.revision;
   $('myResearchDetailText').textContent=readBack.body;
   showSources(readBack.source_urls);
   $('myResearchDraftStatus').textContent='Saved private revision '+readBack.revision+' and verified from the server. No public edition changed.';
   render();
  }catch(e){$('myResearchDraftStatus').textContent='Changes were not confirmed: '+message(e)}
  finally{$('myResearchDraftSave').disabled=false}
 }
 async function moreEditions(){
  if(!selected||selected.kind!=='papers')return;
  const paper=selected.paper;
  $('myResearchEditionNext').disabled=true;
  try{
   await ensureOwner();
   const next=editionPage+1;
   const found=await recovery.listEditions(paper.paperId,{page:next,pageSize});
   await ensureOwner();
   if(!selected||selected.paper.paperId!==paper.paperId)return;
   const used=new Set(versions.map(v=>v.edition));
   versions.push(...found.filter(v=>!used.has(v.edition)));
   editionPage=next;optionsForVersions();
   $('myResearchEditionNext').disabled=found.length<pageSize;
   $('myResearchEditionStatus').textContent=versions.length+' edition(s) loaded.';
  }catch(e){$('myResearchEditionStatus').textContent='Could not retrieve older editions: '+message(e)}
 }
 async function withdraw(){
  if(!selected||selected.kind!=='papers'||selected.paper.status!=='published')return;
  if($('myResearchWithdrawType').value!=='WITHDRAW'||!$('myResearchWithdrawConfirm').checked){
   $('myResearchEditionStatus').textContent='Type WITHDRAW and tick the acknowledgement before withdrawing.';
   return;
  }
  const paper=selected.paper;$('myResearchWithdrawButton').disabled=true;
  try{
   await ensureOwner();
   // Confirm the current edition and ownership AGAIN before allowing withdrawal.
   const latest=await recovery.listMyPapers({page:paperPage,pageSize});
   const fresh=latest.find(x=>x.paperId===paper.paperId);
   if(!fresh||fresh.status!=='published'||fresh.currentEdition!==paper.currentEdition)
    throw Error('Paper changed or is no longer on this owner page. Refresh before withdrawing.');
   await ensureOwner();
   const result=await publication.withdrawPaper({paperId:paper.paperId,edition:paper.currentEdition,consent:true});
   await ensureOwner();
   if(result.status!=='withdrawn'||result.paperId!==paper.paperId)throw Error('Withdrawal response could not be verified.');
   closeDetail();tab='withdrawn';paperPage=0;
   await refresh();
   setTab('withdrawn');
   status.textContent='Withdrawal confirmed by server. Prior editions remain in your private history.';
  }catch(e){$('myResearchEditionStatus').textContent='Withdrawal not confirmed: '+message(e)}
  finally{$('myResearchWithdrawButton').disabled=false}
 }
 $('myResearchRefresh').addEventListener('click',()=>{void refresh()});
 $('myResearchPrev').addEventListener('click',()=>{void changePage(-1)});
 $('myResearchNext').addEventListener('click',()=>{void changePage(1)});
 $('myResearchSearch').addEventListener('input',render);
 for(const [key,id] of [['drafts','myResearchDraftTab'],['published','myResearchPublishedTab'],['withdrawn','myResearchWithdrawnTab']]){
  $(id).addEventListener('click',()=>setTab(key));
 }
 $('myResearchClose').addEventListener('click',closeDetail);
 $('myResearchDraftForm').addEventListener('submit',event=>{void saveDraft(event)});
 $('myResearchEditionNext').addEventListener('click',()=>{void moreEditions()});
 $('myResearchEditionPicker').addEventListener('change',()=>{
  const e=versions.find(v=>v.edition===Number($('myResearchEditionPicker').value));
  if(e)renderEdition(e);
 });
 $('myResearchWithdrawButton').addEventListener('click',()=>{void withdraw()});
 const checkSwitch=async()=>{
  if(owner===null)return;
  try{
   const current=await recovery.account();
   if(current!==owner){
    clearAll('Account changed; private research details cleared. Refresh to load the current account.');
    availability.textContent='Account changed. No prior member research remains displayed.';
   }
  }catch{
   clearAll('Account unavailable. Private research details cleared.');
   availability.textContent='Please sign in again to view your research.';
  }
 };
 window.addEventListener('focus',()=>{void checkSwitch()});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)closeDetail();
  else void checkSwitch();
 });
 void refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();