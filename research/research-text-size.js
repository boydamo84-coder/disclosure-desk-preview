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
  const span=document.createElement('span');
  span.setAttribute('data-wne-font-size',String(size));
  // All changes are confined to the selected inline fragment.
  span.append(range.extractContents());
  range.insertNode(span);
  const next=document.createRange();
  next.selectNodeContents(span);
  const current=window.getSelection();
  current.removeAllRanges();current.addRange(next);
  remembered=next.cloneRange();
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  status.textContent='Selected text set to '+size+' px · saving with your research document.';
  return true;
 }catch(_){
  status.textContent='Text formatting was not applied. Your document was not deliberately replaced.';
  remembered=null;return false;
 }
}
control.addEventListener('change',apply);
window.DDResearchTextSize=Object.freeze({supportedSizes:SIZES.slice(),getSelectionRange:()=>remembered?.cloneRange()||null});
})();
