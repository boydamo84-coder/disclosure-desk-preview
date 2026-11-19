'use strict';
/* Offline editor tool. Does NOT prove a human independently checked the source.
   It signs attestations with a local private key and never sends the key online. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const gate=require('./who-m73-editorial-approval.cjs');
const required=['reviewerId','role','decision','signedAt','originalInspected','statementVerified','alternativesReviewed','conflictOfInterest'];
function signReview(candidate,attestation,key){
 assert(attestation&&typeof attestation==='object'&&!Array.isArray(attestation));
 assert.deepEqual(Object.keys(attestation).sort(),required.slice().sort(),'Attestation must contain exact required fields');
 assert(/^[a-z0-9][a-z0-9-]{3,99}$/.test(attestation.reviewerId),'Use enrolled reviewer ID');
 assert(['lead','independent'].includes(attestation.role),'Use enrolled editorial role');
 assert.equal(attestation.decision,'approve','Do not sign an unresolved or rejected review');
 assert.equal(attestation.originalInspected,true,'Editor must have inspected original source');
 assert.equal(attestation.statementVerified,true,'Editor must check exact attribution and wording');
 assert.equal(attestation.alternativesReviewed,true,'Editor must consider alternatives');
 assert.equal(attestation.conflictOfInterest,false,'Conflicted reviewer cannot sign');
 const time=attestation.signedAt;
 assert(typeof time==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(time),'UTC seconds required');
 assert(new Date(time).toISOString()===time.replace('Z','.000Z'),'Invalid timestamp');
 assert(Date.parse(time)<=Date.now()+300000,'Future timestamps forbidden');
 const claimDigest=gate.digest(candidate);
 const pkey=crypto.createPrivateKey(key);
 assert.equal(pkey.asymmetricKeyType,'ed25519','Signer requires Ed25519 private key');
 const review={...attestation,claimDigest,signature:''};
 review.signature=crypto.sign(null,gate.attestationMessage(review),pkey).toString('base64');
 return review;
}
function readJSON(p){return JSON.parse(fs.readFileSync(p,'utf8'))}
function forbidRepoPrivateKey(p){
 const full=path.resolve(p),root=path.resolve(__dirname,'..');
 assert(full!==root&&!full.startsWith(root+path.sep),'Never place an editorial private key inside the GitHub project');
 const stat=fs.statSync(full);
 assert(stat.isFile(),'Private key must be a regular file');
 if(process.platform!=='win32')assert.equal(stat.mode&0o077,0,'Private key must be accessible only to its owner (chmod 600)');
 return fs.readFileSync(full);
}
if(require.main===module){
 const [mode,...args]=process.argv.slice(2);
 if(mode==='sign'&&args.length===3){
  const signed=signReview(readJSON(args[0]),readJSON(args[1]),forbidRepoPrivateKey(args[2]));
  process.stdout.write(JSON.stringify(signed,null,2)+'\n');
 }else if(mode==='packet'&&args.length===4){
  const candidate=readJSON(args[0]),approvals=[readJSON(args[1]),readJSON(args[2])];
  const packet={schemaVersion:1,candidate,approvals};
  const validated=gate.validatePacket(packet,readJSON(args[3]));
  assert(validated.verifiedSignatures&&validated.proposedRegistryRow.enabled===false,'No verified or disabled registry row');
  process.stdout.write(JSON.stringify(packet,null,2)+'\n');
 }else if(mode==='template'&&args.length===2){
  assert(/^[a-z0-9][a-z0-9-]{3,99}$/.test(args[0]));
  assert(['lead','independent'].includes(args[1]));
  // False/pending defaults force a human to check evidence before signing.
  process.stdout.write(JSON.stringify({
   reviewerId:args[0],role:args[1],decision:'pending',
   signedAt:new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),
   originalInspected:false,statementVerified:false,
   alternativesReviewed:false,conflictOfInterest:false
  },null,2)+'\n');
 }else{
  process.stderr.write('Usage: local-review.cjs template reviewer-id lead|independent | sign candidate.json reviewed-attestation.json /private/key.pem | packet candidate.json signed-lead.json signed-independent.json keyring.json\n');
  process.exitCode=2;
 }
}
module.exports={signReview,forbidRepoPrivateKey};
