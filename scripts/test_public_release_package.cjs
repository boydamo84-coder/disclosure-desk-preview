'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.release-staging','public-site');
if(fs.existsSync(out))throw Error('Refuse to overwrite existing build output');
cp.execFileSync(process.execPath,['scripts/build_public_release.cjs'],{cwd:root,stdio:'inherit'});
const m=JSON.parse(fs.readFileSync(path.join(out,'release-manifest.json'),'utf8'));
const paths=m.files.map(f=>f.path),names=new Set(paths);
assert.equal(names.size,paths.length);
assert.ok(paths.length>=35&&paths.length<=80,'Unexpected package count '+paths.length);
for(const f of m.files){
 const bytes=fs.readFileSync(path.join(out,f.path));
 assert.equal(bytes.length,f.bytes,f.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);
 assert.doesNotMatch(f.path,/(^|\/)(?:scripts|supabase|finance_local|finance-review|finance|android-test|docs|\.github)(\/|$)|\.(?:zip|sql|py|md|env)$/i);
}
for(const f of ['index.html','sources.html','research/wne.html','research/index.html',
 'research/research-site-nav.js','assets/community-test-config.js','assets/profile-private-chat.js',
 'assets/community-discussions.js','data/approved-live-events.json','data/historical-news-archive.json'])
 assert.ok(names.has(f),'Required site dependency missing: '+f);
for(const f of ['MASTER_HANDOVER.md','finance_local/vault.py','supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql',
 'data/gep-2026-09-preflight-summary.json','data/news-feed-health.json','data/modern-official-uap-seed.json'])
 assert.ok(!names.has(f),'Internal file leaked: '+f);
assert.equal(m.totalBytes,m.files.reduce((n,f)=>n+f.bytes,0));
const pages=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');
assert.match(pages,/path: \.release-staging\/public-site/);
assert.doesNotMatch(pages,/path: \.\s*(?:\n|$)/);
console.log('PASS release packaging: '+m.files.length+' files; internal finance/SQL/QA excluded; root Pages upload disabled');
