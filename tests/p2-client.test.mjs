import test from 'node:test';
import assert from 'node:assert/strict';
import { createSyncClient, SYNC_CONFLICT_KEY } from '../src/sync/client.mjs';

class MemoryStorage{constructor(){this.map=new Map()}getItem(k){return this.map.has(k)?this.map.get(k):null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}

test('P2 client salva configuração e aplica pull preservando cópia local em conflito',async()=>{
  const storage=new MemoryStorage();
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({ok:true,action:'pull',conflict:true,revision:3,snapshot:{version:3,updatedAt:'2026-09-14T10:10:00Z',value:'remote'}}),{status:200,headers:{'content-type':'application/json'}})};
  const client=createSyncClient({storage,fetchImpl,deviceId:'PHONE-1'});
  client.configure({serverUrl:'http://192.168.0.10:4174/',token:'ABC',enabled:true,autoSync:true,deviceName:'Celular'});
  const local={version:3,updatedAt:'2026-09-14T10:00:00Z',value:'local'};
  const result=await client.sync(local);
  assert.equal(result.snapshot.value,'remote');
  assert.equal(result.meta.revision,3);
  assert.equal(result.meta.lastDirection,'pull');
  assert.equal(JSON.parse(storage.getItem(SYNC_CONFLICT_KEY)).value,'local');
  assert.equal(calls[0].options.headers['x-locadora-sync-token'],'ABC');
  assert.equal(JSON.parse(calls[0].options.body).deviceId,'PHONE-1');
});

test('P2 client mantém dados locais e registra erro quando PC está offline',async()=>{
  const storage=new MemoryStorage();
  const client=createSyncClient({storage,fetchImpl:async()=>{throw new Error('offline')},deviceId:'PC-1'});
  client.configure({serverUrl:'http://127.0.0.1:4174',token:'ABC',enabled:true});
  const local={version:3,updatedAt:'2026-09-14T10:00:00Z',value:'local'};
  const result=await client.sync(local);
  assert.equal(result.snapshot.value,'local');
  assert.equal(result.ok,false);
  assert.equal(result.meta.lastError,'offline');
});
