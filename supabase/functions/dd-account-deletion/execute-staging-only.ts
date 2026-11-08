// UNDEPLOYED STAGING-ONLY account deletion executor.
// WARNING: Running this on live accounts is forbidden until separate release approval.
// Requires BOTH DD_ACCOUNT_DELETION_EXECUTION_ENABLED=true and an exact nonproduction
// DD_ACCOUNT_DELETION_STAGING_PROJECT_REF. No public frontend calls this endpoint.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import { DELETION_CONFIRMATION } from "./preflight-core.mjs";
import { executeApprovedDeletion, validateManifest } from "./execution-core.mjs";

const knownOrigins = new Set(["https://uapdisclosuredesk.com", "https://www.uapdisclosuredesk.com"]);
const cors = origin => ({
  ...(origin && knownOrigins.has(origin) ? {"Access-Control-Allow-Origin":origin} : {}),
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type",
  "Cache-Control":"no-store", "Vary":"Origin"
});
const result = (status, body, origin) => new Response(JSON.stringify(body),{
  status,headers:{"Content-Type":"application/json; charset=utf-8",...cors(origin)}
});
const safeResponse = () => ({error:"Account deletion cannot proceed safely. No success was recorded."});
const must = (data,error) => {if(error)throw Error("backend_unverified");return data;};
function tokenClaims(token) {
  try {
    const part=token.split(".")[1]||"";
    const json=atob(part.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(part.length/4)*4,"="));
    const decoded=JSON.parse(json);
    return typeof decoded.session_id==="string" ? decoded.session_id : null;
  }catch{return null;}
}
const digest = async plaintext => Array.from(new Uint8Array(
  await crypto.subtle.digest("SHA-256",new TextEncoder().encode(plaintext))
)).map(x=>x.toString(16).padStart(2,"0")).join("");
const newToken = () => {
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
};
function exactKeys(input,keys) {
  return input && typeof input==="object" && !Array.isArray(input) &&
    Object.keys(input).length===keys.length && keys.every(k=>Object.hasOwn(input,k));
}

Deno.serve(async request => {
  const origin=request.headers.get("Origin");
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(request.method!=="POST")return result(405,{error:"Use POST"},origin);
  if(origin&&!knownOrigins.has(origin))return result(403,{error:"Origin not permitted"},origin);

  const url=Deno.env.get("SUPABASE_URL")||"";
  const publicKey=Deno.env.get("SUPABASE_ANON_KEY")||"";
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const stagingRef=Deno.env.get("DD_ACCOUNT_DELETION_STAGING_PROJECT_REF")||"";
  // Two-factor server configuration gate, permitting a separate staging project ONLY.
  if(Deno.env.get("DD_ACCOUNT_DELETION_EXECUTION_ENABLED")!=="true" ||
     !/^[a-z0-9]{20}$/.test(stagingRef) ||
     url!==("https://"+stagingRef+".supabase.co")) {
    return result(503,{error:"Account deletion is not enabled"},origin);
  }
  if(!publicKey||!serviceKey)return result(503,{error:"Service not configured"},origin);
  if(Number(request.headers.get("Content-Length")||0)>1024) {
    return result(413,{error:"Request too large"},origin);
  }
  let input;
  try{
    const raw=await request.text();
    if(raw.length>1024)throw Error("body too large");
    input=JSON.parse(raw);
  }catch{return result(400,{error:"Invalid request"},origin);}
  if(!exactKeys(input,["action","password"])&&!exactKeys(input,["action","intent","confirmation"])) {
    return result(400,{error:"Invalid action fields"},origin);
  }
  const bearer=(request.headers.get("Authorization")||"").replace(/^Bearer /,"");
  if(!/^[A-Za-z0-9_.-]+$/.test(bearer))return result(401,{error:"Sign in required"},origin);
  const anon=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await anon.auth.getUser(bearer);
  if(authError||!user||user.is_anonymous||!user.email||!user.email_confirmed_at) {
    return result(401,{error:"A verified account is required"},origin);
  }
  const sessionId=tokenClaims(bearer);
  if(!sessionId)return result(401,{error:"A current session is required"},origin);

  const call=async (rpc,args) => {
    const {data,error}=await admin.rpc(rpc,args);
    return must(data,error);
  };
  try{
    const sessionOK=await call("dd_deletion_active_session",{p_target:user.id,p_session:sessionId});
    if(sessionOK!==true) return result(401,{error:"Session expired"},origin);
    const protectedRole=await call("dd_deletion_guard_role",{p_target:user.id});
    if(protectedRole!==false)return result(403,{error:"Protected account requires owner transfer"},origin);
    const enumerateOwnedObjects=async id => validateManifest(
      await call("dd_deletion_storage_manifest",{p_target:id}),id
    );
    if(input.action==="prepare"&&exactKeys(input,["action","password"])){
      if(typeof input.password!=="string"||input.password.length<1||input.password.length>256) {
        return result(400,{error:"Password confirmation required"},origin);
      }
      // Fresh password verification, not a refreshed JWT or unverified client claim.
      // SSO-only accounts are unsupported until an audited provider reauth flow.
      const fresh=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
      const {data:reauth,error:reauthError}=await fresh.auth.signInWithPassword({
        email:user.email,password:input.password
      });
      if(reauthError||!reauth.user||reauth.user.id!==user.id||!reauth.session) {
        return result(401,{error:"Reauthentication failed"},origin);
      }
      try{await fresh.auth.signOut({scope:"local"});}catch{/* temporary session only */}
      const manifest=await enumerateOwnedObjects(user.id);
      const intent=newToken();
      const saved=await call("dd_deletion_prepare",{
        p_target:user.id,p_session:sessionId,p_digest:await digest(intent),p_manifest:manifest
      });
      if(saved!==true)return result(409,{error:"An account deletion operation is already in progress"},origin);
      return result(200,{
        ready:true,intent,expiresInSeconds:600,
        requiresConfirmation:DELETION_CONFIRMATION,
        affectedStorageObjects:manifest.length,
        message:"Review your exports and confirm separately. No data has been deleted yet."
      },origin);
    }
    if(input.action==="confirm"&&exactKeys(input,["action","intent","confirmation"])){
      if(input.confirmation!==DELETION_CONFIRMATION ||
         typeof input.intent!=="string" ||
         !/^[A-Za-z0-9_-]{43}$/.test(input.intent)) {
        return result(400,{error:"Confirmation failed"},origin);
      }
      const lease=crypto.randomUUID();
      const claimed=await call("dd_deletion_claim",{
        p_target:user.id,p_session:sessionId,p_digest:await digest(input.intent),p_lease:lease
      });
      if(claimed!==true)return result(409,{error:"Confirmation expired or already used"},origin);
      const {data:job,error:jobError}=await admin.from("dd_account_deletion_jobs")
        .select("account_id,phase,manifest,lease_token,reauthenticated_at,confirmed_at,intent_digest")
        .eq("account_id",user.id).single();
      if(jobError||job?.lease_token!==lease)throw Error("job_claim_unverified");
      const hydrated={
        ...job,one_time_intent_consumed:job.intent_digest===null,
        reauthentication_verified:!!job.reauthenticated_at,
        confirmation_verified:!!job.confirmed_at
      };
      const adapter={
        assertNotPrivilegedOwner:async id=>{
          if(await call("dd_deletion_guard_role",{p_target:id})!==false)
            throw Error("protected_role");
        },
        redactOwnForumText:async id=>{
          await call("dd_deletion_redact_forum",{p_target:id});
        },
        enumerateOwnedObjects,
        removeOwnedObject:async(id,bucket,name)=>{
          const current=await enumerateOwnedObjects(id);
          if(!current.some(x=>x.bucket_id===bucket&&x.name===name))return;
          const {error}=await admin.storage.from(bucket).remove([name]);
          if(error)throw Error("storage_removal_failed");
          const after=await enumerateOwnedObjects(id);
          if(after.some(x=>x.bucket_id===bucket&&x.name===name))
            throw Error("storage_removal_unverified");
        },
        accountExists:async id=>{
          const {data,error}=await admin.auth.admin.getUserById(id);
          if(!error){
            if(!data?.user)throw Error("auth_state_unverified");
            return true;
          }
          if(error.status===404||error.code==="user_not_found")return false;
          throw Error("auth_state_unverified");
        },
        deleteAuthAccount:async id=>{
          const {error}=await admin.auth.admin.deleteUser(id);
          if(error)throw Error("auth_deletion_failed");
        },
        advancePhase:async(id,token,before,after)=>{
          if(await call("dd_deletion_advance",{
            p_target:id,p_lease:token,p_before:before,p_after:after
          })!==true)throw Error("checkpoint_failed");
        }
      };
      const completed=await executeApprovedDeletion(hydrated,adapter);
      if(!completed.complete)throw Error("unverified_result");
      return result(200,{completed:true,
        message:"Account deletion completed and verified; sign out on this device."},origin);
    }
    return result(400,{error:"Unsupported action"},origin);
  }catch{
    // Never report success or expose backend object paths/user data on partial failure.
    // Operator-only recovery is required after a claimed intent; no unsafe client retry.
    return result(503,safeResponse(),origin);
  }
});
