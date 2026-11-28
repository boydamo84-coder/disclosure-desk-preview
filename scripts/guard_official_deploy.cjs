'use strict';
// Netlify publishes only from the reviewed production branch.
// This check is a second defence: Netlify's UI branch selection must also stay on production.
// Does not block safe local or GitHub Actions preview builds.
const netlify=String(process.env.NETLIFY||'').toLowerCase()==='true';
const context=process.env.CONTEXT||'';
const branch=process.env.BRANCH||'';
if(netlify&&context==='production'&&branch!=='production'){
  throw new Error('Blocked public Netlify build: expected BRANCH=production, got '+JSON.stringify(branch||'(missing)'));
}

if(netlify&&branch==='feature/research-collaboration-20261126'){
  throw new Error('Research & Collaboration candidate builds run in GitHub Actions only.');
}

if(netlify&&branch==='feature/experience-discovery-20261127'){
 throw new Error('Experience & Discovery candidate tests run in GitHub Actions only.');
}

if(netlify&&branch==='feature/become-investigator-20261127'){
 throw new Error('Become the Investigator candidate tests run in GitHub Actions only.');
}

if(netlify&&branch==='feature/news-pagination-20261127'){
 throw new Error('News pagination candidate tests run in GitHub Actions only.');
}

if(netlify&&branch==='fix/news-pager-full-width-20261127'){
 throw new Error('News pager layout candidate tests run in GitHub Actions only.');
}

if(netlify&&[branch,process.env.HEAD].includes('feature/issue-22-final-launch-polish')){
 throw new Error('Issue #22 candidate is restricted to isolated testing.');
}

if (netlify && [branch, process.env.HEAD].includes('fix/issue22-mobile-nav-polish-20261127')) {
  throw new Error('Mobile navigation polish candidate is restricted to isolated testing.');
}

if (netlify && [branch, process.env.HEAD].includes('feature/brand-public-sharing-20261127')) {
  throw new Error('Public sharing candidate is restricted to isolated testing.');
}

if (netlify && [branch, process.env.HEAD].includes('feature/share-identifiable-previews-20261127')) {
  throw new Error('Share-title candidate is restricted to isolated testing.');
}

if (netlify && [branch, process.env.HEAD].includes('feature/seo-keyword-launch-20261128')) {
  throw new Error('SEO keyword launch candidate is restricted to isolated testing.');
}

if (netlify && [branch, process.env.HEAD].includes('android/m106-play-ready')) {
  throw new Error('M106 Android Play candidate must never deploy a website.');
}

if (netlify && [branch, process.env.HEAD].includes('android/m107-desk-help')) {
  throw new Error('M107 Android UI candidate must never deploy a website.');
}

if (netlify && [branch, process.env.HEAD].includes('android/m108-wne-polish')) {
  throw new Error('M108 Android W.NE candidate must never deploy a website.');
}

if (netlify && [branch, process.env.HEAD].includes('android/m109-persistent-directory')) {
  throw new Error('M109 Android navigation candidate must never deploy a website.');
}

if (netlify && [branch, process.env.HEAD].includes('android/m112-launch-frame')) {
  throw new Error('M112 Android startup candidate must never deploy a website.');
}
if (netlify && [branch, process.env.HEAD].includes('android/m111-wne-layout')) {
  throw new Error('M111 Android editor candidate must never deploy a website.');
}
if (netlify && [branch, process.env.HEAD].includes('android/m110-shared-navigation')) {
  throw new Error('M110 Android navigation candidate must never deploy a website.');
}
