'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('research/research-insert-menu.js','utf8');
const html=fs.readFileSync('research/wne.html','utf8');
const build=fs.readFileSync('scripts/build_public_release.cjs','utf8');
class Element{
 constructor(id='',tag='DIV'){
  this.id=id;this.tagName=tag;this.parent=null;this.children=[];this.listeners={};
  this.attributes={};this.classList={add(){}};this.style={};this.hidden=false;
  this.textContent='';this.type='';this.focused=false;this.offsetWidth=218;this.offsetHeight=110;
 }
 setAttribute(key,val){this.attributes[key]=val}
 getAttribute(key){return this.attributes[key]}
 append(child){if(child.parent)child.parent.children=child.parent.children.filter(c=>c!==child);this.children.push(child);child.parent=this}
 insertBefore(child,before){if(child.parent)child.parent.children=child.parent.children.filter(c=>c!==child);this.children.splice(this.children.indexOf(before),0,child);child.parent=this}
 get firstChild(){return this.children[0]}
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn)}
 focus(){this.focused=true;doc.activeElement=this}
 contains(el){for(let p=el;p;p=p.parent){if(p===this)return true}return false}
 closest(selector){if(selector==='#dd-insert-image, #dd-insert-comparison')return ['dd-insert-image','dd-insert-comparison'].includes(this.id)?this:null;return null}
 getBoundingClientRect(){return {left:38,top:100,bottom:140}}
 dispatch(type,props={}){for(const fn of this.listeners[type]||[])fn({target:this,key:'',preventDefault(){},...props})}
}
const bar=new Element('toolbar'),editor=new Element('editor'),image=new Element('dd-insert-image','BUTTON'),compare=new Element('dd-insert-comparison','BUTTON'),body=new Element('body');
const paragraph=new Element('paragraph');editor.append(paragraph);bar.append(image);bar.append(compare);
const byId=new Map([bar,editor,image,compare].map(x=>[x.id,x]));
let oldCalls=0;image.addEventListener('click',()=>oldCalls++);compare.addEventListener('click',()=>oldCalls++);
const doc={body,activeElement:null,querySelector:s=>s==='.formatbar'?bar:null,
 getElementById:id=>byId.get(id)||body.children.find(x=>x.id===id)||bar.children.find(x=>x.id===id)||null,
 createElement:tag=>new Element('',tag.toUpperCase()),
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn)},listeners:{}
};
const range={commonAncestorContainer:paragraph,cloneRange(){return this}};
let count=0;
const selection={anchorNode:paragraph,rangeCount:1,getRangeAt:()=>range,
 removeAllRanges:()=>{},addRange:()=>{count++}};
const win={innerWidth:375,innerHeight:800,listeners:{},
 getSelection:()=>selection,matchMedia:()=>({matches:true}),
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn)}};
vm.runInNewContext(source,{document:doc,window:win,console},{timeout:3000});
const trigger=bar.children[0],menu=body.children[0];
assert.equal(trigger.id,'dd-research-insert-trigger');
assert.equal(menu.id,'dd-research-insert-menu');
assert.deepEqual(menu.children,[image,compare],'existing buttons relocated, not cloned');
assert.equal(trigger.getAttribute('aria-controls'),menu.id);
assert.equal(trigger.getAttribute('aria-haspopup'),'menu');
assert.ok(menu.hidden);
trigger.dispatch('pointerdown');trigger.dispatch('click');
assert.equal(menu.hidden,false);
assert.equal(trigger.getAttribute('aria-expanded'),'true');
assert.equal(menu.style.left,'10px');
menu.dispatch('click',{target:image});image.dispatch('click');
assert.equal(menu.hidden,true);assert.equal(oldCalls,1,'original click handler still connected');
assert.equal(count,1,'previous edit selection restored before original action');
trigger.dispatch('click');menu.dispatch('keydown',{key:'Escape'});assert.equal(menu.hidden,true);
trigger.dispatch('click');doc.listeners.pointerdown[0]({target:editor});assert.equal(menu.hidden,true);
vm.runInNewContext(source,{document:doc,window:win,console},{timeout:3000});
assert.equal(bar.children.filter(x=>x.id==='dd-research-insert-trigger').length,1,'idempotent');
assert.match(html,/research-insert-menu\.js/);
assert.match(html,/#dd-research-insert-menu\[hidden\]\{display:none!important\}/);
assert.match(build,/'research-insert-menu\.js'/);
assert.match(source,/restoreSelection\(\)/);
assert.match(source,/document\.addEventListener\('pointerdown'/);
console.log('PASS: Insert menu grouping, selection, event handlers, mobile placement, keyboard/outside close and restricted packaging');
