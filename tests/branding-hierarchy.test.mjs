import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const css = readFileSync(resolve(root, 'styles-branding.css'), 'utf8');

test('branding GD usa dourado como assinatura, não como cor de leitura', () => {
  const forbiddenGoldValuePatterns = [
    /\[data-screen="dashboard"\] \.cards\.six article:nth-child\(4\) strong,[\s\S]*?color:\s*var\(--gd-gold-dark\)/,
    /\[data-screen="dashboard"\] \.kpi-lines b\s*\{[^}]*color:\s*var\(--gd-gold-dark\)/,
    /\[data-screen="frota"\] \.vehicle > div > b,[\s\S]*?color:\s*var\(--gd-gold-dark\)/,
    /\[data-screen="financeiro"\] > \.cards article:nth-child\(3\) strong,[\s\S]*?color:\s*var\(--gd-gold-dark\)/
  ];

  for (const pattern of forbiddenGoldValuePatterns) {
    assert.doesNotMatch(css, pattern, 'números e KPIs principais não devem usar dourado como cor de leitura');
  }

  assert.doesNotMatch(css, /#fffdf7|#faf8f2/i, 'fundos amarelados não devem dominar hover, cards ou campos');

  assert.match(css, /\.sidebar \.nav\.active[\s\S]*?var\(--gd-gold/,
    'dourado deve permanecer como assinatura no item ativo');
  assert.match(css, /\.shell \.primary[\s\S]*?background:\s*var\(--gd-gold\)/,
    'dourado deve permanecer em CTA principal');
  assert.match(css, /focus-visible[\s\S]*?outline:\s*2px solid var\(--gd-gold\)/,
    'dourado deve permanecer no foco acessível');
});
