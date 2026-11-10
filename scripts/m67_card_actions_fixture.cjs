'use strict';
// Fictional records and accounts only; all remote services are blocked.
const fs=require('node:fs');
function mockServices(){
 const user={id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.invalid',is_anonymous:false};
 const rows=new Map();window.__m67={shared:[],posts:[],votes:[],user:null};
 const archive=[{id:'m67-archive-a',title:'Fixture investigation A (2004)',kind:'Featured investigation',year:2004,description:'Synthetic archive entry for interface acceptance.',source:'Fictional source',url:'https://example.invalid/archive/a',category:'UAP'},
 {id:'m67-archive-b',title:'Fixture investigation B (1947)',kind:'Featured investigation',year:1947,description:'Another synthetic entry.',source:'Fictional source',url:'https://example.invalid/archive/b',category:'UAP'}];
 const clip={id:'m67-video',title:'Fixture video',publisher:'Fixture publisher',group:'YouTube',description:'Synthetic video metadata; no real video is requested.',source:'https://example.invalid/video',youtubeId:'abcdefghijk',publishedAt:'2026-11-10',evidenceStatus:'traceable',status:'Fixture',videoAvailable:true};
 const original=window.fetch.bind(window);
 window.fetch=async(input,options)=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(url.origin!==location.origin)throw Error('External service blocked by test fixture');
  if(['/data/curated-historical-cases.json','/data/historical-news-archive.json'].includes(url.pathname))return new Response(JSON.stringify(archive),{headers:{'Content-Type':'application/json'}});
  if(url.pathname==='/data/disclosure-clips.json')return new Response(JSON.stringify([clip]),{headers:{'Content-Type':'application/json'}});
  if(url.pathname==='/data/curated-official-videos.json')return new Response('[]',{headers:{'Content-Type':'application/json'}});
  return original(input,options);
 };
 Object.defineProperty(navigator,'share',{configurable:true,value:async value=>{window.__m67.shared.push(value)}});
 const comments=id=>{if(!rows.has(id))rows.set(id,Array.from({length:3},(_,i)=>({id:'22222222-2222-4222-8222-22222222222'+i,body:'Fixture comment '+(i+1),created_at:'2026-11-10T10:00:00Z',is_mine:false})));return rows.get(id)};
 function query(table){
  let write=null;const q={select(){return q},eq(){return q},order(){return q},limit(){return q},in(){return q},is(){return q},single(){return q},maybeSingle(){return q},delete(){write={};return q},update(value){write=value;return q},upsert(value){write=value;window.__m67.votes.push(value);return q},insert(value){write=value;if(table==='dd_case_comments'){window.__m67.posts.push(value);comments(value.case_id).push({...value,id:'33333333-3333-4333-8333-333333333333',created_at:new Date().toISOString(),is_mine:true})}return q},then(fn){return Promise.resolve({data:[],count:0,error:null}).then(fn)}};return q;
 }
 const db={auth:{getUser:async()=>({data:{user:window.__m67.user?user:null},error:null}),getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:query,
 rpc:async(name,args)=>({data:name==='dd_media_catalogue'?[
 {id:'fixture-doc',category:'documentaries',title:'Fixture documentary',creator:'Fixture creator',display_year:'2026',public_url:'https://example.invalid/documentary',created_at:'2026-11-10',source_kind:'editorial'},
 {id:'fixture-book',category:'books',title:'Fixture book',creator:'Fixture author',display_year:'2026',public_url:'https://example.invalid/book',created_at:'2026-11-10',source_kind:'editorial'}
 ]:name==='dd_public_comments'?comments(args.p_case_id):name==='dd_media_ranking'?[{title_id:'fixture-doc',ratings:6,average_score:8,recommendations:2}]:name==='dd_discussions_feed_capable'?false:[],error:null})};
 window.supabase={createClient:()=>db};
 localStorage.setItem('dd-welcome-tour-choice-v2','dismissed');
}
function buildFixture(){
 const html=fs.readFileSync('index.html','utf8');
 return html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; connect-src \'self\'; frame-src \'none\'"><script>('+mockServices.toString()+')();</script>');
}
module.exports={buildFixture};
