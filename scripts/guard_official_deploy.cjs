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
