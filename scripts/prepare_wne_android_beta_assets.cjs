"use strict";
// Install only approved public Research Edition resources into the PRIVATE
// Android debug APK. Never include Supabase service secrets, GitHub workflows,
// SQL, test fixtures, docs or unpublished files. Does NOT deploy any website.
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=path.resolve(__dirname,"..");
const staged=path.join(root,".release-staging","public-site");
const out=path.join(root,"android-wne-beta","app","src","main","assets");
const manifestFile=path.join(staged,"release-manifest.json");
if(!fs.existsSync(manifestFile))
 throw Error("Run node scripts/build_public_release.cjs first (reviewed allowlist)");
if(fs.existsSync(out))
 throw Error("Refusing to overwrite an existing Android packaged-assets directory");
const manifest=JSON.parse(fs.readFileSync(manifestFile,"utf8"));
if(!Array.isArray(manifest.files)||manifest.files.length<20)
 throw Error("Invalid reviewed public-site manifest");
const approved=manifest.files.filter(item=>
 item.path.startsWith("research/")||
 ["assets/community-test-config.js","assets/disclosure-desk-mark.svg"].includes(item.path)
);
const mandatory=["research/index.html","research/research-workspace.html",
 "research/wne.html","research/research-auth-guard.js","research/research-entry.js",
 "research/wne-cloud-bridge.js","research/research-library-cloud-bridge.js",
 "research/import.html","research/restore-copy.html",
 "research/restore-library.html","assets/community-test-config.js"];
for(const file of mandatory)if(!approved.some(x=>x.path===file))
 throw Error("Missing required approved W.NE web asset: "+file);
const recorded=[];
for(const item of approved) {
 const source=path.resolve(staged,item.path);
 const dest=path.resolve(out,item.path);
 if(!source.startsWith(staged+path.sep)||!dest.startsWith(out+path.sep)||
    !/^(research|assets)\/[A-Za-z0-9_./-]+$/.test(item.path))
  throw Error("Unsafe public asset: "+item.path);
 if(!fs.lstatSync(source).isFile()||fs.lstatSync(source).isSymbolicLink())
  throw Error("Unsafe file type: "+item.path);
 const blob=fs.readFileSync(source);
 const sha=crypto.createHash("sha256").update(blob).digest("hex");
 if(sha!==item.sha256 || blob.length!==item.bytes)
  throw Error("File changed since approved site package: "+item.path);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,blob,{flag:"wx"});
 recorded.push({path:item.path,bytes:item.bytes,sha256:sha});
}
// No normal site root index.html is bundled: APK starts in Research Edition.
// Its own WebView intercepts site-exit links and sends them to a real browser.
fs.writeFileSync(path.join(out,"wne-beta-build.json"),
 JSON.stringify({app:"W.NE Research Beta",kind:"dev-branch-bundled-public-research-only",
  revision:process.env.GITHUB_SHA||"local-unknown",
  offlineShell:true,cloudAuthenticationRequiresInternet:true,
  fileCount:recorded.length,files:recorded},null,2)+"\n",{flag:"wx"});
if(fs.existsSync(path.join(out,"index.html")))throw Error("Unexpected full site packed");
console.log("PASS WNE APK allowed research static assets:",recorded.length,
 "bytes",recorded.reduce((n,x)=>n+x.bytes,0),"no website deploy");
