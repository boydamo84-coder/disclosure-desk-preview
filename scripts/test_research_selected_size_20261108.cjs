'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('research/wne.html','utf8');
const source=fs.readFileSync('research/research-text-size.js','utf8');
const docx=fs.readFileSync('research/docx-tools.js','utf8');
const pdf=fs.readFileSync('research/wne-export-integration.js','utf8');
const zip=fs.readFileSync('research/restore-library-core.js','utf8');
const pack=fs.readFileSync('scripts/build_public_release.cjs','utf8');
const sizes=[10,11,12,13,14,15,16,18,20,22,24];
class Node{
 constructor(tag='DIV',id=''){
  this.tagName=tag;this.nodeType=1;this.id=id;this.parentNode=null;this.children=[];this.listeners={};
  this.attributes={};this.classList={add(){}},this.contentEditable='false';this.value='';this.textContent='';
 }
 append(child){this.children.push(child);if(child?.nodeType)child.parentNode=this;return child}
 setAttribute(key,value){this.attributes[key]=String(value)}
 getAttribute(key){return this.attributes[key]||null}
 insertAdjacentElement(where,el){
  assert.equal(where,'afterend');
  const p=this.parentNode;if(!p)throw Error('No insertion parent');
  p.children.splice(p.children.indexOf(this)+1,0,el);el.parentNode=p;return el;
 }
 contains(n){for(let x=n;x;x=x.parentNode){if(x===this)return true;}return false}
 addEventListener(name,fn){(this.listeners[name]||=[]).push(fn)}
 removeEventListener(name,fn){this.listeners[name]=(this.listeners[name]||[]).filter(x=>x!==fn)}
 focus(){}
 dispatchEvent(e){for(const fn of this.listeners[e.type]||[])fn(e)}
 dispatch(name){this.dispatchEvent({type:name})}
 matches(selector){return false}
}
const bar=new Node('DIV','bar'),editor=new Node('DIV','editor'),parent=new Node('DIV','toolbar-parent'),size=new Node('SELECT','size');
parent.append(size);editor.contentEditable='true';
const p=new Node('P','paragraph');editor.append(p);
const t={nodeType:3,nodeValue:'Selected words',parentNode:p};p.append(t);
let inserts=0,selected=null,currentRange=null;
const textRange={
 startContainer:t,endContainer:t,collapsed:false,toString:()=>t.nodeValue,
 cloneContents:()=>({nodeType:11,childNodes:[{nodeType:3,nodeValue:'Selected words'}],querySelector:()=>null}),cloneRange(){return this},
 extractContents:()=>({nodeType:11,childNodes:[{nodeType:3,nodeValue:t.nodeValue}]}),
 insertNode(span){p.append(span);inserts++;},
};
currentRange=textRange;
const selection={
 rangeCount:1,getRangeAt(){return currentRange},removeAllRanges(){selected=null;this.rangeCount=0},
 addRange(r){selected=r;currentRange=r;this.rangeCount=1}
};
const doc={
 listeners:{},getElementById(id){return id==='editor'?editor:id==='size'?size:null},
 querySelector(sel){return sel==='.formatbar'?bar:null},
 createElement(tag){return new Node(tag.toUpperCase())},
 createRange(){return {selectNodeContents(span){this.startContainer=span;this.endContainer=span;this.collapsed=false},
  cloneRange(){return this}}},
 execCommand(command,showUi,markup){
  assert.equal(command,'insertHTML');assert.equal(showUi,false);
  assert.match(markup,/^<span data-wne-font-size="16">Selected words<\/span>$/);
  const span=new Node('SPAN');span.setAttribute('data-wne-font-size','16');
  p.append(span);inserts++;editor.dispatchEvent({type:'input',bubbles:true});return true;
 },
 addEventListener(name,fn){(this.listeners[name]||=[]).push(fn)}
};
const win={getSelection:()=>selection};
vm.runInNewContext(source,{document:doc,window:win,Option:class {constructor(text,value){this.text=text;this.value=value}},Event:class{constructor(type,opts){this.type=type;this.bubbles=!!opts?.bubbles}}},{timeout:3000});
const label=parent.children[1],control=label.children[0],status=parent.children[2];
assert.equal(control.id,'dd-research-selected-size');
assert.equal(control.attributes['aria-label'],'Selected text font size');
assert.equal(control.children.length,sizes.length+1,'only allowlisted sizes');
assert.equal(typeof win.DDResearchTextSize.getSelectionRange,'function');
let inputEvents=0;editor.addEventListener('input',()=>inputEvents++);
control.value='16';control.dispatch('pointerdown');control.dispatch('change');
assert.equal(inserts,1,'selected inline text was formatted exactly once');
assert.equal(inputEvents,1,'existing editor input autosave path invoked');
assert.equal(p.children[p.children.length-1].attributes['data-wne-font-size'],'16');
assert.match(status.textContent,/16 px/);
assert.equal(size.value,'','document-wide size untouched');
assert.equal(control.value,'','control reset');
control.value='999';control.dispatch('change');assert.equal(inserts,1,'invalid size never edits');
editor.contentEditable='false';control.value='18';control.dispatch('change');
assert.equal(inserts,1,'read-only editor cannot be formatted');
editor.contentEditable='true';
const p2=new Node('P','other');editor.append(p2);
const otherText={nodeType:3,nodeValue:'Different paragraph',parentNode:p2};p2.append(otherText);
currentRange={...textRange,startContainer:t,endContainer:otherText,cloneRange(){return this}};
control.value='20';control.dispatch('change');
assert.equal(inserts,1,'cross-paragraph formatting refused');
// The canonical save sanitizer is executed in isolation, not just checked as a string.
const start=html.indexOf('function sanitizeHtml(raw){'),stop=html.indexOf('function normalise(x){',start);
assert(start>0&&stop>start,'canonical W.NE sanitizer located');
const sanitizeSource=html.slice(start,stop);
class Parser{
 parseFromString(raw){
  const m=/<span(?: data-wne-font-size="([^"]*)")?(?: style="([^"]*)")?>([^<]*)<\/span>/.exec(raw);
  const span={nodeType:1,tagName:'SPAN',getAttribute:key=>
   key==='data-wne-font-size'?m?.[1]||null:key==='style'?m?.[2]||null:null,
   childNodes:[{nodeType:3,nodeValue:m?.[3]||''}]};
  return {body:{childNodes:[span]}};
 }
}
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sanitize=new Function('DOMParser','esc',sanitizeSource+'return sanitizeHtml;')(Parser,escape);
assert.equal(sanitize('<span data-wne-font-size="16">Selected words</span>'),
 '<span data-wne-font-size="16">Selected words</span>','valid font size survives save/reopen');
assert.equal(sanitize('<span data-wne-font-size="999">Selected words</span>'),
 'Selected words','arbitrary size removed');
assert.equal(sanitize('<span style="font-size:1000px">Selected words</span>'),
 'Selected words','unsanitized free-form font CSS is not retained');
// Separate export paths must recognize only the same safe data marker.
assert.match(docx,/next\.size=Math\.round\(Number\(selectedSize\)\*1\.5\)/,
 'DOCX selected font converted from CSS px to Word half-points');
assert.equal((docx.match(/'data-wne-font-size'/g)||[]).length>=2,true,
 'DOCX import and export sanitization allow the restricted attribute');
assert.match(pdf,/'data-wne-font-size'/);
for(const size of sizes){
 assert.ok(html.includes('#editor [data-wne-font-size="'+size+'"]{font-size:'+size+'px}'),
  'editor style missing '+size);
 assert.ok(pdf.includes('[data-wne-font-size="'+size+'"]{font-size:'+size+'px}'),
  'print/PDF style missing '+size);
}
assert.match(zip,/key==='data-wne-font-size'/);
// Check the actual restore validator, not merely the presence of the attribute name.
const startZip=zip.indexOf('function safeMarkup(html){');
const stopZip=zip.indexOf('async function inspect(file,zipLibrary){',startZip);
assert.ok(startZip>0&&stopZip>startZip);
class ZipParser{
 parseFromString(raw){
  const nodes=[];
  for(const match of raw.matchAll(/<([a-z][a-z0-9]*)([^>]*)>/gi)){
   const attributes=[];
   for(const att of match[2].matchAll(/([a-z][a-z0-9-]*)="([^"]*)"/gi))
    attributes.push({name:att[1],value:att[2]});
   nodes.push({tagName:match[1].toUpperCase(),attributes});
  }
  return {body:{querySelectorAll:()=>nodes}};
 }
}
const safeMarkup=new Function('DOMParser','MAX_DOC',zip.slice(startZip,stopZip)+'return safeMarkup;')(ZipParser,8*1024*1024);
assert.equal(safeMarkup('<p><span data-wne-font-size="16">Words</span></p>'),true,
 'formatted manuscript can pass ZIP restore validation');
assert.equal(safeMarkup('<p><span data-wne-font-size="999">Words</span></p>'),false,
 'ZIP restore blocks unsupported font-size markers');
assert.equal(safeMarkup('<figure width="100"><img src="data:image/jpeg;base64,QUJD" alt="Evidence"></figure>'),true,
 'existing resized W.NE evidence figures can pass ZIP restore');
assert.equal(safeMarkup('<img src="data:image/svg+xml;base64,QUJD">'),false,
 'untrusted executable image types stay blocked');

assert.match(zip,/data:image\\\/\(\?:png\|jpeg\|webp\)/);
assert.match(html,/src="\.\/research-text-size\.js" defer/);
assert.match(pack,/'research-text-size\.js'/);
console.log('PASS: selected text size, input save signal, invalid/range/read-only guards, canonical sanitizer, DOCX/PDF and ZIP compatibility');
