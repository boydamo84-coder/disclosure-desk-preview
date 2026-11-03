/* Hosted adapter for the ORIGINAL Import Research Document UI.
 * Imports only a new document; never overwrites an existing manuscript.
 */
(()=>{'use strict';
const original=window.fetch.bind(window),reply=(v,n=200)=>new Response(JSON.stringify(v),{status:n,headers:{'Content-Type':'application/json'}});
const client=window.supabase?.createClient('https://omqxizswzcwgzqaczlhe.supabase.co','sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
let scan=null;
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href),path=url.pathname;
 if(!path.startsWith('/api/import/')&&path!=='/api/manuscript')return original(input,options);
 try{
  if(!client)throw Error('Supabase unavailable');
  const {data:user,error:authError}=await client.auth.getUser();
  if(authError||!user?.user)throw Error('Sign in to Research Edition before importing');
  if(path==='/api/manuscript')return reply({revision:0,remote_seq:0,manuscript:null});
  if(path==='/api/import/preview'){
   if(options.method!=='POST')return reply({error:'POST required'},405);
   if(!window.DDResearchDocx?.importFile)throw Error('Word import module unavailable');
   const raw=options.body;
   if(!(raw instanceof ArrayBuffer)||raw.byteLength>14*1024*1024)throw Error('Invalid Word document');
   const file=new File([raw],'research-import.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
   const parsed=await window.DDResearchDocx.importFile(file);
   const chapters=parsed.document.chapters;
   if(!chapters?.length||chapters.length>500)throw Error('No supported Word sections found');
   const token='browser-'+crypto.randomUUID();
   const candidates=chapters.map((c,index)=>({index,title:c.title||'Section '+(index+1),text:c.title||'',source:'Word heading'}));
   scan={token,chapters};
   return reply({token,bookTitle:parsed.document.bookTitle,candidates,warnings:parsed.warnings||[],paragraphCount:chapters.length,characterCount:chapters.reduce((n,c)=>n+c.html.length,0),frontMatterParagraphs:0});
  }
  if(path==='/api/import/search'){
   if(!scan||url.searchParams.get('token')!==scan.token)return reply({error:'Preview expired. Scan the file again.'},409);
   const q=(url.searchParams.get('q')||'').toLowerCase();
   return reply({items:scan.chapters.map((c,index)=>({index,text:c.title})).filter(x=>x.text.toLowerCase().includes(q)).slice(0,60)});
  }
  if(path==='/api/import/commit-copy'){
   const payload=JSON.parse(options.body||'{}');
   if(!scan||payload.token!==scan.token||payload.confirmation!=='IMPORT AS NEW COPY')return reply({error:'Invalid or expired import confirmation'},409);
   const starts=payload.starts||[];
   if(!Array.isArray(starts)||starts.some(x=>!Number.isInteger(x)||x<0||x>=scan.chapters.length))return reply({error:'Invalid section selection'},400);
   const indices=starts.length?starts:[...scan.chapters.keys()];
   const chapters=indices.map((i,n)=>({id:'import-'+crypto.randomUUID(),title:String(payload.titles?.[i]||scan.chapters[i].title||'Section '+(n+1)).slice(0,150),html:scan.chapters[i].html}));
   const title=String(payload.bookTitle||'').trim();
   if(!title||title.length>180)throw Error('A title under 180 characters is required');
   const document={version:2,bookTitle:title,chapters,active:chapters[0].id,font:'Georgia',size:12};
   const {data,error}=await client.from('research_documents').insert({user_id:user.user.id,title:title.slice(0,150),content:document}).select('id').single();
   if(error)throw error;
   scan=null;
   return reply({ok:true,chapters:chapters.length,id:data.id});
  }
  return reply({error:'Import action not implemented'},501);
 }catch(e){return reply({error:String(e.message||e)},400)}
};
})();