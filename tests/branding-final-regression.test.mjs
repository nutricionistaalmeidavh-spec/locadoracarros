import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createEmptySnapshot } from '../src/domain/rental.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('fase 16: instalação nova nasce com identidade GD', () => {
  assert.equal(createEmptySnapshot().settings.companyName, 'GD Locações');
});

test('fase 16: asset legado empacotado não exibe LV nem laranja antigo', () => {
  const icon = read('assets/icon.svg');
  assert.doesNotMatch(icon, />LV</);
  assert.doesNotMatch(icon, /#f37a20/i);
  assert.match(icon, /GD Locações|>G<|>D</);
});

test('fase 16: superfícies visíveis não reintroduzem a marca antiga', () => {
  for (const path of ['index.html','manifest.webmanifest','src/app.mjs','src/ui/system.mjs','src/domain/documents.mjs']) {
    const source = read(path);
    assert.doesNotMatch(source, /ARTISYS|<span class="brandmark">LV<\/span>/i, path);
    assert.doesNotMatch(source, /Sistema Locadora/i, path);
  }
});
