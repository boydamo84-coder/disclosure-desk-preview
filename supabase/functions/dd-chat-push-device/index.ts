// STAGED ONLY. Deploy with verify_jwt=true after private token table migration.
import { createClient } from "npm:@supabase/supabase-js@2.78.0";

const allowedOrigin="https://uapdisclosuredesk.com";
function reply(status:number,body:Record<string,unknown>,origin:string|null){
 const headers:Record<string,string>={
  "Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
 };
 if(origin===allowedOrigin)headers["Access-Control-Allow-Origin"]=origin;
 return new Response(JSON.stringify(body),{status,headers});
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(origin&&origin!==allowedOrigin)return reply(403,{error:"Origin not allowed"},origin);
 if(req.method==="OPTIONS")return reply(204,{},origin);
 if(req.method!=="POST")return reply(405,{error:"POST only"},origin);
 const auth=req.headers.get("authorization")||"";
 const accessToken=auth.replace(/^Bearer\s+/i,"");
 if(accessToken===auth||!accessToken)return reply(401,{error:"Login required"},origin);
 const url=Deno.env.get("SUPABASE_URL")||"";
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!serviceKey)return reply(503,{error:"Service unavailable"},origin);
 const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error:authError}=await db.auth.getUser(accessToken);
 if(authError||!data?.user||data.user.is_anonymous)return reply(401,{error:"Registered account required"},origin);
 let body:Record<string,unknown>;
 try{body=await req.json()}catch{return reply(400,{error:"JSON required"},origin)}
 const operation=body.operation,token=String(body.token||"");
 if(token.length<40||token.length>4096)return reply(400,{error:"Invalid FCM registration"},origin);
 if(operation==="register"){
  // Unique token can belong to one account at a time; a shared phone switch
  // reassigns it instead of leaking the previous member's notifications.
  const {error}=await db.from("dd_android_push_devices")
    .upsert({fcm_token:token,user_id:data.user.id,updated_at:new Date().toISOString()},{onConflict:"fcm_token"});
  return error?reply(503,{error:"Could not register this device"},origin):reply(200,{ok:true},origin);
 }
 if(operation==="unregister"){
  const {error}=await db.from("dd_android_push_devices")
    .delete().eq("fcm_token",token).eq("user_id",data.user.id);
  return error?reply(503,{error:"Could not unregister device"},origin):reply(200,{ok:true},origin);
 }
 return reply(400,{error:"Unknown operation"},origin);
});
