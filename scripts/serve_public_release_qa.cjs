'use strict';
// Test the actual allowlisted bundle, not repository sources or private files.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {shareRedirect}=require('./public_share_redirect_qa.cjs');
const root=path.resolve('.release-staging/public-site');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
const allowed=new Set(manifest.files.map(entry=>entry.path));
const mime={txt:'text/plain; charset=utf-8',xml:'application/xml',ico:'image/x-icon',html:'text/html; charset=utf-8',css:'text/css',js:'application/javascript',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',png:'image/png',pdf:'application/pdf',mp4:'video/mp4',webmanifest:'application/manifest+json'};
http.createServer((req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  const redirect=shareRedirect(pathname);if(redirect)return res.writeHead(redirect.status,{Location:redirect.location}).end();
  let file=decodeURIComponent(pathname).replace(/^\/+/, '');
  if(file==='favicon.ico'&&allowed.has('assets/disclosure-desk-mark.svg'))return res.writeHead(302,{Location:'/assets/disclosure-desk-mark.svg'}).end();
  if(!file||file.endsWith('/'))file+='index.html';
  else if(!allowed.has(file)&&allowed.has(file+'.html'))file+='.html';
  else if(!allowed.has(file)&&allowed.has(file+'/index.html'))file+='/index.html';
  if(!allowed.has(file))return res.writeHead(404).end();
  res.writeHead(200,{'Content-Type':mime[path.extname(file).slice(1)]||'application/octet-stream'});
  fs.createReadStream(path.join(root,file)).pipe(res);
 }catch{res.writeHead(400).end();}
}).listen(4173,'127.0.0.1');
