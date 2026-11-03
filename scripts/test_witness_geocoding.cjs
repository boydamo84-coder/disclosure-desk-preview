'use strict';
// Tests the pure location resolver contract without network requests.
const assert=require('node:assert/strict'),fs=require('node:fs');
const edge=fs.readFileSync('supabase/functions/dd-witness-submit/index.ts','utf8');
const sql=fs.readFileSync('supabase/WITNESS_VOTING_COMMUNITY_REVIEW.sql','utf8');
const n=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
function extract(name) {
 const m=edge.match(new RegExp('function '+name+'\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'));
 assert.ok(m,name+' missing from edge');
 return new Function('normal',m[0]+'; return '+name+';')(n);
}
const matchesCountry=extract('matchesCountry');
const containsPreciseCoordinates=extract('containsPreciseCoordinates');
assert.equal(matchesCountry('Northern Ireland','United Kingdom','Northern Ireland'),true);
assert.equal(matchesCountry('UK','United Kingdom','Northern Ireland'),true);
assert.equal(matchesCountry('United Kingdom','United Kingdom','England'),true);
assert.equal(matchesCountry('Ireland','United Kingdom','Northern Ireland'),false,'Belfast must not be filed in Republic of Ireland');
assert.equal(matchesCountry('Republic of Ireland','Ireland','Leinster'),true);
assert.equal(matchesCountry('Ireland','Ireland','Leinster'),true);
assert.equal(matchesCountry('Scotland','United Kingdom','Scotland'),true);
assert.equal(matchesCountry('Scotland','United Kingdom','Northern Ireland'),false);
assert.equal(matchesCountry('USA','United States','California'),true);
assert.equal(matchesCountry('United','United States','California'),false,'Truncated country is ambiguous');
assert.equal(containsPreciseCoordinates('Observed near 54.59427, -5.93133'),true);
assert.equal(containsPreciseCoordinates('Observed above Belfast, Northern Ireland'),false);
assert.match(edge,/const matchArea=matchesCountry\(country,x\.country,x\.admin1\|\|""\)/);
assert.doesNotMatch(edge,/area\.includes\(countryName\)/,'Never use substring country matching');
assert.match(sql,/new\.story ~ '\(\^\|\[\^0-9\]\)-\?/,'Server must also reject pasted GPS coordinates');
console.log('PASS: Northern Ireland vs Ireland geocoding, exact country matching and private GPS rejection fixture tests');
