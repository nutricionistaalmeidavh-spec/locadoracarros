import test from 'node:test';
import assert from 'node:assert/strict';
import { exchangeSnapshots } from '../src/domain/sync.mjs';

test('sync merge: edição de cliente no PC e vistoria no celular sobrevivem ao mesmo conflito',()=>{
  const server={version:3,updatedAt:'2026-09-14T10:05:00Z',customers:[{id:'C1',name:'Ana PC',updatedAt:'2026-09-14T10:05:00Z'}],vehicles:[],rentals:[],expenses:[],users:[],ledger:[],audit:[],inspections:[],maintenance:[],alertState:[],settings:{companyName:'Locadora'}};
  const client={version:3,updatedAt:'2026-09-14T10:06:00Z',customers:[{id:'C1',name:'Ana',updatedAt:'2026-09-14T10:00:00Z'}],vehicles:[],rentals:[],expenses:[],users:[],ledger:[],audit:[],inspections:[{id:'VIS-1',rentalId:'R1',status:'completed',updatedAt:'2026-09-14T10:06:00Z'}],maintenance:[],alertState:[],settings:{companyName:'Locadora'}};
  const result=exchangeSnapshots({serverRevision:5,serverSnapshot:server,baseRevision:4,clientSnapshot:client});
  assert.equal(result.action,'merge');assert.equal(result.conflict,true);assert.equal(result.nextRevision,6);
  assert.equal(result.snapshot.customers[0].name,'Ana PC');assert.equal(result.snapshot.inspections[0].id,'VIS-1');
});
