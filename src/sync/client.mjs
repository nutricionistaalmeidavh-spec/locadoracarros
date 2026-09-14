import { createSyncMeta, markSyncFailure, markSyncSuccess, normalizeSyncUrl } from '../domain/sync.mjs';
import { createOfflineState, markOfflineSynced, queueSnapshot } from '../domain/offline.mjs';

export const SYNC_META_KEY='artisys:locadora:sync:meta:v1';
export const SYNC_CONFLICT_KEY='artisys:locadora:sync:conflict:v1';
export const SYNC_OFFLINE_KEY='artisys:locadora:sync:offline:v1';

export function createSyncClient({storage=window.localStorage,fetchImpl=fetch,deviceId=null}={}){
  function load(){
    const raw=storage.getItem(SYNC_META_KEY);
    if(raw){try{return createSyncMeta(JSON.parse(raw));}catch{}}
    return createSyncMeta({deviceId:deviceId||undefined});
  }
  function persist(meta){storage.setItem(SYNC_META_KEY,JSON.stringify(meta));return meta;}
  function offlineState(){
    const raw=storage.getItem(SYNC_OFFLINE_KEY);
    if(raw){try{return createOfflineState(JSON.parse(raw));}catch{}}
    return createOfflineState();
  }
  function persistOffline(state){storage.setItem(SYNC_OFFLINE_KEY,JSON.stringify(state));return state;}
  function markDirty(snapshot){return persistOffline(queueSnapshot(offlineState(),snapshot));}
  function configure(patch={}){
    const current=load();
    const next=createSyncMeta({...current,...patch,deviceId:current.deviceId||deviceId||undefined,serverUrl:patch.serverUrl!=null?normalizeSyncUrl(patch.serverUrl):current.serverUrl});
    return persist(next);
  }
  async function sync(snapshot){
    let meta=load();
    if(!meta.enabled||!meta.serverUrl||!meta.token)return {ok:false,skipped:true,snapshot,meta,offline:offlineState()};
    try{
      const response=await fetchImpl(`${meta.serverUrl}/api/sync/exchange`,{method:'POST',headers:{'content-type':'application/json','x-locadora-sync-token':meta.token},body:JSON.stringify({baseRevision:meta.revision,deviceId:meta.deviceId,snapshot})});
      if(!response.ok){let detail='';try{detail=(await response.json())?.error||'';}catch{}throw new Error(detail||`Sincronização falhou (${response.status}).`);}
      const data=await response.json();
      if(data.conflict&&data.action==='pull')storage.setItem(SYNC_CONFLICT_KEY,JSON.stringify(snapshot));
      meta=markSyncSuccess(meta,{revision:data.revision,direction:data.action,at:new Date().toISOString()});
      persist(meta);
      const offline=persistOffline(markOfflineSynced(offlineState(),{revision:data.revision,at:meta.lastSyncAt}));
      return {ok:true,snapshot:data.action==='pull'&&data.snapshot?data.snapshot:snapshot,meta,offline,conflict:Boolean(data.conflict),direction:data.action};
    }catch(error){
      meta=markSyncFailure(meta,error);persist(meta);
      return {ok:false,snapshot,meta,offline:offlineState(),error};
    }
  }
  function clearConflict(){storage.removeItem(SYNC_CONFLICT_KEY);}
  function getConflict(){const raw=storage.getItem(SYNC_CONFLICT_KEY);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}
  return {load,configure,sync,markDirty,offlineState,clearConflict,getConflict};
}
