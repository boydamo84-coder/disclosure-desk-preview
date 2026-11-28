'use strict';
// Verify the actual allowlisted release, without JS/API/crawler-specific content.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const stage = path.join(root, '.release-staging/public-site');
const read = file => fs.readFileSync(path.join(stage, file), 'utf8');
const {pursueIndex, peopleIndex} = require('./build_public_discovery.cjs');
const catalogue = JSON.parse(read('data/pursue-index.json'));
const index = pursueIndex(root);
const html = read('pursue.html');
assert.ok(html.includes(index), 'Release output contains complete static catalogue');
const links = [...index.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)];
assert.equal(links.length, catalogue.records.length, 'Every approved record is in the static index');
assert.equal((index.match(/<details class="dd-public-release">/g) || []).length, catalogue.releases.length);
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
for (const row of catalogue.records) {
  assert.ok(index.includes('<a href="'+escape(row.source)+'">'+escape(row.title)+'</a>'), row.key);
  assert.ok(row.identifier === '' || index.includes(escape(row.identifier)), 'Original identifier '+row.key);
  assert.ok(['www.war.gov', 'www.dvidshub.net'].includes(new URL(row.source).host));
}
assert.ok(Buffer.byteLength(index) < 250_000, 'Do not balloon the catalogue HTML');
assert.match(html, /<div id="archive-records" class="records"/, 'Keep paginated interactive catalogue');
assert.match(read('assets/research-public.js'), /if \(publicIndex\) publicIndex\.open = false;/);
const people = peopleIndex(root);
assert.ok(read('who-is-who.html').includes(people), 'Public directory has static names and roles');
const base = JSON.parse(read('data/public-people-directory.json')).people;
const extras = JSON.parse(read('data/public-people-directory-additions-m58.json'));
const publicPeople = [...base, ...extras.people.filter(p => extras.enabledProfileIds.includes(p.id))];
assert.equal((people.match(/<li><a /g) || []).length, publicPeople.length);
for (const person of publicPeople) {
  assert.ok(people.includes(escape(person.name)) && people.includes(escape(person.role)), person.id);
}
assert.doesNotMatch(people, /claimEvidence|photoRightsAudit|profileResearchReview|private contact/i);
const home = read('index.html');
const more = home.match(/<details class="dd-discovery-more">[\s\S]*?<\/details>/)?.[0] || '';
for (const target of ['/investigations','/rendlesham-forest-1980','/roswell-1947','/pursue',
  '/project-blue-book','/pentagon-navy-video-referral','/guide#glossary','/research-edition']) {
  assert.ok(more.includes('href="'+target+'"'), 'Crawlable, discoverable '+target);
}
assert.match(home, /<h2>Latest UAP &amp; UFO news<\/h2>/);
assert.match(read('guide.html'), /<h2>What is a UAP\? UFO and UAP meanings<\/h2>/);
assert.match(read('guide.html'), /UAP means Unidentified Anomalous Phenomena; UFO means Unidentified Flying Object/);
assert.match(read('rendlesham-forest-1980.html'), /<h1>Rendlesham Forest UFO incident \(1980\)/);
assert.match(read('roswell-1947.html'), /<h1>Roswell UFO incident \(1947\)/);
assert.match(read('project-blue-book.html'), /<h1>Project Blue Book files and records<\/h1>/);
assert.match(read('sources.html'), /Brazil UFO files — Objeto Voador Não Identificado/);
for (const name of ['rendlesham-forest-1980','roswell-1947']) {
  assert.match(read(name+'.html'), /Editorial sign-off pending/, 'Do not imply editorial approval');
}
for (const loc of read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const pathname = new URL(loc[1]).pathname;
  const file = pathname === '/' ? 'index.html' : pathname.slice(1)+'.html';
  assert.doesNotMatch(read(file).split('</head>')[0], /<meta\s+name="keywords"/i, 'No meta keyword stuffing '+file);
}
assert.equal((read('sitemap.xml').match(/<loc>/g) || []).length, 24, 'Do not publish thin or duplicate pages');
console.log('PASS SEO: '+catalogue.records.length+' static government record links, '+publicPeople.length+' public directory entries, direct research links, glossary, truthful editorial status, 24 canonical destinations, unchanged private boundaries');
