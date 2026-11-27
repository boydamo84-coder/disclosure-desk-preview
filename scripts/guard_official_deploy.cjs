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

if (netlify && [branch, process.env.HEAD].includes('android/m101-issue22-launch-polish')) {
  throw new Error('M101 Android candidate is restricted to isolated testing.');
}

if (netlify && [branch, process.env.HEAD].includes('android/m102-issue22-case-links')) {
  throw new Error('M102 Android candidate is restricted to isolated testing.');
}
