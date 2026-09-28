import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const brandingModulePath = resolve(root, 'src/ui/branding.mjs');
const brandingStylesPath = resolve(root, 'styles-branding.css');
const inventoryPath = resolve(root, 'docs/branding/gd-visual-inventory.md');
const assetPaths = [
  resolve(root, 'assets/branding/gd-logo-full.jpeg'),
  resolve(root, 'assets/branding/gd-logo-compact.svg'),
  resolve(root, 'assets/branding/gd-icon.svg')
];

const expectedTokens = [
  '--gd-bg',
  '--gd-bg-secondary',
  '--gd-gold',
  '--gd-gold-light',
  '--gd-gold-dark',
  '--gd-silver',
  '--gd-silver-dark',
  '--gd-white',
  '--gd-text',
  '--gd-muted',
  '--gd-success',
  '--gd-warning',
  '--gd-danger',
  '--gd-radius-sm',
  '--gd-radius-md',
  '--gd-radius-lg',
  '--gd-shadow-card',
  '--gd-shadow-modal',
  '--gd-spacing-xs',
  '--gd-spacing-sm',
  '--gd-spacing-md',
  '--gd-spacing-lg'
];

test('fases 0-2 expõem a fundação visual da GD Locações', async () => {
  assert.equal(existsSync(inventoryPath), true, 'inventário visual da fase 0 não existe');
  assert.equal(existsSync(brandingStylesPath), true, 'tokens da fase 1 não existem');
  assert.equal(existsSync(brandingModulePath), true, 'componente de branding da fase 2 não existe');
  for (const assetPath of assetPaths) assert.equal(existsSync(assetPath), true, `asset ausente: ${assetPath}`);

  const css = readFileSync(brandingStylesPath, 'utf8');
  for (const token of expectedTokens) assert.match(css, new RegExp(`${token}\\s*:`));

  const index = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.match(index, /styles-branding\.css/);

  const buildWeb = readFileSync(resolve(root, 'scripts/build-web.mjs'), 'utf8');
  assert.match(buildWeb, /styles-branding\.css/);

  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  assert.ok(packageJson.build.files.includes('styles-branding.css'));

  const serviceWorker = readFileSync(resolve(root, 'sw.js'), 'utf8');
  assert.match(serviceWorker, /styles-branding\.css/);

  const { renderGDLogo, GD_BRAND } = await import('../src/ui/branding.mjs');
  assert.equal(GD_BRAND.companyName, 'GD Locações');
  assert.equal(GD_BRAND.slogan, 'Liberdade para seu destino');

  for (const variant of ['full', 'compact', 'icon']) {
    const html = renderGDLogo({ variant });
    assert.match(html, /gd-brand/);
    assert.match(html, new RegExp(`data-variant="${variant}"`));
    assert.match(html, /assets\/branding\/gd-/);
  }
});
