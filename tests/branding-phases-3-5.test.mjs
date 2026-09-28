import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(resolve(root,p),'utf8');

test('fase 3 aplica shell GD sem alterar login',()=>{
  const app=read('src/app.mjs');
  const css=read('styles-branding.css');
  assert.match(app,/renderGDLogo/,'shell ainda não usa o componente GD');
  assert.match(app,/data-screen=\\"\$\{active\}\\"/,'view ainda não expõe a tela ativa para tema');
  assert.match(css,/\.sidebar\s*\{/,'sidebar GD não foi aplicada');
  assert.match(css,/\.nav\.active/,'estado ativo dourado não foi aplicado');
  assert.match(css,/\.topbar\s*\{/,'topbar GD não foi aplicada');
  assert.match(css,/\.primary\s*\{/,'CTA dourado global não foi aplicado');
});

test('fase 4 personaliza o dashboard com classes próprias',()=>{
  const ui=read('src/ui/p1.mjs');
  const css=read('styles-branding.css');
  assert.match(ui,/dashboard-kpis/);
  assert.match(ui,/dashboard-kpi/);
  assert.match(css,/\[data-screen="dashboard"\]/);
  assert.match(css,/\.dashboard-kpi/);
});

test('fase 5 personaliza o fluxo operacional de locação',()=>{
  const ui=read('src/ui/reservas.mjs');
  const css=read('styles-branding.css');
  assert.match(ui,/rental-form/);
  assert.match(ui,/rental-payment-form/);
  assert.match(ui,/rental-close-form/);
  assert.match(css,/\[data-screen="reservas"\]/);
  assert.match(css,/\.rental-form/);
  assert.match(css,/\.rental-payment-form/);
  assert.match(css,/\.rental-close-form/);
});
