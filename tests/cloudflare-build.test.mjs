import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

test('Cloudflare build gera uma pasta dist publicável e sem runtime Electron', () => {
  assert.equal(typeof pkg.scripts?.build, 'string', 'package.json precisa expor npm run build para o Cloudflare');

  rmSync(path.join(root, 'dist'), { recursive: true, force: true });
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['run', 'build'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  assert.equal(result.status, 0, `${result.stdout || ''}\n${result.stderr || ''}`);

  for (const relativePath of [
    'index.html',
    'styles.css',
    'styles-p1.css',
    'styles-p2.css',
    'manifest.webmanifest',
    'sw.js',
    'assets/icon.svg',
    'src/app.mjs',
    'vendor/sqlite/sql-wasm.js',
    'vendor/sqlite/sql-wasm.wasm'
  ]) {
    assert.equal(existsSync(path.join(root, 'dist', relativePath)), true, `dist/${relativePath} ausente`);
  }

  assert.equal(existsSync(path.join(root, 'dist', 'electron')), false, 'Electron não deve ser publicado no Cloudflare');
  assert.equal(existsSync(path.join(root, 'dist', 'package.json')), false, 'package.json não deve fazer parte dos assets públicos');
});
