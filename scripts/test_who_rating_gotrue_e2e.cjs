'use strict';
// M24 ONLY: actual local Supabase Auth (GoTrue) sign-in and signed JWT voting.
// NO production/network Supabase access, no real emails, no service keys.
const assert=require('node:assert/strict');
const auth='http://127.0.0.1:9999';
const api='http://127.0.0.1:3207';
let checks=0;
async function send(url,method='GET',data,token,headers={}){
 const h={'content-type':'application/json','accept':'application/json',...headers};
 if(token)h.authorization='Bearer '+token;
 const r=await fetch(url,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data)});
 const raw=await r.text();let out;
 try{out=raw?JSON.parse(raw):null;}catch{out=raw.slice(0,400);}
 return {status:r.status,data:out};
}
function ok(x,label){assert(x.status>=200&&x.status<300,
 label+' expected 2xx, got '+x.status+' '+JSON.stringify(x.data).slice(0,240));checks++;return x.data;}
function deny(x,label){assert(x.status>=400&&x.status<500,
 label+' expected rejection, got '+x.status+' '+JSON.stringify(x.data).slice(0,240));checks++;}
const summary=(token)=>send(api+'/rpc/dd_who_claim_rating_summary','POST',
 {p_claim_ids:['m24-claim-fixture']},token);
const vote=(token,value,claim='m24-claim-fixture')=>send(api+'/rpc/dd_who_claim_rating_set','POST',
 {p_claim_id:claim,p_rating:value},token);
const member=(n)=>({email:'m24-fixture-'+n+'@example.com',
 password:'M24-fictional-only-Password-907!'});
function claims(jwt){
 const parts=jwt.split('.');assert.equal(parts.length,3,'JWT has 3 signed parts');
 return JSON.parse(Buffer.from(parts[1],'base64url').toString());
}
(async()=>{
 const check=ok(await send(auth+'/health'),'Self-hosted GoTrue health endpoint');
 assert(check,'GoTrue health must answer');checks++;
 const guest=ok(await summary(),'Guest can inspect reviewable synthetic claim');
 assert(Array.isArray(guest)&&guest.length===1&&guest[0].rating_count===0);checks++;
 deny(await vote(null,50),'Guest cannot create rating');
 const tokens=[],ids=[],refreshes=[];
 for(let n=1;n<=2;n++){
  const profile=member(n);
  const newUser=ok(await send(auth+'/signup','POST',profile),'GoTrue signup '+n);
  assert(newUser?.user?.id||newUser?.id,'GoTrue returned real auth user '+n);checks++;
  const login=ok(await send(auth+'/token?grant_type=password','POST',profile),'GoTrue password login '+n);
  assert(typeof login.access_token==='string'&&login.access_token.length>40,'GoTrue issued access JWT');checks++;
  assert(typeof login.refresh_token==='string'&&login.refresh_token.length>=8,'GoTrue issued a nonempty opaque refresh token');checks++;
  const c=claims(login.access_token);
  assert.equal(c.role,'authenticated','GoTrue issued authenticated role');checks++;
  assert.equal(c.aud,'authenticated','GoTrue audience');checks++;
  assert(c.exp>Math.floor(Date.now()/1000),'GoTrue signed unexpired token');checks++;
  assert.equal(c.sub,login.user.id,'JWT sub matches authenticated user');checks++;
  assert.match(c.session_id,/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i,'Actual GoTrue token carries a session UUID');checks++;
  ids.push(c.sub);tokens.push(login.access_token);refreshes.push(login.refresh_token);
  const authenticated=ok(await send(auth+'/user','GET',undefined,login.access_token),'GoTrue validates user '+n);
  assert.equal(authenticated.id,c.sub,'User endpoint verifies JWT belongs to account');checks++;
 }
 assert.notEqual(ids[0],ids[1],'Two genuinely separate local GoTrue users');checks++;
 // GoTrue anonymous sign-in creates a REAL auth.users row but cannot vote,
 // despite bearing Postgres role authenticated.
 const anonymous=ok(await send(auth+'/signup','POST',{data:{}}),
  'Real GoTrue anonymous sign-in');
 assert(typeof anonymous.access_token==='string','Real GoTrue anonymous access JWT');checks++;
 assert.equal(claims(anonymous.access_token).is_anonymous,true,'Anonymous JWT claim is server-issued');checks++;
 assert.equal(claims(anonymous.access_token).role,'authenticated','Anonymous user carries authenticated SQL role');checks++;
 deny(await vote(anonymous.access_token,70),'GoTrue-authenticated anonymous user cannot vote');
 // Rotate a genuine password-authenticated refresh token and retain identity.
 const renewed=ok(await send(auth+'/token?grant_type=refresh_token','POST',
  {refresh_token:refreshes[1]}),'GoTrue refresh-token exchange');
 assert.equal(claims(renewed.access_token).sub,ids[1],'Refreshed access token preserves account identity');checks++;
 assert(typeof renewed.refresh_token==='string'&&renewed.refresh_token.length>=8,
  'GoTrue rotated the refresh token');checks++;
 const refreshedUser=ok(await send(auth+'/user','GET',undefined,renewed.access_token),
  'GoTrue recognises refreshed access token');
 assert.equal(refreshedUser.id,ids[1]);checks++;
 deny(await send(auth+'/token?grant_type=password','POST',
  {...member(1),password:'WRONG-PASSWORD-9!'}),'GoTrue rejects incorrect account password');
 deny(await send(auth+'/user','GET',undefined,tokens[0].slice(0,-1)+'x'),
  'GoTrue rejects mutated signed access token');
 const a=ok(await vote(tokens[0],65),'First genuine GoTrue account votes through PostgREST');
 assert.equal(a.length,1);checks++;
 assert.equal(a[0].rating_count,1);checks++;
 assert.equal(a[0].my_rating,65);checks++;
 assert.equal(a[0].community_mean,null);checks++;
 const other=ok(await summary(tokens[1]),'Second GoTrue user can inspect private-safe summary');
 assert.equal(other.length,1);checks++;
 assert.equal(other[0].my_rating,null,'Other GoTrue user cannot read the first account vote');checks++;
 deny(await send(api+'/dd_who_claim_ratings?select=claim_id,score','GET',undefined,tokens[1]),
  'Authenticated GoTrue session cannot inspect raw vote table');
 deny(await vote(tokens[0],75),'Rapid second vote blocked by cooldown');
 deny(await vote(tokens[1],10,'m24-disabled-fixture'),'No voting on disabled claim');
 const second=ok(await vote(tokens[1],95),'Second independent GoTrue account votes');
 assert.equal(second[0].rating_count,2);checks++;
 assert.equal(second[0].community_mean,null,'No two-voter public mean');checks++;
 assert.equal(second[0].my_rating,95);checks++;
 const guestAfter=ok(await summary(),'Guest can view count but no individual votes');
 assert.equal(guestAfter[0].rating_count,2);checks++;
 assert.equal(guestAfter[0].my_rating,null);checks++;
 assert.equal(guestAfter[0].community_mean,null);checks++;
 deny(await send(api+'/rpc/dd_who_claim_rating_set','POST',
  {p_claim_id:'m24-claim-fixture',p_rating:45},tokens[0].slice(0,-1)+'x'),
  'PostgREST rejects corrupted GoTrue access token');
 deny(await send(api+'/rpc/dd_who_claim_rating_set','POST',
  {p_claim_id:'m24-claim-fixture',p_rating:45},'bogus.jwt.signature'),
  'PostgREST rejects arbitrary bearer');
 // Critical auth lifecycle distinction: sign-out revokes refresh grants, but
 // self-contained bearer JWTs can remain usable until expiry. Do not claim
 // immediate access-token revocation without session_id enforcement.
 ok(await send(auth+'/logout','POST',{},renewed.access_token),
  'Actual GoTrue sign-out invalidates the member session refresh grants');
 deny(await send(auth+'/token?grant_type=refresh_token','POST',
  {refresh_token:renewed.refresh_token}),
  'GoTrue rejects refresh after signed-out session');
 const jwtAfterLogout=ok(await summary(renewed.access_token),
  'Unexpired signed access JWT can still reach read-only summary after logout');
 assert.equal(jwtAfterLogout[0].my_rating,95,
  'Read-only summary can remain accessible to unexpired signed JWT after logout');checks++;
 // A SECOND fictional claim avoids cooldown being confused with session
 // revocation. The signed-out account must get SQLSTATE 28000 even with a
 // cryptographically valid, unexpired bearer token.
 const loggedOutAttempt=await vote(renewed.access_token,45,'m25-revocation-fixture');
 deny(loggedOutAttempt,'Signed-out GoTrue session cannot cast a new vote');
 assert.equal(loggedOutAttempt.data?.code,'28000',
  'Logout denial must be Auth session revocation, NOT vote cooldown or claim absence');checks++;
 const stillSignedIn=ok(await vote(tokens[0],60,'m25-revocation-fixture'),
  'Separate still-active GoTrue session can vote on the same synthetic claim');
 assert.equal(stillSignedIn[0].my_rating,60);checks++;
 console.log('M25 GoTrue: '+checks+' real local Auth/JWT/vote checks; logout blocks NEW votes despite still-valid JWT, while read-only JWT remains valid until expiry. NO PRODUCTION USERS.');
})().catch(error=>{console.error('M24 GOTRUE FAILURE: '+error.message);process.exitCode=1;});
