'use strict';
// Curated release guard. Fail if the branch contains any unapproved change
// against the exact locked production source used to create the candidate.
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const baseline='6b602324d14b834b0ef5ac222d3cae3acbf53a56';
const allowed=new Set([
 'index.html','who-is-who.html','sources.html','world-uap-programmes.html',
 'assets/people-directory.js','assets/who-archive-return.js',
 'assets/world-uap-programmes.js','assets/source-verification.js',
 'data/public-people-directory.json','data/public-people-directory-additions-m58.json',
 'data/public-person-case-links.json','data/who-editorial-handoff-m29.json',
 'data/programmes-places-m58.json','data/public-source-verification.json',
 'scripts/build_public_release.cjs',
 'scripts/test_who_m62_source_first_chromium.cjs',
 'scripts/test_who_m62_source_first_contract.cjs',
 'scripts/test_who_m39_source_tracker_chromium.cjs',
 'scripts/test_curated_research_rc1_contract.cjs',
 'scripts/test_curated_research_rc1_browser.cjs',
 'scripts/test_curated_research_rc1_diff.cjs',
 '.github/workflows/curated-research-rc1-no-deploy.yml',
 'docs/CURATED_RESEARCH_RC1_HANDOVER_2026-11-18.md',
 'MASTER_HANDOVER.md'
]);
const output=cp.execFileSync('git',['diff','--name-only',baseline,'HEAD'],
 {encoding:'utf8'}).trim();
const paths=output.split(/\r?\n/).filter(Boolean);
const unexpected=paths.filter(f=>!allowed.has(f));
assert.deepEqual(unexpected,[],'Unapproved file in curated website release candidate');
const required=['index.html','who-is-who.html','sources.html','world-uap-programmes.html',
 'assets/people-directory.js','data/public-source-verification.json',
 'scripts/build_public_release.cjs'];
for(const f of required)assert(paths.includes(f),'Expected curated change absent: '+f);
assert(paths.length<=allowed.size,'Unexpected number of files');
assert(!paths.some(x=>/^research\/|^android\/|^supabase\/|^docs\/COMMUNITY_RESEARCH_M0[2-7]_.*\.sql$/.test(x)),
 'W.NE, APK or database migration must NEVER ride with curated site-only release');
console.log('PASS curated RC1 diff: exactly '+paths.length+' reviewed files relative to pinned production baseline; no beta, Android, W.NE or migration scope');
