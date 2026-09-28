import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('fase 14 carrega camada responsiva por ultimo e a empacota offline',()=>{
  const cssPath=resolve(root,'styles-responsive-accessibility.css');
  assert.equal(existsSync(cssPath),true,'camada responsiva ainda nao existe');
  const css=read('styles-responsive-accessibility.css');
  const html=read('index.html');
  const build=read('scripts/build-web.mjs');
  const pkg=read('package.json');
  const sw=read('sw.js');

  const balance=html.indexOf('styles-branding-balance.css');
  const responsive=html.indexOf('styles-responsive-accessibility.css');
  assert.ok(responsive>balance,'camada responsiva deve ser carregada por ultimo');
  assert.match(build,/styles-responsive-accessibility\.css/);
  assert.match(pkg,/styles-responsive-accessibility\.css/);
  assert.match(sw,/styles-responsive-accessibility\.css/);

  assert.match(css,/@media\s*\(max-width:\s*900px\)/);
  assert.match(css,/\.table-wrap\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css,/\.modal\s*\{[^}]*max-height:\s*calc\(100dvh - 24px\)/s);
  assert.match(css,/min-height:\s*40px/,'controles touch devem ter alvo minimo');
  assert.match(css,/\[data-density=['"]compact['"]\]/);
  assert.match(css,/overflow-x:\s*hidden/,'viewport nao deve vazar horizontalmente');
});
