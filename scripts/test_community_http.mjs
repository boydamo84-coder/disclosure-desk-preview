/* LIVE GET-only/public RPC smoke tests plus unauthenticated function probe.
 * No registered credentials, user creation, report submission or database writes.
 * Designed for GitHub Actions runners, not browsers and not Netlify builds.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('assets/community-test-config.js','utf8');
const url=source.match(/url:enabled\?'(https:\/\/[^']+)':'',/)?.[1];
const key=source.match(/publishableKey:enabled\?'(sb_publishable_[^']+)':'',/)?.[1];
assert.ok(url&&key,'Missing current project URL or public publishable API key');
assert.equal(new URL(url).hostname,'omqxizswzcwgzqaczlhe.supabase.co','Never test another project');
const headers={'apikey':key,'content-type':'application/json'};
let checks=0;
async function verify(label,path,{method='GET',body,expected}={}){
 const response=await fetch(url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),
   signal:AbortSignal.timeout(15000)});
 let result=null;try{result=await response.json()}catch{}
 if(!expected.includes(response.status))throw Error(label+': HTTP '+response.status+
   ' (expected '+expected.join('/')+'), provider code '+String(result?.code||'unknown'));
 if(response.status===200)assert.ok(Array.isArray(result),'Expected JSON array for '+label);
 checks++;
 console.log('PASS '+label+' HTTP '+response.status);
 return result;
}
// Live public, read-only endpoints: safe on the existing production backend.
await verify('guest witness map', '/rest/v1/dd_public_witness_reports?select=id,city,country&limit=1',{expected:[200]});
await verify('guest approved comments', '/rest/v1/rpc/dd_public_comments',{method:'POST',body:{p_case_id:'__community_public_qa_no_match__',p_limit:1},expected:[200]});
await verify('guest opt-in aliases', '/rest/v1/rpc/dd_public_aliases',{method:'POST',body:{p_kind:'comment',p_ids:[]},expected:[200]});
await verify('guest vote summary', '/rest/v1/rpc/dd_vote_summary',{method:'POST',body:{p_kind:'witness',p_ids:[]},expected:[200]});
// Unauthorised routes must not leak account identifiers or moderator material.
await verify('guest raw comment identifiers blocked','/rest/v1/dd_case_comments?select=author_id&limit=1',{expected:[401,403]});
await verify('guest own-comment history blocked','/rest/v1/rpc/dd_my_comments',{method:'POST',body:{p_limit:1},expected:[401,403]});
await verify('guest moderator queue blocked','/rest/v1/rpc/dd_witness_moderation_queue',{method:'POST',body:{},expected:[401,403]});
await verify('guest witness submission blocked by JWT gate','/functions/v1/dd-witness-submit',{
 method:'POST',body:{},expected:[401,403]
});
// LIVE hearing archive: guests can read approved text but never raw author IDs.
await verify('guest public hearing schedule',
 '/rest/v1/dd_live_events?select=id,title,status&limit=1',{expected:[200]});
await verify('guest archived hearing transcript',
 '/rest/v1/rpc/dd_public_hearing_chat',{
 method:'POST',body:{p_event_id:'qa-archive-no-match',p_before:null,p_limit:1},expected:[200]});
await verify('guest raw LIVE author IDs blocked',
 '/rest/v1/dd_live_chat_messages?select=author_id&limit=1',{expected:[401,403]});
await verify('guest LIVE moderation queue blocked',
 '/rest/v1/rpc/dd_live_chat_moderation_queue',{method:'POST',body:{},expected:[401,403]});

// Reproduce the Samsung browser failure precisely: CORS preflight must allow
// Supabase-js's x-client-info header for both preview and production origins.
// The only real witness POST below is unsigned/unauthorised; it creates no report.
for(const origin of ['https://deploy-preview-2--uap-disclosure-desk.netlify.app','https://uapdisclosuredesk.com']){
 const preflight=await fetch(url+'/functions/v1/dd-witness-submit',{
  method:'OPTIONS',headers:{Origin:origin,
    'Access-Control-Request-Method':'POST',
    'Access-Control-Request-Headers':'authorization, x-client-info, apikey, content-type'},
  signal:AbortSignal.timeout(15000)
 });
 assert.equal(preflight.status,204,'CORS preflight '+origin);
 assert.equal(preflight.headers.get('access-control-allow-origin'),origin,
   'CORS origin denied: '+origin);
 const allowed=String(preflight.headers.get('access-control-allow-headers')||'').toLowerCase();
 for(const name of ['authorization','x-client-info','apikey','content-type'])
  assert.ok(allowed.includes(name),'Missing browser CORS header '+name+' on '+origin);
 checks++;
 console.log('PASS witness browser preflight '+origin+' HTTP 204');
}
console.log('PASS '+checks+' live guest/auth security HTTP checks. No user data written.');
