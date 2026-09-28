import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(resolve(root,p),'utf8');

test('fase 6 aplica identidade GD à frota sem alterar regras de veículo',()=>{
  const ui=read('src/ui/cadastros.mjs');
  const css=read('styles-branding.css');
  assert.match(ui,/data-availability=/,'status visual da frota ainda não está exposto semanticamente');
  assert.match(css,/\[data-screen="frota"\] \.vehicle/,'cards da frota ainda não receberam o tema GD');
  assert.match(css,/#vehicle-form/,'cadastro de veículo ainda não recebeu o tema GD');
  assert.match(css,/#vehicle-docs-form/,'documentos do veículo ainda não receberam o tema GD');
  assert.match(css,/\[data-availability="manutencao"\]/,'status manutenção deve manter semântica própria');
});

test('fase 7 aplica identidade GD ao financeiro preservando semântica',()=>{
  const css=read('styles-branding.css');
  assert.match(css,/\[data-screen="financeiro"\] \.cards article/,'KPIs financeiros ainda não receberam o tema GD');
  assert.match(css,/\[data-screen="financeiro"\] \.panel/,'painéis financeiros ainda não receberam o tema GD');
  assert.match(css,/\[data-screen="financeiro"\].*nth-child\(4\)/s,'indicador de atraso deve ter tratamento semântico');
  assert.match(css,/#pay-form/,'modal de recebimento ainda não recebeu o tema GD');
  assert.match(css,/#expense-form/,'modal de despesa ainda não recebeu o tema GD');
});

test('fase 8 mantém o login com identidade GD Locações',()=>{
  const app=read('src/app.mjs');
  const css=read('styles-branding.css');
  assert.match(app,/getEffectiveBranding/,'login ainda não usa os metadados efetivos da GD');
  assert.ok(app.includes("renderGDLogo({variant:'full',className:'login-logo',alt:brand.companyName})"),'login ainda não usa a logo completa da GD');
  assert.doesNotMatch(app,/<span class="brandmark">LV<\/span>/,'branding LV ainda aparece no login');
  assert.match(app,/gd-login-slogan/,'slogan da GD ainda não aparece no login');
  assert.match(css,/\.login-wrap\s*\{/,'fundo do login GD ainda não foi aplicado');
  assert.match(css,/\.login-logo/,'logo do login ainda não foi dimensionada');
  assert.match(css,/\.gd-login-slogan/,'slogan do login ainda não foi estilizado');
  assert.match(css,/\.login-card \.primary/,'CTA do login ainda não recebeu o dourado GD');
});
