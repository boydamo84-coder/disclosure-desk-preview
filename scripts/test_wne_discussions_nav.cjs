'use strict';
// Staged, synthetic navigation test. No account, backend, W.NE report or Netlify writes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('research/research-site-nav.js','utf8');
const main=fs.readFileSync('index.html','utf8');
const live=fs.readFileSync('assets/community-test-config.js','utf8');
const pages=['index.html','wne.html','guest-preview.html','research-workspace.html',
 'research-bible.html','import.html','restore-copy.html'];
assert.match(live,/privateChat:false/);
assert.match(live,/discussions:false/,'Feature remains OFF in committed configuration');
assert.match(main,/if\(id==='discussionsPage'&&window\.DD_COMMUNITY_FEATURES\?\.discussions!==true\)return/);
assert.match(main,/if\(ddResearchReturnTab==='discussionsPage'\)\{\s*document\.addEventListener\('DOMContentLoaded'/);
assert.match(main,/if\(window\.DD_COMMUNITY_FEATURES\?\.discussions===true\)navigateTo\('discussionsPage'\)/);
for(const page of pages){
 const html=fs.readFileSync('research/'+page,'utf8');
 assert.match(html,/<script src="\.\.\/assets\/community-test-config\.js" defer><\/script><script src="\.\/research-site-nav\.js" defer><\/script>/,
  'Research screen must load official host feature flags before navigation: '+page);
}
function cls(){
 const names=new Set();
 return {add:n=>names.add(n),contains:n=>names.has(n),toggle:(n,force)=>{
  if(force===undefined? !names.has(n):force)names.add(n);else names.delete(n);
 }};
}
function el(tag){
 return {tag,children:[],dataset:{},attributes:{},style:{setProperty(){}},classList:cls(),
  textContent:'',scrollLeft:0,offsetLeft:0,clientWidth:400,clientHeight:50,offsetWidth:55,
  append(...items){this.children.push(...items)},appendChild(node){this.children.push(node)},
  setAttribute(name,value){this.attributes[name]=value},removeAttribute(name){delete this.attributes[name]},
  getBoundingClientRect(){return {height:60}},
  addEventListener(name,handler){this['on'+name]=handler},
  querySelector(selector){return this.children.find(node=>
   selector==='[aria-current="page"]'&&node.attributes?.['aria-current']==='page')||null}
 };
}
function run(disabled,saveResult){
 const nav=el('nav'),status=el('span'),toggle=el('button'),dock=el('div');
 dock.querySelector=selector=>selector==='nav'?nav:selector==='.dd-site-dock-status'?status:
  selector==='.dd-site-dock-toggle'?toggle:null;
 const doc={head:el('head'),body:el('body'),createElement:tag=>tag==='div'?dock:el(tag),
  createTextNode:value=>({tag:'text',textContent:value}),
  getElementById:id=>id==='writer'?{contentWindow:{wneSaveBeforeNavigation:async()=>saveResult}}:null,
  addEventListener(){},querySelector:()=>null};
 const visited=[];
 const win={DD_COMMUNITY_FEATURES:{discussions:!disabled},
  addEventListener(){},alert(){},
  top:{location:{assign:destination=>visited.push(destination)}}};
 win.parent=win;
 vm.runInNewContext(source,{window:win,document:doc,
  localStorage:{getItem:()=>null,setItem(){}},
  requestAnimationFrame:fn=>fn(),encodeURIComponent,ResizeObserver:undefined},{timeout:2000});
 return {win,nav,visited};
}
(async()=>{
 const base=['discover','archivePage','researchStudio','mapPage','clips','livePage',
  'boards','witness','watchRead','hub','profilePage'];
 const off=run(true,true),offTabs=off.nav.children.map(b=>b.dataset.ddTab);
 assert.deepEqual(offTabs,base,'OFF must preserve published eleven-tab Research dock');
 assert.equal(await off.win.ddResearchNavigateTo('discussionsPage'),false,'OFF must reject Discussions navigation');
 assert.equal(off.visited.length,0);
 const unsaved=run(false,false),activeTabs=unsaved.nav.children.map(b=>b.dataset.ddTab);
 assert.equal(activeTabs.length,12);
 assert.deepEqual(activeTabs,[...base.slice(0,8),'discussionsPage',...base.slice(8)],
  'Discussions follows Witness, leaves Profile last');
 assert.equal(await unsaved.win.ddResearchNavigateTo('discussionsPage'),false,
  'Unsaved editor must NOT navigate, even when future Discussions is on');
 assert.deepEqual(unsaved.visited,[]);
 const saved=run(false,true);
 assert.equal(await saved.win.ddResearchNavigateTo('discussionsPage'),true,
  'Confirmed saved document can navigate');
 assert.deepEqual(saved.visited,['/?dd_tab=discussionsPage']);
 assert.equal(await saved.win.ddResearchNavigateTo('made-up-tab'),false,
  'Unknown tab cannot bypass save/feature allowlist');
 console.log('PASS: 11 live tabs, feature-gated 12th after Witness, disabled deep-links, 7 Research pages, W.NE unsaved save gate and saved return');
})().catch(e=>{console.error(e);process.exitCode=1});

assert.match(main,/id="ddNavPrev"/);
assert.match(main,/id="ddNavNext"/);
assert.match(main,/Scroll navigation one tab right/);
assert.match(main,/rail\.scrollTo\(\{left:target,behavior:'smooth'\}\)/);
assert.match(main,/ddLastTabKey='dd_last_open_tab_v1'/);
assert.match(main,/window\.sessionStorage\?\.setItem\(ddLastTabKey,id\)/);
assert.match(main,/new URLSearchParams\(location\.search\)\.get\('dd_tab'\)\|\|ddRememberedTab/);
assert.match(main,/ddResearchReturnTab==='chatPage'/);
console.log('PASS: clickable one-tab mobile dock arrows and guarded session-only active-tab restore.');
