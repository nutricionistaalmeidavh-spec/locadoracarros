import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

test('Windows dist desativa publicação automática do electron-builder no CI', () => {
  assert.match(
    pkg.scripts?.dist || '',
    /--publish\s+never/,
    'npm run dist deve usar --publish never para não exigir GH_TOKEN em pushes da main'
  );
});
