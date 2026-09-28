import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('fase 12 usa branding efetivo e densidade no runtime',async()=>{
  const app=read('src/app.mjs');
  const ui=read('src/ui/branding.mjs');

  assert.match(app,/getEffectiveBranding/,'app ainda nao consome branding efetivo');
  assert.ok(app.includes('data-density="${brand.density}"'),'shell nao expoe densidade efetiva');
  assert.ok(app.includes('${esc(brand.companyName)}'),'nome comercial efetivo nao aparece no login');
  assert.ok(app.includes('${esc(brand.slogan)}'),'slogan efetivo nao aparece no login');
  assert.doesNotMatch(app,/GD_BRAND\.companyName/,'nome comercial continua fixo em GD_BRAND');
  assert.doesNotMatch(app,/GD_BRAND\.slogan/,'slogan continua fixo em GD_BRAND');
  assert.match(ui,/export function renderBrandLogo/,'componente generico de logo ainda nao existe');

  const {renderBrandLogo,renderGDLogo}=await import('../src/ui/branding.mjs');
  const html=renderBrandLogo({variant:'compact',alt:'George Rent'});
  assert.match(html,/gd-logo-compact\.svg/);
  assert.match(html,/alt="George Rent"/);
  assert.equal(renderGDLogo({variant:'icon'}),renderBrandLogo({variant:'icon'}));
});
