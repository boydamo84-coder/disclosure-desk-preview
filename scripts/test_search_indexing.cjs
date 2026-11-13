'use strict';
// M36: Match indexing signals to live Netlify clean URLs. Read-only source gate.
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const origin='https://uapdisclosuredesk.com';
const publicRoutes=[
 ['/','index.html'],['/research-edition','research-edition.html'],
 ['/sources','sources.html'],['/guide','guide.html'],
 ['/community-rules','community-rules.html'],['/privacy','privacy.html'],['/terms','terms.html']
];
const robots=read('robots.txt'),sitemap=read('sitemap.xml');
assert.match(robots,/User-agent:\s*\*/);
assert.match(robots,/Allow:\s*\//);
assert.ok(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
const listed=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual(listed,publicRoutes.map(([route])=>origin+route),
 'Use only reviewed clean, canonical public routes, each exactly once');
assert.match(sitemap,/<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
assert.doesNotMatch(sitemap,/\/research\/|\/data\/|\/api\/|\/admin\/|\/netlify\//);
assert.ok(listed.every(url=>!url.includes('?')&&!url.includes('#')&&!url.endsWith('.html')));
const titles=new Set();
for(const [route,file] of publicRoutes){
 const html=read(file),head=html.split('</head>')[0];
 const canonical=origin+route;
 assert.match(html.slice(0,200),/<html[^>]+lang="en(?:-GB)?"/i,file+' language');
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
 assert.ok(title&&title.length>18&&title.length<85,'Clear page title for '+file);
 assert.ok(!titles.has(title),'Unique title '+file);titles.add(title);
 assert.match(head,/<meta name="description" content="[^"]{50,220}">/,'Description '+file);
 assert.ok(head.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+file);
 assert.doesNotMatch(head,/<meta[^>]+name="robots"[^>]+noindex/i,'Public page noindex '+file);
 const og=head.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
 if(og)assert.equal(og,canonical,'OG shares canonical '+file);
 const schema=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 if(schema){
  const data=JSON.parse(schema[1]);
  if(data['@type']==='WebPage')assert.equal(data.url,canonical,'Structured page URL '+file);
 }
}
for(const [route,file] of publicRoutes.filter(([route])=>route!=='/')){
 const home=read('index.html');
 assert.ok(home.includes('href="'+route+'"'),'Crawlable direct homepage link '+route);
}
// The new prettified public pages do not change private W.NE endpoints.
// No public sitemap entries or canonical links may point to authenticated documents.
for(const p of ['research/index.html','research/guest-preview.html','research/wne.html',
 'research/research-workspace.html','research/research-bible.html','research/import.html',
 'research/restore-copy.html','research/restore-library.html']){
 const source=read(p).slice(0,2400);
 assert.match(source,/<meta\s+name="robots"\s+content="[^"]*noindex[^"]*">/i,
  'Preserve private noindex for '+p);
 assert.ok(!listed.some(url=>url.includes('/research/')),'Never list W.NE internals');
}
// M62: Public help pages must reflect the current available social release.
const guide=read('guide.html'), communityRules=read('community-rules.html');
for(const route of ['chatPage','discussionsPage']){
 assert.ok(guide.includes('href="/?dd_tab='+route+'"'),
  'Guide links to public '+route+' destination');
}
assert.doesNotMatch(guide,/data-guide-beta|local phone beta, not enabled for the general public website/i,
 'Public guide must not hide live social navigation');
assert.match(guide,/Eligible registered members can create subjects, posts and replies on the public website/,
 'Discussions FAQ documents eligibility');
assert.match(communityRules,/Community Discussions and private one-to-one Chat are available to eligible signed-in members/,
 'Community Rules reflect current public website');
assert.doesNotMatch(communityRules,/Planned: user-created Discussions sections|Proposed Discussions and private Chat rules/i,
 'No outdated social launch text on indexed public pages');
const research=read('research-edition.html');
assert.match(research,/href="\/research\/index\.html"/);
assert.match(research,/href="\/research\/guest-preview\.html"/);
const rules=read('community-rules.html');
for(const id of ['accounts','witness','voting','flagging','comments','research','privacy'])
 assert.ok(rules.includes('id="'+id+'"'),'Community rules retain '+id);
assert.match(rules,/5 flags from distinct registered accounts/);
assert.match(rules,/one active vote per item/);
// Search Console 404: do not attempt a function absent from the public
// Netlify package. News Interests still matches genuine feed headlines.
const main=read('index.html');
assert.doesNotMatch(main,/fetch\(\s*['"]\/\.netlify\/functions\/interests\b/i,
 'Do not request the never-deployed /interests Netlify function');
assert.match(main,/interestStories=feedLive\?localInterestMatches\(stories,myInterests\):\[\]/,
 'Keep sourced News Interests matching instead of disabling the feature');
// M96: older browsers and crawlers may request /favicon.ico even when the
// branded SVG favicon is declared correctly. Keep an exact, non-invasive
// Netlify fallback; do not create a catch-all redirect for missing paths.
const netlify=read('netlify.toml');
assert.ok(netlify.includes('from = "/favicon.ico"') &&
          netlify.includes('to = "/assets/disclosure-desk-mark.svg"') &&
          netlify.includes('status = 302'),
  'Legacy favicon fallback must point at the published brand SVG only');
assert.ok(read('index.html').includes('<link rel="icon" type="image/svg+xml" href="/assets/disclosure-desk-mark.svg">'),
  'Browser should prefer the original branded SVG favicon');
assert.match(read('assets/disclosure-desk-mark.svg'),/<svg[^>]*viewBox="0 0 512 512"/,
  'Favicon redirect must target the real Disclosure Desk artwork');
assert.ok(read('scripts/build_public_release.cjs').includes("'disclosure-desk-mark.svg'"),
  'Strict release package must publish the favicon SVG');
console.log('PASS Search: 7 clean sitemap URLs, consistent canonicals and schema, direct internal links, protected W.NE noindex, no search privacy regressions');
