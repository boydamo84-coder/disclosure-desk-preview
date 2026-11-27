'use strict';
// Test the actual allowlisted bundle, not repository sources or private files.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shareHandler=require('./public_share_redirect_qa.cjs').load();
// Only the preview handler fetches from Node; browser request fixtures are separate.
global.fetch=async()=>new Response('Remote lookups disabled in loopback QA',{status:503});
const root=path.resolve('.release-staging/public-site');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
const allowed=new Set(manifest.files.map(entry=>entry.path));
const mime={txt:'text/plain; charset=utf-8',xml:'application/xml',ico:'image/x-icon',html:'text/html; charset=utf-8',css:'text/css',js:'application/javascript',json:'application/json',svg:'image/svg+xml',jpg:'image/jpeg',png:'image/png',pdf:'application/pdf',mp4:'video/mp4',webmanifest:'application/manifest+json'};
http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  if(/^\/(news|archive|video|case|discussion|witness|media|talk)\//.test(pathname)){
   const {default:render}=await shareHandler;
   const response=await render(new Request('http://127.0.0.1:4173'+req.url,{method:req.method}));
   res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text());
  }
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
