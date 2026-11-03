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
 const query=new URLSearchParams({p:'geographic',v:extent,t:selected,s:lon.toFixed(1)+','+lat.toFixed(1)});
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
window.DDHistoricalSatellite=Object.freeze({details,isoDate,worldViewUrl,mountCaseCard});
})();
