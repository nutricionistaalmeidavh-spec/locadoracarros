import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = readFileSync(path.join(root, '.github/workflows/windows-build.yml'), 'utf8');

test('Windows dist desativa publicação automática do electron-builder no CI', () => {
  assert.match(
    pkg.scripts?.dist || '',
    /--publish\s+never/,
    'npm run dist deve usar --publish never para não exigir GH_TOKEN em pushes da main'
  );
});

test('Windows CI valida, instala e publica o artefato renomeado da GD', () => {
  assert.match(workflow,/release\/GD-Locacoes-Setup-\*\.exe/,'workflow ainda procura o instalador Sistema-Locadora');
  assert.match(workflow,/GD Locações\.exe/,'workflow ainda procura o executável instalado Sistema Locadora');
  assert.match(workflow,/name:\s*GD-Locacoes-Windows/,'artefato do workflow ainda usa o nome antigo');
  assert.doesNotMatch(workflow,/Sistema-Locadora-Setup-/,'nome antigo do instalador não pode permanecer no workflow');
});
