import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(resolve(root,p),'utf8');

test('fase 3 aplica shell GD sem alterar o login',()=>{
  const app=read('src/app.mjs');
  const css=read('styles-branding.css');
  assert.match(app,/renderGDLogo/,'shell ainda não usa o componente GD');
  assert.ok(app.includes('data-screen="${active}"'),'view ainda não expõe a tela ativa para tema');
  assert.match(css,/\.sidebar\s*\{/,'sidebar GD não foi aplicada');
  assert.match(css,/\.nav\.active/,'estado ativo dourado não foi aplicado');
  assert.match(css,/\.topbar\s*\{/,'topbar GD não foi aplicada');
  assert.match(css,/\.shell \.primary/,'CTA dourado deve ficar restrito à aplicação autenticada');
});

test('fase 4 aplica identidade GD ao dashboard sem classes novas de negócio',()=>{
  const css=read('styles-branding.css');
  assert.match(css,/\[data-screen="dashboard"\] \.cards\.six article/);
  assert.match(css,/\[data-screen="dashboard"\] \.panel/);
  assert.match(css,/\[data-screen="dashboard"\] \.kpi-lines/);
});

test('fase 5 aplica identidade GD ao fluxo operacional de locação',()=>{
  const ui=read('src/ui/reservas.mjs');
  const css=read('styles-branding.css');
  for(const id of ['rental-form','daily-payment-form','daily-bulk-payment-form','continuous-close-form']) assert.match(ui,new RegExp(id));
  assert.match(css,/\[data-screen="reservas"\] \.agenda-item/);
  assert.match(css,/#rental-form/);
  assert.match(css,/#daily-payment-form/);
  assert.match(css,/#daily-bulk-payment-form/);
  assert.match(css,/#continuous-close-form/);
  assert.match(css,/#receive-next-daily/,'CTA de recebimento de diária ainda não usa a identidade GD');
  assert.match(css,/#receive-multiple-daily/,'ação de recebimento múltiplo ainda não usa a identidade GD');
});
