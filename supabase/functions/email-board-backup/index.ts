// Disclosure Desk: authenticated, user-addressed board backup email.
// Deploy via Supabase Edge Functions; configure RESEND_API_KEY and BACKUP_FROM_EMAIL secrets.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const auth=req.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer "))return json({error:"Sign in required"},401);
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const apiKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("BACKUP_FROM_EMAIL");
 if(!apiKey||!from)return json({error:"Email backup service is not configured"},503);
 const client=createClient(url,anon,{global:{headers:{Authorization:auth}}});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email||!user.email_confirmed_at)return json({error:"Verified account required"},403);
 let payload;
 try{payload=await req.json()}catch{return json({error:"Invalid backup"},400)}
 if(!Array.isArray(payload?.boards)||payload.boards.length>40)return json({error:"Invalid board collection"},400);
 const boards=payload.boards;
 if(boards.some((b:unknown)=>typeof b!=="object"||b===null||typeof (b as {name?:unknown}).name!=="string"||!Array.isArray((b as {links?:unknown}).links)))return json({error:"Invalid board data"},400);
 const backup={format:"disclosure-desk-email-backup",version:1,createdAt:new Date().toISOString(),boards};
 const content=JSON.stringify(backup,null,2);
 if(content.length>4_000_000)return json({error:"Backup too large for email; use a local export"},413);
 // A persistent database limit stops clients bypassing UI cooldowns.
 const admin=createClient(url,service);
 const {data:rate,error:rateError}=await admin.rpc("dd_reserve_email_backup",{account_id:user.id});
 if(rateError)return json({error:"Backup email rate limit unavailable"},503);
 if(!rate)return json({error:"Please wait at least one hour between email backups"},429);
 const bytes=new TextEncoder().encode(content);
 let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const attachment=btoa(binary);
 const response=await fetch("https://api.resend.com/emails",{
  method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
  body:JSON.stringify({
   from,to:[user.email],subject:"Your Disclosure Desk Investigation Boards backup",
   html:"<div style='font:16px Arial,sans-serif;color:#13263a'><h2>Disclosure Desk</h2><p>Your private Investigation Boards backup is attached as a JSON file.</p><p>It may include private research notes, timelines, videos and evidence connections. Keep the attachment secure, and do not forward it unless you intend to share that information.</p><p>This backup was requested while signed in to your account. If this was unexpected, review your account security.</p></div>",
   attachments:[{filename:"disclosure-desk-boards-"+new Date().toISOString().slice(0,10)+".json",content:attachment}]
  })
 });
 if(!response.ok)return json({error:"Email provider could not accept this backup. Please retry later."},502);
 return json({ok:true,boardCount:boards.length});
});
