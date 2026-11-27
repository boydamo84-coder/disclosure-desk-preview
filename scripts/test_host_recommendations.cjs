'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {selectPicks,validateStatus,hosts}=require('../assets/host-recommendations.js');
const day='2026-11-27',date='2026-11-26T10:00:00Z';
const report=(id,headline,source='BBC News',url='https://news.google.com/rss/articles/abc')=>({id,headline,source,url,date});
const articles=[
 report('a','FOIA archive records released'),report('b','NASA radar analysis'),report('c','Researchers explain uncertainty in footage'),
 report('reject-game','PlayStation UFO game guide'),report('reject-spoof','New Pentagon records','BBC News','https://bbc.co.uk.attacker.example/x'),
 report('reject-unattributed','New evidence records','Unverified blog','https://example.org/post'),
 {...report('reject-old','Pentagon records'),date:'2026-10-01'}, {...report('reject-future','Pentagon records'),date:'2026-11-28'},
 report('d','New hearing evidence','Reuters','https://www.reuters.com/example/article')];
const clips=[
 {id:'v1',title:'AARO infrared sensor footage',publisher:'AARO',source:'https://www.dvidshub.net/video/1000000',evidenceStatus:'official',group:'Official',videoAvailable:true,publishedAt:'2026-11-26'},
 {id:'v2',title:'Historical official archive',source:'https://www.war.gov/UFO/',evidenceStatus:'official',group:'Official'},
 {id:'unverified',title:'NASA shocking footage',source:'https://www.youtube.com/watch?v=x',evidenceStatus:'unverified',group:'YouTube'},
 {id:'fakeofficial',title:'Fake official footage',source:'https://aaro.mil.example.org/x',evidenceStatus:'official',group:'Official'},
 {id:'unavailable',title:'Unavailable NASA footage',source:'https://www.nasa.gov/foo',evidenceStatus:'official',group:'Official',videoAvailable:false}
];
const chosen=selectPicks('news',articles,day),videos=selectPicks('video',clips,day);
assert(chosen.length===2);assert(videos.length===2);assert(chosen.every(p=>['a','b','c','d'].includes(p.id)&&hosts[p.host]));
assert(videos.every(p=>['v1','v2'].includes(p.id)));
assert.deepEqual(chosen,selectPicks('news',[...articles].reverse(),day));
assert.deepEqual(videos,selectPicks('video',[...clips].reverse(),day));
assert.deepEqual(chosen,selectPicks('news',[...articles,...articles],day));
assert.equal(selectPicks('news',articles.filter(a=>a.id.startsWith('reject')),day).length,0);
assert.equal(selectPicks('video',clips.slice(2),day).length,0);
assert.deepEqual(validateStatus({active:false,day,discussions:[]}),{active:false,day,discussions:[]});
assert.equal(validateStatus({active:true,day,discussions:[{},{}]}),null);
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('ddSyncNewsHostPicks();'));assert(html.includes('ddSyncVideoHostPicks();// Only initialize'));
assert(html.includes('id="ddNewsHostPicks"'));assert(html.includes('id="ddVideoHostPicks"'));
const forum=fs.readFileSync('assets/community-discussions.js','utf8');assert(forum.includes('main.dataset.ddHostThread=item.id;'));assert(forum.includes('main.dataset.ddHostThread=row.id;'));
assert(!/dd_discussions_vote|dd_news_article_vote_set|\.insert\(|\.update\(|\.upsert\(/.test(fs.readFileSync('assets/host-recommendations.js','utf8')));
console.log('PASS bounded deterministic topic picks, source checks, dedupe, unrelated/stale/future/unsafe exclusions, read-only card integration');
module.exports={articles,clips,chosen,videos,day};
