'use strict';
// Actual full-page controls, fictional threads; inherited CSP blocks every remote service.
const {buildFixture:cardFixture}=require('./m67_card_actions_fixture.cjs');
function threadBackend(){
 const ids=Array.from({length:7},(_,i)=>'88888888-8888-4888-8888-'+String(i+1).padStart(12,'0'));
 const names=['SignalSeeker','LunaArchive','OrbitNotes','SourceReader','NorthStar','NovaAtlas','SkyWatcher'];
 const bodies=['Start with the original report.',
  'Agreed. The original source gives the time and viewing direction.\n\nThat makes the later discussion much easier to follow.',
  'I would check the weather records too.', 'The uncertainty belongs alongside the evidence.',
  'Long source references should wrap safely: https://example.invalid/'+('original-record-'.repeat(14)),
  'A separate comment remains at the top level.', 'An unavailable parent should not hide this comment.'];
 const rows=ids.map((id,i)=>({id,parent_id:i>0&&i<5?ids[i-1]:i===6?'99999999-9999-4999-8999-999999999999':null,
  body:bodies[i],created_at:'2026-11-10T18:00:00Z',is_mine:false}));
 const create=window.supabase.createClient,votes=new Map();
 window.__m68={ids,rows,calls:[]};
 window.supabase.createClient=(...args)=>{
  const base=create(...args);
  return {...base,from(table){const q=base.from(table),insert=q.insert;
   q.insert=function(row){window.__m68.calls.push({name:'insert:'+table,args:row});return insert.call(q,row)};return q;},
   async rpc(name,p={}){
    window.__m68.calls.push({name,args:p});
    if(name==='dd_public_comments')return {data:rows.concat(window.__m67.posts.filter(x=>x.case_id===p.p_case_id).map((x,i)=>({...x,id:'77777777-7777-4777-8777-'+String(i+1).padStart(12,'0'),created_at:new Date().toISOString(),is_mine:true}))),error:null};
    if(name==='dd_public_aliases')return {data:p.p_ids.map(content_id=>({content_id,display_name:names[ids.indexOf(content_id)]||'FixtureAuthor'})),error:null};
    if(name==='dd_vote_set')votes.set(p.p_id,p.p_value);
    if(name==='dd_vote_summary'||name==='dd_vote_set')return {data:(p.p_ids||[p.p_id]).map(target_id=>({target_id,likes:2+(votes.get(target_id)===1?1:0),dislikes:votes.get(target_id)===-1?1:0,my_vote:votes.get(target_id)||0})),error:null};
    return base.rpc(name,p);
   }};
 };
}
function buildFixture(){
 return cardFixture().replace('</head>','<script>('+threadBackend.toString()+')();</script></head>');
}
module.exports={buildFixture};
