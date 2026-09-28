import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const rootFiles = [
  'index.html',
  'styles-branding.css',
  'styles.css',
  'styles-p1.css',
  'styles-p2.css',
  'manifest.webmanifest',
  'sw.js'
];

const directories = [
  'assets',
  'src',
  'vendor/sqlite'
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of rootFiles) {
  await cp(path.join(root, file), path.join(dist, file));
}

for (const directory of directories) {
  await cp(path.join(root, directory), path.join(dist, directory), { recursive: true });
}

console.log('Build web pronto em dist/.');
