import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const compatPath = path.join(root, 'scripts/post-dist-compat.mjs');

test('Windows dist desativa publicação automática do electron-builder no CI', () => {
  assert.match(
    pkg.scripts?.dist || '',
    /--publish\s+never/,
    'npm run dist deve usar --publish never para não exigir GH_TOKEN em pushes da main'
  );
});

test('Windows build mantém branding GD e compatibilidade com o workflow legado', () => {
  assert.equal(pkg.build.productName, 'GD Locações');
  assert.equal(pkg.build.artifactName, 'GD-Locacoes-Setup-${version}.${ext}');
  assert.equal(
    pkg.build.win?.executableName,
    'Sistema Locadora',
    'o executável interno precisa manter o alias legado esperado pelo workflow sem alterar o nome do produto'
  );
  assert.match(
    pkg.scripts?.dist || '',
    /scripts\/post-dist-compat\.mjs/,
    'dist precisa criar alias legado do instalador depois de gerar o instalador GD'
  );
  assert.equal(existsSync(compatPath), true, 'script de compatibilidade do instalador ainda não existe');

  const compat = readFileSync(compatPath, 'utf8');
  assert.match(compat, /GD-Locacoes-Setup-/);
  assert.match(compat, /Sistema-Locadora-Setup-/);
});
