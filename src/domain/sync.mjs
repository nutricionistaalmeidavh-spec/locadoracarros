function clone(value){return value==null?value:(typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value)));}
function stamp(value){for(const key of ['updatedAt','completedAt','paidAt','createdAt','at','dueAt']){const time=Date.parse(value?.[key]??'');if(Number.isFinite(time))return time;}return 0;}
function snapshotStamp(snapshot){const value=Date.parse(snapshot?.updatedAt??'');return Number.isFinite(value)?value:0;}
const COLLECTIONS=['customers','vehicles','rentals','expenses','users','ledger','audit','inspections','maintenance','alertState','contractTemplates','issuedContracts','billingPlans','billingInstallments','billingPayments','collectionActivities'];

function mergeCollection(server=[],client=[]){
  const map=new Map();
  for(const item of server||[])if(item?.id!=null)map.set(String(item.id),clone(item));
  for(const item of client||[]){
    if(item?.id==null)continue;
    const id=String(item.id),current=map.get(id);
    if(!current||stamp(item)>stamp(current))map.set(id,clone(item));
    else if(stamp(item)===stamp(current)&&JSON.stringify(item)!==JSON.stringify(current)){
      const a=JSON.stringify(current),b=JSON.stringify(item);if(b>a)map.set(id,clone(item));
    }
  }
  return [...map.values()];
}

export function mergeSnapshots(serverSnapshot,clientSnapshot){
  if(!serverSnapshot)return clone(clientSnapshot);
  if(!clientSnapshot)return clone(serverSnapshot);
  const server=clone(serverSnapshot),client=clone(clientSnapshot);
  const merged={...server};
  for(const key of COLLECTIONS)if(Array.isArray(server[key])||Array.isArray(client[key]))merged[key]=mergeCollection(server[key],client[key]);
  const clientNewer=snapshotStamp(client)>snapshotStamp(server);
  merged.settings=clone(clientNewer?client.settings??server.settings:server.settings??client.settings);
  merged.version=Math.max(Number(server.version)||0,Number(client.version)||0);
  merged.updatedAt=new Date(Math.max(snapshotStamp(server),snapshotStamp(client),Date.now())).toISOString();
  return merged;
}

function canEntityMerge(a,b){return COLLECTIONS.some(key=>Array.isArray(a?.[key])||Array.isArray(b?.[key]));}

export function exchangeSnapshots({serverRevision=0,serverSnapshot=null,baseRevision=0,clientSnapshot}={}){
  if(!clientSnapshot||typeof clientSnapshot!=='object'||Array.isArray(clientSnapshot))throw new TypeError('clientSnapshot is required.');
  const currentRevision=Math.max(0,Number(serverRevision)||0),knownRevision=Math.max(0,Number(baseRevision)||0);
  if(!serverSnapshot)return {action:'push',snapshot:clone(clientSnapshot),nextRevision:Math.max(1,currentRevision+1),conflict:false};
  if(knownRevision===currentRevision){
    if(snapshotStamp(clientSnapshot)<snapshotStamp(serverSnapshot))return {action:'pull',snapshot:clone(serverSnapshot),nextRevision:currentRevision,conflict:false};
    return {action:'push',snapshot:clone(clientSnapshot),nextRevision:currentRevision+1,conflict:false};
  }
  if(canEntityMerge(serverSnapshot,clientSnapshot))return {action:'merge',snapshot:mergeSnapshots(serverSnapshot,clientSnapshot),nextRevision:currentRevision+1,conflict:true};
  if(snapshotStamp(clientSnapshot)>snapshotStamp(serverSnapshot))return {action:'push',snapshot:clone(clientSnapshot),nextRevision:currentRevision+1,conflict:true};
  return {action:'pull',snapshot:clone(serverSnapshot),nextRevision:currentRevision,conflict:true};
}

export function normalizeSyncUrl(value){
  const raw=String(value??'').trim();if(!raw)return '';
  let url;try{url=new URL(raw);}catch{throw new Error('Endereço de sincronização inválido.');}
  if(!['http:','https:'].includes(url.protocol))throw new Error('Sincronização aceita apenas HTTP ou HTTPS.');
  url.pathname='/';url.search='';url.hash='';return url.toString().replace(/\/$/,'');
}
export function createDeviceId(prefix='DEV'){
  if(typeof globalThis.crypto?.randomUUID==='function')return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
export function createSyncMeta(input={}){return{deviceId:String(input.deviceId||createDeviceId()),deviceName:String(input.deviceName||''),serverUrl:normalizeSyncUrl(input.serverUrl||''),token:String(input.token||''),enabled:Boolean(input.enabled),autoSync:Boolean(input.autoSync),revision:Math.max(0,Number(input.revision)||0),lastSyncAt:input.lastSyncAt||null,lastDirection:input.lastDirection||null,lastError:input.lastError||null};}
export function markSyncSuccess(meta,{revision,direction,at=new Date().toISOString()}={}){return{...createSyncMeta(meta),revision:Math.max(0,Number(revision)||0),lastSyncAt:at,lastDirection:direction||null,lastError:null};}
export function markSyncFailure(meta,error,{at=new Date().toISOString()}={}){return{...createSyncMeta(meta),lastError:String(error?.message??error??'Falha de sincronização.'),lastSyncAt:meta?.lastSyncAt??null,lastAttemptAt:at};}
