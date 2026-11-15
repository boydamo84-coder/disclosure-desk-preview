'use strict';
/* Build a reviewed, separate hosted R3 client from the same tested offline
 * source. Never copy experiments, README screenshots, SQL, private account
 * contents, service keys, or scripts into the publicly accessible directory.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function buildHostedR3(root,out,manifestFiles){
 const previewPath=path.join(root,'.r3-lab-preview');
 if(fs.existsSync(previewPath))throw Error('R3 working directory already exists. Refusing ambiguous public bundle.');
 require('./build_r3_lab_preview.cjs');
 const siteDir=path.join(out,'research','r3-lab');
 fs.mkdirSync(siteDir,{recursive:true});
 const assets=['hypothesis-engine.js','research-gap-finder.js','research-gap-bridge.js',
  'curated-public-cases.js','hypothesis-vault.js','hypothesis-ui.js',
  'hypothesis-ui.css','editorial-dock.css','BUILD_INFO.txt'];
 const supplementary=[['experiments/r3/hypothesis-cloud.js','hypothesis-cloud.js'],
  ['experiments/r3/hypothesis-hosted.css','hypothesis-hosted.css']];
 function add(outputName,data){
  const dest=path.join(siteDir,outputName);
  if(!dest.startsWith(siteDir+path.sep))throw Error('Unsafe R3 public file');
  fs.writeFileSync(dest,data,{flag:'wx'});
  const bytes=fs.readFileSync(dest);
  manifestFiles.push({path:'research/r3-lab/'+outputName,bytes:bytes.length,
   sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 for(const file of assets)add(file,fs.readFileSync(path.join(previewPath,file)));
 for(const [file,to] of supplementary)add(to,fs.readFileSync(path.join(root,file)));
 const info=fs.readFileSync(path.join(previewPath,'BUILD_INFO.txt'),'utf8');
 const id=info.match(/^Build: ([a-f0-9]{12})$/m)?.[1];
 if(!id)throw Error('Missing R3 source identity');
 let html=fs.readFileSync(path.join(previewPath,'index.html'),'utf8');
 const replaceOnce=(oldText,newText)=>{
  if(html.split(oldText).length!==2)throw Error('Unexpected R3 HTML host bootstrap pattern');
  html=html.replace(oldText,newText);
 };
 replaceOnce('<html lang="en">','<html lang="en" data-r3-hosted="true" data-r3-boot="checking">');
 replaceOnce('Hypothesis Lab · Disclosure Desk · R3 Offline Prototype',
  'Hypothesis Lab · Disclosure Desk · Encrypted Account Beta');
 replaceOnce("default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
  "default-src 'none'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self'; img-src 'self' blob:; connect-src https://omqxizswzcwgzqaczlhe.supabase.co wss://omqxizswzcwgzqaczlhe.supabase.co; object-src 'none'; base-uri 'none'; form-action 'none'");
 replaceOnce('<link rel="stylesheet" href="./editorial-dock.css?v='+id+'">',
  '<link rel="stylesheet" href="./editorial-dock.css?v='+id+'">\n <link rel="stylesheet" href="./hypothesis-hosted.css?v='+id+'">');
 replaceOnce('<script defer src="./hypothesis-ui.js?v='+id+'"></script>',
  '<script defer src="../../assets/community-test-config.js"></script>\n'+
  ' <script defer crossorigin="anonymous" integrity="sha384-uteMfOloLDGt042uDz+xHGF3ym63/WQ6rFq7murQRG8Ih7QrXGEGNtWd8688sb4O" src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js"></script>\n'+
  ' <script defer src="./hypothesis-cloud.js?v='+id+'"></script>\n'+
  ' <script defer src="./hypothesis-ui.js?v='+id+'"></script>');
 const securityNote=/<p class="security-note" id="privacyWarning">[\s\S]*?<\/p>/;
 if(!securityNote.test(html))throw Error('R3 privacy notice missing');
 html=html.replace(securityNote,
  '<p class="security-note" id="privacyWarning"><strong>Research beta — avoid sensitive or identifying information.</strong> '+
  'Your notebook is kept in this browser until you deliberately enable encrypted local saving. '+
  'A signed-in Disclosure Desk profile can then manually back up ciphertext to its own account. '+
  'Cloud backup is optional, not automatic syncing. The server cannot recover your passphrase. '+
  'This feature has not completed independent cryptographic/security review; keep a separate encrypted download.</p>');
 const cloudPanel='<p id="r3BootBanner" role="status">Checking your Disclosure Desk account and encrypted local notebook…</p>'+
 '<section class="panel vault-access" id="r3CloudPanel" aria-labelledby="r3CloudHeading" hidden>'+
 '<span class="eyebrow">OPTIONAL · CONNECTED TO YOUR PROFILE</span>'+
 '<h2 id="r3CloudHeading">Private encrypted cloud backup</h2>'+
 '<p class="r3-cloud-account">Profile: <strong id="r3CloudProfile">Checking sign-in…</strong></p>'+
 '<p id="r3CloudStatus" role="status" aria-live="polite">Checking account ownership…</p>'+
 '<p class="r3-cloud-reminder">Only encrypted notebook backups are sent to your Disclosure Desk account. '+
 'Your passphrase is never uploaded. You must opt in to each backup; saved revisions do not sync automatically.</p>'+
 '<div class="r3-cloud-actions">'+
 '<button type="button" id="r3CloudUpload" class="btn-primary" disabled>Save encrypted backup to account</button>'+
 '<button type="button" id="r3CloudDownload" class="btn-secondary" disabled>Download account backup</button>'+
 '</div>'+
 '<label class="r3-cloud-passphrase" for="r3CloudPassphrase">Original passphrase to restore on this device '+
 '<input id="r3CloudPassphrase" type="password" minlength="12" maxlength="1024" autocomplete="off" placeholder="Enter your notebook passphrase"></label>'+
 '<div class="r3-cloud-actions"><button type="button" class="btn-secondary" id="r3CloudRestore" disabled>Restore account backup on this device</button>'+
 '<button type="button" class="btn-danger" id="r3CloudDelete" disabled>Delete account backup</button></div>'+
 '<p class="muted small">Not signed in? <a href="/?dd_tab=boards">Go to Boards to sign in</a>, '+
 'then return to Hypothesis Lab. Guest research remains local to this browser.</p></section>';
 replaceOnce('<section class="panel setup-panel" id="setupPanel"',cloudPanel+
  '<section class="panel setup-panel" id="setupPanel"');
 add('index.html',html);
 const forbidden=/\b(?:service_role|sb_secret_|private[_-]key|auth\.users)\b/i;
 for(const f of manifestFiles.filter(x=>x.path.startsWith('research/r3-lab/'))){
  if(/\.(?:sql|cjs|md|py|zip)$/i.test(f.path))throw Error('R3 source or SQL leaked into public package');
  if(f.path.endsWith('.js')&&forbidden.test(fs.readFileSync(path.join(out,f.path),'utf8')))
   throw Error('R3 public script contains a protected server-side token or reference');
 }
 console.log('PASS R3 hosted: '+assets.length+' tested assets, optional owner-scoped encrypted cloud adapter and no private research data');
};
