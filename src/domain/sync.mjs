function clone(value){return value==null?value:(typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value)));}

function stamp(snapshot){
  const value=Date.parse(snapshot?.updatedAt??'');
  return Number.isFinite(value)?value:0;
}

export function exchangeSnapshots({serverRevision=0,serverSnapshot=null,baseRevision=0,clientSnapshot}={}){
  if(!clientSnapshot||typeof clientSnapshot!=='object'||Array.isArray(clientSnapshot))throw new TypeError('clientSnapshot is required.');
  const currentRevision=Math.max(0,Number(serverRevision)||0);
  const knownRevision=Math.max(0,Number(baseRevision)||0);
  if(!serverSnapshot){
    return {action:'push',snapshot:clone(clientSnapshot),nextRevision:Math.max(1,currentRevision+1),conflict:false};
  }
  if(knownRevision===currentRevision){
    if(stamp(clientSnapshot)<stamp(serverSnapshot))return {action:'pull',snapshot:clone(serverSnapshot),nextRevision:currentRevision,conflict:false};
    return {action:'push',snapshot:clone(clientSnapshot),nextRevision:currentRevision+1,conflict:false};
  }
  if(stamp(clientSnapshot)>stamp(serverSnapshot))return {action:'push',snapshot:clone(clientSnapshot),nextRevision:currentRevision+1,conflict:true};
  return {action:'pull',snapshot:clone(serverSnapshot),nextRevision:currentRevision,conflict:true};
}

export function normalizeSyncUrl(value){
  const raw=String(value??'').trim();
  if(!raw) return '';
  let url;
  try{url=new URL(raw);}catch{throw new Error('Endereço de sincronização inválido.');}
  if(!['http:','https:'].includes(url.protocol))throw new Error('Sincronização aceita apenas HTTP ou HTTPS.');
  url.pathname='/';url.search='';url.hash='';
  return url.toString().replace(/\/$/,'');
}

export function createDeviceId(prefix='DEV'){
  if(typeof globalThis.crypto?.randomUUID==='function')return `${prefix}-${globalThis.crypto.randomUUID()}`;
  const random=Math.random().toString(36).slice(2);return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function createSyncMeta(input={}){
  return {
    deviceId:String(input.deviceId||createDeviceId()),
    deviceName:String(input.deviceName||''),
    serverUrl:normalizeSyncUrl(input.serverUrl||''),
    token:String(input.token||''),
    enabled:Boolean(input.enabled),
    autoSync:Boolean(input.autoSync),
    revision:Math.max(0,Number(input.revision)||0),
    lastSyncAt:input.lastSyncAt||null,
    lastDirection:input.lastDirection||null,
    lastError:input.lastError||null
  };
}

export function markSyncSuccess(meta,{revision,direction,at=new Date().toISOString()}={}){
  return {...createSyncMeta(meta),revision:Math.max(0,Number(revision)||0),lastSyncAt:at,lastDirection:direction||null,lastError:null};
}

export function markSyncFailure(meta,error,{at=new Date().toISOString()}={}){
  return {...createSyncMeta(meta),lastError:String(error?.message??error??'Falha de sincronização.'),lastSyncAt:meta?.lastSyncAt??null,lastAttemptAt:at};
}
