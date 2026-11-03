/* Research Edition hosted UI entry guard.
 * UX access gate only. Supabase RLS remains the security boundary.
 * Guest preview has no import of this script or any cloud/editor APIs.
 */
(()=>{
 'use strict';
 const style=document.createElement('style');
 style.id='dd-auth-gate-style';
 style.textContent='html[data-research-access="checking"] body{visibility:hidden!important}';
 document.head.appendChild(style);
 document.documentElement.dataset.researchAccess='checking';
 function back(){location.replace('./index.html')}
 if(!window.supabase?.createClient){back();return}
 const db=window.supabase.createClient('https://omqxizswzcwgzqaczlhe.supabase.co','sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 db.auth.getUser().then(({data,error})=>{
  if(error||!data?.user){back();return}
  document.documentElement.dataset.researchAccess='authorized';
 }).catch(back);
 db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')back()});
})();