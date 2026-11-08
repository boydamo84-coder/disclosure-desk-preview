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
assert.equal(u.searchParams.get('l'),'MODIS_Terra_CorrectedReflectance_TrueColor',
 'NASA daily true-colour imagery must be explicitly selected instead of a current-day default layer');
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
assert.match(html,/data-dd-sat-case="'\+esc\(String\(r\.id\)\)\+'"/,
 'Map card now opens the case-specific satellite dialogue');
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


/* Parse every inline JavaScript script, including the current 11-tab main-site code.
 * A dedicated module check alone will not catch malformed HTML string fragments. */
const inlineScripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m=>!/\bsrc\s*=/.test(m[1])&&m[2].trim());
assert.ok(inlineScripts.length>=1,'Main website script exists');
for(const s of inlineScripts)
 assert.doesNotThrow(()=>new Function(s[2]),'Inline website JavaScript must parse');
assert.doesNotMatch(html,/<\/button>\+<button/,
 'Do not display a stray plus between adjacent case card buttons');
assert.match(html,/data-dd-sat-case/);
assert.match(html,/data-dd-sat-archive/);

assert.match(js,/NASA Worldview can show daily MODIS imagery where available after 2000/);
assert.match(js,/no nearest acquisition frame, geographic coverage or event-time match has been verified/);

/* Rendlesham Forest must use source-backed approximate forest coordinates, never RAF base coordinates or a fabricated day. */
const curated=JSON.parse(fs.readFileSync('data/curated-historical-cases.json','utf8'));
const rendlesham=curated.find(x=>x.id==='featured-rendlesham-1980');
assert.ok(rendlesham,'The featured Rendlesham record exists');
assert.equal(rendlesham.locationSource,'https://www.forestryengland.uk/rendlesham-forest');
assert.match(rendlesham.locationPrecision,/not the reported sighting point/i);
assert.equal(rendlesham.eventDate,undefined,'Multiple nights are documented; no invented single day');
assert.equal(api.caseSelection(rendlesham).coordinatesKnown,true,'Verified public forest area is map-ready');
assert.equal(api.caseSelection(rendlesham).lat,52.1);
assert.equal(api.caseSelection(rendlesham).lon,1.4);
assert.equal(api.caseSelection(rendlesham).date,null,'Calendar day is still unknown');
assert.match(html,/"id":"c2","title":"Rendlesham Forest"[^}]*"archiveRecordId":"featured-rendlesham-1980"/,
 'Archive must resolve the exact corresponding public map record');
assert.match(html,/String\(x\.archiveRecordId\|\|''\)===String\(archive\.id\)/,
 'Archive link to forest must use explicit curated ID, not a fuzzy match');
assert.match(html,/"id":"c2"[^}]*"locationPrecision":"Approximate public forest visitor area/);

// Documented partial period stays honest: prefill December 1980, not a guessed exact sighting day.
assert.equal(api.caseSelection(rendlesham).year,1980);
assert.equal(api.caseSelection(rendlesham).month,12);
assert.equal(api.caseSelection(rendlesham).date,null);
assert.equal(api.periodLabel(api.caseSelection(rendlesham)),'December 1980');
assert.equal(api.researcherDate(1980,12,''),null,'Unknown day remains blank');
assert.equal(api.researcherDate(1980,12,26),'1980-12-26','Only a researcher-chosen day makes a precise date');
assert.equal(api.researcherDate(1980,2,30),null,'Impossible dates rejected');
assert.equal(api.periodRange(1980,12).from,'1980-12-01');
assert.equal(api.periodRange(1980,12).to,'1980-12-31');
assert.equal(api.periodRange(1947,null),null,'Pre-Landsat cases have no bogus period range');
assert.match(api.caseSearchDetails(rendlesham,null,null),/Recorded case period: December 1980 \(exact sighting day not established\)/);
assert.match(api.caseSearchDetails(rendlesham,null,null),/1980-12-01 to 1980-12-31/);
for(const id of ['ddSatYearInput','ddSatMonthInput','ddSatDayInput'])assert.match(js,new RegExp(id));
assert.match(html,/"id":"c2"[^}]*"eventMonth":12/);

console.log('PASS: Rendlesham archive-to-map-to-satellite uses approximate Forestry England forest coordinates, no invented date or exact sighting site.');

/* Archive Satellite secondary view & USGS Landsat 1970s (source handoff, not a fetched frame). */
const oldArizona={id:'arizona-1976',title:'Arizona sighting',city:'Arizona',eventDate:'1976-06-03',lat:33.4,lon:-111.9};
const range=api.landsatWindow(oldArizona.eventDate);
assert.ok(range,'Landsat search range is available in 1976');
assert.equal(range.from,'1976-05-16');
assert.equal(range.to,'1976-06-21');
assert.equal(api.landsatWindow('1972-07-24'),null,'Do not claim Landsat scene coverage before official first data');
assert.equal(api.landsatWindow('2019-02-29'),null,'Invalid dates cannot produce archival range');
assert.equal(api.worldViewUrl(oldArizona),null,'NASA MODIS 2000+ cannot be used as imagery for 1976');
assert.equal(api.details(oldArizona).dailyArchive,false,'EUMETSAT historic daily imagery does not cover 1976');
assert.match(js,/Landsat 1–5 MSS C2 L1/);
assert.match(js,/https:\/\/earthexplorer\.usgs\.gov\//);
assert.match(js,/NOT retrieved or confirmed a matching frame/);
assert.doesNotMatch(js,/dd_discussions_owner_review|supabase\.rpc|navigator\.geolocation/,'No private location or database mutations in satellite viewer');
for(const id of ['ddArchiveCasesTab','ddArchiveSatelliteTab','ddArchiveCasesPanel','ddArchiveSatellitePanel',
 'ddArchiveSatelliteSearch','ddArchiveSatelliteStatus','ddArchiveSatelliteResults']){
 assert.match(html,new RegExp('id="'+id+'"'),'Missing satellite archive subview '+id);
}
assert.match(html,/function setArchiveView\(mode\)/);
assert.match(html,/function renderArchiveSatelliteCases\(\)/);
assert.match(html,/data-dd-sat-archive/);
assert.match(html,/setArchiveView\('satellite'\)/);
assert.match(html,/renderArchiveSatelliteCases\(\);ddSetupCompareCases/);
assert.match(html,/data-dd-sat-archive="'\+esc\(String\(r\.id\)\)\+'/);
assert.match(html,/new URLSearchParams/);
assert.equal((nav.match(/class="tab(?: active)?"/g)||[]).length,11,'Archive satellite view must not create a bottom tab');
assert.match(html,/https:\/\/earthexplorer\.usgs\.gov\//);
assert.match(html,/https:\/\/worldview\.earthdata\.nasa\.gov\//);
assert.match(html,/https:\/\/pics\.eumetsat\.int\//);
assert.match(js,/not a verified image of this sighting|not a verified picture of the event/i);
/* Source-documented case handoff: USGS predefined criteria supports AOI and dataset, not search dates. */
const usgs=new URL(api.usgsExplorerUrl(oldArizona));
assert.equal(usgs.origin,'https://earthexplorer.usgs.gov');
assert.equal(usgs.pathname,'/criteria');
assert.equal(usgs.searchParams.get('node'),'EE');
assert.equal(usgs.searchParams.get('dataset_name'),'landsat_mss_c2_l1');
assert.equal(usgs.searchParams.get('aoiFilter'),'[[33.4,-111.9]]','USGS AOI is rounded, public town map point');
assert.equal(usgs.searchParams.has('startDate'),false,'Never invent an unsupported EarthExplorer temporal URL parameter');
assert.equal(usgs.searchParams.has('endDate'),false,'Never invent an unsupported EarthExplorer temporal URL parameter');
assert.equal(api.usgsExplorerUrl({...oldArizona,lat:null,lon:null}),'https://earthexplorer.usgs.gov/',
 'No coordinates from unsupported case locations');
assert.equal(api.usgsExplorerUrl({...oldArizona,isWitness:true}),'https://earthexplorer.usgs.gov/',
 'No witness data forwarded by external USGS links');
const usgsSummary=api.caseSearchDetails(oldArizona,oldArizona.eventDate,null);
assert.match(usgsSummary,/1976-06-03 \(recorded in case\)/);
assert.match(usgsSummary,/1976-05-16 to 1976-06-21/);
assert.match(usgsSummary,/33\.4° latitude, -111\.9° longitude/);
assert.match(usgsSummary,/not verified \/ not recorded/);
assert.match(api.caseSearchDetails(oldArizona,'1976-06-04','09:20'),/researcher-entered, not verified/);
assert.match(api.caseSearchDetails(oldArizona,'1976-06-04','09:20'),/researcher-selected; not verified against case/);
assert.equal(api.caseSearchDetails({...oldArizona,isWitness:true},oldArizona.eventDate,null),null);
assert.match(js,/navigator\.clipboard\?\.writeText/);
assert.match(js,/Browser blocked automatic copying/);
assert.match(js,/Copy case search details/);
assert.match(js,/dataset and approximate public mapped point are preselected/);
assert.match(html,/assets\/historical-satellite\.js\?v=nov08-landsat-handoff-prefill/);
console.log('PASS: official USGS AOI and MSS dataset prefill, copied date range, verified/unverified time provenance, witness privacy and safe fallback.');

console.log('PASS: Arizona 1976 Landsat date window, Archive Satellite subtab, 11-bottom-tab boundary and official source caveats.');
