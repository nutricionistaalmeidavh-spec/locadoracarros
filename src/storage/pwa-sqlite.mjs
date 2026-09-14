const DB_FILE='locadora.sqlite';
const SQLITE_JS='./vendor/sqlite/sql-wasm.js';
const SQLITE_WASM='./vendor/sqlite/sql-wasm.wasm';

function loadScript(src){
  return new Promise((resolve,reject)=>{
    if(globalThis.initSqlJs)return resolve();
    const existing=document.querySelector(`script[data-sqlite-wasm="${src}"]`);
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const script=document.createElement('script');
    script.src=src;script.async=true;script.dataset.sqliteWasm=src;
    script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar o runtime SQLite da PWA.'));
    document.head.appendChild(script);
  });
}

export async function createPwaSqliteStore(){
  if(!globalThis.isSecureContext)throw new Error('A PWA com SQLite local precisa ser aberta em HTTPS.');
  if(!navigator.storage?.getDirectory)throw new Error('Este navegador não oferece armazenamento OPFS necessário ao SQLite local.');
  await loadScript(SQLITE_JS);
  const SQL=await globalThis.initSqlJs({locateFile:(name)=>name.endsWith('.wasm')?SQLITE_WASM:`./vendor/sqlite/${name}`});
  const root=await navigator.storage.getDirectory();
  const handle=await root.getFileHandle(DB_FILE,{create:true});
  const file=await handle.getFile();
  const bytes=file.size?new Uint8Array(await file.arrayBuffer()):null;
  const db=bytes?.length?new SQL.Database(bytes):new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS kv(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL)`);
  let queue=Promise.resolve();

  async function persist(){
    const exported=db.export();
    queue=queue.then(async()=>{const writable=await handle.createWritable();await writable.write(exported);await writable.close();});
    return queue;
  }
  function get(key){
    const stmt=db.prepare('SELECT value FROM kv WHERE key=?');
    try{stmt.bind([String(key)]);return stmt.step()?stmt.getAsObject().value:null;}finally{stmt.free();}
  }
  async function set(key,value){
    db.run(`INSERT INTO kv(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`,[String(key),String(value),new Date().toISOString()]);
    await persist();return true;
  }
  async function remove(key){db.run('DELETE FROM kv WHERE key=?',[String(key)]);await persist();return true;}
  await persist();
  return Object.freeze({kind:'sqlite-opfs',fileName:DB_FILE,get,set,remove,flush:()=>queue,close:()=>db.close()});
}
