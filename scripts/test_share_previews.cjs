'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
(async()=>{
 const {default:render,config}=await import('../netlify/functions/share-preview.mjs');
 const base='https://uapdisclosuredesk.com';
 const local=async(path,options)=>{const r=await render(new Request(base+path,options));return {status:r.status,headers:r.headers,body:await r.text()}};
 const title=body=>body.match(/<meta property="og:title" content="([^"]*)">/)?.[1];
 const calls=[];
 // Real handler; external read endpoints are deterministic in this isolated QA test.
 global.fetch=async(url,opts)=>{
  const u=new URL(url);calls.push({u,opts});
  assert.equal(opts.redirect,'error');
  if(u.hostname==='raw.githubusercontent.com'){
   if(u.pathname.endsWith('/news-alerts.json'))return Response.json([{id:'live-fresh',headline:'Updated UAP story &amp; source',source:'Fixture publisher',url:'https://example.invalid/report',relatedCoverage:[{id:'alternate-fresh',headline:'Alternate source headline',source:'Other publisher'}]}]);
   if(u.pathname.endsWith('/disclosure-clips.json'))return Response.json([{id:'new-video',title:'New video title',publisher:'Fixture publisher'}]);
   throw Error('Unexpected feed');
  }
  assert.equal(u.hostname,'omqxizswzcwgzqaczlhe.supabase.co');
  assert.match(opts.headers.apikey,/^sb_publishable_/);
  assert.ok(!opts.headers.Authorization);
  if(u.pathname.endsWith('dd_discussions_thread_v2')){
   const id=JSON.parse(opts.body).p_thread_id;
   return Response.json(id==='11111111-1111-4111-8111-111111111111'?[{id,title:'Public forum post "<script>alert(1)</script>',body:'DO NOT EXPOSE BODY'}]:[]);
  }
  if(u.pathname.endsWith('dd_media_catalogue'))return Response.json([{id:'book-1',title:'A & B field guide',category:'books',creator:'Fixture author',private_note:'DO NOT EXPOSE PRIVATE NOTE'}]);
  if(u.pathname.endsWith('dd_public_witness_reports')){
   assert.equal(u.searchParams.get('select'),'id,category,city,country');
   return Response.json([{id:'22222222-2222-4222-8222-222222222222',category:'UAP',city:'Fixture town',country:'UK',story:'DO NOT EXPOSE STORY'}]);
  }
  if(u.pathname.endsWith('dd_live_events'))return Response.json([{id:'future-hearing',title:'New public hearing',is_public:true,status:'upcoming'}]);
  throw Error('Unexpected data endpoint');
 };
 const tests=[
  ['/news/63f7be4828e9ea82f3c3',/New Pentagon UFO files reveal/],
  ['/news/live-fresh',/^Updated UAP story &amp; source$/],
  ['/news/alternate-fresh',/^Alternate source headline$/],
  ['/archive/featured-rendlesham-1980',/Rendlesham Forest/],
  ['/video/yt-X1F6L1by_9o',/Skinwalker Ranch/],
  ['/video/new-video',/New video title/],
  ['/case/c1',/^Roswell Incident$/],
  ['/discussion/11111111-1111-4111-8111-111111111111',/Public forum post &quot;&lt;script&gt;/],
  ['/witness/22222222-2222-4222-8222-222222222222',/Witness report · UAP · Fixture town/],
  ['/media/book-1',/^A &amp; B field guide$/],
  ['/talk/hearing/future-hearing',/^New public hearing$/],
  ['/talk/news/live-fresh/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',/^Updated UAP story &amp; source$/],
 ];
 for(const [path,expected] of tests){
  const r=await local(path);assert.equal(r.status,200,path);assert.match(title(r.body),expected,path);
  assert.ok(r.body.includes('property="og:url" content="'+base+path+'"'));
  assert.ok(r.body.includes('name="twitter:title" content="'+title(r.body)+'"'));
  assert.ok(r.body.includes('property="og:image" content="'+base+'/assets/share-desk.jpg"'));
  assert.match(r.body,/id="open-record" href="\/\?/);
  assert.doesNotMatch(r.body,/http-equiv="refresh"|DO NOT EXPOSE|<script>alert\(1\)/);
  assert.equal(r.headers.get('cache-control'),'no-store');
  const script=r.body.match(/<script>([^]*?)<\/script>/)[1];
  const hash=crypto.createHash('sha256').update(script).digest('base64');
  assert.ok(r.headers.get('content-security-policy').includes('sha256-'+hash));
 }
 const missing=await local('/discussion/33333333-3333-4333-8333-333333333333?title=Fake%20post&next=https://evil.invalid');
 assert.equal(title(missing.body),'Community discussion on Disclosure Desk');assert.doesNotMatch(missing.body,/Fake post|evil.invalid/);
 for(const path of ['/news/not%2Fvalid','/talk/private/board-1','/discussion/not-a-uuid','/news/x/other','/archive/__proto__/unexpected'])assert.equal((await local(path)).status,404,path);
 const head=await local('/news/live-fresh',{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.body,'');
 assert.equal((await local('/news/live-fresh',{method:'POST'})).status,405);
 assert.ok(calls.every(c=>c.u.hostname==='raw.githubusercontent.com'||c.u.hostname==='omqxizswzcwgzqaczlhe.supabase.co'));
 assert.equal(config.method.join(','),'GET,HEAD');assert.equal(config.path.length,9);
 const manifest=JSON.parse(fs.readFileSync('.release-staging/public-site/release-manifest.json'));
 assert.ok(!manifest.files.some(x=>x.path.includes('share-catalogue')||x.path.includes('netlify/')),'Server code and index not shipped to public assets/APK');
 console.log('PASS distinct crawler-visible previews, fresh news/video lookups, anonymous public records, escaping, no private fields, no open redirects, no JS required to read, safe navigation, GET/HEAD only');
})().catch(e=>{console.error(e);process.exitCode=1});
