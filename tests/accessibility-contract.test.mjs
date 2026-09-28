import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('fase 15 expõe foco, live regions e diálogo acessível',()=>{
  const css=read('styles-responsive-accessibility.css');
  const common=read('src/ui/common.mjs');
  const app=read('src/app.mjs');

  assert.match(css,/:focus-visible/,'foco visivel global ainda nao existe');
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/,'reducao de movimento ainda nao existe');
  assert.match(css,/button:disabled|:disabled/,'estado disabled precisa de tratamento perceptivel');
  assert.match(css,/\.nav\[aria-current="page"\]/,'navegacao ativa precisa de indicacao alem da cor');

  assert.match(common,/role=['"]status['"]/,'toast ainda nao e live region');
  assert.match(common,/aria-live=['"]polite['"]/,'toast precisa anunciar mensagens');
  assert.match(common,/role="dialog"/,'modal ainda nao tem role dialog');
  assert.match(common,/aria-modal="true"/,'modal ainda nao informa modalidade');
  assert.match(common,/aria-labelledby=/,'modal precisa apontar para o titulo');

  assert.match(app,/aria-current=/,'navegacao ativa ainda nao e anunciada');
  assert.match(app,/role="alert"/,'erro de login ainda nao e live alert');
  assert.match(app,/aria-live="assertive"/,'erro de login deve ser anunciado imediatamente');
  assert.match(app,/aria-label="Navegação principal"/,'navegacao principal precisa de nome acessivel');
});
