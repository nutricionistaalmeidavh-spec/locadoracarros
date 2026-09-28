import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));

test('Cloudflare aponta para o Worker e os recursos do George', () => {
  assert.equal(config.name, 'sistemaaluguelcarrogeorge');
  assert.equal(config.assets?.directory, './dist');

  assert.deepEqual(config.d1_databases, [
    {
      binding: 'Bd',
      database_name: 'db'
    }
  ]);

  assert.deepEqual(config.r2_buckets, [
    {
      binding: 'r2',
      bucket_name: 'r2george'
    }
  ]);
});
