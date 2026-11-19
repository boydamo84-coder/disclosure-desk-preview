'use strict';
// Synthetic keypairs are generated in process and never written to the repository.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {reviewQueue,digest,attestationMessage,validatePacket,verifiedCandidate}=require('./who-m73-editorial-approval.cjs');
const mod=require('../assets/who-evidence-ballot-m64.js');
const signer=require('./who-m73-local-review.cjs');
const queue=reviewQueue();
const publicRecords=JSON.parse(fs.readFileSync('data/public-people-directory.json','utf8')).people;
assert.equal(publicRecords.length,50);
assert.equal(publicRecords.flatMap(x=>x.claimEvidence||[]).length,23);
assert.equal(queue.length,5,'Initial review queue must contain only the five source-backed incident/observation dossiers');
const c=queue.find(x=>x.claimId==='fravor-2023-house-2004-encounter');
assert(c,'Firsthand observation is in a queue, NOT an editor-approved claim');
assert.equal(verifiedCandidate(c),c);
const pair=(id,role)=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 return {id,role,privateKey,publicKeyPem:publicKey.export({type:'spki',format:'pem'})};
};
const a=pair('fictional-editor-a','lead'),b=pair('fictional-editor-b','independent'),other=pair('fictional-editor-c','lead');
const keyring={schemaVersion:1,reviewers:[a,b].map(x=>({reviewerId:x.id,role:x.role,status:'active',publicKeyPem:x.publicKeyPem}))};
function sign(person,candidate=c,extra={}){
 const review={
  reviewerId:person.id,role:person.role,decision:'approve',claimDigest:digest(candidate),
  signedAt:'2026-11-19T11:00:00Z',originalInspected:true,
  statementVerified:true,alternativesReviewed:true,conflictOfInterest:false,signature:''
 };
 Object.assign(review,extra);
 review.signature=crypto.sign(null,attestationMessage(review),person.privateKey).toString('base64');
 return review;
}
const approvals=[sign(a),sign(b)];
const pkt={schemaVersion:1,candidate:c,approvals};
const ok=validatePacket(pkt,keyring);
assert.equal(ok.verifiedSignatures,true);
assert.equal(ok.leadEditor,a.id);
assert.equal(ok.independentEditor,b.id);
assert.equal(ok.reviewCompletedAt,'2026-11-19');
assert.equal(ok.proposedRegistryRow.enabled,false,'Sign-offs do NOT open public voting');
assert.equal(mod.parseRegistry({schemaVersion:1,approvedClaims:[ok.proposedRegistryRow]}).size,0);
const reject=(f,phrase)=>assert.throws(f,phrase);
reject(()=>validatePacket({...pkt,approvals:[sign(a)]},keyring),/Exactly two/);
reject(()=>validatePacket({...pkt,approvals:[sign(a),sign(a)]},keyring),/roles must be distinct/);
reject(()=>validatePacket({...pkt,approvals:[sign(a),{...sign(b),reviewerId:a.id}]},keyring),/role does not match|roles must be distinct/);
reject(()=>validatePacket({...pkt,approvals:[sign(a),sign(other)]},keyring),/Unknown or revoked/);
reject(()=>validatePacket(pkt,{...keyring,reviewers:[keyring.reviewers[0],{...keyring.reviewers[1],publicKeyPem:keyring.reviewers[0].publicKeyPem}] }),/cannot represent multiple/);
reject(()=>validatePacket(pkt,{...keyring,reviewers:[keyring.reviewers[0],{...keyring.reviewers[1],status:'revoked'}]}),/revoked/);
reject(()=>validatePacket({...pkt,candidate:{...c,statement:c.statement+' unreviewed claim changed'}},keyring),/identical/);
reject(()=>validatePacket({...pkt,candidate:{...c,originalSourceUrl:'https://example.com/imposter'}},keyring),/identical/);
reject(()=>validatePacket({...pkt,candidate:{...c,claimVersion:2}},keyring),/identical/);
reject(()=>validatePacket({...pkt,candidate:{...c,sourceLocator:c.sourceLocator+' changed'}},keyring),/identical/);
reject(()=>validatePacket({...pkt,candidate:{...c,limitations:c.limitations+' altered'}},keyring),/identical/);
reject(()=>validatePacket({...pkt,candidate:{...c,claimType:'policy_or_records_access'}},keyring),/direct incident/);
const attacks=[
 {decision:'reject'}, {originalInspected:false},{statementVerified:false},
 {alternativesReviewed:false},{conflictOfInterest:true},
 {signedAt:'2077-11-19T11:00:00Z'},
 {claimDigest:'0'.repeat(64)}
];
for(const change of attacks){
 const tampered={...approvals[1],...change}; // Not resigned: must fail even if role metadata appears plausible.
 reject(()=>validatePacket({...pkt,approvals:[approvals[0],tampered]},keyring));
}
const altered={...approvals[0],signedAt:'2026-11-19T11:01:00Z'};
reject(()=>validatePacket({...pkt,approvals:[altered,approvals[1]]},keyring),/Invalid or tampered/);
const forged={...approvals[1],signature:crypto.sign(null,attestationMessage(approvals[1]),other.privateKey).toString('base64')};
reject(()=>validatePacket({...pkt,approvals:[approvals[0],forged]},keyring),/Invalid or tampered/);
const signedWithLocalTool=signer.signReview(c,{
 reviewerId:a.id,role:a.role,decision:'approve',signedAt:'2026-11-19T11:00:00Z',
 originalInspected:true,statementVerified:true,alternativesReviewed:true,conflictOfInterest:false
},a.privateKey.export({type:'pkcs8',format:'pem'}));
assert.deepEqual(signedWithLocalTool,approvals[0],'Local signer must reproduce the same canonical Ed25519 review');
reject(()=>signer.signReview(c,{
 reviewerId:a.id,role:a.role,decision:'pending',signedAt:'2026-11-19T11:00:00Z',
 originalInspected:false,statementVerified:true,alternativesReviewed:true,conflictOfInterest:false
},a.privateKey.export({type:'pkcs8',format:'pem'})));
const registry=JSON.parse(fs.readFileSync('data/who-community-approvals-m64.json','utf8'));
const config=fs.readFileSync('assets/community-test-config.js','utf8');
assert.deepEqual(registry.approvedClaims,[],'ZERO actual editor approvals in published registry');
assert(config.includes('whoEvidenceBallots:false'),'Hard kill switch retained');
assert(fs.readFileSync('assets/site-adsterra-m02.js','utf8').includes('const RELEASE_ENABLED=false;'));
const build=fs.readFileSync('scripts/build_public_release.cjs','utf8');
assert(!build.includes('who-m73-editorial-approval.cjs'),'Private source gate must never ship in public JS');
console.log('M73 PASS: five candidate dossiers are NOT approved; Ed25519 exact-source, independent roles, conflict/attestation checks, revocation, cross-key forgery and tampering rejection');
