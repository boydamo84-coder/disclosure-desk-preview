'use strict';
/*
 * R3 local encrypted vault alpha. Browser-only; no server calls, auth,
 * password escrow, analytics, external dependencies or plaintext persistence.
 * PBKDF2-SHA256 / AES-256-GCM. Not yet an audited production security product.
 */
(()=>{
 const FORMAT='dd-r3-private-aes256gcm-v1';
 const DB_NAME='dd-r3-hypothesis-vault-alpha-1';
 const STORE='encrypted';
 const ENTRY='local-vault';
 const ITERATIONS=310000;
 const MAX_BYTES=1024*1024;
 const MAX_FILE_BYTES=2*1024*1024;
 const aad=new TextEncoder().encode(FORMAT);
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 const err=m=>{throw new Error('Encrypted vault: '+m)};
 const bytesToBase64=bytes=>{
  let text='';for(let i=0;i<bytes.length;i+=8192)
   text+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(text);
 };
 const base64ToBytes=(value,max)=>{
  if(typeof value!=='string'||value.length>Math.ceil(max/3)*4+4||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value))err('Invalid encrypted file encoding');
  let text;
  try{text=atob(value)}catch{err('Invalid base64 data')}
  if(text.length>max)err('Encrypted file exceeds supported size');
  return Uint8Array.from(text,c=>c.charCodeAt(0));
 };
 function validateEnvelope(envelope){
  if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    envelope.format!==FORMAT||envelope.version!==1||
    envelope.kdf?.algorithm!=='PBKDF2-SHA256'||
    envelope.kdf?.iterations!==ITERATIONS||
    envelope.cipher!=='AES-256-GCM'||
    !/^[0-9a-f]{32}$/.test(envelope.generation||''))
    err('Unsupported encrypted backup format');
  const salt=base64ToBytes(envelope.salt,16);
  const iv=base64ToBytes(envelope.iv,12);
  const cipher=base64ToBytes(envelope.ciphertext,MAX_BYTES+32);
  if(salt.length!==16||iv.length!==12||cipher.length<17)
   err('Encrypted backup has invalid parameters');
  return {salt,iv,cipher};
 }
 function passphraseOk(p){
  if(typeof p!=='string'||p.length<12||p.length>1024)
   err('Use a unique passphrase of at least 12 characters');
  return p;
 }
 function validateBook(book){
  if(!book||typeof book!=='object'||Array.isArray(book)||book.schemaVersion!==1||
    book.visibility!=='private'||!Array.isArray(book.hypotheses)||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,79}$/.test(book.workspaceId||'')||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,79}$/.test(book.caseId||'')||
    typeof book.title!=='string'||!book.title.trim()||book.title.length>160||
    book.hypotheses.length>100)
   err('Decrypted document is not an approved private R3 notebook');
  if(typeof book.createdAt!=='string'||typeof book.updatedAt!=='string'||
    !Number.isFinite(Date.parse(book.createdAt))||
    !Number.isFinite(Date.parse(book.updatedAt))||
    book.updatedAt<book.createdAt)
   err('Invalid document timestamps');
  const ids=new Set();
  for(const h of book.hypotheses){
   if(!h||typeof h!=='object'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,79}$/.test(h.id||'')||
      ids.has(h.id)||!Array.isArray(h.revisions)||h.revisions.length<1||h.revisions.length>1000)
    err('Invalid hypothesis revision history');
   ids.add(h.id);
   let time=book.createdAt;
   for(let i=0;i<h.revisions.length;i++){
    const r=h.revisions[i],c=r?.content;
    if(!r||r.revision!==i+1||typeof r.recordedAt!=='string'||r.recordedAt<time||
       !Number.isFinite(Date.parse(r.recordedAt))||!c||typeof c!=='object'||
       !Array.isArray(c.assumptions)||!c.assumptions.length||
       !Array.isArray(c.predictions)||!c.predictions.length||
       !Array.isArray(c.disconfirmingTests)||!c.disconfirmingTests.length||
       !Array.isArray(c.alternativeInterpretations)||!c.alternativeInterpretations.length||
       !Array.isArray(c.sources)||c.sources.length>30||
       typeof c.title!=='string'||typeof c.explanation!=='string')
     err('Invalid or incomplete hypothesis snapshot');
    for(const s of c.sources){
     let url;
     try{url=new URL(s.url)}catch{err('Invalid restored citation')}
     if(url.protocol!=='https:'||url.username||url.password)
      err('Restored citation must be HTTPS');
    }
    time=r.recordedAt;
   }
  }
  const plain=encoder.encode(JSON.stringify(book));
  if(plain.byteLength>MAX_BYTES)err('Notebook exceeds the encrypted vault size limit');
  return plain;
 }
 function cryptoReady(){
  if(!globalThis.isSecureContext||!globalThis.crypto?.subtle||!globalThis.indexedDB)
   err('Requires Chrome secure localhost and browser storage access');
 }
 async function derive(passphrase,salt){
  passphraseOk(passphrase);cryptoReady();
  const raw=await crypto.subtle.importKey('raw',encoder.encode(passphrase),
   'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({
   name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'
  },raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 }
 function random(length){const a=new Uint8Array(length);crypto.getRandomValues(a);return a}
 function generation(){return [...random(16)].map(x=>x.toString(16).padStart(2,'0')).join('')}
 async function encrypt(book,key,salt){
  const plain=validateBook(book);
  const iv=random(12);
  const cipher=await crypto.subtle.encrypt({
   name:'AES-GCM',iv,additionalData:aad,tagLength:128
  },key,plain);
  return {
   format:FORMAT,version:1,generation:generation(),
   cipher:'AES-256-GCM',
   kdf:{algorithm:'PBKDF2-SHA256',iterations:ITERATIONS},
   salt:bytesToBase64(salt),iv:bytesToBase64(iv),
   ciphertext:bytesToBase64(new Uint8Array(cipher))
  };
 }
 async function decrypt(envelope,passphrase){
  cryptoReady();
  const {salt,iv,cipher}=validateEnvelope(envelope);
  const key=await derive(passphrase,salt);
  let data;
  try{data=await crypto.subtle.decrypt({name:'AES-GCM',iv,
   additionalData:aad,tagLength:128},key,cipher)}
  catch{err('Wrong passphrase or corrupted encrypted backup')}
  let book;
  try{book=JSON.parse(decoder.decode(data))}catch{err('Decrypted document is not valid JSON')}
  validateBook(book);
  return {book,key,generation:envelope.generation};
 }
 function database(){
  cryptoReady();
  return new Promise((resolve,reject)=>{
   const req=indexedDB.open(DB_NAME,1);
   req.onupgradeneeded=()=>{req.result.createObjectStore(STORE)};
   req.onerror=()=>reject(new Error('Browser storage could not be opened'));
   req.onblocked=()=>reject(new Error('Browser storage is blocked by another tab'));
   req.onsuccess=()=>resolve(req.result);
  });
 }
 async function readStored(){
  const db=await database();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly');
   const request=tx.objectStore(STORE).get(ENTRY);
   let value=null;
   request.onsuccess=()=>{value=request.result||null};
   tx.oncomplete=()=>{db.close();resolve(value)};
   tx.onerror=()=>{db.close();reject(new Error('Unable to read encrypted local vault'))};
   tx.onabort=()=>{db.close();reject(new Error('Encrypted local read aborted'))};
  });
 }
 async function insert(envelope){
  const db=await database();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).add(envelope,ENTRY);
   tx.oncomplete=()=>{db.close();resolve(envelope)};
   tx.onerror=()=>{db.close();reject(new Error('A saved vault already exists; unlock or delete it first'))};
   tx.onabort=()=>{db.close();reject(new Error('Cannot replace an existing vault without explicit deletion'))};
  });
 }
 async function create(book,passphrase){
  cryptoReady();
  const salt=random(16),key=await derive(passphrase,salt);
  const envelope=await encrypt(book,key,salt);
  await insert(envelope);
  return {key,generation:envelope.generation};
 }
 async function unlock(passphrase){
  const envelope=await readStored();
  if(!envelope)err('No local encrypted vault found');
  return decrypt(envelope,passphrase);
 }
 async function save(book,key,expectedGeneration){
  if(!key||!generationPattern(expectedGeneration))err('Notebook is locked');
  const old=await readStored();
  if(!old||old.generation!==expectedGeneration)
   err('Saved copy was changed in another tab; no overwrite was made');
  const {salt}=validateEnvelope(old);
  const next=await encrypt(book,key,salt);
  const db=await database();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   const req=store.get(ENTRY);
   req.onsuccess=()=>{
    if(req.result?.generation!==expectedGeneration){
     tx.abort();return;
    }
    store.put(next,ENTRY);
   };
   tx.oncomplete=()=>{db.close();resolve(next.generation)};
   tx.onerror=()=>{db.close();reject(new Error('Encrypted save failed'))};
   tx.onabort=()=>{db.close();reject(new Error('Saved copy changed elsewhere or storage write failed'))};
  });
 }
 function generationPattern(text){return typeof text==='string'&&/^[0-9a-f]{32}$/.test(text)}
 async function encryptedExport(generationExpected){
  const envelope=await readStored();
  if(!envelope)err('No encrypted notebook available for download');
  validateEnvelope(envelope);
  if(envelope.generation!==generationExpected)
   err('Encrypted backup is stale or was changed in another tab');
  return JSON.stringify(envelope,null,2);
 }
 async function importBackup(content,passphrase){
  if(typeof content!=='string'||content.length>MAX_FILE_BYTES)
   err('Encrypted file is too large or invalid');
  let envelope;
  try{envelope=JSON.parse(content)}catch{err('Not a valid encrypted JSON backup')}
  const unlocked=await decrypt(envelope,passphrase);
  await insert(envelope);
  return unlocked;
 }
 async function deleteLocalVault(){
  const db=await database();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).delete(ENTRY);
   tx.oncomplete=resolve;
   tx.onerror=()=>reject(new Error('Local vault deletion failed'));
   tx.onabort=()=>reject(new Error('Local vault deletion aborted'));
  }).finally(()=>db.close());
 }
 Object.defineProperty(window,'DDPrivateVault',{
  value:Object.freeze({create,unlock,save,readStored,encryptedExport,importBackup,deleteLocalVault,validateBook}),
  configurable:false,writable:false
 });
})();
