import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ensureP1Snapshot } from '../src/domain/p1.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const modulePath=resolve(root,'src/domain/branding.mjs');

test('fase 12 normaliza branding GD e preserva configuracoes legadas',async()=>{
  assert.equal(existsSync(modulePath),true,'dominio central de branding ainda nao existe');
  const {DEFAULT_GD_BRANDING,BRANDING_LIMITS,normalizeBranding,getEffectiveBranding}=await import('../src/domain/branding.mjs');

  assert.deepEqual(DEFAULT_GD_BRANDING,{
    slogan:'Liberdade para seu destino',
    preset:'gd',
    density:'comfortable',
    logoVariant:'gd'
  });
  assert.equal(BRANDING_LIMITS.sloganMaxLength,80);

  assert.deepEqual(normalizeBranding(),DEFAULT_GD_BRANDING);
  assert.deepEqual(normalizeBranding({
    slogan:'  Minha locadora  ',
    preset:'qualquer',
    density:'tiny',
    logoVariant:'externa'
  }),{
    slogan:'Minha locadora',
    preset:'gd',
    density:'comfortable',
    logoVariant:'gd'
  });
  assert.equal(normalizeBranding({slogan:'x'.repeat(120)}).slogan.length,80);
  assert.equal(normalizeBranding({slogan:42}).slogan,DEFAULT_GD_BRANDING.slogan);
  assert.equal(normalizeBranding({density:'compact'}).density,'compact');

  assert.deepEqual(getEffectiveBranding({}),{
    companyName:'GD Locações',
    ...DEFAULT_GD_BRANDING
  });
  assert.equal(getEffectiveBranding({companyName:'George Rent'}).companyName,'George Rent');

  const legacy=ensureP1Snapshot({
    settings:{companyName:'George Rent',document:'123',phone:'456',address:'Rua A'},
    customers:[],vehicles:[]
  });
  assert.equal(legacy.settings.companyName,'George Rent');
  assert.equal(legacy.settings.document,'123');
  assert.equal(legacy.settings.phone,'456');
  assert.equal(legacy.settings.address,'Rua A');
  assert.deepEqual(legacy.settings.branding,DEFAULT_GD_BRANDING);

  const empty=ensureP1Snapshot({customers:[],vehicles:[]});
  assert.equal(typeof empty.settings,'object');
  assert.deepEqual(empty.settings.branding,DEFAULT_GD_BRANDING);
});
