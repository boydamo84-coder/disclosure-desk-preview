'use strict';
// M71 read-only release-hygiene guard. Does not change GitHub, Netlify or user data.
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const smoke=read('.github/workflows/production-netlify-public-smoke.yml');
const netlify=read('netlify.toml'), builder=read('scripts/build_public_release.cjs');
const r3=read('scripts/build_r3_hosted_assets.cjs');
const config=read('assets/community-test-config.js');
const who=read('who-is-who.html'), ad=read('assets/site-adsterra-m02.js');
assert(smoke.includes('branches: [production]'),'Smoke triggers only on production');
assert(smoke.includes('published-tree-smoke:'),'Production smoke job is present');
assert(smoke.includes('CONTEXT: production'),'Production smoke recreates Netlify environment');
assert(smoke.includes('node scripts/build_public_release.cjs'),'Strict builder is used');
assert(smoke.includes('sha256sum .release-staging/public-site/release-manifest.json'),'Published manifest is compared');
assert(!smoke.includes('netlify deploy')&&!smoke.includes('netlify build'),'Smoke must remain no-deploy');
assert(netlify.includes('command = "node scripts/build_public_release.cjs"'));
assert(netlify.includes('publish = ".release-staging/public-site"'));
assert(r3.includes("process.env.CONTEXT==='production'"));
assert(builder.includes('whoEvidenceBallots:false'),'Builder blocks evidence ballots');
assert(builder.includes('RELEASE_ENABLED=false'),'Builder blocks live Adsterra');
assert(config.includes('whoEvidenceBallots:false'),'Member evidence ballots are closed');
assert(ad.includes('const RELEASE_ENABLED=false;'),'Real Adsterra is disabled');
assert(!who.includes('who-evidence-ballot-m64.js')&&!who.includes('who-evidence-ballot-m64.css'),'Unfinished voting files are not linked');
const mode=process.argv.includes('--production')?'production':process.argv.includes('--preview')?'deploy-preview':null;
if(mode){
 assert.equal(process.env.CONTEXT,mode,'Set CONTEXT explicitly for this test');
 const root=path.resolve(__dirname,'..','.release-staging/public-site');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
 const paths=manifest.files.map(f=>f.path);
 const qa='research/r3-lab/hypothesis-session-qa.js';
 const lab=fs.readFileSync(path.join(root,'research/r3-lab/index.html'),'utf8');
 if(mode==='production'){
  assert.equal(paths.length,129,'The published public bundle has 129 safe files');
  assert(!paths.includes(qa),'No internal R3 QA JS in production');
  assert(!lab.includes('id="r3QaPanel"'),'No internal R3 QA panel in production');
 }else{
  assert.equal(paths.length,130,'Preview retains the R3 QA fixture');
  assert(paths.includes(qa),'Preview QA fixture retained');
  assert(lab.includes('id="r3QaPanel"'),'Preview QA panel retained');
 }
 assert(!paths.some(p=>p.includes('who-evidence-ballot-m64')||p.includes('who-community-approvals-m64')),'No unfinished ballots in bundle');
}
console.log('M71 PASS: production-only smoke, read-only QA and safe R3 output ('+(mode||'source')+')');
