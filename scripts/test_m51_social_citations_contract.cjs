'use strict';
// M51 source contract: no services, uploads, real accounts or production data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const site=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/community-polish.css','utf8');
const citation=fs.readFileSync('research/wne-ui-m40.js','utf8');
const citationCss=fs.readFileSync('research/wne-ui-m40.css','utf8');
assert.match(site,/<div class="dd-news-actions"><div class="dd-news-main-actions dd-action-rail">/,
 'News toolbar must be one action rail rather than two separated rows');
assert.doesNotMatch(site,/class="dd-news-tools"/,'Remove legacy separate Compare row');
assert.match(site,/class="outline dd-news-compare-action" data-compare-news="\$\{i\}"/);
assert.match(site,/querySelectorAll\('\[data-compare-news\]'\)/,
 'Keep existing Compare click handler rather than a decorative button');
assert.match(css,/\.dd-action-rail\{justify-content:flex-end!important\}/,
 'Align all shared social rails to the right, including mobile');
assert.match(css,/#newsGrid article>\.dd-news-actions>\.dd-news-main-actions\{[\s\S]*?justify-content:flex-end!important/);
assert.match(css,/\.nav \.tab\[data-tab="profilePage"\]\{[\s\S]*?flex-direction:column!important/,
 'Profile avatar must sit above label');
assert.match(site,/el\.dataset\.boardState=saved\?'added':'available'/);
assert.match(site,/board\.links\.unshift\(entry\);boardSave\(\);refreshBookmarkStars\(\)/);
assert.match(site,/data-timeline-key/);
assert.match(site,/btn\.textContent='✓ Added';btn\.setAttribute\('aria-label','Event added to your private timeline'\)/);
assert.match(site,/function ddSaveSiteCitation\(title,url\)/);
assert.match(site,/data-dd-citation-url/);
assert.match(site,/ddSaveSiteCitation\(btn\.dataset\.ddCitationTitle,btn\.dataset\.ddCitationUrl\)/);
assert.match(site,/DD_SITE_CITATIONS='wne_research_references_v1'/,
 'Use same safe per-browser reference list as W.NE');
assert.match(citation,/function saveCitationOnly\(\)/);
assert.match(citation,/id="dd-m40-cite-save-only"/);
assert.match(citation,/Save to citation list \(no insertion\)/);
assert.match(citation,/d\.querySelector\('#dd-m40-cite-save-only'\)\.onclick=saveCitationOnly/);
assert.match(citationCss,/#dd-m40-cite-save-only/);
const f=citation.slice(citation.indexOf('function saveCitationOnly()'),citation.indexOf('function insertCitation()'));
assert.doesNotMatch(f,/execCommand|dispatchEvent\(new Event\('input'/,
 'Save-only must never edit active writing');
assert.match(f,/localStorage\.setItem\(sourceKey\(p\),JSON\.stringify\(next\)\)/);
assert.match(f,/if\(existing<0\&\&list\.length>=499\)/);
console.log('PASS M51 rail layout, saved Board/timeline and non-inserting citation-list contracts.');
