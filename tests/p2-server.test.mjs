import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);

const { startSyncServer }=require('../electron/sync-server.cjs');

test('P2 LAN server autentica, serve PWA e sincroniza snapshot com revisão',async(t)=>{
  const dir=await mkdtemp(join(tmpdir(),'locadora-sync-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await writeFile(join(dir,'index.html'),'<h1>Locadora</h1>');
  const stateFile=join(dir,'state.json');
  const server=await startSyncServer({host:'127.0.0.1',port:0,token:'TOKEN123',rootDir:dir,stateFile});
  t.after(()=>server.close());
  const base=`http://127.0.0.1:${server.port}`;

  const page=await fetch(base+'/');
  assert.equal(page.status,200);
  assert.match(await page.text(),/Locadora/);

  const unauthorized=await fetch(base+'/api/sync/exchange',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({baseRevision:0,snapshot:{updatedAt:'2026-09-14T10:00:00Z'}})});
  assert.equal(unauthorized.status,401);

  const push=await fetch(base+'/api/sync/exchange',{method:'POST',headers:{'content-type':'application/json','x-locadora-sync-token':'TOKEN123'},body:JSON.stringify({baseRevision:0,deviceId:'PC',snapshot:{version:3,updatedAt:'2026-09-14T10:00:00Z',value:'pc'}})});
  assert.equal(push.status,200);
  const pushed=await push.json();
  assert.equal(pushed.action,'push');
  assert.equal(pushed.revision,1);

  const pull=await fetch(base+'/api/sync/exchange',{method:'POST',headers:{'content-type':'application/json','x-locadora-sync-token':'TOKEN123'},body:JSON.stringify({baseRevision:0,deviceId:'PHONE',snapshot:{version:3,updatedAt:'2026-09-14T09:00:00Z',value:'phone'}})});
  const pulled=await pull.json();
  assert.equal(pulled.action,'pull');
  assert.equal(pulled.conflict,true);
  assert.equal(pulled.snapshot.value,'pc');
});
