import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('fase 13 oferece Aparencia administrada e limitada ao preset GD',()=>{
  const ui=read('src/ui/system.mjs');
  assert.match(ui,/Aparência/);
  assert.match(ui,/id="appearance-form"/);
  assert.match(ui,/name="slogan"[^>]*maxlength="80"/);
  assert.match(ui,/name="density"/);
  assert.match(ui,/value="comfortable"/);
  assert.match(ui,/value="compact"/);
  assert.match(ui,/GD institucional/);
  assert.match(ui,/id="appearance-reset"/);
  assert.match(ui,/normalizeBranding/,'salvamento deve normalizar o branding');
  assert.match(ui,/window\.confirm/,'reset do nome comercial exige confirmacao explicita');
  assert.doesNotMatch(ui,/type="color"/);
  assert.doesNotMatch(ui,/name="logoUrl"|name="css"|name="customCss"/);
});
