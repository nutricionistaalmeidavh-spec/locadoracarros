import { createEmptySnapshot, migrateLegacySnapshot } from '../domain/rental.mjs';
import { ensureP1Snapshot } from '../domain/p1.mjs';
import { syncMaintenanceAvailability } from '../domain/maintenance.mjs';
import { createPwaSqliteStore } from './pwa-sqlite.mjs';

export const STORE_KEY='app:snapshot:v3';

function normalize(raw){
  const source=typeof raw==='string'?JSON.parse(raw):raw;
  if(!source)return syncMaintenanceAvailability(ensureP1Snapshot(createEmptySnapshot()));
  const base=Number(source?.version)>=2&&Array.isArray(source?.ledger)&&Array.isArray(source?.audit)?source:migrateLegacySnapshot(source);
  return syncMaintenanceAvailability(ensureP1Snapshot(base));
}

async function createDesktopStore(){
  const bridge=globalThis.window?.locadoraDesktop;
  if(!bridge?.dbGet||!bridge?.dbSet||!bridge?.dbRemove)return null;
  return Object.freeze({
    kind:'sqlite-desktop',
    get:(key)=>bridge.dbGet(String(key)),
    set:(key,value)=>bridge.dbSet(String(key),String(value)),
    remove:(key)=>bridge.dbRemove(String(key)),
    flush:async()=>true
  });
}

export async function createRepository(){
  const storage=await createDesktopStore()??await createPwaSqliteStore();
  const raw=await storage.get(STORE_KEY);
  let cache=normalize(raw);
  if(raw==null)await storage.set(STORE_KEY,JSON.stringify(cache));
  let writeQueue=Promise.resolve();

  const persist=(value)=>{
    writeQueue=writeQueue.then(()=>storage.set(STORE_KEY,JSON.stringify(value)));
    writeQueue.catch(()=>{});
    return value;
  };

  const kv=Object.freeze({
    kind:storage.kind,
    get:(key)=>storage.get(key),
    set:(key,value)=>{writeQueue=writeQueue.then(()=>storage.set(key,String(value)));writeQueue.catch(()=>{});return true;},
    remove:(key)=>{writeQueue=writeQueue.then(()=>storage.remove(key));writeQueue.catch(()=>{});return true;},
    flush:async()=>{await writeQueue;await storage.flush?.();}
  });

  return Object.freeze({
    kind:storage.kind,
    load(){return cache;},
    save(snapshot){cache=normalize(snapshot);persist(cache);return cache;},
    async flush(){await writeQueue;await storage.flush?.();},
    async reset(){cache=normalize(null);await storage.remove(STORE_KEY);await storage.set(STORE_KEY,JSON.stringify(cache));return cache;},
    kv
  });
}
