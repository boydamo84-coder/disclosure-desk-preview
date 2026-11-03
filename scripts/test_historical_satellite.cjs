'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('assets/historical-satellite.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.doesNotThrow(()=>new Function(js));
const context={window:{},Date,URLSearchParams};vm.createContext(context);vm.runInContext(js,context);
const api=context.window.DDHistoricalSatellite;
assert.ok(api,'Satellite historical link API available');
const current={id:'old-test',title:'Old UK report',city:'Bradford, England',eventDate:'2008-01-20',lat:53.8,lon:-1.76};
const info=api.details(current);
assert.equal(info.date,'2008-01-20');assert.equal(info.lat,53.8);
assert.equal(info.lon,-1.8,'Only approximate region is transferred to provider');
const query=String(api.worldViewUrl(current));
assert.ok(query.startsWith('https://worldview.earthdata.nasa.gov/?'));
const u=new URL(query);
assert.equal(u.searchParams.get('p'),'geographic');
assert.equal(u.searchParams.get('t'),'2008-01-20-T12:00:00Z','No time recorded: noon is only a date-browsing anchor');
assert.equal(u.searchParams.get('s'),'-1.8,53.8');
assert.equal(u.searchParams.get('v'),'-6.80,50.80,3.20,56.80');
assert.equal(new URL(api.worldViewUrl(current,'21:05')).searchParams.get('t'),'2008-01-20-T21:05:00Z','UTC supplied by researcher');
assert.equal(new URL(api.worldViewUrl(current,'not-time')).searchParams.get('t'),'2008-01-20-T12:00:00Z','Invalid times fall back to browse anchor');
assert.equal(api.worldViewUrl({...current,eventDate:'1997-01-20'}),null,'NASA 2000+ daily coverage only; older Meteosat archives separate');
assert.equal(api.details({...current,eventDate:'1997-01-20'}).dailyArchive,true);
assert.equal(api.details({...current,eventDate:'1979-01-20'}).dailyArchive,false,'No invented 1981-before imagery');
assert.equal(api.details({...current,eventDate:'2019-02-29'}),null,'Invalid calendar date rejected');
assert.equal(api.details({...current,eventDate:'2010'}),null,'Year-only source cannot be assigned a day');
assert.equal(api.details({...current,lat:91}),null,'Reject invalid coordinates');
assert.equal(api.details({...current,isWitness:true}),null,'Never forward witness draft/precise positions');
assert.equal(api.worldViewUrl({...current,isWitness:true}),null);
assert.match(js,/historical minute-by-minute imagery may be unavailable/i);
assert.match(js,/No private GPS/);
assert.match(js,/https:\/\/pics\.eumetsat\.int\//);
assert.match(js,/https:\/\/view\.eumetsat\.int\//);
assert.match(js,/noopener noreferrer/,'Third party opens safely');
assert.match(html,/window\.DDHistoricalSatellite\?\.mountCaseCard\(r,\$\('evidenceBody'\)\)/);
assert.match(html,/data-evidence-open="'\+esc\(r\.id\)\+'" aria-label="View historical weather satellite imagery/);
assert.match(html,/assets\/historical-satellite\.js\?v=/);
const nav=html.match(/<nav\s+class="nav"[\s\S]*?<\/nav>/i)?.[0]||'';
assert.equal((nav.match(/class="tab(?: active)?"/g)||[]).length,11,'Live navigation stays at 11 tabs');
console.log('PASS: historical satellite links use exact event date and approximate city only, no fabricated sighting time, pre-2000 fallback, case Evidence UI, safe official links.');

/* Consistent satellite-case action from every public case-card collection.
 * Archived records cannot be assigned a false event day or map coordinate. */
const yearOnly={id:'year-only',title:'Roswell',city:'Roswell, New Mexico',year:1947,lat:33.4,lon:-104.5};
assert.equal(api.caseSelection(yearOnly).date,null,'Year is not a verified exact event date');
assert.equal(api.caseSelection(yearOnly).year,1947);
assert.equal(api.validatedViewerUrl(yearOnly,null,null),null);
assert.equal(api.validatedViewerUrl(yearOnly,'2008-01-20',null).includes('2008-01-20'),true,
 'Explicitly entered date can open available NASA viewer; do not write it to case');
assert.equal(api.caseSelection({...yearOnly,lat:null,lon:null}).coordinatesKnown,false);
assert.equal(api.validatedViewerUrl({...yearOnly,lat:null,lon:null},'2008-01-20',null),null,
 'Do not send a locationless historical archive record to a false point');
assert.equal(api.caseSelection({...yearOnly,isWitness:true}),null);
assert.match(js,/No verified time is included in this case record/);
assert.match(js,/image acquisition time is NOT checked/);
assert.match(js,/No verified mappable town position is linked to this case/);
assert.match(html,/id="ddSatelliteDialog"/);
assert.match(html,/id="ddSatelliteDialogBody"/);
assert.match(html,/data-dd-sat-case="'\+esc\(String\(r\.id\)\)\+'/);
assert.match(html,/data-dd-sat-archive="\$\{esc\(String\(r\.id\)\)\}"/);
assert.match(html,/String\(x\.archiveRecordId\|\|''\)===String\(archive\.id\)/,
 'Only exact mapped archive references can supply coordinates');
assert.match(html,/data-dd-sat-archive/, 'Archived case card access');
