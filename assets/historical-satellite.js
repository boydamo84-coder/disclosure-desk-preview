/* Disclosure Desk: source-grounded historic satellite imagery handoff.
 * No imagery is fabricated or downloaded. We open verified official viewers,
 * placing a date + APPROXIMATE town area into NASA's documented Worldview URL.
 * Date-only case records DO NOT provide a time of sighting. No private GPS,
 * browser geolocation, account data, cookies, API keys or backend calls.
 * Historical minutes/subdaily data are NOT promised by NASA Worldview.
 */
(()=>{'use strict';
const NASA='https://worldview.earthdata.nasa.gov/';
const EUMET_DAILY='https://pics.eumetsat.int/';
const EUMET_VIEW='https://view.eumetsat.int/';
const USGS_LANDSAT='https://earthexplorer.usgs.gov/';
const LANDSAT_START='1972-07-25';
const DAILY_START='1981-08-17';
const NASA_DAILY_START='2000-03-01';
const $=(tag,text,className)=>{
 const e=document.createElement(tag);
 if(text!==undefined)e.textContent=String(text);
 if(className)e.className=className;
 return e;
};
function isoDate(raw){
 const s=typeof raw==='string'?raw.trim():'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
 const d=new Date(s+'T00:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)return null;
 if(d.getTime()>Date.now()+86400000)return null;
 return s;
}
function details(r){
 if(!r||r.isWitness)return null; // Witness locations and drafts are not shared with external viewers.
 const date=isoDate(r.eventDate);
 const lat=Number(r.lat),lon=Number(r.lon);
 if(!date||!Number.isFinite(lat)||!Number.isFinite(lon)||
    Math.abs(lat)>90||Math.abs(lon)>180)return null;
 const townLat=Math.round(lat*10)/10,townLon=Math.round(lon*10)/10;
 return {date,lat:townLat,lon:townLon,city:String(r.city||'Approximate region').slice(0,120),
  precision:'approximate town/region',dailyArchive:date>=DAILY_START,
  nasaDaily:date>=NASA_DAILY_START};
}
function landsatWindow(raw){
 const date=isoDate(raw);
 if(!date||date<LANDSAT_START)return null;
 // A first exploratory search only: acquisition cadence is not a promise of availability.
 const midday=Date.parse(date+'T12:00:00Z'),shift=18*86400000;
 return {from:new Date(midday-shift).toISOString().slice(0,10),
  to:new Date(midday+shift).toISOString().slice(0,10)};
}
function utcTime(raw){
 if(typeof raw!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw))return null;
 return raw;
}
function worldViewUrl(r,enteredTime){
 const info=details(r);if(!info||!info.nasaDaily)return null;
 const hasTime=utcTime(enteredTime);
 // Browser timeline needs a time; 12:00Z is ONLY a browsing anchor if original report is date-only.
 const selected=info.date+'-T'+(hasTime||'12:00')+':00Z';
 const lat=info.lat,lon=info.lon;
 const extent=[
  Math.max(-180,lon-5).toFixed(2),
  Math.max(-90,lat-3).toFixed(2),
  Math.min(180,lon+5).toFixed(2),
  Math.min(90,lat+3).toFixed(2)
 ].join(',');
 const query=new URLSearchParams({p:'geographic',v:extent,t:selected,s:lon.toFixed(1)+','+lat.toFixed(1),l:'MODIS_Terra_CorrectedReflectance_TrueColor'});
 return NASA+'?'+query.toString();
}
function externalLink(parent,label,url){
 const a=$('a',label,'outline dd-satellite-link');
 a.href=url;a.target='_blank';a.rel='noopener noreferrer';
 parent.append(a);return a;
}
function mountCaseCard(record,host){
 const info=details(record);
 if(!host||!info)return false;
 const card=$('section',undefined,'dd-historical-satellite');
 card.id='ddHistoricalSatelliteCase';
 card.setAttribute('aria-label','Historical satellite imagery for this case');
 const heading=$('h3','🛰 See area at the time of this sighting');
 const note=$('p',info.city+' · '+info.date+' · '+info.precision,'muted small');
 const caution=$('p','This opens satellite imagery for the reported date and approximate area, not a verified picture of the event. Weather satellites mainly show clouds and atmosphere, not individual objects or street-level photographs.','muted small');
 card.append(heading,note,caution);
 const links=$('div',undefined,'dd-satellite-actions');
 if(info.nasaDaily){
  const timeLabel=$('label','Optional sighting time in UTC (HH:MM) · researcher-supplied, not verified:');
  timeLabel.setAttribute('for','ddSatelliteSightingTime');
  const input=$('input');input.id='ddSatelliteSightingTime';input.type='time';input.step='60';input.className='field';
  input.setAttribute('aria-describedby','ddSatelliteTimeCaveat');
  const caveat=$('p','This archive record contains the date only. Without a sourced time, Worldview opens at 12:00 UTC as a browsing anchor, NOT the sighting time. Historical minute-by-minute imagery may be unavailable.','muted small');
  caveat.id='ddSatelliteTimeCaveat';
  const link=externalLink(links,'Open NASA Worldview · area + case date',worldViewUrl(record));
  input.oninput=()=>{
   link.href=worldViewUrl(record,input.value)||worldViewUrl(record);
   caveat.textContent=input.value&&utcTime(input.value)
    ?'UTC time entered manually for research. It is NOT verified against the case and does NOT guarantee a satellite frame at that minute.'
    :'This archive record contains the date only. Without a sourced time, Worldview opens at 12:00 UTC as a browsing anchor, NOT the sighting time. Historical minute-by-minute imagery may be unavailable.';
  };
  card.append(timeLabel,input,caveat);
 }else{
  card.append($('p','NASA Worldview daily imagery for this case date is not available from our verified starting window. Older Meteosat records may offer a daily historical view instead.','muted small'));
 }
 if(info.date>=LANDSAT_START){
  const range=landsatWindow(info.date);
  externalLink(links,'Search USGS Landsat 1–5 MSS scenes (1972+)',usgsExplorerUrl(record));
  card.append($('p','EarthExplorer link preselects the Landsat MSS dataset and approximate public mapped point when available; enter the acquisition dates '+range.from+' to '+range.to+' manually. This ±18-day window is an exploratory guide, not a verified image of this sighting.','muted small'));
 }
 if(info.dailyArchive){
  externalLink(links,'Open Meteosat historical gallery · choose '+info.date,EUMET_DAILY);
  card.append($('p','EUMETSAT historical viewer has about one suitable image per day from 17 August 1981, usually around noon UTC. The current viewer does not support a verified automatic case-date link; choose the displayed date in its calendar.','muted small'));
 }
 externalLink(links,'EUMETView · explore weather satellite layers',EUMET_VIEW);
 card.append(links);
 const fine=$('p','Provider availability, cloud layers and spatial/temporal resolution vary by mission. NASA geostationary 10-minute imagery generally covers only a recent ~90-day viewer window; older data may require EUMETSAT Data Store retrieval. An image not showing a feature cannot rule out the reported sighting.','muted small');
 card.append(fine);
 const first=host.querySelector('h3');
 if(first)first.before(card);else host.append(card);
 return true;
}

// Case-card satellite inspection. Source cards with partial dates must not
// substitute an arbitrary day or a catalogue year as an actual event date.
function caseSelection(r){
 if(!r||r.isWitness)return null;
 const lat=Number(r.lat),lon=Number(r.lon);
 const coordinatesKnown=Number.isFinite(lat)&&Number.isFinite(lon)&&
  Math.abs(lat)<=90&&Math.abs(lon)<=180&&r.lat!==null&&r.lon!==null&&
  r.lat!==undefined&&r.lon!==undefined;
 const date=isoDate(r.eventDate); // Do NOT reuse a published/document date.
 const year=Number(r.year),month=Number(r.eventMonth);
 const knownYear=Number.isInteger(year)&&year>=1&&year<=9999?year:(date?Number(date.slice(0,4)):null);
 const knownMonth=date?Number(date.slice(5,7)):(r.eventMonth!=null&&Number.isInteger(month)&&month>=1&&month<=12?month:null);
 return {date,year:knownYear,month:knownMonth,
  coordinatesKnown,lat:coordinatesKnown?Math.round(lat*10)/10:null,
  lon:coordinatesKnown?Math.round(lon*10)/10:null,
  city:String(r.city||r.location||'Location not verified').slice(0,120),
  provenance:String(r.locationPrecision||'Approximate case region').slice(0,100)};
}
// Calendar range for a documented MONTH or YEAR, never a fabricated incident day.
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function periodRange(year,month){
 const y=Number(year),m=month==null||month===''?null:Number(month);
 if(!Number.isInteger(y)||y<1972||y>new Date().getUTCFullYear())return null;
 if(m!==null&&(!Number.isInteger(m)||m<1||m>12))return null;
 const ystr=String(y).padStart(4,'0');
 if(m===null)return {from:ystr+'-01-01',to:ystr+'-12-31',precision:'year'};
 const mm=String(m).padStart(2,'0'),last=new Date(Date.UTC(y,m,0)).getUTCDate();
 return {from:ystr+'-'+mm+'-01',to:ystr+'-'+mm+'-'+String(last).padStart(2,'0'),precision:'month'};
}
function periodLabel(info){
 return info?.year?(info.month?MONTHS[info.month-1]+' ':'')+info.year:'not established';
}
function researcherDate(year,month,day){
 if(!/^\d{4}$/.test(String(year||''))||!/^\d{1,2}$/.test(String(month||''))||!/^\d{1,2}$/.test(String(day||'')))return null;
 return isoDate(String(year)+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'));
}

// Official USGS EarthExplorer predefined criteria: dataset + APPROXIMATE public area.
// The USGS URL contract does not document date-range/time prefill. Those remain manual.
function usgsExplorerUrl(r){
 const info=caseSelection(r);
 if(!info||!info.coordinatesKnown)return USGS_LANDSAT;
 const query=new URLSearchParams({node:'EE',dataset_name:'landsat_mss_c2_l1',
  aoiFilter:'[['+info.lat.toFixed(1)+','+info.lon.toFixed(1)+']]'});
 return USGS_LANDSAT.replace(/\/$/,'')+'/criteria?'+query.toString();
}
function caseSearchDetails(r,chosenDate,chosenTime,chosenYear,chosenMonth){
 const info=caseSelection(r);if(!info)return null;
 const date=isoDate(chosenDate),utc=utcTime(chosenTime);
 const window=landsatWindow(date);
 const activeYear=chosenYear===undefined?info.year:chosenYear;
 const activeMonth=chosenMonth===undefined?info.month:chosenMonth;
 const period=periodRange(activeYear,activeMonth);
 return [
  'Disclosure Desk · historical satellite research handoff',
  'Public case area: '+info.city+' ('+info.provenance+')',
  'Approximate public map point: '+(info.coordinatesKnown?info.lat.toFixed(1)+'° latitude, '+info.lon.toFixed(1)+'° longitude':'not verified; choose location manually'),
  'Recorded case period: '+periodLabel(info)+(info.date?' (exact date recorded)':' (exact sighting day not established)'),
  'Event date: '+(date||'not established')+(date?(date===info.date?' (recorded in case)':' (researcher-selected; not verified against case)'):''),
  'Event time UTC: '+(utc?utc+' (researcher-entered, not verified)':'not verified / not recorded'),
  'USGS dataset: Landsat Collection 2 Level-1 → Landsat 1–5 MSS C2 L1',
  'Manual EarthExplorer acquisition dates: '+(window?window.from+' to '+window.to+' (±18-day exploratory window only)':period?period.from+' to '+period.to+' (research period only; no verified event day)':'choose only after confirming event date or period'),
  'Check actual satellite acquisition timestamp, footprint, cloud cover and resolution; no matching frame has been verified.'
 ].join('\n');
}

function validatedViewerUrl(r,chosenDate,chosenTime){
 const info=caseSelection(r);
 if(!info||!info.coordinatesKnown||!isoDate(chosenDate))return null;
 // NASA viewer may still contain no image on this day; no frame is fetched.
 return worldViewUrl({...r,eventDate:chosenDate,lat:info.lat,lon:info.lon},chosenTime);
}
function openSatelliteCase(r){
 const state=caseSelection(r),dialog=document.getElementById('ddSatelliteDialog');
 if(!dialog||!state)return false;
 const content=document.getElementById('ddSatelliteDialogBody');
 const heading=document.getElementById('ddSatelliteTitle');
 if(!content||!heading)return false;
 heading.textContent='🛰 Historical satellite imagery · '+String(r.title||'Case').slice(0,160);
 content.replaceChildren();
 const summary=$('p',state.city+' · '+(state.date||state.year&&'Year '+state.year||'Date not recorded'),'muted small');
 const geo=$('p',state.coordinatesKnown
  ?'Approximate mapped area only · location rounded to 0.1° · '+state.provenance+' · not the exact sighting point.'
  :'No verified mappable town position is linked to this case. Map centring is unavailable until the location is researched.','muted small');
 content.append(summary,geo);
 if(state.coordinatesKnown&&r.locationSource==='https://www.forestryengland.uk/rendlesham-forest'){
  const origin=$('p',undefined,'muted small');
  externalLink(origin,'Forestry England · public forest location ↗',r.locationSource);
  content.append(origin);
 }
 // Keep a known year and month without pretending the source supplies an exact day.
 const periodIntro=$('p','Recorded case period: '+periodLabel(state)+(state.date?' · exact event date recorded.':' · day not confirmed; leave Day blank unless a source supports your search.'),'muted small');
 const periodGrid=$('div',undefined,'dd-sat-period-grid');
 periodGrid.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:end;margin:8px 0 12px';
 const yearWrap=$('div'),yearLabel=$('label','Year'),yearInput=$('input');
 yearLabel.htmlFor='ddSatYearInput';yearInput.id='ddSatYearInput';yearInput.type='number';yearInput.min='1';
 yearInput.max=String(new Date().getUTCFullYear());yearInput.placeholder='YYYY';yearInput.className='field';
 yearInput.value=state.year||'';yearWrap.append(yearLabel,yearInput);
 const monthWrap=$('div'),monthLabel=$('label','Month'),monthInput=$('select');
 monthLabel.htmlFor='ddSatMonthInput';monthInput.id='ddSatMonthInput';monthInput.className='field';
 const unknownMonth=$('option','Unknown');unknownMonth.value='';monthInput.append(unknownMonth);
 MONTHS.forEach((name,i)=>{const opt=$('option',name);opt.value=String(i+1);monthInput.append(opt)});
 monthInput.value=state.month?String(state.month):'';monthWrap.append(monthLabel,monthInput);
 const dayWrap=$('div'),dayLabel=$('label','Day (optional)'),dayInput=$('input');
 dayLabel.htmlFor='ddSatDayInput';dayInput.id='ddSatDayInput';dayInput.className='field';
 dayInput.type='number';dayInput.min='1';dayInput.max='31';dayInput.placeholder='—';
 dayInput.value=state.date?String(Number(state.date.slice(8,10))):'';
 dayInput.setAttribute('aria-describedby','ddSatDateSource');dayWrap.append(dayLabel,dayInput);
 periodGrid.append(yearWrap,monthWrap,dayWrap);
 const date=$('input');date.type='hidden';date.id='ddSatDateInput';date.value=state.date||'';
 const dateOrigin=$('p',state.date?'Recorded exact event date from this case.':'A documented month and year are not an exact incident date. Choose a day only for a researcher-led search.','muted small');
 dateOrigin.id='ddSatDateSource';
 const timeLabel=$('label','Reported time (UTC, optional)');timeLabel.htmlFor='ddSatUtcInput';
 const time=$('input');time.type='time';time.id='ddSatUtcInput';time.className='field';
 const timeNote=$('p','No verified time is included in this case record. Leave blank to browse at 12:00 UTC (a navigation default, NOT the event time).','muted small');
 const status=$('p','','muted small');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const actions=$('div',undefined,'dd-satellite-actions');
 const primary=externalLink(actions,'Open NASA daily satellite imagery · selected date and area',NASA);
 const eumet=externalLink(actions,'Open Meteosat historic imagery',EUMET_DAILY);
 const landsat=externalLink(actions,'Search USGS Landsat 1–5 MSS archive (1972+)',usgsExplorerUrl(r));
 const modern=externalLink(actions,'EUMETSAT weather layers',EUMET_VIEW);
 const copy= $('button','Copy case search details','outline dd-satellite-link');
 copy.type='button';actions.append(copy);
 const copyStatus=$('p','','muted small');copyStatus.setAttribute('role','status');
 const handoff=$('textarea');handoff.readOnly=true;handoff.rows=5;
 handoff.className='field dd-satellite-handoff-details';handoff.hidden=true;
 handoff.setAttribute('aria-label','Case search details to copy manually');
 copy.addEventListener('click',async()=>{
  const value=caseSearchDetails(r,date.value,time.value,yearInput.value,monthInput.value);
  if(!value)return;
  try{
   if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');
   await navigator.clipboard.writeText(value);
   copyStatus.textContent='Case date, approximate location and search range copied. Paste into your research notes or an external search form.';
   handoff.hidden=true;
  }catch(_){
   handoff.value=value;handoff.hidden=false;handoff.focus?.();handoff.select?.();
   copyStatus.textContent='Browser blocked automatic copying. Select and copy the prepared details below.';
  }
 });
 const landsatAdvice=$('p','','muted small');
 const caution=$('p','NASA Worldview can show daily MODIS imagery where available after 2000. The EUMETSAT historical gallery starts in 1981; the first Meteosat launched in November 1977. USGS Landsat MSS imagery starts in 1972 but provides occasional daylight ground scenes, not continuous weather video. These links start a source search only; no nearest acquisition frame, geographic coverage or event-time match has been verified in Disclosure Desk. Never infer an unexplained object from a missing or unclear scene.','muted small');
 const update=()=>{
  const requested=isoDate(date.value),hasCoords=state.coordinatesKnown,utc=utcTime(time.value);
  const changedPeriod=String(yearInput.value)!==String(state.year||'')||
   String(monthInput.value)!==String(state.month||'');
  const searchPeriod=periodRange(yearInput.value,monthInput.value);
  const world=validatedViewerUrl(r,requested,utc);
  primary.hidden=!world;if(world)primary.href=world;
  eumet.hidden=!requested||requested<DAILY_START;
  landsat.hidden=!(requested&&requested>=LANDSAT_START)&&!(searchPeriod&&searchPeriod.to>=LANDSAT_START);
  const landsatRange=landsatWindow(requested);
  landsatAdvice.hidden=!landsatRange&&!searchPeriod;
  if(landsatRange)landsatAdvice.textContent=
   'USGS EarthExplorer: dataset and approximate public mapped point are preselected where available; manually enter acquisition dates '+
   landsatRange.from+' to '+landsatRange.to+'. This ±18-day window is only a starting search range. Select a genuine scene and compare its published acquisition timestamp and geographic footprint with the report. Landsat has ~80 m historic resolution and does not record continuous video or night-time UFO sightings.';
  else if(searchPeriod)landsatAdvice.textContent=
   'USGS EarthExplorer: dataset and approximate public point are preselected. Manually enter '+
   searchPeriod.from+' to '+searchPeriod.to+' for this '+searchPeriod.precision+'-precision search. '+
   (changedPeriod?'The period was changed by the researcher, not verified against the case. ':'The case gives this period, not a precise sighting day. ')+
   'No matching scene or sighting-time image has been verified.';
  copy.hidden=!requested&&!searchPeriod;
  if(!handoff.hidden)handoff.value=caseSearchDetails(r,date.value,time.value,yearInput.value,monthInput.value)||'';
  modern.hidden=false;
  if(!requested)status.textContent=searchPeriod
    ?'Recorded case period: '+periodLabel(state)+'; exact day unknown. '+(changedPeriod?'Researcher-edited search period. ':'')+
     'Use the USGS period search, or add a sourced Day to open date-specific viewers.'
    :'Select a known year and month or a verified day. No exact event date has been confirmed.';
  else if(!hasCoords)status.textContent='The date is selected, but this archive lacks a verified town-level map position. Check the original source before a location-specific search.';
  else if(world)status.textContent='Date selected: '+requested+' · '+(utc?'manually entered '+utc+' UTC (unverified)':'12:00 UTC date-browsing default (not sighting time)')+' · approximate '+state.city+'. The image acquisition time is NOT checked.';
  else if(requested>=DAILY_START)status.textContent='For '+requested+', the Meteosat daily gallery offers a historical date search; USGS Landsat also provides a separate acquisition-date search. Neither gives a verified event-time image here.';
  else if(requested>=LANDSAT_START)status.textContent='For '+requested+', use the USGS Landsat 1–5 MSS archive for scenes near the date. Meteosat had not launched yet and NASA MODIS begins in 2000. We have NOT retrieved or confirmed a matching frame.';
  else status.textContent='No verified source viewer coverage established for this date. Do not substitute modern imagery as historical.';
  dateOrigin.textContent=!requested
   ?'Day not verified. Month/year shown from the case when available; changes are researcher supplied.'
   :requested===state.date?'Exact date recorded in this case.'
    :'Researcher-selected day · NOT verified against the case. Confirm it in the original evidence.';
  if(time.value&&!utc)timeNote.textContent='Enter a valid 24-hour UTC time. This will not be saved as a documented sighting time.';
  else if(utc)timeNote.textContent='Researcher-supplied '+utc+' UTC, not a confirmed sighting time or actual image timestamp. Verify the time zone and provider frame.';
  else timeNote.textContent='No verified sighting time. The 12:00 UTC timeline position is a browsing default only, not the event time.';
 };
 const syncDate=()=>{date.value=researcherDate(yearInput.value,monthInput.value,dayInput.value)||'';update()};
 yearInput.addEventListener('input',syncDate);monthInput.addEventListener('change',syncDate);
 dayInput.addEventListener('input',syncDate);time.addEventListener('input',update);
 content.append(periodIntro,periodGrid,date,dateOrigin,timeLabel,time,timeNote,status,actions,copyStatus,handoff,landsatAdvice,caution);
 if(!dialog.open)dialog.showModal();
 syncDate();yearInput.focus();
 return true;
}

window.DDHistoricalSatellite=Object.freeze({details,isoDate,worldViewUrl,mountCaseCard,caseSelection,periodRange,periodLabel,researcherDate,validatedViewerUrl,landsatWindow,usgsExplorerUrl,caseSearchDetails,openSatelliteCase});
})();
