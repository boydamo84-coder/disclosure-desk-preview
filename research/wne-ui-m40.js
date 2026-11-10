/* M40 — Research Edition mobile UX. Presentation and source selection only.
 * Keep the existing compare and citation data/save handlers; never silently
 * rewrite a document, delete research, or publish anything.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('dd-comparison-dialog'),area=$('dd-comparison-json');
const tabs=$('dd-word-ribbon-v1'),panel=$('dd-word-context-v1');
if(!dialog||!area||!tabs||!panel)return;
const compareText=dialog.querySelector('h3');
const introduction=compareText?.nextElementSibling;
if(compareText)compareText.textContent='Compare evidence';
if(introduction?.tagName==='P')introduction.textContent='Choose your evidence. The preview updates automatically before anything is inserted.';
const subtitle=document.createElement('p');
subtitle.className='dd-m40-simple-label';
subtitle.textContent='Where is your evidence?';
const choices=$('dd-compare-sources');choices?.before(subtitle);
const heading=document.createElement('div');
heading.className='dd-m40-dialog-heading';
const body=document.createElement('div');
body.className='dd-m40-dialog-scroll';
const footer=document.createElement('div');
footer.className='dd-m40-dialog-footer';
if(compareText&&introduction){
 heading.append(compareText,introduction);
 const status=$('dd-comparison-status'),cancel=$('dd-comparison-cancel'),confirm=$('dd-comparison-confirm');
 const contents=[...dialog.children];
 for(const node of contents){
  if(node===compareText||node===introduction)continue;
  if(node===status||node===cancel||node===confirm)continue;
  body.append(node);
 }
 const advanced=document.createElement('details');
 advanced.id='dd-m40-advanced';
 const advancedTitle=document.createElement('summary');
 advancedTitle.textContent='More options (optional)';
 advanced.append(advancedTitle);
 const formats=body.querySelector('fieldset');
 const json=body.querySelector('details');
 if(formats)advanced.append(formats);
 if(json){json.hidden=true;advanced.append(json)} // Keep original internal data controls for handlers; users choose cases or saved comparisons.
 const preview=body.querySelector('#dd-comparison-preview');
 if(preview)preview.before(advanced);else body.append(advanced);
 if(status){status.classList.add('dd-m40-status');footer.append(status)}
 if(cancel){cancel.textContent='Cancel';footer.append(cancel)}
 if(confirm){confirm.textContent='Insert into document';footer.append(confirm)}
 dialog.append(heading,body,footer);
 dialog.classList.add('dd-m40-simple');
}
const archiveButton=$('dd-archive-search'),query=$('dd-archive-query');
const useArchive=$('dd-archive-use'),selectedLabel=$('dd-archive-selected');
const board=$('dd-compare-board'),item=$('dd-compare-item'),load=$('dd-load-saved-compare');
if(query){
 query.placeholder='Search by case, location or year';
 let debounce=null;
 query.addEventListener('input',()=>{
  clearTimeout(debounce);
  const value=query.value.trim();
  if(value.length>=2)debounce=setTimeout(()=>archiveButton?.click(),420);
 });
}
if(board){
 board.closest('label')?.prepend(document.createTextNode('1. '));
 board.addEventListener('change',()=>{
  area.value='';area.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
if(item){
 item.closest('label')?.prepend(document.createTextNode('2. '));
 item.addEventListener('change',()=>{
  area.value='';area.dispatchEvent(new Event('input',{bubbles:true}));
  if(item.value!=='')load?.click();
 });
}
if(load)load.textContent='Preview selection';
if(useArchive)useArchive.textContent='Refresh preview';
if(selectedLabel)selectedLabel.setAttribute('aria-live','polite');
const tabs2=[['dd-compare-archive-tab','Search cases'],['dd-compare-boards-tab','Saved comparisons']];
for(const [id,label] of tabs2){const b=$(id);if(b)b.textContent=label}
const preview=$('dd-comparison-preview'),previewMessage=$('dd-preview-message');
if(preview){
 const strong=preview.querySelector('strong');
 if(strong)strong.textContent='Your comparison preview';
}
if(previewMessage)previewMessage.textContent='Choose two cases or a saved comparison to see your preview.';
// Do not let a stale preview from the other source be inserted by mistake.
choices?.addEventListener('click',event=>{
 const button=event.target.closest('#dd-compare-archive-tab,#dd-compare-boards-tab');
 if(!button)return;
 if(button.id==='dd-compare-archive-tab'&&Number.parseInt(selectedLabel?.textContent||'0',10)>=2){
  useArchive?.click();return;
 }
 if(button.id==='dd-compare-boards-tab'&&item?.value!==''){load?.click();return}
 area.value='';area.dispatchEvent(new Event('input',{bubbles:true}));
},true);
dialog.addEventListener('close',()=>{const s=$('dd-comparison-status');if(s)s.textContent=''});
// The editor keeps a local, project-scoped reference ledger. Make it accessible
// from a first-class Citations ribbon tab without migrating or deleting it.
const citeTab=document.createElement('button');
citeTab.type='button';citeTab.dataset.ribbon='citations';citeTab.textContent='Citations';
citeTab.setAttribute('role','tab');citeTab.setAttribute('aria-selected','false');citeTab.tabIndex=-1;
const review=tabs.querySelector('[data-ribbon="review"]');
if(review)review.before(citeTab);else tabs.append(citeTab);
let citationsDialog=null,visibleProject='legacy',mode='saved';
const ledger='wne_research_references_v1',projectKey='wne_research_reference_projects_v1';
const linksKey='wne_research_doc_project_links_v1';
const safeJson=(s,fallback)=>{try{const o=JSON.parse(s);return o??fallback}catch{return fallback}};
const safeUrl=text=>{try{const u=new URL(text);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&u.href.length<=1800?u.href:null}catch{return null}};
function sourceKey(p){return p==='legacy'?ledger:ledger+'_'+p}
function projects(){
 const all=[{id:'legacy',name:'My saved references'}];
 const stored=safeJson(localStorage.getItem(projectKey)||'[]',[]);
 if(Array.isArray(stored))for(const p of stored){
  if(p&&/^p_[a-z0-9-]{1,60}$/.test(p.id)&&typeof p.name==='string')
   all.push({id:p.id,name:p.name.slice(0,100)});
 }
 return all;
}
function currentProject(){
 const id=new URLSearchParams(location.search).get('id');
 const links=safeJson(localStorage.getItem(linksKey)||'{}',{});
 return id&&typeof links==='object'&&typeof links[id]==='string'?links[id]:'legacy';
}
function entries(p){
 const list=safeJson(localStorage.getItem(sourceKey(p))||'[]',[]);
 return Array.isArray(list)?list.filter(x=>x&&typeof x.title==='string'&&safeUrl(x.url)).slice(0,500):[];
}
function make(tag,txt,cls){
 const e=document.createElement(tag);
 if(txt!==undefined)e.textContent=txt;
 if(cls)e.className=cls;
 return e;
}
function openLibrary(){
 try{const parent=window.parent!==window?window.parent:null;const b=parent?.document?.getElementById('bibleBtn');if(b){if(citationsDialog?.open)citationsDialog.close();b.click();return true}}catch(_){}
 return false;
}
function citationPreview(){
 if(!citationsDialog)return;
 const select=citationsDialog.querySelector('#dd-m40-cite-select');
 const pane=citationsDialog.querySelector('#dd-m40-cite-preview');
 const title=citationsDialog.querySelector('#dd-m40-cite-title').value.trim();
 const url=citationsDialog.querySelector('#dd-m40-cite-url').value.trim();
 const picker=citationsDialog.querySelector('#dd-m40-cite-project');
 const list=entries(picker.value);
 const chosen=select.value===''?null:list[Number(select.value)];
 const obj=mode==='saved'?chosen:{title,url,publisher:''};
 pane.replaceChildren();
 const valid=!!obj?.title&&!!safeUrl(obj?.url);
 const submit=citationsDialog.querySelector('#dd-m40-cite-insert');
 submit.disabled=!valid;
 if(!valid){pane.append(make('p',mode==='saved'?'Choose a saved reference, or tap Add new source.':'Enter a title and a valid http(s) source link.'));return}
 const heading=make('strong',obj.title);pane.append(heading);
 const a=make('a',safeUrl(obj.url));a.href=safeUrl(obj.url);a.rel='noopener noreferrer';a.target='_blank';
 pane.append(a);
 const style=citationsDialog.querySelector('#dd-m40-cite-style').value;
 const n=list.findIndex(x=>x.url===obj.url);
 const number=n>=0?n+1:list.length+1;
 const label=style==='academic'?'['+number+']':obj.title.replace(/[.!?]+$/,'')+'. Source: '+(obj.publisher||new URL(obj.url).hostname)+'. ['+number+']';
 pane.append(make('p','Will insert: '+label,'dd-m40-citation-example'));
}
function showCitationDialog(nextMode){
 if(!citationsDialog){
  const d=document.createElement('dialog');d.id='dd-m40-citation-dialog';d.className='dd-m40-citation-dialog';
  d.innerHTML='<div class="dd-m40-cite-head"><h2>Insert a citation</h2><p>Choose a saved source or add a reference. Preview it before inserting.</p></div><div class="dd-m40-cite-scroll"><div class="dd-m40-cite-modes" role="group" aria-label="Citation source"><button type="button" id="dd-m40-cite-saved">Saved sources</button><button type="button" id="dd-m40-cite-new">Add new source</button></div><label>Reference collection<select id="dd-m40-cite-project"></select></label><div id="dd-m40-cite-saved-area"><label>Choose a reference<select id="dd-m40-cite-select"></select></label></div><div id="dd-m40-cite-new-area" hidden><label>Source title<input id="dd-m40-cite-title" maxlength="160" placeholder="e.g. Original government report"></label><label>Source web link<input id="dd-m40-cite-url" type="url" maxlength="1800" placeholder="https://..."></label></div><label>Citation style<select id="dd-m40-cite-style"><option value="investigative">Investigative report</option><option value="academic">Numbered [1]</option></select></label><div id="dd-m40-cite-preview" aria-live="polite"></div><p class="dd-m40-help">References are saved locally in this browser, not automatically synced between devices.</p><button type="button" id="dd-m40-cite-library">Open Research Library</button></div><div class="dd-m40-cite-footer"><p id="dd-m40-cite-status" role="status"></p><button type="button" id="dd-m40-cite-close">Cancel</button><button type="button" id="dd-m40-cite-insert" disabled>Insert citation</button></div>';
  document.body.append(d);citationsDialog=d;
  d.querySelector('#dd-m40-cite-saved').onclick=()=>setCitationMode('saved');
  d.querySelector('#dd-m40-cite-new').onclick=()=>setCitationMode('new');
  d.querySelector('#dd-m40-cite-close').onclick=()=>d.close();
  d.querySelector('#dd-m40-cite-library').onclick=()=>{if(!openLibrary())d.querySelector('#dd-m40-cite-status').textContent='Open the Research Library tab in Research Studio.'};
  for(const id of ['dd-m40-cite-select','dd-m40-cite-style','dd-m40-cite-title','dd-m40-cite-url'])
   d.querySelector('#'+id).addEventListener('input',citationPreview);
  d.querySelector('#dd-m40-cite-project').addEventListener('change',()=>{
   visibleProject=d.querySelector('#dd-m40-cite-project').value;
   refreshCitationList();
  });
  d.querySelector('#dd-m40-cite-insert').onclick=insertCitation;
 }
 const p=citationsDialog.querySelector('#dd-m40-cite-project');
 p.replaceChildren();
 for(const x of projects())p.add(new Option(x.name,x.id));
 const active=currentProject();
 visibleProject=[...p.options].some(o=>o.value===active)?active:'legacy';p.value=visibleProject;
 citationsDialog.querySelector('#dd-m40-cite-status').textContent='';
 refreshCitationList();setCitationMode(nextMode||'saved');
 citationsDialog.showModal();
}
function refreshCitationList(){
 const d=citationsDialog;
 const select=d.querySelector('#dd-m40-cite-select');
 const list=entries(visibleProject);
 select.replaceChildren(new Option(list.length?'Choose a source…':'No saved sources in this collection',''));
 list.forEach((r,i)=>select.add(new Option(r.title.slice(0,100),String(i))));
 citationPreview();
}
function setCitationMode(next){
 mode=next;
 const d=citationsDialog;
 d.querySelector('#dd-m40-cite-saved-area').hidden=next!=='saved';
 d.querySelector('#dd-m40-cite-new-area').hidden=next!=='new';
 d.querySelector('#dd-m40-cite-saved').setAttribute('aria-pressed',String(next==='saved'));
 d.querySelector('#dd-m40-cite-new').setAttribute('aria-pressed',String(next==='new'));
 d.querySelector('#dd-m40-cite-insert').textContent=next==='new'?'Save and insert':'Insert citation';
 citationPreview();
}
function insertCitation(){
 const d=citationsDialog,output=d.querySelector('#dd-m40-cite-status'),button=d.querySelector('#dd-m40-cite-insert');
 const editor=$('editor');
 if(!editor?.isContentEditable){output.textContent='This document is not editable. Check cloud save status.';return}
 const select=d.querySelector('#dd-m40-cite-select');
 const p=d.querySelector('#dd-m40-cite-project').value;
 const list=entries(p);
 const source=mode==='saved'?(select.value===''?null:list[Number(select.value)]):{
  title:d.querySelector('#dd-m40-cite-title').value.trim(),
  url:d.querySelector('#dd-m40-cite-url').value.trim(),
  publisher:''
 };
 const valid=safeUrl(source?.url);
 if(!source?.title||!valid){output.textContent='Choose a valid source first.';return}
 const url=valid;
 if(p!==currentProject()){
  output.textContent='This document is linked to a different reference collection. Open Research Library to change the document link first.';
  return;
 }
 const existing=list.findIndex(x=>x.url===url);
 if(existing<0&&list.length>=499){output.textContent='This collection is full. Export it from Research Library.';return}
 const next=existing<0?[...list,{title:source.title.slice(0,160),url,publisher:source.publisher||new URL(url).hostname,addedAt:new Date().toISOString()}]:list;
 const number=existing<0?next.length:existing+1;
 const publisher=source.publisher||new URL(url).hostname;
 const style=d.querySelector('#dd-m40-cite-style').value;
 const insertion=style==='academic'?'['+number+']':source.title.replace(/[.!?]+$/,'')+'. Source: '+publisher+'. ['+number+']';
 try{
  button.disabled=true;
  // Maintain the reference ledger before modifying the editor, like the
  // existing Research Library citation path. Cancel is always non-destructive.
  localStorage.setItem(sourceKey(p),JSON.stringify(next));
  d.close();
  editor.focus();
  const range=document.createRange();range.selectNodeContents(editor);range.collapse(false);
  const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
  if(!document.execCommand('insertText',false,'\n'+insertion))throw Error('Editor did not accept this citation.');
  editor.dispatchEvent(new Event('input',{bubbles:true}));
 }catch(e){if(!d.open)d.showModal();output.textContent=e.message||'Citation not inserted';button.disabled=false}
}
function showCitationsTab(){
 document.body.dataset.ddRibbonView='citations';
 for(const b of tabs.querySelectorAll('[data-ribbon]')){
  const selected=b===citeTab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;
 }
 panel.replaceChildren();panel.hidden=false;
 const choose=make('button','📚 Choose saved citation'),add=make('button','＋ Add source'),library=make('button','Research Library');
 [choose,add,library].forEach(b=>{b.type='button';b.classList.add('dd-m40-ribbon-action');panel.append(b)});
 choose.onclick=()=>showCitationDialog('saved');
 add.onclick=()=>showCitationDialog('new');
 library.onclick=()=>{if(!openLibrary())window.WNEExportNotice?.('Open Research Library from the Research Studio header.')};
}
tabs.addEventListener('click',event=>{
 if(!event.target.closest('[data-ribbon="citations"]'))return;
 event.stopImmediatePropagation();event.preventDefault();showCitationsTab();
},true);
tabs.addEventListener('keydown',()=>queueMicrotask(()=>{
 if(document.body.dataset.ddRibbonView==='citations')showCitationsTab();
}));
})();