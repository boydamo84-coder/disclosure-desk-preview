'use strict';
/* Google Search discovery and privacy checks — no Google account or live deployment required. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const domain='https://uapdisclosuredesk.com';
const publicPages=['/','/research-edition.html','/community-rules.html','/privacy.html'];
const publicFiles={'/':'index.html','/research-edition.html':'research-edition.html','/community-rules.html':'community-rules.html','/privacy.html':'privacy.html'};
const robots=read('robots.txt'),sitemap=read('sitemap.xml');
assert.match(robots,/User-agent:\s*\*/);
assert.match(robots,/Allow:\s*\//);
assert.ok(robots.includes('Sitemap: '+domain+'/sitemap.xml'),'Use the canonical domain for the sitemap');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(urls.length,publicPages.length,'Sitemap must list only approved public indexable pages');
assert.deepEqual(urls,publicPages.map(p=>domain+p));
assert.match(sitemap,/<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
assert.doesNotMatch(sitemap,/\/research\/|\/data\/|\/api\/|\/admin\/|\/netlify\//,'Never expose private document or API routes in public sitemap');
for(const p of publicPages){
 const html=read(publicFiles[p]);
 const name=p==='/'?'home':p;
 assert.match(html,/lang="en(?:-GB)?"/,'Missing English language on '+name);
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
 assert.ok(title&&title.length>18&&title.length<85,'Provide distinct, human-readable title for '+name);
 assert.match(html,/<meta name="description" content="[^"]{50,220}">/,'Missing useful meta description on '+name);
 assert.ok(html.includes('<link rel="canonical" href="'+domain+p+'">'),'Incorrect canonical for '+name);
 assert.doesNotMatch(html.slice(0,2500),/<meta name="robots" content="[^"]*noindex/i,'Public page must be indexable: '+name);
}
const home=read('index.html');
assert.ok(home.includes('href="/research-edition.html"'),'Provide a crawlable public link to W.NE Research Edition');
assert.ok(home.includes('href="/privacy.html"'),'Provide a crawlable Privacy Policy link');
assert.ok(home.includes('href="/community-rules.html"'),'Provide a crawlable community rules link');
assert.match(home,/<meta property="og:title"/);
assert.match(home,/<meta property="og:url" content="https:\/\/uapdisclosuredesk.com\/">/);
const research=read('research-edition.html');
assert.ok(research.includes('href="/research/index.html"'),'Public research information must link to the actual app');
assert.ok(research.includes('href="/research/guest-preview.html"'),'Public research information must link to guest preview');
const schemaMatch=research.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(schemaMatch,'Public research information needs factual JSON-LD description');
const schema=JSON.parse(schemaMatch[1]);
assert.equal(schema['@context'],'https://schema.org');
assert.equal(schema['@type'],'WebPage');
assert.equal(schema.url,domain+'/research-edition.html');
assert.equal(schema.publisher.name,'Boyd Digital Studios');
for(const p of ['research/index.html','research/guest-preview.html','research/wne.html','research/research-workspace.html','research/research-bible.html','research/import.html','research/restore-copy.html']){
 const html=read(p);
 assert.match(html.slice(0,1800),/<meta name="robots" content="[^"]*noindex[^"]*">/,p+' must remain non-indexable');
 assert.ok(!urls.some(url=>url.endsWith(p.replace('research/','/research/'))),p+' must not be in public sitemap');
}
assert.ok(!urls.some(x=>x.includes('?')||x.includes('#')),'Sitemap must use permanent clean URLs');
const rules=read('community-rules.html');
for(const section of ['accounts','witness','voting','flagging','comments','research','privacy']){
 assert.ok(rules.includes('id="'+section+'"'),'Document community rule category '+section);
}
for(const needle of ['3 new public witness reports','5 distinct valid account flags','one active vote per item','private drafts only','rolling 24-hour period','Community-published W.NE research']){
 assert.ok(rules.includes(needle),'Missing clear beta community policy: '+needle);
}
assert.match(rules,/some community features described below are still being built or tested/i,'No misleading claim that public publishing is live');

console.log('PASS: robots, canonical public sitemap, homepage social metadata, W.NE structured page, crawlable links, noindex private research and no leakage of dynamic records');
