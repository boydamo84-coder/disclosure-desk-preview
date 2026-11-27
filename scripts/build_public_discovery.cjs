'use strict';

// Only deliberately selected public records and editorial text are used here.
const fs = require('node:fs');
const path = require('node:path');
const origin = 'https://uapdisclosuredesk.com';
const blueBook = 'https://www.archives.gov/research/military/air-force/ufos';
const nasaReport = 'https://www.nasa.gov/wp-content/uploads/2023/09/uap-independent-study-team-final-report-0.pdf';
const nasaRoster = 'https://www.nasa.gov/general/nasa-announces-unidentified-aerial-phenomena-study-team-members/';
const fravorHearing = 'https://docs.house.gov/Committee/Calendar/ByEvent.aspx?EventID=116282';
const navyRelease = 'https://www.defense.gov/News/Releases/release/article/2165713/statement-by-the-department-of-defense-on-the-release-of-historical-navy-videos/';
const decision = '/data/foia/27-f-0917-decision-extract.pdf';
const extracts = '/data/foia/27-f-0917-referral-extracts.pdf';

const pages = {
  'project-blue-book': {
    heading: 'Project Blue Book: using the US National Archives records',
    description: 'How to identify a Project Blue Book case, read its records alongside the original context, and interpret gaps in the US Air Force archive.',
    tag: 'Archive review',
    sections: [
      ['What the archive holds', 'The US Air Force ended Project Blue Book in 1969. The National Archives holds its declassified records, including case files and administrative material. The finding aid explains how to look up case files by date and location.'],
      ['How to cite a case', 'Record the reported date and place, the catalogue or microfilm reference and the exact report or analysis you used. Note who made the observation and whether the file includes measurements, original images or correspondence. Preserve the Air Force classification as an attributed historical finding.'],
      ['What a search can establish', 'The National Archives reports that it could not locate documentation discussing the July 1947 Roswell incident among the Blue Book records. Separate GAO, Air Force and FBI material is available for that episode.'],
    ],
    sources: [['Official Project Blue Book research guide', blueBook], ['UAP holdings by record group', 'https://www.archives.gov/research/topics/uaps/rg-collections']],
    related: [['Roswell record ledger', '/roswell-1947#record-ledger'], ['Evidence Archive', '/?dd_tab=archivePage']],
  },
  'nasa-uap-study': {
    heading: 'NASA’s 2023 UAP study and its data recommendations',
    description: 'Read the September 2023 NASA independent study team report and trace its recommendations for improving the quality of future UAP observations.',
    tag: 'Programme review',
    sections: [
      ['What NASA commissioned', 'NASA’s independent study team considered which data and scientific tools could improve future UAP research. Its final report was released on 14 September 2023. The report focused on the methods and data available for study.'],
      ['What to look for in the report', 'The report discusses calibrated sensors, timing and location metadata, transparent methods, and standardised reporting. Use the recommendations to check whether an observation has enough detail to test competing explanations.'],
      ['How to apply it', 'Record the sensor, time, direction and observing location, if safely public and documented. Capture the original file and its provenance. A catalogue entry or a clip with missing metadata leaves limits that belong in the case record.'],
    ],
    sources: [['NASA independent study team final report (PDF)', nasaReport], ['NASA Science study hub', 'https://science.nasa.gov/uap/']],
    related: [['Mike Gold’s NASA study role', '/nasa-mike-gold'], ['Try the guided investigation', '/first-investigation']],
  },
  'pentagon-navy-video-referral': {
    heading: 'Tracing the Pentagon referral for the Navy UAP videos',
    description: 'Trace the 2020 official Navy video release, the 2025 referral of seven documents and the separate 2026 administrative FOIA response.',
    tag: 'FOIA research review',
    sections: [
      ['Start with the video release', 'The Department of Defense’s 27 April 2020 statement covers the release of one Navy video recorded in November 2004 and two recorded in January 2015. The referral concerns the paperwork behind the decision to release those videos.'],
      ['Follow the document trail', 'The 24 April 2025 NAVAIR letter refers seven documents for Pentagon review. An interim response dated 28 May records receipt on 12 May under case 25-F-3215. The referral letter and interim response appear on original pages 11 and 13 of the administrative packet.'],
      ['Identify the missing decision', 'The 19 November 2026 final response to a separate case, 27-F-0917, released administrative records and described 25-F-3215 as open. A later release or final disposition identifying 25-F-3215 would answer what happened to the seven underlying documents.'],
    ],
    sources: [['DoD video-release statement', navyRelease], ['Referral and Pentagon acknowledgement (redacted PDF)', extracts], ['Final WHS administrative response (redacted PDF)', decision]],
    related: [['Pentagon case 25-F-3215', '/foia-pentagon-25-f-3215'], ['WHS case 27-F-0917', '/foia-whs-27-f-0917']],
  },
  'foia-whs-27-f-0917': {
    heading: 'WHS FOIA 27-F-0917: administrative records decision',
    description: 'Follow the November 2026 WHS administrative FOIA decision, which released 14 pages of Navy UAP referral, tracking and correspondence records.',
    tag: 'FOIA case summary · Final response',
    sections: [
      ['Request and response', 'Disclosure Desk dated its request 17 November 2026. The FOIA office received it on 18 November and assigned case 27-F-0917. Its 19 November final response identified 14 responsive administrative pages and applied personal-privacy redactions under Exemption 6.'],
      ['What the extract contains', 'The publication extract reproduces original page 1 of the final response. It documents the administrative decision and describes the separate Pentagon referral as open. The seven records referred for Pentagon review were outstanding as of the decision.'],
    ],
    sources: [['WHS final response, original page 1 (redacted PDF)', decision], ['Official WHS filing guidance', 'https://www.esd.whs.mil/FOID/Submit-Request/']],
    related: [['Full tracker and research actions', '/foia-tracker#request-27-f-0917'], ['Related Pentagon case', '/foia-pentagon-25-f-3215']],
  },
  'foia-pentagon-25-f-3215': {
    heading: 'Pentagon FOIA 25-F-3215: seven referred Navy records',
    description: 'See how the Pentagon received the Navy video-records referral, which documents confirm the case number and what remains outstanding.',
    tag: 'FOIA case summary · Open at last confirmation',
    sections: [
      ['Referral and acknowledgement', 'NAVAIR referred seven documents concerning the release of FLIR1, GIMBAL and GOFAST in a letter dated 24 April 2025. The Pentagon recorded receipt on 12 May and confirmed case 25-F-3215 in the interim response dated 28 May.'],
      ['Last documented status', 'The final WHS response for administrative case 27-F-0917 confirmed the referred case remained open on 19 November 2026. The extracts contain the referral and case acknowledgement. A final Pentagon decision or release would establish the disposition of the seven records.'],
    ],
    sources: [['Referral and interim response, original pages 11 and 13 (redacted PDF)', extracts], ['WHS status confirmation, original page 1 (redacted PDF)', decision]],
    related: [['Full tracker and research actions', '/foia-tracker#request-25-f-3215'], ['Navy video referral research review', '/pentagon-navy-video-referral']],
  },
  'nasa-mike-gold': {
    heading: 'Mike Gold and NASA’s UAP independent study team',
    description: 'Trace Mike Gold’s membership of NASA’s 2022–23 UAP independent study team to the official roster and the team’s final report.',
    tag: 'Who’s Who · Public institutional role',
    sections: [
      ['What NASA’s roster records', 'NASA listed Mike Gold among the members of its UAP independent study team when it announced the roster in October 2022. The roster gives his space-policy and industry background.'],
      ['Where to follow the work', 'The team’s September 2023 report sets out a collective approach to collecting and studying higher-quality UAP observations. The report describes the team’s remit and recommendations.'],
    ],
    sources: [['NASA team announcement and roster', nasaRoster], ['NASA final report (PDF)', nasaReport]],
    related: [['Full Mike Gold directory profile', '/who-is-who?person=mike-gold'], ['NASA study methods review', '/nasa-uap-study']],
  },
  'david-fravor-hearing': {
    heading: 'David Fravor’s 2023 congressional UAP testimony',
    description: 'Find David Fravor’s written witness statement and the official record of the July 2023 US House hearing on UAP.',
    tag: 'Who’s Who · Attributed witness statement',
    sections: [
      ['What the hearing record establishes', 'David Fravor spoke at the House Oversight hearing on 26 July 2023. The committee record includes his written witness statement about his account of an encounter off the coast of Southern California in 2004.'],
      ['Reading the testimony', 'Start with the witness statement and transcript. Record which details Fravor says he observed and which he attributes to other people or instruments. The committee material establishes the testimony and its attribution. Further original data are needed to assess the physical observation.'],
    ],
    sources: [['US House hearing and witness materials', fravorHearing], ['Official hearing transcript and printed record', 'https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm']],
    related: [['Full David Fravor directory profile', '/who-is-who?person=david-fravor'], ['Evidence First research guide', '/guide#evidence-first']],
  },
};

function escape(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
}
function links(entries) {
  return '<ul>' + entries.map(([label, url]) => '<li><a href="' + escape(url) + '">' + escape(label) + '</a></li>').join('') + '</ul>';
}
function pageHtml(slug, info) {
  const canonical = origin + '/' + slug;
  const title = escape(info.heading + ' | Disclosure Desk');
  const description = escape(info.description);
  const isProfile = info.tag.startsWith('Who’s Who');
  const image = origin + '/assets/share-' + (isProfile ? 'people' : 'research') + '.jpg';
  const alt = 'Disclosure Desk emblem and ' + (isProfile ? 'Who’s Who' : 'Original Research') + ' wordmark on a navy background';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b131c">
<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Disclosure Desk">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${alt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${alt}">
<link rel="icon" href="/assets/disclosure-desk-mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/research-public.css"><link rel="stylesheet" href="/assets/secondary-editorial-nav.css?v=issue22">
<script src="/assets/site-dock.js?v=issue22" defer></script><script src="/assets/secondary-editorial-nav.js?v=issue22" defer></script>
</head><body><a class="skip" href="#main-content">Skip to content</a>
<header class="top"><div class="wrap"><a class="brand" href="/"><img src="/assets/disclosure-desk-mark.svg" alt="">Disclosure Desk</a>
<nav class="navigation" aria-label="Research navigation"><a href="/investigations">Original Research</a><a href="/sources">Sources &amp; Archives</a><a href="/guide">Help</a></nav></div></header>
<main class="wrap" id="main-content" tabindex="-1"><article><p class="record-id">${escape(info.tag)}</p>
<h1>${escape(info.heading)}</h1><p class="intro">${description}</p>
<p class="muted">Source summary · 27 November 2026</p>
${info.sections.map(([heading, paragraph]) => '<section class="panel block"><h2>' + escape(heading) + '</h2><p>' + escape(paragraph) + '</p></section>').join('\n')}
<section id="primary-sources" class="panel block"><h2>Primary sources</h2>${links(info.sources)}</section>
<section class="block"><h2>Continue researching</h2>${links(info.related)}</section>
</article></main><footer><div class="wrap"><a href="/investigations">Original Research</a> · <a href="/sources">Sources &amp; Archives</a> · <a href="/site-updates">Site Updates</a> · <a href="/privacy">Privacy</a></div></footer>
</body></html>\n`;
}

function pursueIndex(root) {
  const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/pursue-index.json'), 'utf8'));
  return '<details id="archive-public-index" class="panel block" open><summary>Browse selected records by release</summary>' +
    catalogue.releases.map(release => {
      const safe = catalogue.records.filter(record => record.release === release.number &&
        /^https:\/\/www\.(?:war\.gov|dvidshub\.net)\//.test(record.source));
      return '<h2>Release ' + String(release.number).padStart(2, '0') + '</h2>' +
        links(safe.slice(0, 3).map(record => [record.title, record.source]));
    }).join('') + '</details>';
}

function peopleIndex(root) {
  const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
  const base = read('public-people-directory.json').people;
  const extras = read('public-people-directory-additions-m58.json');
  const publicPeople = [...base, ...extras.people.filter(p => extras.enabledProfileIds.includes(p.id))]
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const previews = {'mike-gold': '/nasa-mike-gold', 'david-fravor': '/david-fravor-hearing'};
  return '<div class="card"><details open><summary>Browse the public people index</summary>' +
    '<p>Open a public record summary or an interactive directory profile.</p>' +
    links(publicPeople.map(p => [p.name, previews[p.id] || '/who-is-who?person=' + encodeURIComponent(p.id)])) +
    '</details></div>';
}

function caseReaders(root) {
  const cases = {};
  for (const key of ['rendlesham-forest-1980', 'roswell-1947']) {
    const html = fs.readFileSync(path.join(root, key + '.html'), 'utf8');
    const match = /<!-- dd-case-reader:start -->([\s\S]*?)<!-- dd-case-reader:end -->/.exec(html);
    if (!match) throw Error('Missing editorial reader section in ' + key);
    const prefix = 'dd-reader-' + key + '-';
    cases[key] = match[1].trim()
      .replace(/(id="|href="#)([a-z0-9-]+)"/g, (_text, attr, id) => attr + prefix + id + '"')
      .replace(/class="grid"/g, 'class="dd-reader-grid"')
      .replace(/class="side"/g, 'class="dd-reader-side"')
      .replace(/class="card"/g, 'class="dd-reader-card"')
      .replace(/class="kicker"/g, 'class="dd-reader-kicker"')
      .replace(/class="lead"/g, 'class="dd-reader-lead"')
      .replace(/class="facts"/g, 'class="dd-reader-facts"')
      .replace(/class="button"/g, 'class="dd-reader-cta"');
  }
  const payload = JSON.stringify(cases).replace(/</g, '\\u003c');
  return `'use strict';\nwindow.DDCaseReaders = Object.freeze(${payload});\n`;
}

module.exports = {pages, pageHtml, pursueIndex, peopleIndex, caseReaders};
