import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('fase 9 publica PWA GD Locacoes e invalida o cache antigo',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  const html=read('index.html');
  const sw=read('sw.js');

  assert.equal(manifest.name,'GD Locações');
  assert.equal(manifest.short_name,'GD');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.theme_color,'#06111d');
  assert.equal(manifest.background_color,'#f4f5f7');
  assert.equal(manifest.icons[0].src,'./assets/branding/gd-icon.svg');

  assert.match(html,/<title>GD Locações<\/title>/);
  assert.match(html,/name="theme-color" content="#06111d"/);
  assert.match(html,/rel="icon" href="\.\/assets\/branding\/gd-icon\.svg"/);

  assert.match(sw,/const CACHE='gd-locacoes-0\.7\.0-phases-9-15-1'/);
  assert.match(sw,/\.\/assets\/branding\/gd-icon\.svg/);
  assert.match(sw,/\.\/src\/domain\/branding\.mjs/);
  assert.match(sw,/keys\.filter\(key=>key!==CACHE\)/,'service worker deve excluir caches anteriores');
});
