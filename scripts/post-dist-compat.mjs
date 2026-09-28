import { copyFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const releaseDir = join(root, 'release');
const canonical = join(releaseDir, `GD-Locacoes-Setup-${pkg.version}.exe`);
const legacy = join(releaseDir, `Sistema-Locadora-Setup-${pkg.version}.exe`);

await copyFile(canonical, legacy);

const sourceStat = await stat(canonical);
const legacyStat = await stat(legacy);
if (legacyStat.size !== sourceStat.size || legacyStat.size < 1024 * 1024) {
  throw new Error('Alias legado do instalador Windows inválido');
}

console.log(`Alias legado criado: ${legacy}`);
