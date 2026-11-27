// Test-only interpreter of the exact fixed Netlify record routes.
const fs=require('node:fs');
const config=fs.readFileSync('netlify.toml','utf8');
const routes=[...config.matchAll(/\[\[redirects\]\]\s+from = "([^"]+)"\s+to = "([^"]+)"\s+status = (\d+)/g)]
 .filter(m=>m[1].includes(':id')).map(([,from,to,status])=>({from,to,status:Number(status)}));
function shareRedirect(pathname){
 for(const {from,to,status} of routes){
  const names=[];const pattern=from.replace(/:([a-z]+)/g,(_,name)=>{names.push(name);return '([A-Za-z0-9_-]{1,150})'});
  const m=new RegExp('^'+pattern+'/?$').exec(pathname);if(!m)continue;
  const values=Object.fromEntries(names.map((x,i)=>[x,m[i+1]]));
  return {status,location:to.replace(/:([a-z]+)/g,(_,name)=>encodeURIComponent(values[name]))};
 }
 return null;
}
module.exports={routes,shareRedirect};
