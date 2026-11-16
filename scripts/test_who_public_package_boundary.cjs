'use strict';
// M23 PUBLIC PACKAGE SAFETY (NO DEPLOY). Run ONLY after build_public_release.cjs.
// Internal review drafts, SQL and synthetic account fixtures must stay out of Netlify.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const out=path.join(__dirname,'..','.release-staging','public-site');
const man=JSON.parse(fs.readFileSync(path.join(out,'release-manifest.json'),'utf8'));
assert.match(man.type,/NOT DEPLOYED/);
assert(Array.isArray(man.files)&&man.files.length>50,'Expected strict allowlisted public package');
const approved=new Set(man.files.map(f=>f.path));
assert(approved.has('who-is-who.html')&&approved.has('data/public-people-directory.json')&&approved.has('assets/people-directory.js')&&approved.has('data/public-who-editorial-readiness-m29.json'),'Required Who and M29 unsigned editorial ledger missing from allowlist');
const forbidden=/^(?:\.github|docs|scripts|supabase|\.git|node_modules|tests?|private|internal)(?:\/|$)|(?:\.sql|\.env|\.pem|\.key|\.sqlite3?|\.bak|\.map)$/i;
const internalNames=['who_rating_ephemeral_pg_bootstrap.sql','who_rating_signed_jwt_http_seed.sql','test_who_rating_postgrest_jwt_http.cjs','WHO_CLAIM_RATINGS_SQL_DRAFT_ONLY_2026-11-15.sql'];
let verified=0;
function visit(dir,rel=''){
 for(const f of fs.readdirSync(dir,{withFileTypes:true})){
  const p=rel?rel+'/'+f.name:f.name;
  const abs=path.join(dir,f.name);
  assert(!fs.lstatSync(abs).isSymbolicLink(),'No symlink in public package: '+p);
  if(f.isDirectory()){visit(abs,p);continue}
  assert(f.isFile(),'Only regular files in public package: '+p);
  if(p==='release-manifest.json')continue;
  assert(!forbidden.test(p),'Internal artifact would leak into the public website: '+p);
  assert(approved.has(p),'Unapproved extra public file: '+p);
  assert(!internalNames.some(name=>p.endsWith(name)),'Synthetic test/SQL leaked into public site: '+p);
  const meta=man.files.find(x=>x.path===p);
  const bytes=fs.readFileSync(abs);
  assert.equal(bytes.length,meta.bytes,'File size mismatch: '+p);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256,'Manifest hash mismatch: '+p);
  verified++;
 }
}
visit(out);
assert.equal(verified,approved.size,'The complete allowlist must match copied package');
const data=JSON.parse(fs.readFileSync(path.join(out,'data/public-people-directory.json'),'utf8'));
assert.equal(data.people.length,50,'Keep all public profiles');
const claims=data.people.flatMap(p=>p.claimEvidence||[]);
assert.equal(claims.length,23,'Keep 23 attributed individual claim/recommendation drafts');
assert(claims.every(c=>c.ratingReadiness?.publicationApproval==='withheld'),'Unapproved claim must not become public percentage');
assert(claims.every(c=>c.sourceAccessCheck?.secondEditorSignoff==='not_obtained'),'No invented human signoffs');
assert(data.people.every(p=>p.photoRightsAudit?.finalRightsApproval===false),'No synthetic portrait rights signoffs');
const editorial=JSON.parse(fs.readFileSync(path.join(out,'data/public-who-editorial-readiness-m29.json'),'utf8'));
assert.equal(editorial.version,1);
assert.equal(editorial.milestone,'M29');
assert.equal(editorial.state,'public_read_only_editorial_handoff_not_approved');
assert.equal(editorial.rubric.status,'unweighted_editorial_readiness_checklist_not_a_scoring_formula');
assert.equal(editorial.rubric.numericWeightsApproved,false);
assert.equal(editorial.publications.length,17);
assert.equal(editorial.relationships.length,7);
assert.equal(editorial.claims.length,23);
assert(editorial.claims.every(x=>x.publicationApproval===false&&x.editorialScoreEnabled===false&&
 x.communityVoteEnabled===false&&x.portraitPermission===false&&
 x.assignment==='unassigned'&&x.secondHumanEditorSignoff==='not_obtained'));
assert(editorial.claims.every(x=>!('reviewerName' in x)&&!('reviewerEmail' in x)&&
 !('voteCount' in x)&&!('score' in x)&&!('points' in x)));
console.log('Who M29 package: '+verified+' allowlisted public files verified by SHA-256; 23 unsigned rubric entries, 17 source families, 7 cross-links, 0 ratings, 0 internal fixtures. NO DEPLOY.');
