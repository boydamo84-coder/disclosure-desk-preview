'use strict';
// Rendlesham source-grounded map QA. No network, private accounts or fabricated event time.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const map=JSON.parse(fs.readFileSync('data/disclosure-map.json','utf8'));
const archive=JSON.parse(fs.readFileSync('data/curated-historical-cases.json','utf8'));
const sat=fs.readFileSync('assets/historical-satellite.js','utf8');
const target=archive.find(x=>x.id==='featured-rendlesham-1980');
assert.ok(target,'Rendlesham is still a curated featured Archive case');
assert.equal(archive.filter(x=>x.id===target.id).length,1,'Only one canonical featured archive record');
assert.equal(target.year,1980);
assert.equal(target.eventDate,undefined,'Never invent an exact date for multi-night Rendlesham reports');
assert.equal(target.city,'Rendlesham Forest, Suffolk, England');
assert.equal(target.locationSource,'https://www.forestryengland.uk/rendlesham-forest');
assert.equal(target.lat,52.0844);
assert.equal(target.lon,1.4302);
assert.match(target.locationPrecision,/Approximate public forest visitor area/);
assert.match(target.locationPrecision,/not the reported sighting point/);
assert.equal(map.filter(x=>x.archiveRecordId==='featured-rendlesham-1980').length,0,
 'Do not create a duplicate marker in the live map feed when c2 is already curated');
assert.equal(map.length,276,'Preserve previous mapped data feed rather than adding a duplicate');
const snippet=html.match(/\{"id":"c2","title":"Rendlesham Forest"[^}]+/);
assert.ok(snippet,'Existing curated Rendlesham Map pin must remain, without a second pin');
assert.match(snippet[0],/"city":"Rendlesham Forest, Suffolk, England"/);
assert.match(snippet[0],/"lat":52\.0844,"lon":1\.4302/);
assert.match(snippet[0],/"archiveRecordId":"featured-rendlesham-1980"/);
assert.match(snippet[0],/"locationPrecision":"Approximate public forest visitor area; NOT the reported sighting point"/);
assert.match(snippet[0],/"locationSource":"https:\/\/www\.forestryengland\.uk\/rendlesham-forest"/);
assert.match(snippet[0],/"source":"https:\/\/www\.nationalarchives\.gov\.uk\//);
assert.doesNotMatch(snippet[0],/"eventDate":/,'No invented Dec 1980 date');
assert.match(html,/String\(x\.archiveRecordId\|\|''\)===String\(archive\.id\)/,
 'Archive satellite case uses explicit matching ID, not fuzzy title');
assert.match(html,/disclosureCasePool\(\)\.some\(m=>!m\.isWitness&&m\.archiveRecordId===r\.id/,
 'Map archive listings distinguish truly linked location from missing-location records');
assert.match(sat,/Forestry England · public forest location/,'Show the provenance within satellite dialog');
assert.match(sat,/r\.locationSource==='https:\/\/www\.forestryengland\.uk\/rendlesham-forest'/,
 'Forest source link is restricted to a verified provider');
assert.match(html,/target:'#ddArchiveSatelliteTab'/);
assert.match(html,/target:'\.dd-explore-guide-link'/);
console.log('PASS: Rendlesham forest visitor-area location and exact archive/map linkage, no duplicate pin/date invention, source provenance and tour entry points.');
