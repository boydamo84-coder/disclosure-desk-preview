'use strict';
const {buildFixture:base}=require('./m68_comment_thread_fixture.cjs');
function ownerApiFixture(){
 const rows=window.__m68.rows;
 rows[0].is_mine=true;
 rows[0].created_at=new Date().toISOString();
 rows[1].is_mine=true;
 rows[1].created_at=new Date(Date.now()-3600000).toISOString();
 const orig=window.supabase.createClient;
 window.__m73={rows,mutations:[]};
 window.supabase.createClient=(...args)=>{
  const c=orig(...args);
  return {...c,async rpc(name,args={}){
   if(name==='dd_edit_my_comment'||name==='dd_delete_my_comment'){
    window.__m73.mutations.push({name,args});
    const i=rows.findIndex(x=>x.id===args.p_id&&x.is_mine);
    if(i<0)return {data:false,error:null};
    if(name==='dd_edit_my_comment'){
     if(Date.now()-Date.parse(rows[i].created_at)>30*60000)return {data:false,error:null};
     rows[i].body=args.p_body;
    }else{
     const gone=rows.splice(i,1)[0];
     for(const child of rows)if(child.parent_id===gone.id)child.parent_id=null;
    }
    return {data:true,error:null};
   }
   return c.rpc(name,args);
  }};
 };
}
function buildFixture(){
 return base().replace('</head>','<script>('+ownerApiFixture.toString()+')();</script></head>');
}
module.exports={buildFixture};
