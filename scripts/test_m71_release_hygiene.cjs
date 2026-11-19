'use strict';
// M71 release-hygiene regression; never contacts user accounts or deploys a site.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const smoke=read('.github/workflows/production-netlify-public-smoke.yml');
const netlify=read('netlify.toml'),builder=read('scripts/build_public_release.cjs');
const r3=read('scripts/build_r3_hosted_assets.cjs');
const config=read('assets/community-test-config.js');
const who=read('who-is-who.html');
const ad=read('assets/site-adsterra-m02.js');
assert.match(smoke,/push:\\n    branches: \\[production\\]/,'Production smoke only runs on official production ref');
assert.match(smoke,/published-tree-smoke:[\\s\\S]*?env:\\n      CONTEXT: production/,'Must recreate production R3 privacy stripping');
assert.match(smoke,/node scripts\\/build_public_release\\.cjs/);
assert.match(smoke,/sha256sum \\.release-staging\\/public-site\\/release-manifest\\.json/);
assert(!/netlify\\s+(?:deploy|build|api)/i.test(smoke),'Smoke must never deploy to Netlify');
assert.match(netlify,/command = "node scripts\\/build_public_release\\.cjs"/);
assert.match(netlify,/publish = "\\.release-staging\\/public-site"/);
assert.match(r3,/process\\.env\\.CONTEXT==='production'/);
assert.match(builder,/whoEvidenceBallots:false/);
assert.match(builder,/RELEASE_ENABLED=false/);
assert.match(config,/whoEvidenceBallots:false/);
assert.match(ad,/const RELEASE_ENABLED=false;/);
assert.doesNotMatch(who,/who-evidence-ballot-m64\\.(?:js|css)/);
const mode=process.argv.includes('--production')?'production':process.argv.includes('--preview')?'deploy-preview':null;
if(mode){
 assert.equal(process.env.CONTEXT,mode,'Build environment must explicitly set correct Netlify context');
 const root=path.resolve(__dirname,'..','.release-staging/public-site');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
 const paths=manifest.files.map(f=>f.path);
 const qa='research/r3-lab/hypothesis-session-qa.js';
 const lab=fs.readFileSync(path.join(root,'research/r3-lab/index.html'),'utf8');
 if(mode==='production'){
  assert.equal(paths.length,129,'Production public bundle must exclude R3 test fixture');
  assert(!paths.includes(qa),'Public R3 must exclude internal QA JS');
  assert(!lab.includes('id="r3QaPanel"'),'Public R3 must exclude internal QA panel');
 }else{
  assert.equal(paths.length,130,'Preview adds only the R3 test asset');
  assert(paths.includes(qa),'Preview must retain synthetic R3 QA fixture');
  assert(lab.includes('id="r3QaPanel"'),'Preview must retain R3 synthetic test controls');
 }
 assert(!paths.some(p=>/who-evidence-ballot-m64|who-community-approvals-m64/.test(p)),'No unfinished claim ballots');
}
console.log('M71 PASS: official release context, strict Netlify public bundle and disabled drafts ('+(mode||'source')+')');
