#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');
const directory=read('sources.html');
const homepage=read('index.html');
const sitemap=read('sitemap.xml');
const cards=[...directory.matchAll(/<article class="entry" data-country="([^"]+)" data-type="([^"]+)" data-search="([^"]+)">/g)];
assert.equal(cards.length,13,'Expected thirteen curated source entries');
for(const [,country,type,search] of cards){
 assert(country.trim()&&type.trim()&&search.trim(),'Each source has country, type and searchable metadata');
}
const external=[...directory.matchAll(/href="(https:\/\/[^"]+)"/g)].map(m=>m[1]);
assert(external.length>=13,'At least one original external link per entry');
assert.equal(new Set(external).size,external.length,'Do not duplicate source URLs');
for(const url of external){const parsed=new URL(url);assert(parsed.hostname&&!parsed.username&&!parsed.password,'Malformed source URL');}
assert(directory.includes('Arquivo Nacional, Objeto Voador Não Identificado'),'Brazil fonds attribution missing');
assert(directory.includes('BR DFANBSB ARX.0.0.4'),'Brazil example reference missing');
assert(directory.includes('correct individual reference code'),'Individual Brazil references must not be conflated');
assert(directory.includes('does not mean it endorses or partners'),'Avoid implication of endorsement');
assert(directory.includes('Reproducing digital copies may require further permission'),'Do not infer blanket reuse permission');
assert(directory.includes('id="archiveSearch"')&&directory.includes('id="countryFilter"')&&directory.includes('id="typeFilter"'));
const js=[...directory.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
assert.equal(js.length,1,'Directory should have one small inline script');
js.forEach(s=>new vm.Script(s,{filename:'sources.html inline script'}));
for(const label of ['About','Explore','Documents']){
 assert(homepage.includes('href="/sources.html"'),label+' directory navigation missing');
}
assert((homepage.match(/href="\/sources\.html"/g)||[]).length>=3,'Directory must be reachable from About, Explore and Documents');
const nav=homepage.match(/<nav\s+class="nav"[\s\S]*?<\/nav>/i);
assert(nav,'Site bottom navigation missing');
const tabs=[...nav[0].matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(tabs,['discover','archivePage','researchStudio','mapPage','clips','livePage','boards','witness','watchRead','profilePage','hub'],'11-tab release retains its tab count with Explore last');
assert(sitemap.includes('https://uapdisclosuredesk.com/sources.html'),'Sitemap missing new public directory');
console.log('PASS — 13 searchable sources, safe origin links, Brazilian citation, attribution, 3 internal links, 11 original tabs and sitemap.');
