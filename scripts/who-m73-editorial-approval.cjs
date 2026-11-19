'use strict';
/* M73 private editorial evidence intake. No user vote, database connection or publishing action.
   A valid pair of Ed25519 signatures proves possession of two enrolled keys,
   NOT that humans independently checked the original evidence: manual vetting still required. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const directory=()=>JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const pattern=/^[a-z0-9][a-z0-9-]{6,85}$/;
const exactKeys=(value,keys,label)=>{
 assert(value&&typeof value==='object'&&!Array.isArray(value),label+' must be an object');
 assert.deepEqual(Object.keys(value).sort(),keys.slice().sort(),label+' has unexpected or missing fields');
};
const textValue=(value,label,min,max)=>{
 assert(typeof value==='string'&&value.length>=min&&value.length<=max&&value===value.trim(),label+' must be exact, trimmed text');
 return value;
};
const dateValue=(value)=>{
 assert(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value),'Sign-off timestamp must be canonical UTC seconds');
 const ms=Date.parse(value);
 assert(Number.isFinite(ms)&&new Date(ms).toISOString()===value.replace('Z','.000Z'),'Invalid sign-off date');
 assert(ms<=Date.now()+5*60*1000,'Future-dated editorial sign-off');
 return value;
};
function reviewQueue(dir=directory()){
 assert(Array.isArray(dir.people),'Public people directory expected');
 return dir.people.flatMap(person=>(person.claimEvidence||[]).filter(claim=>
  claim.ratingReadiness?.claimType==='incident_or_observation' &&
  claim.ratingReadiness?.scorePath!=='not_applicable_to_incident_score' &&
  Array.isArray(claim.sources)&&claim.sources.some(s=>s.kind==='primary')
 ).map(claim=>{
  const primary=claim.sources.filter(s=>s.kind==='primary');
  const original=claim.sourceAudit?.original;
  const matched=primary.find(s=>s.url===original?.url)||primary[0];
  return Object.freeze({
   personId:person.id,claimId:claim.id,claimVersion:Number.isInteger(claim.version)?claim.version:1,
   statement:claim.statement,originalSourceUrl:matched.url,
   sourceLocator:(original?.url===matched.url&&original?.locator)||matched.context||matched.label,
   limitations:claim.ratingReadiness.reason,
   claimType:'incident_or_observation'
  });
 }));
}
function verifiedCandidate(candidate,dir=directory()){
 exactKeys(candidate,['personId','claimId','claimVersion','statement','originalSourceUrl','sourceLocator','limitations','claimType'],'Candidate');
 textValue(candidate.personId,'Person id',3,90);
 textValue(candidate.claimId,'Claim id',7,86);
 assert(pattern.test(candidate.claimId),'Invalid claim ID');
 assert(Number.isSafeInteger(candidate.claimVersion)&&candidate.claimVersion>0,'Invalid claim version');
 textValue(candidate.statement,'Exact attributed statement',30,2500);
 textValue(candidate.originalSourceUrl,'Source URL',12,1200);
 assert(/^https:\/\/[^\s?#]+(?:[?#][^\s]*)?$/.test(candidate.originalSourceUrl),'Original source must use HTTPS');
 textValue(candidate.sourceLocator,'Original source locator',15,1500);
 textValue(candidate.limitations,'Uncertainty and limitations',30,2000);
 assert.equal(candidate.claimType,'incident_or_observation','Only direct incident or observation claims in initial pilot');
 const matches=reviewQueue(dir).filter(row=>row.personId===candidate.personId&&row.claimId===candidate.claimId);
 assert.equal(matches.length,1,'Claim must exist uniquely in the public source directory');
 assert.deepEqual(candidate,matches[0],'Candidate must be byte-for-byte identical to the current approved-for-intake source draft');
 return candidate;
}
function digest(candidate,dir=directory()){
 const c=verifiedCandidate(candidate,dir);
 // Fixed ordered representation; no Unicode/whitespace normalization that changes testimony.
 return crypto.createHash('sha256').update('DD-WHO-M73-CLAIM-V1\n'+JSON.stringify(c),'utf8').digest('hex');
}
const fields=['reviewerId','role','decision','claimDigest','signedAt','originalInspected','statementVerified','alternativesReviewed','conflictOfInterest','signature'];
function attestationMessage(review){
 const {reviewerId,role,decision,claimDigest,signedAt,originalInspected,statementVerified,alternativesReviewed,conflictOfInterest}=review;
 return Buffer.from('DD-WHO-M73-EDITOR-V1\n'+JSON.stringify({
  reviewerId,role,decision,claimDigest,signedAt,originalInspected,
  statementVerified,alternativesReviewed,conflictOfInterest
 }), 'utf8');
}
function validatePacket(packet,keys,dir=directory()){
 exactKeys(packet,['schemaVersion','candidate','approvals'],'Approval packet');
 assert.equal(packet.schemaVersion,1,'Unsupported packet schema');
 assert(Array.isArray(packet.approvals)&&packet.approvals.length===2,'Exactly two independent approvals required');
 exactKeys(keys,['schemaVersion','reviewers'],'Editor trust store');
 assert.equal(keys.schemaVersion,1);
 assert(Array.isArray(keys.reviewers)&&keys.reviewers.length>=2,'No enrolled editorial keyring');
 const candidate=verifiedCandidate(packet.candidate,dir);
 const claimDigest=digest(candidate,dir);
 const reviewers=new Map();
 const fingerprints=new Set();
 for(const item of keys.reviewers){
  exactKeys(item,['reviewerId','role','status','publicKeyPem'],'Enrolled reviewer');
  textValue(item.reviewerId,'Reviewer identity',4,100);
  assert(['lead','independent'].includes(item.role),'Unknown editor role');
  assert(['active','revoked'].includes(item.status),'Unknown reviewer status');
  assert(!reviewers.has(item.reviewerId),'Duplicate reviewer ID');
  const key=crypto.createPublicKey(item.publicKeyPem);
  assert.equal(key.asymmetricKeyType,'ed25519','Only Ed25519 public keys are accepted');
  const fingerprint=crypto.createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex');
  assert(!fingerprints.has(fingerprint),'An editorial public key cannot represent multiple reviewers');
  reviewers.set(item.reviewerId,{...item,key,fingerprint});
  fingerprints.add(fingerprint);
 }
 const signed=new Map();
 for(const review of packet.approvals){
  exactKeys(review,fields,'Signed reviewer attestation');
  textValue(review.reviewerId,'Reviewer identity',4,100);
  const enrolled=reviewers.get(review.reviewerId);
  assert(enrolled&&enrolled.status==='active','Unknown or revoked editorial signer');
  assert.equal(review.role,enrolled.role,'Claimed role does not match enrolled identity');
  assert(['lead','independent'].includes(review.role),'Both named reviewer roles are required');
  assert(!signed.has(review.role),'Approval roles must be distinct');
  assert.equal(review.decision,'approve','Unapproved or rejected evidence cannot be unlocked');
  assert.equal(review.claimDigest,claimDigest,'Signatures must refer to this exact source version');
  dateValue(review.signedAt);
  assert.equal(review.originalInspected,true,'Editor must attest to inspecting the original');
  assert.equal(review.statementVerified,true,'Editor must attest to exact attributed claim wording');
  assert.equal(review.alternativesReviewed,true,'Editor must attest to limitations and alternatives');
  assert.equal(review.conflictOfInterest,false,'Conflicted editor cannot approve');
  assert(typeof review.signature==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(review.signature),'Canonical base64 signature required');
  const bytes=Buffer.from(review.signature,'base64');
  assert.equal(bytes.length,64,'Ed25519 signature must be 64 bytes');
  assert.equal(bytes.toString('base64'),review.signature,'Noncanonical signature encoding');
  assert(crypto.verify(null,attestationMessage(review),enrolled.key,bytes),'Invalid or tampered reviewer signature');
  signed.set(review.role,{reviewerId:review.reviewerId,signedAt:review.signedAt,fingerprint:enrolled.fingerprint});
 }
 assert.equal(signed.size,2,'Two distinct editorial roles required');
 assert.notEqual(signed.get('lead').reviewerId,signed.get('independent').reviewerId,'Editors must be distinct');
 assert.notEqual(signed.get('lead').fingerprint,signed.get('independent').fingerprint,'Editors must have different keys');
 const reviewedAt=[...signed.values()].map(x=>x.signedAt).sort().at(-1).slice(0,10);
 return Object.freeze({
  verifiedSignatures:true,claimDigest,
  leadEditor:signed.get('lead').reviewerId,independentEditor:signed.get('independent').reviewerId,
  reviewCompletedAt:reviewedAt,
  // IMPORTANT: editorial signatures alone NEVER enable voting or populate the live registry.
  proposedRegistryRow:Object.freeze({
   claimId:candidate.claimId,claimVersion:candidate.claimVersion,statement:candidate.statement,
   originalSourceUrl:candidate.originalSourceUrl,
   status:'independently_approved_for_community_criteria',reviewedAt,
   leadEditor:signed.get('lead').reviewerId,independentEditor:signed.get('independent').reviewerId,
   enabled:false
  })
 });
}
module.exports={reviewQueue,verifiedCandidate,digest,attestationMessage,validatePacket};
if(require.main===module){
 const [mode,...args]=process.argv.slice(2);
 if(mode==='queue'&&args.length===0){
  // A review queue is not an approval. This prints only already public claims.
  process.stdout.write(JSON.stringify({
   status:'needs_original_source_review_not_approved',candidateCount:reviewQueue().length,
   candidates:reviewQueue()
  },null,2)+'\n');
 }else if(mode==='draft'&&args.length===1){
  const found=reviewQueue().filter(c=>c.claimId===args[0]);
  assert.equal(found.length,1,'No uniquely eligible incident claim with this ID');
  process.stdout.write(JSON.stringify(found[0],null,2)+'\n');
 }else if(mode==='verify'&&args.length===2){
  const packet=JSON.parse(fs.readFileSync(args[0],'utf8'));
  const keys=JSON.parse(fs.readFileSync(args[1],'utf8'));
  process.stdout.write(JSON.stringify(validatePacket(packet,keys),null,2)+'\n');
 }else{
  process.stderr.write('Usage: node scripts/who-m73-editorial-approval.cjs queue | draft claim-id | verify signed-packet.json enrolled-public-keys.json\n');
  process.exitCode=2;
 }
}
