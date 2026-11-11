'use strict';
// M87: verify legal links and optional Drive claims before any public deploy.
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const terms=read('terms.html'),index=read('index.html'),policy=read('privacy.html'),rules=read('community-rules.html');
for(const [path,html] of [['index.html',index],['privacy.html',policy],['community-rules.html',rules],
 ['guide.html',read('guide.html')],['research-edition.html',read('research-edition.html')]]){
 assert.ok(html.includes('href="/terms"'),path+' must link Terms from its public UI');
}
for(const text of ['<h1>Terms of Service</h1>','https://uapdisclosuredesk.com/terms',
 '<a href="/privacy">Privacy Policy</a>','<a href="/community-rules">Community Rules</a>',
 'support@uapdisclosuredesk.com','11 November 2026','W.NE Research Edition',
 'optional action, not an automatic or continuous full-library backup','You retain ownership of material you create',
 'Google Drive','Northern Ireland','mandatory statutory consumer rights']){
 assert.ok(terms.includes(text),'Missing service-specific disclosure: '+text);
}
assert.match(terms,/<meta name="description" content="[^"]{50,220}">/);
assert.match(terms,/<script defer src="\/assets\/analytics-consent\.js/);
assert.ok(!/\b(?:TODO|TBD|lorem ipsum|example\.com)\b/i.test(terms));
assert.ok(index.includes('href="/terms">Terms of Service</a>'));
const sitemap=read('sitemap.xml');
assert.ok(sitemap.includes('<loc>https://uapdisclosuredesk.com/terms</loc>'));
assert.ok(read('scripts/build_public_release.cjs').includes("'terms.html'"));
assert.ok(read('scripts/test_search_indexing.cjs').includes("['/terms','terms.html']"));
assert.match(rules,/5 flags from distinct registered accounts/);
assert.match(policy,/Optional Google Drive Word copies/);
console.log('PASS M87: Terms/Privacy/Community/Drive copy accuracy, public links, sitemap and allowlist (NO deploy)');
