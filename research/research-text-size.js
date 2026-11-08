/* W.NE Research Edition only: selected-text size without changing the report-wide
 * font setting. Stored as a restricted data attribute, never arbitrary CSS.
 * Existing contenteditable input listener remains responsible for cloud saving.
 */
(()=>{
'use strict';
const editor=document.getElementById('editor');
const bar=document.querySelector('.formatbar');
const wholeSize=document.getElementById('size');
if(!editor||!bar||!wholeSize||document.getElementById('dd-research-selected-size'))return;
const SIZES=[10,11,12,13,14,15,16,18,20,22,24];
const allowed=new Set(SIZES);
const blockedTags='figure,table,img,iframe,video,object,svg,form,.dd-comparison-block';
const blocks=new Set(['P','DIV','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','PRE','TD','TH']);
const label=document.createElement('label');
label.id='dd-research-selected-size-label';
label.setAttribute('for','dd-research-selected-size');
label.textContent='Selection size';
const control=document.createElement('select');
control.id='dd-research-selected-size';
control.title='Select words first, then set the size of only those words';
control.setAttribute('aria-label','Selected text font size');
control.append(new Option('Select size…',''));
for(const size of SIZES)control.append(new Option(size+' px',String(size)));
label.append(control);
wholeSize.insertAdjacentElement('afterend',label);
const status=document.createElement('span');
status.id='dd-research-selected-size-status';
status.setAttribute('role','status');
status.setAttribute('aria-live','polite');
label.insertAdjacentElement('afterend',status);
let remembered=null;
function inEditor(node){return !!node&&(node===editor||editor.contains(node))}
function blockOf(node){
 for(let n=node;n&&n!==editor;n=n.parentNode){
  if(n.nodeType===1&&blocks.has(n.tagName))return n;
 }
 return editor;
}
function prohibited(node){
 for(let n=node;n&&n!==editor;n=n.parentNode){
  if(n.nodeType===1 && n.matches?.(blockedTags))return true;
 }
 return false;
}
function validRange(range){
 if(!range||range.collapsed||!inEditor(range.startContainer)||!inEditor(range.endContainer))return false;
 if(!range.toString().trim()||prohibited(range.startContainer)||prohibited(range.endContainer))return false;
 if(blockOf(range.startContainer)!==blockOf(range.endContainer))return false;
 // Moving a full block into a span can invalidate the document structure.
 const fragment=range.cloneContents();
 if(fragment.querySelector('p,div,li,h1,h2,h3,h4,h5,h6,blockquote,pre,figure,table,img,hr,br ~ table,svg,iframe,video,object,form'))return false;
 return true;
}
function remember(){
 const selection=window.getSelection();
 if(!selection?.rangeCount)return;
 const range=selection.getRangeAt(0);
 if(inEditor(range.startContainer)&&inEditor(range.endContainer)){
  remembered=range.collapsed?null:range.cloneRange();
 }
}
editor.addEventListener('pointerup',remember);
editor.addEventListener('keyup',remember);
editor.addEventListener('input',()=>{remembered=null});
document.addEventListener('selectionchange',remember);
control.addEventListener('pointerdown',remember);
control.addEventListener('touchstart',remember,{passive:true});
function apply(){
 const size=Number(control.value);
 control.value='';
 if(!allowed.has(size)){status.textContent='Choose a supported text size.';return false}
 if(editor.contentEditable!=='true'){status.textContent='Open an editable research document first.';return false}
 const selection=window.getSelection();
 let range=null;
 if(selection?.rangeCount){
  const candidate=selection.getRangeAt(0);
  if(validRange(candidate))range=candidate.cloneRange();
 }
 if(!range&&validRange(remembered))range=remembered.cloneRange();
 if(!range){
  status.textContent='Select words inside one paragraph, then choose their size.';
  return false;
 }
 try{
  // Native insertHTML participates in the browser's Undo/Redo history, unlike
  // Range.extractContents()+Range.insertNode() which silently bypasses Undo.
  // Serialize only a minimal safe inline subset; never inject untrusted raw HTML.
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
   .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const inlineTags=new Set(['b','strong','i','em','u','s','strike','sub','sup','code','mark','small']);
  function inlineHtml(node){
   if(node.nodeType===3)return esc(node.nodeValue||'');
   if(node.nodeType!==1&&node.nodeType!==11)return '';
   const tag=node.nodeType===1?node.tagName.toLowerCase():'';
   if(tag==='br')return '<br>';
   const content=Array.from(node.childNodes||[]).map(inlineHtml).join('');
   if(inlineTags.has(tag))return '<'+tag+'>'+content+'</'+tag+'>';
   if(tag==='span'){
    const existing=node.getAttribute('data-wne-font-size')||'';
    return allowed.has(Number(existing))&&existing.trim()!==''
     ?'<span data-wne-font-size="'+esc(existing)+'">'+content+'</span>':content;
   }
   if(tag==='a'){
    const href=node.getAttribute('href')||'';
    return /^https:\/\/[^<>"']+$/i.test(href)&&href.length<=1000
     ?'<a href="'+esc(href)+'">'+content+'</a>':content;
   }
   return content;
  }
  const markup='<span data-wne-font-size="'+size+'">'+inlineHtml(range.cloneContents())+'</span>';
  if(markup.length>250000)throw Error('Selected text is too large to format at once.');
  editor.focus({preventScroll:true});
  const current=window.getSelection();
  current.removeAllRanges();current.addRange(range);
  let inputFired=false;
  const onInput=()=>{inputFired=true};
  editor.addEventListener('input',onInput,{once:true});
  const applied=typeof document.execCommand==='function'&&document.execCommand('insertHTML',false,markup);
  editor.removeEventListener('input',onInput);
  if(!applied)throw Error('Undoable inline formatting is unavailable in this browser.');
  // Browser-native commands normally dispatch input, but keep W.NE autosave
  // wired in engines where insertion succeeds without an input notification.
  if(!inputFired)editor.dispatchEvent(new Event('input',{bubbles:true}));
  remembered=null;
  status.textContent='Selected text set to '+size+' px · Undo is available · saving.';
  return true;
 }catch(_){
  status.textContent='Font size could not be applied safely in this browser.';
  remembered=null;return false;
 }
}
control.addEventListener('change',apply);
window.DDResearchTextSize=Object.freeze({supportedSizes:SIZES.slice(),getSelectionRange:()=>remembered?.cloneRange()||null});
})();
