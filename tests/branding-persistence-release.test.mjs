import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptySnapshot } from '../src/domain/rental.mjs';
import { createBackupEnvelope, restoreBackupEnvelope, prepareSnapshotRestore } from '../src/domain/backup.mjs';
import { ensureP1Snapshot } from '../src/domain/p1.mjs';
import { mergeSnapshots } from '../src/domain/sync.mjs';

const BRANDING = Object.freeze({
  slogan:'Mobilidade do seu jeito',
  preset:'gd',
  density:'compact',
  logoVariant:'gd'
});

function brandedSnapshot(updatedAt='2026-09-28T20:00:00.000Z'){
  const snapshot=createEmptySnapshot();
  snapshot.updatedAt=updatedAt;
  snapshot.settings={
    ...snapshot.settings,
    companyName:'George Rent',
    branding:{...BRANDING}
  };
  return ensureP1Snapshot(snapshot);
}

function assertBranding(snapshot){
  assert.equal(snapshot.settings.companyName,'George Rent');
  assert.equal(snapshot.settings.branding.slogan,BRANDING.slogan);
  assert.equal(snapshot.settings.branding.density,'compact');
  assert.equal(snapshot.settings.branding.preset,'gd');
  assert.equal(snapshot.settings.branding.logoVariant,'gd');
}

test('fase 17: backup e restore preservam settings.branding',async()=>{
  const source=brandedSnapshot();
  const raw=await createBackupEnvelope(source);
  const restored=ensureP1Snapshot(await restoreBackupEnvelope(raw));
  assertBranding(restored);
});

test('fase 17: restore point preserva settings.branding',()=>{
  const current=brandedSnapshot('2026-09-28T19:00:00.000Z');
  const backup=brandedSnapshot('2026-09-28T18:00:00.000Z');
  const restored=ensureP1Snapshot(prepareSnapshotRestore(backup,current,{id:'REST-GD',at:'2026-09-28T21:00:00.000Z'}));
  assertBranding(restored);
  assert.deepEqual(restored.restorePoint,{generation:1,id:'REST-GD'});
});

test('fase 17: merge de snapshots preserva branding do snapshot mais novo',()=>{
  const server=brandedSnapshot('2026-09-28T18:00:00.000Z');
  server.settings={...server.settings,companyName:'Servidor antigo',branding:{...server.settings.branding,slogan:'Antigo',density:'comfortable'}};
  const client=brandedSnapshot('2026-09-28T20:00:00.000Z');
  const merged=ensureP1Snapshot(mergeSnapshots(server,client));
  assertBranding(merged);
});
