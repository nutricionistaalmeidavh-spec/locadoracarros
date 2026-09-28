import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('fase 18: README apresenta GD e o instalador canônico', () => {
  const readme = read('README.md');
  assert.match(readme, /^# GD Locações/m);
  assert.match(readme, /release\/GD-Locacoes-Setup-0\.7\.0\.exe/);
  assert.doesNotMatch(readme, /Sistema standalone .* ArtiSys/i);
});

test('fase 18: documentação de branding registra regras finais e aliases técnicos', () => {
  const branding = read('docs/branding/README.md');
  assert.match(branding, /dourado.*assinatura/i);
  assert.match(branding, /settings\.branding/);
  assert.match(branding, /GD-Locacoes-Setup-\$\{version\}\.exe/);
  assert.match(branding, /alias.*técnic/i);
});
