'use strict';
// Source-only simulated Auth concurrency: no live credentials, endpoint or
// user records. Complements real PostgreSQL RLS tests, not signed-token E2E.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('experiments/r3/hypothesis-cloud.js','utf8');
const A={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',email:'a@example.invalid',is_anonymous:false};
const B={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',email:'b@example.invalid',is_anonymous:false};
const envelope={format:'dd-r3-private-aes256gcm-v1',cipher:'AES-256-GCM',
 generation:'a'.repeat(32),ciphertext:'X'.repeat(384)};
function fixture(initialUser=A){
 let current=initialUser,error=null,changed=null,pause=null,entered=null,enteredResolve=null,reloads=0,events=0;
 const row={generation:envelope.generation,encrypted_envelope:envelope,updated_at:'2026-11-15T00:00:00Z'};
 const client={
  auth:{
   getUser:async()=>({data:{user:current},error}),
   onAuthStateChange:callback=>{changed=callback;return {data:{subscription:{unsubscribe(){}}}};}
  },
  from:table=>{
   assert.equal(table,'dd_r3_private_notebooks');
   return {select(){return this},eq(){return this},
    async maybeSingle(){
     if(pause){
      enteredResolve();const gate=pause;pause=null;await gate;
     }
     return {data:row,error:null};
    }};
  }
 };
 const w={
  DD_COMMUNITY_TEST_CONFIG:{url:'https://example.supabase.co',
    publishableKey:'sb_publishable_FICTIONAL_TEST_ONLY',environment:'test'},
  supabase:{createClient:()=>client},dispatchEvent:()=>{events++}
 };
 const context={window:w,location:{hostname:'uapdisclosuredesk.com',reload:()=>{reloads++}},
  Event:class{constructor(name){this.type=name}}};
 vm.runInNewContext(source,context,{filename:'hypothesis-cloud.js'});
 return {
  sdk:w.DDR3Cloud,
  setUser:(u)=>{current=u;error=null},
  setError:e=>{error=new Error(e)},
  change:(name,u)=>{assert.equal(typeof changed,'function');changed(name,{user:u})},
  hold:()=>{entered=new Promise(resolve=>enteredResolve=resolve);
   let resume;pause=new Promise(resolve=>resume=resolve);
   return {entered,resume};},
  stats:()=>({reloads,events})
 };
}
(async()=>{
 const f=fixture();
 assert.equal((await f.sdk.ready()).id,A.id);
 assert.equal((await f.sdk.readEncrypted()).generation,envelope.generation);
 // Hold a legitimate A read until the login has switched to B.
 // A successful network reply must not return A's encrypted notebook to B.
 const barrier=f.hold(),late=f.sdk.readEncrypted();
 await barrier.entered;
 f.setUser(B);f.change('SIGNED_IN',B);
 barrier.resume();
 await assert.rejects(late,/Account changed|sign-in has changed/);
 assert.equal(f.stats().reloads,1);
 assert.equal(f.stats().events,1);
 await assert.rejects(f.sdk.readEncrypted(),/Account changed|sign-in has changed/);
 // Fresh page logged in as A, then an expired session must fail closed.
 const expired=fixture();await expired.sdk.ready();
 expired.setError('JWT expired');
 await assert.rejects(expired.sdk.readEncrypted(),/Account verification unavailable/);
 // SIGNED_OUT triggers a lock and reload even if the browser is offline.
 const loggedOut=fixture();await loggedOut.sdk.ready();
 loggedOut.setUser(null);loggedOut.change('SIGNED_OUT',null);
 assert.equal(loggedOut.stats().events,1);
 await assert.rejects(loggedOut.sdk.readEncrypted(),/Account changed|sign-in has changed/);
 // Token refresh carrying a different account must also invalidate the tab.
 const refreshed=fixture();await refreshed.sdk.ready();
 refreshed.setUser(B);refreshed.change('TOKEN_REFRESHED',B);
 assert.equal(refreshed.stats().reloads,1);
 await assert.rejects(refreshed.sdk.verifyCurrent(),/Account changed|sign-in has changed/);
 // A guest cannot read account ciphertext, even if a broken mock backend would.
 const guest=fixture(null);
 assert.equal(await guest.sdk.ready(),null);
 await assert.rejects(guest.sdk.readEncrypted(),/Sign in/);
 console.log('PASS R3 cloud identity: pending response revoked on A→B, signed-out & expired token denied, refresh identity switch rejected, guest denied');
})().catch(e=>{console.error('R3 cloud identity regression FAILED',e);process.exitCode=1});
