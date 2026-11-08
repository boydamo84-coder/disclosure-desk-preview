'use strict';
// No network, no user data. Synthetic source rows and a minimal fake browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/news-ticker.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const css = fs.readFileSync('assets/news-ticker.css','utf8');
const core = require('../assets/news-ticker.js');

const now = Date.parse('2026-11-05T20:00:00Z'), hour = 3600000;
function article(id, age, priority='standard') {
  return {id, headline:'Article '+id, source:'Example Publisher',
    url:'https://news.example.org/story/'+id,
    date:new Date(now-age).toISOString(), priority};
}
const rows = [
  article('a',5000,'major'),article('b',8*hour,'standard'),
  article('c',8*hour+1,'major'),article('d',48*hour,'standard'),
  article('e',48*hour+1),article('future',-5),article('bad',6000)
];
rows[6].url='http://localhost/suspicious';
rows.push({...rows[0]}, {...article('xss',3000),headline:'<img onerror=alert(1) />'});
let selected=core.selectHeadlines(rows,now);
assert.deepEqual(selected.breaking.map(x=>x.id),['xss','a','b']);
assert.deepEqual(selected.recent.map(x=>x.id),['c','d']);
assert.deepEqual(selected.major.map(x=>x.id),['a']);
assert.equal(core.safeSourceUrl('javascript:alert(1)'), '');
assert.equal(core.safeSourceUrl('https://example.com@127.0.0.1/a'), '');
assert.equal(core.safeSourceUrl('http://example.com'), '');
assert.equal(core.safeSourceUrl('https://news.example.org/a'), 'https://news.example.org/a');
assert.deepEqual(core.selectHeadlines([],now).recent,[]);
assert.equal(core.BREAKING_WINDOW,8*hour,'Breaking window must be eight hours');
console.log('PASS 1/5 — exact 8h/48h clock boundaries; major vs ordinary; URL and duplicate gating.');

const required = ['ddNewsTickerHub','ddNewsTickerRows','ddNewsTickerBreakingTrack',
 'ddNewsTickerRecentTrack','ddNewsTickerHubToggle','ddNewsTickerAlertsToggle',
 'ddNewsTickerAlert','ddNewsTickerAlertTrack','ddNewsTickerHide','ddNewsTickerOff'];
for(const id of required)assert.match(html,new RegExp('id="'+id+'"'),'Missing ID '+id);
assert.match(html,/window\.ddNewsTickerRows=valid/);
assert.match(html,/window\.ddTickerOpenStory=function/);
assert.match(html,/assets\/news-ticker\.js/);
assert.match(html,/assets\/news-ticker\.css/);
assert.match(css,/\.dd-news-ticker-hub\{position:fixed/);
assert.match(css,/bottom:calc\(var\(--dd-news-nav-height/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/\.dd-news-ticker-row\[hidden\]\{display:none!important\}/);
assert.doesNotMatch(css,/\.dd-news-ticker-expanded \.dd-nav-swipe-hint\{display:none!important\}/);
assert.doesNotMatch(css,/dd-ticker-user-paused|Pause headlines/);
assert.doesNotMatch(source,/ddNewsTickerPause|setTickerPaused|tickerPaused/);
console.log('PASS 2/5 — actual site wiring, narrow fixed TV strip above measured dock, reduced motion.');

class FakeElement {
  constructor(id='') {
    this.id=id; this.hidden=false; this.dataset={}; this.children=[];
    this.listeners={}; this.attributes={}; this.textContent=''; this.style={};
    this.style.setProperty=(key,value)=>{this.style[key]=value;};
    const classes=new Set();
    this.classList={
      add:(c)=>classes.add(c), remove:(c)=>classes.delete(c), contains:(c)=>classes.has(c),
      toggle:(c,forced)=>{const desired=forced===undefined?!classes.has(c):forced;
        if(desired)classes.add(c);else classes.delete(c);return desired;}
    };
  }
  setAttribute(key,value){this.attributes[key]=String(value);}
  addEventListener(name,handler){this.listeners[name]=handler;}
  replaceChildren(...items){this.children=[...items];}
  appendChild(item){this.children.push(item);}
}
const elements=Object.fromEntries(required.concat(['discover']).map(id=>[id,new FakeElement(id)]));
for(const id of ['ddNewsTickerBreakingTrack','ddNewsTickerRecentTrack','ddNewsTickerAlertTrack']){
  elements[id].parentElement=new FakeElement('viewport-'+id);
}
elements.ddNewsTickerBreakingTrack.parentElement.parentElement=new FakeElement('breaking-row');
elements.ddNewsTickerRecentTrack.parentElement.parentElement=new FakeElement('recent-row');
const tickerControls=new FakeElement('ticker-controls');
elements.ddNewsTickerHubToggle.parentElement=tickerControls;
const nav={getBoundingClientRect:()=>({height:77})};
const doc={
  readyState:'complete',visibilityState:'visible',body:new FakeElement('body'),
  documentElement:{style:{properties:{},setProperty(k,v){this.properties[k]=v;}}},
  getElementById:id=>elements[id],
  querySelector:query=>query==='.nav'?nav:null,
  createElement:tag=>new FakeElement(tag)
};
let observerCallback;
class FakeObserver {constructor(callback){observerCallback=callback;} observe(){}}
const storage=new Map(), events=new Map(), intervals=[], transitions=[];
const advanceTransitions=()=>{
 for(let i=0;i<8;i++){
  const pending=transitions.find(x=>!x.ran&&!x.cancelled);
  if(!pending)return;
  pending.ran=true;pending.fn();
 }
 throw Error('Too many pending headline-animation timers');
};
const win={
  document:doc,localStorage:{
    getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)
  },
  addEventListener:(key,callback)=>events.set(key,callback),
  setInterval:(fn,ms)=>intervals.push({fn,ms}),
  setTimeout:(fn,ms)=>{const item={id:transitions.length+1,fn,ms,ran:false,cancelled:false};transitions.push(item);return item.id},
  clearTimeout:id=>{const item=transitions.find(x=>x.id===id);if(item)item.cancelled=true},
  matchMedia:()=>({matches:false}),
  ResizeObserver:class{observe(){}},
  ddNewsTickerRows:[
    {id:'current-major',headline:'Sourced major report',source:'Sample outlet',
      url:'https://news.example.org/live',priority:'major',
      date:new Date(Date.now()-3*60000).toISOString()},
    {id:'recent',headline:'Sourced recent report',source:'Sample outlet',
      url:'https://news.example.org/recent',priority:'standard',
      date:new Date(Date.now()-10*hour).toISOString()}
  ]
};
vm.runInNewContext(source,{window:win,document:doc,globalThis:win,
  URL,Date,MutationObserver:FakeObserver},{filename:'assets/news-ticker.js'});
assert.equal(elements.ddNewsTickerHub.hidden,false,'News ticker must appear on News tab');
assert.equal(elements.ddNewsTickerAlert.hidden,true,'No overlapping alert on News');
assert.equal(doc.documentElement.style.properties['--dd-news-nav-height'],'77px');
assert.equal(elements.ddNewsTickerBreakingTrack.children.length,2);
assert.equal(elements.ddNewsTickerRecentTrack.children.length,2);
assert.equal(doc.body.classList.contains('dd-news-ticker-expanded'),true);
assert.equal(intervals.length,3);
assert.equal(tickerControls.children.length,0,'Pause headlines button is no longer added');
assert.equal(elements.ddNewsTickerBreakingTrack.parentElement.parentElement.hidden,false);
assert(intervals.some(x=>x.ms===20000),'Readable lead rotates at the video-matched pace');
assert.match(css,/\.dd-news-ticker-breaking \.dd-ticker-track\s*\{/);
assert.match(css,/animation:none!important/);
assert.match(css,/@keyframes ddBreakErase/);
assert.match(css,/@keyframes ddBreakType/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(html,/>BREAKING NEWS<\/span>/);
const firstLeadNode = elements.ddNewsTickerBreakingTrack.children[0];
events.get('dd-news-updated')();
assert.strictEqual(elements.ddNewsTickerBreakingTrack.children[0],firstLeadNode,
  'Unchanged feed refresh must never blank/reset the ticker');
win.ddNewsTickerRows.push({
  id:'newer-breaking',headline:'Latest source-verified UAP headline',
  source:'Sample publisher',url:'https://news.example.org/newer',
  priority:'standard',date:new Date(Date.now()-60*1000).toISOString()
});
events.get('dd-news-updated')();
assert.match(elements.ddNewsTickerBreakingTrack.children[0].children[0].textContent,/Latest source-verified/);
intervals.find(x=>x.ms===20000).fn();
assert.equal(elements.ddNewsTickerBreakingTrack.children[0].children[0].classList.contains('dd-break-erasing'),true);
advanceTransitions();
assert.match(elements.ddNewsTickerBreakingTrack.children[0].children[0].textContent,/Sourced major report/,
  'Breaking lead must cycle without marquee-scrolling the current headline');
const group=elements.ddNewsTickerBreakingTrack.children[0];
assert.match(group.children[0].textContent,/Sourced major report/);
// Clicking a lead never pauses the crawl or next Breaking transition.
group.children[0].listeners.click({preventDefault(){}});
assert.equal(tickerControls.children.length,0);
const leadBeforeTap=elements.ddNewsTickerBreakingTrack.children[0].children[0].textContent;
intervals.find(x=>x.ms===20000).fn();
advanceTransitions();
assert.notEqual(elements.ddNewsTickerBreakingTrack.children[0].children[0].textContent,leadBeforeTap);
const nextLead=elements.ddNewsTickerBreakingTrack.children[0].children[0].textContent;
intervals.find(x=>x.ms===20000).fn();
advanceTransitions();
assert.notEqual(elements.ddNewsTickerBreakingTrack.children[0].children[0].textContent,nextLead);
// No Breaking rows should leave the still-relevant 48-hour crawl visible.
const savedRows=win.ddNewsTickerRows;
win.ddNewsTickerRows=[savedRows.find(x=>x.id==='recent')];
events.get('dd-news-updated')();
assert.equal(elements.ddNewsTickerBreakingTrack.parentElement.parentElement.hidden,true);
assert.equal(elements.ddNewsTickerRecentTrack.parentElement.parentElement.hidden,false);
assert.equal(doc.body.classList.contains('dd-news-ticker-has-breaking'),false);
win.ddNewsTickerRows=savedRows;
events.get('dd-news-updated')();
assert.equal(elements.ddNewsTickerBreakingTrack.parentElement.parentElement.hidden,false);
console.log('PASS 3/5 — actual source runtime: fixed lead rotates at 20s, 48h crawl persists on refresh, real dock clearance.');

elements.discover.classList.add('hidden');
observerCallback();
assert.equal(elements.ddNewsTickerHub.hidden,true);
assert.equal(elements.ddNewsTickerAlert.hidden,false);
elements.ddNewsTickerHide.listeners.click();
assert.equal(elements.ddNewsTickerAlert.hidden,true,'Hide suppresses currently seen major');
assert(storage.has('dd_live_news_ticker_preferences_v1'));
win.ddNewsTickerRows.push({
  id:'new-major',headline:'New major report',source:'Second sample publisher',
  url:'https://news.example.org/new',priority:'major',
  date:new Date(Date.now()-3000).toISOString()
});
events.get('dd-news-updated')();
assert.equal(elements.ddNewsTickerAlert.hidden,false,'A newly added major revives alert');
elements.ddNewsTickerOff.listeners.click();
assert.equal(elements.ddNewsTickerAlert.hidden,true);
assert.match(elements.ddNewsTickerAlertsToggle.textContent,/Off/);
elements.ddNewsTickerAlertsToggle.listeners.click();
assert.equal(elements.ddNewsTickerAlert.hidden,false);
console.log('PASS 4/5 — other-tab alert only for recent major; hide until new; persistent Off/On.');

elements.discover.classList.remove('hidden');observerCallback();
elements.ddNewsTickerHubToggle.listeners.click();
assert.equal(elements.ddNewsTickerRows.hidden,true);
assert.equal(doc.body.classList.contains('dd-news-ticker-expanded'),false);
elements.ddNewsTickerHubToggle.listeners.click();
assert.equal(elements.ddNewsTickerRows.hidden,false);
assert.equal(elements.ddNewsTickerAlert.hidden,true);
const markup=JSON.stringify(elements.ddNewsTickerBreakingTrack.children.map(x=>x.children.map(a=>a.textContent)));
assert(!markup.includes('<script'),'No executable HTML test value accidentally inserted');
assert.match(source,/link\.textContent\s*=/,'Source headlines must use text nodes, never innerHTML');
console.log('PASS 5/5 — user hides/reopens bottom ticker; safe text nodes; navigation returns to News.');
console.log('PASS — TV-news ticker offline suite: 5/5.');
