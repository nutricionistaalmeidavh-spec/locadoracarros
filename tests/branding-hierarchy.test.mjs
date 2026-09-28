import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const baseStylesPath = resolve(root, 'styles-branding.css');
const balanceStylesPath = resolve(root, 'styles-branding-balance.css');

test('branding GD usa dourado como assinatura, não como cor de leitura', () => {
  assert.equal(existsSync(balanceStylesPath), true, 'camada de harmonização visual GD não existe');

  const base = readFileSync(baseStylesPath, 'utf8');
  const balance = readFileSync(balanceStylesPath, 'utf8');
  const index = readFileSync(resolve(root, 'index.html'), 'utf8');

  assert.ok(index.indexOf('styles-branding-balance.css') > index.indexOf('styles-branding.css'),
    'harmonização deve carregar depois da identidade base');

  const neutralValueRules = [
    /\[data-screen="dashboard"\] \.cards\.six article:nth-child\(4\) strong,[\s\S]*?color:\s*var\(--gd-bg-secondary\)/,
    /\[data-screen="dashboard"\] \.kpi-lines b\s*\{[^}]*color:\s*var\(--gd-bg-secondary\)/,
    /\[data-screen="reservas"\] \.cards article:nth-child\(3\) strong\s*\{[^}]*color:\s*var\(--gd-bg-secondary\)/,
    /\[data-screen="frota"\] \.vehicle > div > b,[\s\S]*?color:\s*var\(--gd-bg-secondary\)/,
    /\[data-screen="financeiro"\] > \.cards article:nth-child\(3\) strong,[\s\S]*?color:\s*var\(--gd-bg-secondary\)/
  ];

  for (const pattern of neutralValueRules) {
    assert.match(balance, pattern, 'números e KPIs principais devem usar leitura neutra/azul-marinho');
  }

  assert.match(balance, /tbody tr:hover\s*\{[^}]*background:\s*#f7f8fa/i,
    'hover de tabela deve ser neutro');
  assert.doesNotMatch(balance, /#fffdf7|#faf8f2/i,
    'fundos amarelados não devem dominar hover, cards ou campos');
  assert.match(balance, /input\[name="amount"\][\s\S]*?background:\s*#fff/,
    'campos de valor devem permanecer neutros e legíveis');

  assert.match(base, /\.sidebar \.nav\.active[\s\S]*?var\(--gd-gold/,
    'dourado deve permanecer como assinatura no item ativo');
  assert.match(base, /\.shell \.primary[\s\S]*?background:\s*var\(--gd-gold\)/,
    'dourado deve permanecer em CTA principal');
  assert.match(base, /focus-visible[\s\S]*?outline:\s*2px solid var\(--gd-gold\)/,
    'dourado deve permanecer no foco acessível');

  assert.doesNotMatch(balance, /\.shell \.primary\s*\{/,
    'camada de harmonização não deve remover dourado dos CTAs');
  assert.doesNotMatch(balance, /\.sidebar \.nav\.active\s*\{/,
    'camada de harmonização não deve remover assinatura da navegação ativa');
});
