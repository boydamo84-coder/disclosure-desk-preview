'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {routes,shareRedirect}=require('./public_share_redirect_qa.cjs');
const html=fs.readFileSync('index.html','utf8');
const helpers=html.slice(html.indexOf("const DD_PUBLIC_SHARE_ORIGIN="),html.indexOf('window.DDSharePublicLink=async'));
const context={window:{},URL,location:{origin:'http://127.0.0.1:4173'},safePublicUrl:v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null}catch{return null}}};
vm.createContext(context);vm.runInContext(helpers,context);
const link=context.ddPublicRecordLink,brand=context.ddBrandedPublicLink,base='https://uapdisclosuredesk.com';
const recordIds={news:'63f7be4828e9ea82f3c3',archive:'bluebook-123',video:'video-1',case:'c2',discussion:'11111111-1111-4111-8111-111111111111',witness:'22222222-2222-4222-8222-222222222222',media:'fixture-doc'};
const params={news:'dd_news',archive:'dd_archive_case',video:'dd_videos',case:'case',discussion:'dd_thread',witness:'dd_witness',media:'dd_media'};
for(const [kind,id] of Object.entries(recordIds)){
 const url=link(kind,id);assert.equal(url,base+'/'+kind+'/'+id);
 const path=new URL(url).pathname,redirect=shareRedirect(path);assert.equal(redirect.status,302);
 const target=new URL(redirect.location,base);assert.equal(target.origin,base);assert.equal(target.searchParams.get(params[kind]),id);
 const old=new URL('/',base);old.searchParams.set(params[kind],id);assert.equal(brand(old.href),url);
}
const comment='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
for(const kind of ['news','video','media','hearing','archive','case','raw']){
 const id='fixture-A',key=kind==='raw'?id:kind+':'+id;
 for(const focused of [false,true]){
  const old=new URL('/',context.location.origin);old.searchParams.set('dd_discussion',key);if(focused)old.searchParams.set('dd_comment',comment);
  const url=brand(old.href);assert.equal(url,base+'/talk/'+kind+'/'+id+(focused?'/'+comment:''));
  const redirect=shareRedirect(new URL(url).pathname),target=new URL(redirect.location,base);
  assert.equal(target.searchParams.get('dd_discussion'),key);assert.equal(target.searchParams.get('dd_comment'),focused?comment:null);
 }
}
assert.equal(routes.length,21);assert(routes.every(r=>r.status===302&&r.to.startsWith('/?')&&!r.to.includes('://')));
for(const malicious of ['https://evil.invalid/','../private','x/y','x?next=y','a&b','x#z','x%2Fy','x'.repeat(151),'']){
 assert.equal(link('news',malicious),null);assert.equal(shareRedirect('/news/'+malicious),null);
}
assert.equal(link('private','anything'),null);
assert.equal(brand(base+'/?dd_news=%2Fprivate'),null);
assert.equal(brand(base+'/?dd_discussion=secret%3Afoo'),null);
assert.equal(brand('https://publisher.invalid/article?dd_news=123'),'https://publisher.invalid/article?dd_news=123','No external open redirect and no invented public record');
assert.equal(brand('https://uapdisclosuredesk.com/rendlesham-forest-1980'),base+'/rendlesham-forest-1980');
assert.match(html,/ddPublicRecordLink\('news',story.id\)/);
assert.match(html,/ddPublicRecordLink\('archive',String\(r.id\)\)/);
assert.match(html,/ddPublicRecordLink\('video',c.id\)/);
assert.match(html,/historicalRecords.find\(r=>String\(r.id\)===ddPendingArchiveCase\)/);
assert.match(html,/entry.url&&item.headline===entry.title/);
console.log('PASS branded record links, 21 fixed same-origin Netlify routes, exact discussion/comment keys, malformed IDs and no arbitrary redirect');
