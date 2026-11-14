'use strict';
/*
 * R3 local alpha only. Shared Node hypothesis engine and browser WebCrypto
 * vault; explicit encrypted IndexedDB saving, NO account auth, server requests,
 * background publishing, outside scripts or evidence scoring.
 */
(()=>{
 const engine=window.DDHypothesisLab;
 const vault=window.DDPrivateVault;
 const $=id=>document.getElementById(id);
 if(!engine||!vault){$('notice').hidden=false;$('notice').textContent='Secure hypothesis engine unavailable; no notebook was loaded.';return;}
 let book=null,selectedId=null,editingId=null,view='write';
 let unlockedVault=null, busy=false;
 const selected=()=>book?.hypotheses.find(h=>h.id===selectedId)||null;
 const latest=h=>h?.revisions[h.revisions.length-1]||null;
 const elt=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  return node;
 };
 const status=(msg,error=false)=>{
  const node=$('notice');node.textContent=msg;node.classList.toggle('error',error);node.hidden=false;
 };
 const hideStatus=()=>{$('notice').hidden=true;$('notice').textContent=''};
 const time=()=>new Date(Math.max(Date.now(),book?Date.parse(book.updatedAt)+1:0)).toISOString();
 const lines=id=>$(id).value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const slug=(title,count)=>{
  let out=String(title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9 -]/g,'')
   .replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,54);
  return 'h-'+(out||'idea')+'-'+count;
 };
 function renderDock(){
  const tabs=[
   ['◈','News'],['▥','Archive'],['♙','Who’s Who'],['✎','W.NE'],
   ['◎','Map'],['▶','Videos'],['●','LIVE'],['▣','Boards'],
   ['◉','Witness'],['☷','Discussions'],['♫','Watch & Read'],
   ['▢','Chat'],['♙','Profile'],['☷','Explore']
  ];
  const rail=$('dockScroll');
  for(const [icon,label] of tabs){
   const b=elt('button','dock-tab'+(label==='Boards'?' current':''));b.type='button';b.disabled=true;
   b.title='Original 14-tab design reference only; not connected to the live site';
   b.setAttribute('aria-label',label+' (design preview only)');
   const picture=elt('span','',icon);picture.setAttribute('aria-hidden','true');
   b.append(picture,document.createTextNode(label));rail.appendChild(b);
  }
  $('dockPrev').addEventListener('click',()=>rail.scrollBy({left:-220,behavior:'smooth'}));
  $('dockNext').addEventListener('click',()=>rail.scrollBy({left:220,behavior:'smooth'}));
  const arrows=()=>{
   const max=rail.scrollWidth-rail.clientWidth;
   $('dockPrev').disabled=rail.scrollLeft<5;
   $('dockNext').disabled=max<5||rail.scrollLeft>=max-5;
  };
  rail.addEventListener('scroll',arrows,{passive:true});window.addEventListener('resize',arrows);
  requestAnimationFrame(arrows);
 }
 function section(root,title,items){
  const box=elt('div','detail-block');box.appendChild(elt('h3','',title));
  if(!items.length){box.appendChild(elt('p','', 'Not supplied in this draft'));root.appendChild(box);return;}
  const ul=elt('ul');
  for(const item of items)ul.appendChild(elt('li','',item));
  box.appendChild(ul);root.appendChild(box);
 }
 function paintContent(root,content){
  root.replaceChildren();
  section(root,'Assumptions',content.assumptions);
  section(root,'Predicted observations',content.predictions.map(p=>
   p.predictedObservation+' — If observed: '+p.ifObserved+'; if not: '+p.ifNotObserved+'; test: '+p.howToTest));
  section(root,'Potentially disconfirming evidence',
   content.disconfirmingTests.map(x=>x.potentiallyDisconfirmingObservation+' — Check: '+x.howToCheck));
  section(root,'Alternative interpretations',content.alternativeInterpretations);
  const sources=elt('div','detail-block');
  sources.appendChild(elt('h3','', 'Source references · not independently verified'));
  if(!content.sources.length)sources.appendChild(elt('p','', 'No references provided yet.'));
  else{
   const ul=elt('ul');
   for(const source of content.sources){
    const li=elt('li');
    const a=elt('a','',source.label);a.href=source.url;
    a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
    li.appendChild(a);
    if(source.locator)li.appendChild(document.createTextNode(' — '+source.locator));
    ul.appendChild(li);
   }
   sources.appendChild(ul);
  }
  root.appendChild(sources);
 }
 function showView(next){
  view=next;
  for(const key of ['write','compare','history']){
   $(key+'View').hidden=key!==next;
   $(key+'Tab').setAttribute('aria-selected',String(key===next));
  }
  if(next==='compare')renderCompareOptions();
  if(next==='history')renderHistoryOptions();
 }
 function renderList(){
  const host=$('hypothesisList');host.replaceChildren();
  $('countTag').textContent=String(book.hypotheses.length);
  if(!book.hypotheses.length)host.appendChild(elt('p','muted small','None yet. Add your first working explanation.'));
  for(const h of book.hypotheses){
   const r=latest(h),b=elt('button','hypothesis-item'+(h.id===selectedId?' active':''));
   b.type='button';b.dataset.hypothesisId=h.id;
   b.appendChild(elt('strong','',r.content.title));
   b.appendChild(elt('span','', 'Revision '+r.revision+' · '+(r.content.sources.length?'Citations linked':'Sources needed')));
   b.addEventListener('click',()=>{
    selectedId=h.id;editingId=null;renderList();renderSelected();showView('write');
   });
   host.appendChild(b);
  }
 }
 function renderSelected(){
  const h=selected();
  $('editorForm').hidden=true;editingId=null;
  $('writeEmpty').hidden=!!h;
  $('selectedPreview').hidden=!h;
  if(!h)return;
  const r=latest(h);
  $('selectedTitle').textContent=r.content.title;
  $('selectedExplanation').textContent=r.content.explanation;
  $('currentVersion').textContent='Revision '+r.revision+' · '+r.recordedAt.replace('T',' ').slice(0,16)+' UTC';
  paintContent($('selectedSections'),r.content);
 }
 function renderCompareOptions(){
  const host=$('compareOptions'),prior=new Set([...host.querySelectorAll('input:checked')].map(x=>x.value));
  host.replaceChildren();
  for(const h of book.hypotheses){
   const label=elt('label','check-item'),check=elt('input');check.type='checkbox';check.value=h.id;
   check.checked=prior.size?prior.has(h.id):true;
   label.append(check,document.createTextNode(latest(h).content.title));host.appendChild(label);
  }
 }
 function renderComparison(){
  hideStatus();const ids=[...$('compareOptions').querySelectorAll('input:checked')].map(x=>x.value);
  let compared;
  try{compared=engine.compareHypotheses(book,{workspaceId:book.workspaceId,ids});}
  catch(err){status(err.message,true);return;}
  const root=$('comparisonResult');root.replaceChildren();
  for(const item of compared.hypotheses){
   const card=elt('article','compare-column');card.appendChild(elt('h3','',item.content.title));
   card.appendChild(elt('p','muted small','Revision '+item.revision+' · Research draft, not verified'));
   card.appendChild(elt('p','',item.content.explanation));
   const structured=elt('div','structured-preview');paintContent(structured,item.content);
   card.appendChild(structured);root.appendChild(card);
  }
  status('Unranked comparison created locally. No hypothesis has been graded or published.');
 }
 function renderHistoryOptions(){
  const select=$('historyPerson'),previous=select.value;select.replaceChildren();
  const prompt=elt('option','','Select an explanation');prompt.value='';select.appendChild(prompt);
  for(const h of book.hypotheses){
   const option=elt('option','',latest(h).content.title);option.value=h.id;select.appendChild(option);
  }
  select.value=book.hypotheses.some(h=>h.id===previous)?previous:(selectedId||'');
  renderHistory();
 }
 function renderHistory(){
  const id=$('historyPerson').value;
  const h=book.hypotheses.find(x=>x.id===id);
  const buttons=$('revisionList');buttons.replaceChildren();
  $('historySnapshot').replaceChildren();
  if(!h)return;
  for(const item of h.revisions){
   const b=elt('button','', 'Version '+item.revision);b.type='button';
   b.dataset.revision=String(item.revision);
   b.addEventListener('click',()=>paintRevision(h,item.revision));
   buttons.appendChild(b);
  }
  paintRevision(h,h.revisions.length);
 }
 function paintRevision(h,number){
  const current=engine.revision(book,{workspaceId:book.workspaceId,id:h.id,number});
  for(const b of $('revisionList').querySelectorAll('button'))
   b.setAttribute('aria-pressed',String(b.dataset.revision===String(number)));
  const root=$('historySnapshot');root.replaceChildren();
  const header=elt('div','detail-block');
  header.append(elt('h3','',current.content.title),
   elt('p','', 'Recorded '+current.recordedAt+' · Version '+current.revision));
  header.appendChild(elt('p','',current.content.explanation));root.appendChild(header);
  const structure=elt('div','structured-preview');paintContent(structure,current.content);
  root.appendChild(structure);
 }
 function renderNotebook(){
  if(!book)return;
  $('setupPanel').hidden=true;$('vaultAccessPanel').hidden=true;$('workPanel').hidden=false;
  $('notebookHeading').textContent=book.title;
  $('notebookMeta').textContent='Workspace '+book.workspaceId+' · Case '+book.caseId+' · Private session';
  renderList();renderSelected();showView(view);
 }
 const fieldDescriptions={
  prediction:[
   ['predictedObservation','Predicted observation'],
   ['ifObserved','If observed, what would it mean?'],
   ['ifNotObserved','If not observed, what would it mean?'],
   ['howToTest','How could this be tested?']
  ],
  disconfirm:[
   ['potentiallyDisconfirmingObservation','Potentially disconfirming observation'],
   ['howToCheck','How would this be checked?']
  ],
  source:[
   ['label','Source / publisher label'],
   ['url','Public HTTPS source URL'],
   ['locator','Page, section or timestamp (optional)']
  ]
 };
 function addEntry(kind,values={}){
  const map={prediction:'predictionEntries',disconfirm:'disconfirmEntries',source:'sourceEntries'};
  const host=$(map[kind]);const existing=host.querySelectorAll('.entry-card');
  if(existing.length>=(kind==='source'?30:20)){
   status('Maximum number of '+kind+' entries reached.',true);return;
  }
  const box=elt('div','entry-card');box.dataset.kind=kind;
  const top=elt('div','entry-top');
  top.appendChild(elt('h4','',kind==='prediction'?'Prediction':kind==='disconfirm'?'Disconfirming test':'Citation'));
  const remove=elt('button','', 'Remove');remove.type='button';
  remove.addEventListener('click',()=>{
   if(kind!=='source'&&host.querySelectorAll('.entry-card').length===1){
    status('At least one '+kind+' entry is required.',true);return;
   }
   box.remove();
  });
  top.appendChild(remove);box.appendChild(top);
  for(const [key,labelText] of fieldDescriptions[kind]){
   const label=elt('label','',labelText);
   const input=kind==='source'?elt('input'):elt('textarea');
   input.dataset.field=key;input.value=values[key]||'';
   input.required=kind!=='source'||key!=='locator';
   if(kind==='source'&&key==='url')input.type='url';
   if(kind==='source'){input.maxLength=key==='url'?2048:key==='label'?180:600;}
   else{input.rows=2;input.maxLength=1200;}
   label.appendChild(input);box.appendChild(label);
  }
  host.appendChild(box);
 }
 function readEntries(kind){
  const host=$({prediction:'predictionEntries',disconfirm:'disconfirmEntries',source:'sourceEntries'}[kind]);
  return [...host.querySelectorAll('.entry-card')].map((item,index)=>{
   const values={};
   for(const node of item.querySelectorAll('[data-field]'))values[node.dataset.field]=node.value.trim();
   if(kind==='prediction')values.id='prediction-'+(index+1);
   if(kind==='disconfirm')values.id='disconfirm-'+(index+1);
   return values;
  }).filter(item=>kind!=='source'||Object.values(item).some(Boolean));
 }
 function populateEditor(h){
  const original=h?latest(h).content:null;
  $('hypothesisTitle').value=original?.title||'';
  $('hypothesisExplanation').value=original?.explanation||'';
  $('assumptionsInput').value=original?.assumptions.join('\n')||'';
  $('alternativesInput').value=original?.alternativeInterpretations.join('\n')||'';
  for(const host of ['predictionEntries','disconfirmEntries','sourceEntries'])$(host).replaceChildren();
  for(const p of original?.predictions||[{}])addEntry('prediction',p);
  for(const d of original?.disconfirmingTests||[{}])addEntry('disconfirm',d);
  for(const source of original?.sources||[])addEntry('source',source);
 }
 function openEditor(h=null){
  if(!book)return;
  hideStatus();editingId=h?.id||null;
  showView('write');
  $('writeEmpty').hidden=true;$('selectedPreview').hidden=true;$('editorForm').hidden=false;
  $('formMode').textContent=h?'CREATE A NEW VERSION':'NEW WORKING EXPLANATION';
  $('saveHypothesisBtn').textContent=h?'Save new revision':'Save private hypothesis';
  populateEditor(h);
  $('editorForm').scrollIntoView({behavior:'smooth',block:'start'});
  $('hypothesisTitle').focus({preventScroll:true});
 }
 function getContent(){
  return {
   title:$('hypothesisTitle').value.trim(),
   explanation:$('hypothesisExplanation').value.trim(),
   assumptions:lines('assumptionsInput'),
   predictions:readEntries('prediction'),
   disconfirmingTests:readEntries('disconfirm'),
   alternativeInterpretations:lines('alternativesInput'),
   sources:readEntries('source')
  };
 }
 async function saveHypothesis(event){
  event.preventDefault();if(busy)return;hideStatus();
  busy=true;$('saveHypothesisBtn').disabled=true;
  try{
   const content=getContent();
   const revising=!!editingId,id=revising?editingId:slug(content.title,book.hypotheses.length+1);
   const next=revising?
    engine.reviseHypothesis(book,{workspaceId:book.workspaceId,id,content,at:time()}):
    engine.addHypothesis(book,{workspaceId:book.workspaceId,id,content,at:time()});
   if(unlockedVault){
    const generation=await vault.save(next,unlockedVault.key,unlockedVault.generation);
    unlockedVault.generation=generation;
   }
   book=next;selectedId=id;editingId=null;
   renderList();renderSelected();
   updateSecurityUI();
   status(unlockedVault?'Encrypted local save complete. Previous revisions preserved.':
    'Draft saved in memory ONLY. Enable encryption before closing the page.');
  }catch(err){status('Save was NOT completed: '+err.message,true)}
  finally{busy=false;$('saveHypothesisBtn').disabled=false}
 }
 function createNotebook(event){
  event.preventDefault();hideStatus();
  try{
   book=engine.createNotebook({
    workspaceId:$('workspaceInput').value.trim(),
    caseId:$('caseInput').value.trim(),
    title:$('notebookInput').value.trim(),at:new Date().toISOString()
   });
   selectedId=null;view='write';renderNotebook();updateSecurityUI();
   status('Notebook created in memory only. Enable encrypted saving to keep it after closing.');
  }catch(err){status(err.message,true);}
 }
 const demoContent=(title,description,observation)=>({
  title,explanation:description,
  assumptions:['The fictional report can be reviewed separately from interpretations.'],
  alternativeInterpretations:['Another hypothetical mechanism could explain the same pattern.'],
  predictions:[{id:'prediction-1',predictedObservation:observation,
   ifObserved:'Would warrant reviewing the original record, not proof.',
   ifNotObserved:'Would motivate re-examining the working explanation.',
   howToTest:'Compare fictional records and their stated measurement limitations.'}],
  disconfirmingTests:[{id:'disconfirm-1',
   potentiallyDisconfirmingObservation:'A synthetic independent measurement inconsistent with this idea',
   howToCheck:'Check the fictional original report and calibration history.'}],
  sources:[]
 });
 function loadDemo(){
  if(unlockedVault){status('Lock your encrypted notebook before loading a different demo.',true);return;}
  if(book&&!window.confirm('Replace your in-memory notebook with a fictional demo? Unsaved work will be lost.'))return;
  book=engine.createNotebook({workspaceId:'demo-workspace',caseId:'fictional-case',
   title:'Fictional case — demonstration only',at:new Date().toISOString()});
  book=engine.addHypothesis(book,{workspaceId:book.workspaceId,id:'h-environmental',
   content:demoContent('Environmental interpretation','A hypothetical environmental mechanism might match the fictional report.',
    'Repeatable environmental readings would align with the fictional observations.'),at:time()});
  book=engine.addHypothesis(book,{workspaceId:book.workspaceId,id:'h-instrument',
   content:demoContent('Instrument interpretation','An imaginary instrument artefact might produce a similar pattern.',
    'A replicated sensor effect under controlled conditions would be detectable.'),at:time()});
  selectedId='h-environmental';view='write';renderNotebook();
  updateSecurityUI();status('Fictional demonstration loaded in memory. Enable encrypted saving if you wish to keep it.');
 }
 function clearDecryptedDOM(){
  for(const id of ['hypothesisList','selectedSections','comparisonResult',
   'compareOptions','revisionList','historySnapshot','predictionEntries',
   'disconfirmEntries','sourceEntries'])$(id).replaceChildren();
  $('editorForm').reset();
  $('notebookHeading').textContent='';$('notebookMeta').textContent='';
  $('selectedTitle').textContent='';$('selectedExplanation').textContent='';
  $('currentVersion').textContent='';
  $('historyPerson').replaceChildren();
  $('workspaceInput').value='';$('caseInput').value='';$('notebookInput').value='';
  for(const id of ['vaultNewPassphrase','vaultConfirmPassphrase',
   'unlockPassphrase','importPassphrase'])$(id).value='';
  $('importVaultFile').value='';
 }
 async function refreshVaultAccess(){
  const stored=await vault.readStored();
  $('vaultAccessPanel').hidden=!!book;
  $('unlockVaultForm').hidden=!stored;
  $('importVaultForm').hidden=!!stored;
  $('deleteVaultBtn').hidden=!stored;
  $('vaultAccessStatus').textContent=stored?
   'An encrypted notebook was found in this Chrome profile. Enter its passphrase to recover it.':
   'No local encrypted notebook found. You can restore a password-protected backup here, or start a fresh notebook.';
  if(!book)$('vaultBadge').textContent=stored?'◉ Encrypted notebook locked':'◉ Session only · not saved';
 }
 function updateSecurityUI(){
  $('enableVaultForm').hidden=!!unlockedVault;
  $('lockVaultBtn').hidden=!unlockedVault;
  $('exportBtn').disabled=!unlockedVault;
  $('vaultSaveState').textContent=unlockedVault?
   'Encrypted autosave active for completed revisions. Download a separate encrypted backup in case Chrome data is cleared.':
   'Session-only: this notebook is NOT stored. Closing or refreshing will lose it.';
  $('vaultBadge').textContent=unlockedVault?'◉ Encrypted on this device':'◉ Session only · not saved';
 }
 async function enableEncryption(event){
  event.preventDefault();if(!book||busy||unlockedVault)return;
  const pass=$('vaultNewPassphrase').value;
  const confirm=$('vaultConfirmPassphrase').value;
  if(pass!==confirm){status('Passphrase confirmation does not match.',true);return;}
  busy=true;$('enableVaultBtn').disabled=true;hideStatus();
  try{
   const session=await vault.create(book,pass);
   unlockedVault=session;
   updateSecurityUI();
   status('Encrypted notebook saved in this browser. Reopen with your passphrase and download a separate encrypted backup.');
   await refreshVaultAccess();
  }catch(err){status('Encryption was NOT enabled: '+err.message,true)}
  finally{
   $('vaultNewPassphrase').value='';$('vaultConfirmPassphrase').value='';
   busy=false;$('enableVaultBtn').disabled=false;
  }
 }
 async function unlockEncrypted(event){
  event.preventDefault();if(busy)return;busy=true;$('unlockVaultBtn').disabled=true;
  try{
   const session=await vault.unlock($('unlockPassphrase').value);
   book=session.book;unlockedVault={key:session.key,generation:session.generation};
   selectedId=book.hypotheses[0]?.id||null;editingId=null;view='write';
   renderNotebook();updateSecurityUI();await refreshVaultAccess();
   status('Encrypted notebook unlocked locally. All saved revisions recovered.');
  }catch(err){status('Unlock failed: '+err.message,true)}
  finally{$('unlockPassphrase').value='';$('unlockVaultBtn').disabled=false;busy=false}
 }
 async function importEncrypted(event){
  event.preventDefault();if(busy)return;
  const file=$('importVaultFile').files?.[0];
  if(!file||file.size>2*1024*1024){
   status('Select an encrypted R3 backup smaller than 2 MB.',true);return;
  }
  busy=true;$('importVaultBtn').disabled=true;hideStatus();
  try{
   const session=await vault.importBackup(await file.text(),$('importPassphrase').value);
   book=session.book;unlockedVault={key:session.key,generation:session.generation};
   selectedId=book.hypotheses[0]?.id||null;editingId=null;view='write';
   renderNotebook();updateSecurityUI();await refreshVaultAccess();
   status('Encrypted backup restored to browser storage. Previous revisions preserved.');
  }catch(err){status('Restore failed; no existing data was replaced: '+err.message,true)}
  finally{
   $('importPassphrase').value='';$('importVaultFile').value='';
   $('importVaultBtn').disabled=false;busy=false;
  }
 }
 async function exportEncrypted(){
  if(!unlockedVault||busy)return;
  busy=true;$('exportBtn').disabled=true;
  try{
   const text=await vault.encryptedExport(unlockedVault.generation);
   const blob=new Blob([text],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const a=elt('a');a.href=url;
   a.download='disclosure-desk-R3-ENCRYPTED-backup.json';
   document.body.appendChild(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1500);
   status('Encrypted backup download requested. Store the file safely; only your passphrase can open it.');
  }catch(err){status('Backup download failed: '+err.message,true)}
  finally{busy=false;$('exportBtn').disabled=!unlockedVault}
 }
 async function closeSession(){
  if(!book||busy)return;
  const prompt=unlockedVault?
   'Lock this notebook and clear the current page? Its latest completed revisions remain encrypted in this browser.':
   'Discard this UNSAVED session? Its changes cannot be recovered.';
  if(!window.confirm(prompt))return;
  clearDecryptedDOM();
  book=null;unlockedVault=null;selectedId=null;editingId=null;view='write';
  $('workPanel').hidden=true;$('setupPanel').hidden=false;
  hideStatus();
  try{await refreshVaultAccess()}catch(err){status(err.message,true)}
 }
 async function deleteSaved(){
  if(busy||unlockedVault){
   status('Lock the active notebook before deleting its encrypted local copy.',true);return;
  }
  if(window.prompt('Type DELETE to permanently erase the local encrypted notebook. Export a backup first if you need it.')!=='DELETE')return;
  busy=true;$('deleteVaultBtn').disabled=true;
  try{
   await vault.deleteLocalVault();
   await refreshVaultAccess();
   status('Local encrypted notebook deleted. No encrypted backups elsewhere were changed.');
  }catch(err){status(err.message,true)}
  finally{busy=false;$('deleteVaultBtn').disabled=false}
 }
 $('setupForm').addEventListener('submit',createNotebook);
 $('sampleBtn').addEventListener('click',loadDemo);
 $('newHypothesisBtn').addEventListener('click',()=>openEditor());
 $('emptyStartBtn').addEventListener('click',()=>openEditor());
 $('editSelectedBtn').addEventListener('click',()=>openEditor(selected()));
 $('cancelEditBtn').addEventListener('click',()=>{renderSelected();hideStatus()});
 $('editorForm').addEventListener('submit',saveHypothesis);
 $('addPredictionBtn').addEventListener('click',()=>addEntry('prediction'));
 $('addDisconfirmBtn').addEventListener('click',()=>addEntry('disconfirm'));
 $('addSourceBtn').addEventListener('click',()=>addEntry('source'));
 for(const key of ['write','compare','history'])
  $(key+'Tab').addEventListener('click',()=>{
   if(!$('editorForm').hidden&&!window.confirm('Leave this unfinished editor? Unsaved changes will be lost.'))return;
   if(key==='write')renderSelected();
   showView(key);hideStatus();
  });
 $('buildCompareBtn').addEventListener('click',renderComparison);
 $('historyPerson').addEventListener('change',renderHistory);
 $('exportBtn').addEventListener('click',exportEncrypted);
 $('resetBtn').addEventListener('click',closeSession);
 $('lockVaultBtn').addEventListener('click',closeSession);
 $('enableVaultForm').addEventListener('submit',enableEncryption);
 $('unlockVaultForm').addEventListener('submit',unlockEncrypted);
 $('importVaultForm').addEventListener('submit',importEncrypted);
 $('deleteVaultBtn').addEventListener('click',deleteSaved);
 renderDock();
 updateSecurityUI();
 refreshVaultAccess().catch(err=>status('Browser vault unavailable: '+err.message,true));
})();
