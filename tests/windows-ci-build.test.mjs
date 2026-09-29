import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWindowsIcon, WINDOWS_ICON_SIZES } from '../scripts/generate-windows-icon.mjs';

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
  assert.equal(pkg.build.win?.icon, 'build/gd-icon.ico');
  assert.match(pkg.scripts?.dist || '', /npm run windows:icon/);
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

test('ICO GD gerado usa contêiner Windows válido com entrada 256px compatível com NSIS', () => {
  const icon = buildWindowsIcon();
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);

  const count = icon.readUInt16LE(4);
  assert.equal(count, WINDOWS_ICON_SIZES.length);

  let has256 = false;
  for (let index = 0; index < count; index += 1) {
    const offset = 6 + index * 16;
    const width = icon[offset] === 0 ? 256 : icon[offset];
    const height = icon[offset + 1] === 0 ? 256 : icon[offset + 1];
    const bytesInResource = icon.readUInt32LE(offset + 8);
    const imageOffset = icon.readUInt32LE(offset + 12);

    assert.ok(imageOffset + bytesInResource <= icon.length);
    if (width === 256 && height === 256) {
      has256 = true;
      assert.equal(
        icon.readUInt32LE(imageOffset),
        40,
        'a entrada 256px deve usar DIB/BMP em vez de PNG compactado para máxima compatibilidade com makensis'
      );
    }
  }

  assert.equal(has256, true, 'o ICO precisa conter uma entrada 256x256 para electron-builder');
});
