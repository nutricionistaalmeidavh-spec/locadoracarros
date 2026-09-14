import test from 'node:test';
import assert from 'node:assert/strict';
import { createSyncClient, SYNC_OFFLINE_KEY } from '../src/sync/client.mjs';

function memoryStorage(){
  const map=new Map();
  return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}

test('sync client: alteração local fica pendente mesmo sem rede', () => {
  const storage=memoryStorage();
  const client=createSyncClient({storage,fetchImpl:async()=>{throw new Error('offline')},deviceId:'DEV-1'});
  const snapshot={version:3,updatedAt:'2026-09-14T12:00:00.000Z'};
  client.markDirty(snapshot);
  const state=client.offlineState();
  assert.equal(state.dirty,true);
  assert.equal(state.pending.length,1);
  assert.ok(storage.getItem(SYNC_OFFLINE_KEY));
});

test('sync client: sync bem sucedido limpa pendência offline', async () => {
  const storage=memoryStorage();
  const fetchImpl=async()=>({ok:true,json:async()=>({action:'push',revision:4,conflict:false})});
  const client=createSyncClient({storage,fetchImpl,deviceId:'DEV-1'});
  client.configure({serverUrl:'http://192.168.0.2:4174',token:'abc',enabled:true});
  const snapshot={version:3,updatedAt:'2026-09-14T12:00:00.000Z'};
  client.markDirty(snapshot);
  const result=await client.sync(snapshot);
  assert.equal(result.ok,true);
  assert.equal(client.offlineState().dirty,false);
  assert.equal(client.offlineState().pending.length,0);
  assert.equal(client.offlineState().lastSyncedRevision,4);
});

test('sync client: falha de rede mantém snapshot na fila', async () => {
  const storage=memoryStorage();
  const client=createSyncClient({storage,fetchImpl:async()=>{throw new Error('sem rede')},deviceId:'DEV-1'});
  client.configure({serverUrl:'http://192.168.0.2:4174',token:'abc',enabled:true});
  const snapshot={version:3,updatedAt:'2026-09-14T12:00:00.000Z'};
  client.markDirty(snapshot);
  const result=await client.sync(snapshot);
  assert.equal(result.ok,false);
  assert.equal(client.offlineState().dirty,true);
  assert.equal(client.offlineState().pending.length,1);
});
