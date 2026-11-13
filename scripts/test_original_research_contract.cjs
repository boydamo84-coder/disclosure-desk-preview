'use strict';
// Focused source-only contract for approved public research dossiers.
// No network, no account access, no deployment. Run from repo root:
// node scripts/test_original_research_contract.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');
const home=read('index.html');
const hub=read('investigations.html');
const guide=read('guide.html');
const sourcesDirectory=read('sources.html');
const sitemap=read('sitemap.xml');
const builder=read('scripts/build_public_release.cjs');
const archive=JSON.parse(read('data/curated-historical-cases.json'));
const ids=new Set(archive.map(x=>String(x.id)));
const routes=[
 {slug:'rendlesham-forest-1980',caseId:'featured-rendlesham-1980',source:'www.nationalarchives.gov.uk'},
 {slug:'roswell-1947',caseId:'featured-roswell-1947',source:'www.gao.gov'}
];
assert.ok(home.includes('href="/investigations"'),'Homepage links to the editorial hub');
assert.ok(hub.includes('href="/rendlesham-forest-1980"')&&hub.includes('href="/roswell-1947"'),'Hub links to the two review dossiers');
assert.ok(guide.includes('href="/investigations"')&&sourcesDirectory.includes('href="/investigations"'),
 'Both the public guide and Sources directory link to original research');
assert.ok(builder.includes("'investigations.html'"),'Hub included in strict deploy allowlist');
for(const {slug,caseId,source} of routes){
 const content=read(slug+'.html'),url='https://uapdisclosuredesk.com/'+slug;
 assert.ok(ids.has(caseId),'Deep-link case must exist in the curated source archive: '+caseId);
 assert.ok(home.includes('href="/'+slug+'"'),'Public homepage contains direct, crawlable article link: '+slug);
 assert.ok(sitemap.includes('<loc>'+url+'</loc>'),'Public sitemap contains '+slug);
 assert.ok(builder.includes("'"+slug+".html'"),'Strict release allowlist contains '+slug);
 assert.ok(content.includes('<link rel="canonical" href="'+url+'">'),'Self canonical '+slug);
 assert.ok(content.includes('<meta name="description"'),'Meta description '+slug);
 assert.ok(content.includes('id="timeline"')&&content.includes('id="analysis"')&&
    content.includes('id="record-ledger"')&&content.includes('id="evidence"')&&
    content.includes('id="sources"')&&content.includes('id="corrections"'),
    'Timelines, documentary record distinctions, uncertainty and corrections required: '+slug);
 assert.ok(content.includes('dd_archive_case='+caseId),'Exact existing source-record deep link: '+slug);
 assert.ok(content.includes(source),'Official source connection: '+slug);
 assert.ok(content.includes('assets/analytics-consent.js'),'Use existing optional analytics consent: '+slug);
 assert.ok(!/googletagmanager\.com|<script[^>]+adsbygoogle|supabase\.co|localStorage|sessionStorage/i.test(content),
    'Do not embed unconstrained analytics, ads, authentication or private state on public editorial page: '+slug);
 assert.ok(!/<meta[^>]+noindex/i.test(content),'Crawlable public dossier required: '+slug);
 const text=content.replace(/<style>[\s\S]*?<\/style>/g,'')
   .replace(/<script[^>]*>[\s\S]*?<\/script>/g,'')
   .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
 assert.ok(text.split(/\s+/).length>=650,'Substantial editorial dossier; no thin placeholders: '+slug);
 assert.ok(home.includes('href="/'+slug+'"'),'Direct public link required: '+slug);
 assert.ok(home.includes('href="/'+slug+'">Read original research')||home.includes('href="/'+slug+'">'), 'Homepage article link');
}
assert.ok(home.includes("['featured-rendlesham-1980','featured-roswell-1947']"),
 'Archive deep-links must accept only reviewed public case IDs');
assert.ok(home.includes('ddPendingArchiveCase=null;'),'Open deep links exactly once');
const publicBuilder=read('scripts/build_public_release.cjs');
assert.ok(home.includes('src="assets/case-connections.js?v=m97-indexed"'),'Public index loads the Case Connections engine before inline archive logic');
assert.ok(publicBuilder.includes("'case-connections.js'"),'Research matching module explicitly included in strict public package');
assert.ok(home.includes("window.DDCaseConnections?.build(next)"),'Index is rebuilt when the full archive loads');
for(const mode of ['all','nearby','similar','time'])
 assert.ok(home.includes("mode")&&home.includes("'"+mode+"'"),'Archive modal offers '+mode+' case filter');
assert.ok(home.includes('ddBindCaseConnections(body,r);'),'Every archive detail gets connected case recommendations');
assert.ok(!home.includes("Suggestions based on title keywords or nearby years."),'Old year-only recommendations are removed');
assert.ok(home.includes('ddPendingArchiveCase')&&home.includes('archiveCaseOpen(linked.id)'),
 'Open existing case detail instead of generating a duplicate record');
assert.ok(home.includes('href="/rendlesham-forest-1980">Read original research: Rendlesham Forest')&&
  home.includes('href="/roswell-1947">Read original research: Roswell'),
 'Archive detail modal must link back to the human-readable public research articles');
console.log('PASS Original Research: two indexed, source-linked and substantial public dossiers; expected curated IDs, safe deep links, consent and archive return navigation. No deployment or external fact checking performed.');
