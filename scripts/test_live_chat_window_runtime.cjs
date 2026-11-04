'use strict';
// Runtime check of the ACTUAL LIVE schedule JavaScript. All hearing times are
// fictional. No Supabase, network, real event announcements or browser UI.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let clock=Date.parse('2026-11-12T10:00:00Z');
const NativeDate=Date;
class TestDate extends NativeDate {
 constructor(...args){super(...(args.length?args:[clock]))}
 static now(){return clock}
}
class E{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.hidden=false;this.className='';this.textContent='';this.attrs={}}
 append(...items){this.children.push(...items)}
 prepend(...items){this.children.unshift(...items)}
 replaceChildren(...items){this.children=items}
 get childElementCount(){return this.children.length}
 setAttribute(k,v){this.attrs[k]=v}
 querySelectorAll(selector){
  let ret=[];const walk=n=>{
   for(const c of n.children||[]){
    if(selector==='.dd-upcoming-card'&&c.className?.split(' ').includes('dd-upcoming-card'))ret.push(c);
    walk(c);
   }
  };walk(this);return ret;
 }
}
const nodes=new Map([['ddLiveMount',new E('div')],['ddLiveNewsNotice',new E('section')]]);
const listeners={},intervals=[];
const doc={readyState:'loading',visibilityState:'visible',
 createElement:tag=>new E(tag),getElementById:id=>nodes.get(id)||null,
 addEventListener(name,fn){listeners[name]=fn}};
const stats={opened:0,closed:0,closeAttempts:0};
const win={addEventListener(){},ddLiveChatClose(){stats.closeAttempts++},
 ddLiveChatMount:(host,event)=>{
  stats.opened++;
  assert.equal(host.className,'dd-live-chat-panel');
  assert.equal(event.id,'synthetic-future-hearing');
  const section=new E('section');section.className='private-chat-fixture';
  host.append(section);
  return ()=>{stats.closed++};
 }};
const fakeEvent={
 id:'synthetic-future-hearing',
 title:'Synthetic Official Test Fixture (Never Publish)',
 startAt:'2026-11-12T10:46:00Z',
 status:'upcoming',sourceUrl:'https://oversight.house.gov/hearing/example',
 chatAvailable:true
};
const fetch=async()=>({ok:true,json:async()=>[fakeEvent]});
const setInterval=(fn,ms)=>{const entry={fn,ms,active:true};intervals.push(entry);return entry};
const clearInterval=id=>{id.active=false};
vm.runInNewContext(fs.readFileSync('assets/live-schedule.js','utf8'),
 {window:win,document:doc,Date:TestDate,URL,Intl,console,fetch,setInterval,clearInterval},{timeout:3000});
async function flush(){for(let i=0;i<24;i++)await Promise.resolve()}
function tick(){for(const item of intervals)if(item.ms===1000&&item.active)item.fn()}
(async()=>{
 listeners.DOMContentLoaded();await flush();
 const live=nodes.get('ddLiveMount').children.find(x=>x.id==='ddLiveSchedule');
 assert.ok(live,'LIVE section mounted');
 const cards=live.querySelectorAll('.dd-upcoming-card');
 assert.equal(cards.length,1,'Exactly one approved synthetic hearing card');
 const card=cards[0],chatPanel=card.querySelectorAll('.not-used')[0];
 assert.equal(stats.opened,0,'46 minutes out: chat must remain closed');
 const stableCard=card;
 clock+=2*60*1000;tick();
 assert.equal(stats.opened,1,'Crossing T-45 opens chat without refetch');
 assert.equal(live.querySelectorAll('.dd-upcoming-card')[0],stableCard,'Do not rebuild active video card');
 clock+=3*60*1000;tick();
 assert.equal(stats.opened,1,'No duplicate mount while still live');
 clock=Date.parse(fakeEvent.startAt)+4*60*60*1000;
 tick();
 assert.equal(stats.closed,1,'Close exactly at four-hour chat window limit');
 assert.equal(live.querySelectorAll('.dd-upcoming-card')[0],stableCard,'Closing chat must not destroy player');
 clock+=60*1000;tick();
 assert.equal(stats.closed,1,'No double dispose after closing window');
 assert.equal(stats.opened,1,'Closed chat must not reopen');
 // End-times earlier than four hours must be honoured, even without a status refresh.
 const source=fs.readFileSync('assets/live-schedule.js','utf8');
 assert.match(source,/Number\.isFinite\(expiry\)\?expiry:/,'Respect approved explicit endsAt');
 assert.match(source,/syncChat\(now\)/,'Room transition evaluated by actual timer');
 console.log('PASS: LIVE synthetic countdown crosses 45-minute opening and 4-hour closing, without duplicated mounts or hearing-card replacement');
})().catch(e=>{console.error(e);process.exitCode=1});
