// Disclosure Desk authenticated witness submission. Beta: deployed separately from Netlify.
// Geocode ONLY a typed town/city name using Open-Meteo (GeoNames-derived), never device GPS.
// Database trigger enforces: registered account; 3 submissions per rolling 24h;
// no precise addresses; coordinate rounding to 0.1 degree; immediate publication.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const projectUrl=Deno.env.get("SUPABASE_URL")??"";
const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
const allowOrigin=(origin:string|null)=>{
 if(!origin)return "";
 if(origin==="https://uapdisclosuredesk.com"
  ||origin==="https://www.uapdisclosuredesk.com"
  ||origin==="https://uap-disclosure-desk.netlify.app"
  ||/^https:\/\/deploy-preview-[0-9]+--uap-disclosure-desk\.netlify\.app$/.test(origin)
  ||/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin))return origin;
 return "";
};
const response=(status:number,payload:unknown,origin:string)=>new Response(JSON.stringify(payload),{
 status,headers:{"content-type":"application/json; charset=utf-8",
 ...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{}),
 "Cache-Control":"no-store"}
});
const normal=(s:unknown)=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const isPlace=(s:unknown)=>typeof s==="string"&&s.trim().length>=2&&s.trim().length<=80
 &&/^[\p{L}\s,.'’()-]+$/u.test(s)&&!/\b(?:street|road|lane|postcode|apartment|flat|house|building|avenue)\b/i.test(s);
const isStory=(s:unknown)=>typeof s==="string"&&s.trim().length>=25&&s.trim().length<=3500
 &&!/[A-Za-z0-9_.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(s);
const validDate=(date:unknown)=>{
 if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(date+"T12:00:00Z");
 return Number.isFinite(d.getTime())&&d.toISOString().startsWith(date)
  &&date<=new Date().toISOString().slice(0,10);
};
const trustedPosition=(x:unknown):x is {name:string;country:string;admin1?:string;latitude:number;longitude:number;feature_code?:string}=>
 !!x&&typeof x==="object"&&typeof (x as Record<string,unknown>).name==="string"
 &&typeof (x as Record<string,unknown>).country==="string"
 &&Number.isFinite((x as Record<string,unknown>).latitude)
 &&Number.isFinite((x as Record<string,unknown>).longitude)
 &&Math.abs(Number((x as Record<string,unknown>).latitude))<=90
 &&Math.abs(Number((x as Record<string,unknown>).longitude))<=180;

Deno.serve(async(req:Request)=>{
 const origin=allowOrigin(req.headers.get("origin"));
 if(req.method==="OPTIONS")return new Response(null,{
  status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST, OPTIONS",
   "Access-Control-Allow-Headers":"authorization, apikey, content-type","Vary":"Origin"}
 });
 if(req.method!=="POST")return response(405,{error:"Use POST"},origin);
 if(req.headers.get("content-length")&&Number(req.headers.get("content-length"))>9000)
  return response(413,{error:"Submission too large"},origin);
 if(!projectUrl||!anonKey)return response(503,{error:"Submission service is not configured"},origin);
 const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 if(!bearer)return response(401,{error:"Sign in to submit a public report"},origin);
 const db=createClient(projectUrl,anonKey,{
  auth:{persistSession:false,autoRefreshToken:false},
  global:{headers:{Authorization:"Bearer "+bearer}}
 });
 const {data:{user},error:authError}=await db.auth.getUser(bearer);
 if(authError||!user||user.is_anonymous)return response(401,{error:"A registered account is required"},origin);
 let input:Record<string,unknown>;
 try{
  const body=await req.text();
  if(body.length>9000)throw Error("Size exceeded");
  input=JSON.parse(body);
  if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Bad request");
 }catch{return response(400,{error:"Invalid submission"},origin)}
 const city=String(input.city||"").trim(),country=String(input.country||"").trim();
 const story=String(input.story||"").trim(),category=String(input.category||"").trim();
 const allowed=['UAP / lights','Unusual drones','Unexplained encounter','Animal-related mystery','Other unexplained experience'];
 if(!isPlace(city)||!isPlace(country)||!isStory(story)||!allowed.includes(category)
  ||!validDate(input.event_date)||input.publicConsent!==true)
  return response(422,{error:"Check the town/country, date, report length and public-sharing consent"},origin);
 const approxTime=input.approximate_time;
 if(approxTime!=null&&approxTime!==""&&(typeof approxTime!=="string"||!/^([01]\d|2[0-3]):[0-5]\d$/.test(approxTime)))
  return response(422,{error:"Approximate time is invalid"},origin);
 // Avoid paying geocoding costs when the account is already at its quota.
 const since=new Date(Date.now()-24*60*60*1000).toISOString();
 const {count,error:limitError}=await db.from("dd_witness_reports")
  .select("id",{count:"exact",head:true}).eq("author_id",user.id).gte("created_at",since);
 if(limitError)return response(503,{error:"Publishing is not yet available"},origin);
 if((count||0)>=3)return response(429,{error:"Maximum 3 public witness reports per rolling 24 hours"},origin);
 // A public CITY search: never request GPS, coordinates, street address or exact position.
 const api=new URL("https://geocoding-api.open-meteo.com/v1/search");
 api.searchParams.set("name",city+", "+country);
 api.searchParams.set("count","10");api.searchParams.set("language","en");api.searchParams.set("format","json");
 let matches:unknown[];
 try{
  const ctrl=new AbortController();
  const timeout=setTimeout(()=>ctrl.abort(),7000);
  let upstream:Response;
  try{upstream=await fetch(api,{signal:ctrl.signal,headers:{"accept":"application/json"}})}
  finally{clearTimeout(timeout)}
  if(!upstream.ok)throw Error("Geocoding unavailable");
  const json=await upstream.json();
  matches=Array.isArray(json?.results)?json.results.slice(0,10):[];
 }catch{return response(503,{error:"Town/city lookup is unavailable. Your private draft has not been published."},origin)}
 const place=matches.filter(trustedPosition).find(x=>{
  const placeName=normal(x.name),wanted=normal(city);
  const area=normal(x.country)+" "+normal(x.admin1);
  const countryName=normal(country);
  const matchCity=placeName===wanted;
  const matchArea=area.includes(countryName)
   ||(countryName==="northern ireland"&&normal(x.admin1).includes("northern ireland"))
   ||(countryName==="uk"&&normal(x.country).includes("united kingdom"));
  const settlement=!x.feature_code||x.feature_code.startsWith("PPL");
  return matchCity&&matchArea&&settlement;
 });
 if(!place)return response(422,{error:"Town/city not verified. Use the recognised town and its country or region. Nothing has been published."},origin);
 const record={
  author_id:user.id,category,event_date:input.event_date,
  approximate_time:approxTime||null,
  city:place.name,country:place.country,
  story,anonymous:input.anonymous!==false,
  lat:Math.round(place.latitude*10)/10,lon:Math.round(place.longitude*10)/10,
  status:"published"
 };
 const {data,error}=await db.from("dd_witness_reports").insert(record).select("id,city,country,created_at,status").single();
 if(error){
  const message=String(error.message||"");
  if(/limit reached|24.hour|3 in a rolling/i.test(message))return response(429,{error:"Daily limit reached. Maximum 3 reports per rolling 24 hours."},origin);
  if(/identifying|location|privacy|event date|registered/i.test(message))return response(422,{error:message.slice(0,180)},origin);
  return response(503,{error:"Report could not be published. Please keep your private draft."},origin);
 }
 return response(201,{ok:true,id:data.id,city:data.city,country:data.country,status:data.status,created_at:data.created_at},origin);
});
