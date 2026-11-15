'use strict';
// Simulated Supabase acknowledgement loss AFTER an encrypted cloud mutation
// reached the server. No network, real account, keys or research are used.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('experiments/r3/hypothesis-cloud.js','utf8');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const make=gen=>({format:'dd-r3-private-aes256gcm-v1',cipher:'AES-256-GCM',
 generation:gen,ciphertext:'MOCK_ENCRYPTED_CIPHERTEXT'});
function fixture(){
 let entry=null,fault=null;
 const client={
  auth:{
   getUser:async()=>({data:{user:{id,is_anonymous:false}},error:null}),
   onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
  },
  from:table=>{
   assert.equal(table,'dd_r3_private_notebooks');
   return {
    kind:'read',filters:{},payload:null,
    select(){return this},
    eq(k,v){this.filters[k]=v;return this},
    insert(v){this.kind='insert';this.payload=v;return this},
    update(v){this.kind='update';this.payload=v;return this},
    delete(){this.kind='delete';return this},
    async maybeSingle(){
     if(this.filters.owner_user_id&&this.filters.owner_user_id!==id)
      throw Error('Unexpected cross-owner test query');
     if(this.kind==='read'){
      if(fault==='read')return {data:null,error:{message:'network offline'}};
      return {data:entry?{generation:entry.generation,
       encrypted_envelope:entry.encrypted_envelope,updated_at:'2026-11-15T00:00:00Z'}:null,error:null};
     }
     if(this.kind==='insert'){
      if(entry)return {data:null,error:{message:'duplicate key',code:'23505'}};
      entry={...this.payload};
      if(fault==='insert')return {data:null,error:{message:'response lost after commit'}};
      if(fault==='insert-no-data')return {data:null,error:null};
      return {data:{generation:entry.generation},error:null};
     }
     if(this.kind==='update'){
      if(!entry||entry.generation!==this.filters.generation)return {data:null,error:null};
      entry={...entry,...this.payload};
      if(fault==='update')return {data:null,error:{message:'response lost after commit'}};
      return {data:{generation:entry.generation},error:null};
     }
     if(this.kind==='delete'){
      if(!entry||entry.generation!==this.filters.generation)return {data:null,error:null};
      const prior=entry;entry=null;
      if(fault==='delete')return {data:null,error:{message:'response lost after commit'}};
      return {data:{generation:prior.generation},error:null};
     }
     throw Error('Unexpected test operation');
    }
   };
  }
 };
 const w={DD_COMMUNITY_TEST_CONFIG:{url:'https://fake.supabase.invalid',
   publishableKey:'sb_publishable_FICTIONAL',environment:'test'},
  supabase:{createClient:()=>client},dispatchEvent:()=>{}};
 vm.runInNewContext(source,{window:w,location:{hostname:'localhost',reload:()=>{}},
  Event:class{constructor(t){this.type=t}}},{filename:'hypothesis-cloud.js'});
 return {sdk:w.DDR3Cloud,setFault:v=>{fault=v},stored:()=>entry};
}
(async()=>{
 const f=fixture(),g1='a'.repeat(32),g2='b'.repeat(32),g3='c'.repeat(32);
 await f.sdk.ready();
 // Insert reached server but returned an error / no acknowledgement.
 f.setFault('insert');
 await assert.rejects(f.sdk.saveEncrypted(JSON.stringify(make(g1)),null),/could not be confirmed/i);
 f.setFault(null);
 assert.equal((await f.sdk.readEncrypted()).generation,g1,'Committed encrypted insert must be discoverable');
 await assert.rejects(f.sdk.saveEncrypted(JSON.stringify(make(g2)),null),/already exists/i);
 assert.equal(f.stored().generation,g1,'A conflicting insert must not silently overwrite');
 // The update committed before its acknowledgement was lost.
 f.setFault('update');
 await assert.rejects(f.sdk.saveEncrypted(JSON.stringify(make(g2)),g1),/could not be confirmed/i);
 f.setFault(null);
 assert.equal((await f.sdk.readEncrypted()).generation,g2,'Committed encrypted update must be discoverable');
 // Generation conflict has a trustworthy explicit no-overwrite outcome.
 await assert.rejects(f.sdk.saveEncrypted(JSON.stringify(make(g3)),g1),/changed in another session/i);
 assert.equal(f.stored().generation,g2);
 // Server applied DELETE, but browser never got acknowledgement.
 f.setFault('delete');
 await assert.rejects(f.sdk.deleteEncrypted(g2),/could not be confirmed/i);
 f.setFault(null);
 assert.equal(await f.sdk.readEncrypted(),null,'Committed deletion must be observable after reconnect');
 // A successful insert with missing response data is also ambiguous.
 f.setFault('insert-no-data');
 await assert.rejects(f.sdk.saveEncrypted(JSON.stringify(make(g3)),null),/could not be confirmed/i);
 f.setFault(null);
 assert.equal((await f.sdk.readEncrypted()).generation,g3);
 f.setFault('read');
 await assert.rejects(f.sdk.readEncrypted(),/Could not read/i,'Offline read must never report success');
 console.log('PASS R3 cloud uncertain writes: insert/update/delete ack loss, missing ack, duplicate protection, CAS conflict, offline read');
})().catch(e=>{console.error('R3 cloud uncertain-write regression FAILED',e);process.exitCode=1});
