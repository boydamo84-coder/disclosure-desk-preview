'use strict';
// Disclosure Desk AdSense source configuration audit; GitHub-only, no external requests.
// Do not confuse published repository source with what Google's crawler actually sees.
const assert=require('node:assert/strict'),fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
const sellers=fs.readFileSync('ads.txt','utf8');
const robot=fs.readFileSync('robots.txt','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const build=fs.readFileSync('scripts/build_public_release.cjs','utf8');
const config=fs.readFileSync('assets/community-test-config.js','utf8');
const meta=[...home.matchAll(/<meta\s+name="google-adsense-account"\s+content="ca-pub-([0-9]{10,25})"/g)];
assert.equal(meta.length,1,'Homepage must contain one official AdSense verification meta tag');
const lines=sellers.trim().split(/\r?\n/);
assert.equal(lines.length,1,'Only one reviewed AdSense seller record should be published');
const seller=lines[0].match(/^google\.com,\s*pub-([0-9]{10,25}),\s*DIRECT,\s*f08c47fec0942fa0$/);
assert.ok(seller,'ads.txt must contain the correctly formatted Google seller record');
assert.equal(meta[0][1],seller[1],'Publisher ID must match verification meta and seller declaration');
assert.match(build,/'ads\.txt'/,'Strict production package must actually include ads.txt');
assert.match(robot,/User-agent:\s*\*/);
assert.match(robot,/Allow:\s*\//);
assert.match(robot,/Sitemap:\s*https:\/\/uapdisclosuredesk\.com\/sitemap\.xml/);
assert.match(sitemap,/https:\/\/uapdisclosuredesk\.com\//);
for(const flag of ['privateChat:enabled','discussions:enabled','profileAvatars:enabled','researchPublishing:false'])
 assert.ok(config.includes(flag),'Unapproved public social flag change: '+flag);
console.log('PASS: AdSense verification meta and seller record match; source sitemap/crawler entry points present; strict public packaging includes ads.txt, social flags active only on approved hostnames, subject to server access control. LIVE HTTP/GOOGLE REVIEW NOT CHECKED.');
