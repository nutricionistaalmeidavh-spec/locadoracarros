import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('fase 10 identifica o desktop como GD Locacoes sem enfraquecer Electron',()=>{
  const pkg=JSON.parse(read('package.json'));
  const main=read('electron/main.cjs');

  assert.equal(pkg.build.appId,'com.artisys.locadora','appId deve permanecer estavel para preservar dados e upgrade');
  assert.equal(pkg.build.productName,'GD Locações');
  assert.equal(pkg.build.artifactName,'GD-Locacoes-Setup-${version}.${ext}');
  assert.equal(pkg.build.win?.icon,'assets/branding/gd-icon.ico','build Windows deve usar o ícone GD, não o padrão Electron');
  assert.equal(existsSync(resolve(root,'assets/branding/gd-icon.ico')),true,'ícone ICO GD precisa existir no pacote');

  assert.match(main,/title:'GD Locações'/,'janela Electron ainda nao tem titulo GD');
  assert.match(main,/contextIsolation:true/);
  assert.match(main,/nodeIntegration:false/);
  assert.match(main,/sandbox:true/);
  assert.match(main,/locadora\.sqlite/,'banco desktop deve manter o mesmo arquivo');
  assert.doesNotMatch(main,/locadora:branding/,'branding nao deve criar novo IPC');
});
