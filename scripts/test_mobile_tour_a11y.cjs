'use strict';
// No network/browser deployment. Evaluate the actual inline guided-tour block
// in a tiny fake DOM, and statically verify 11-tab mobile accessibility.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync('index.html','utf8');
const start=source.indexOf('const tourSections=[');
const end=source.indexOf("window.addEventListener('load'",start);
assert.ok(start>0&&end>start,'Recognise the existing real site tour');
const script=source.slice(start,end);
const selectors=source.slice(source.indexOf('<nav class="nav"'),source.indexOf('</nav>',source.indexOf('<nav class="nav"'))+6);
const tabs=[...selectors.matchAll(/<button class="tab(?: active)?" data-tab="([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(tabs,['discover','archivePage','researchStudio','mapPage','clips','livePage',
 'boards','witness','watchRead','hub','profilePage'],'All 11 real tabs remain in order');
assert.match(selectors,/data-tab="discover" aria-current="page"/);
assert.match(source,/if\(selected\)t\.setAttribute\('aria-current','page'\);else t\.removeAttribute\('aria-current'\)/,
 'Screen-reader current tab updates when navigating');
assert.match(source,/navRail\.scrollTo\(\{left:/,'Mobile bottom dock reveals selected tab');
assert.match(source,/<dialog id="appTourDialog" aria-labelledby="tourHeading" aria-describedby="tourContent"/);
assert.match(source,/#appTourDialog button\{min-height:44px\}/);
assert.match(source,/max-height:min\(60dvh,520px\)/,'Tour remains reachable on small screens');
assert.match(script,/dialog\.showModal\(\);renderTour\(\)/,'Tour is a native modal dialog');
assert.match(script,/addEventListener\('close',\(\)=>\{/,'Close & Escape restore tour state');
assert.match(script,/overlay\.addEventListener\('cancel',e=>/,'Escape dismisses welcome prompt');
assert.match(script,/overlay\.showModal\(\);begin\.focus\(\)/,'Native first-visit welcome traps keyboard focus');
assert.doesNotMatch(script,/function closeTour\(\)[^{]*\{[^}]*navigateTo\('hub'\)/,
 'Tour must not unconditionally jump to Explore when closed');
let where='clips',focused=0,headingFocused=0;const handlers={};
function element(id){return {id,open:false,disabled:false,textContent:'',listeners:{},isConnected:true,
  focus(){if(id==='tourHeading')headingFocused++;else focused++},
  showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()},
  addEventListener(name,cb){this.listeners[name]=cb}}}
const els=new Map();
const get=id=>{if(!els.has(id))els.set(id,element(id));return els.get(id)};
const nav=()=>({dataset:{tab:where},isConnected:true,focus(){focused++}});
const document={
 activeElement:{isConnected:true,focus(){focused++}},
 querySelector(s){if(s==='.nav .tab.active')return nav();return null;},
 querySelectorAll(){return []}
};
const window={};
const vmSource=script+'\nwindow.__T={openTour,closeTour,tourSections,renderTour};';
vm.runInNewContext(vmSource,{window,document,$:get,navigateTo:id=>{where=id},
 requestAnimationFrame:()=>{},setTimeout:()=>{},map:null,
 URLSearchParams,location:{search:''},localStorage:{getItem:()=>null},console},{timeout:2000});
const t=window.__T;
assert.deepEqual(Array.from(t.tourSections,x=>x.steps.length),[10,7,4,4,5],
 'Full and focused tours retain 30 real steps');
for(const group of t.tourSections){for(const step of group.steps){
 assert.ok(step.target&&(step.target[0]==='.'||step.target[0]==='#'),step.title+' target');
 assert.ok(step.target[0]==='#'?source.includes('id="'+step.target.slice(1)+'"'):
  source.includes(step.target.slice(1)),step.title+' target must exist in HTML');
 assert.ok(tabs.includes(step.page)||step.page==='hub','Tour references navigable page: '+step.page);
}}
t.openTour('community');
assert.equal(get('appTourDialog').open,true);
assert.equal(where,'discover','Focused tour opens actual first destination');
assert.equal(headingFocused,1,'Step heading focused for keyboard/screen reader');
t.closeTour();
assert.equal(get('appTourDialog').open,false);
assert.equal(where,'clips','Return to originating Videos tab, not Explore');
assert.equal(focused,1,'Restore focus after modal closes');
where='profilePage';t.openTour('safety');
assert.equal(get('appTourDialog').open,true);
get('appTourDialog').close(); // Native Escape closes without Close button callback.
assert.equal(where,'profilePage','Escape returns to originating Profile tab');
console.log('PASS: all 11 tabs, 30 tour targets, native modal focus, Escape/restoration, mobile dock accessibility');
