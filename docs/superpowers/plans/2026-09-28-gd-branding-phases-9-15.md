# GD Locações Fases 9–15 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concluir as Fases 9–15 da identidade GD Locações em PWA, Electron, documentos, branding por empresa, configurações, responsividade e acessibilidade, sem alterar regras de negócio.

**Architecture:** Criar um domínio central de branding com defaults GD e normalização segura. UI e documentos consomem o branding efetivo; PWA e Electron mantêm metadados estáticos da distribuição GD. A camada visual existente permanece, com uma nova folha final dedicada a responsividade e acessibilidade.

**Tech Stack:** JavaScript ES modules, Node 22, Electron 39, electron-builder 26, CSS, Service Worker/PWA, PDF manual existente, node:test, QA/E2E existente.

**Spec:** `docs/superpowers/specs/2026-09-28-gd-branding-phases-9-15-design.md`

## Global Constraints

- Dourado não pode ser cor principal de números, preços, KPIs ou texto corrido.
- Dourado fica restrito a logo, CTA principal, item ativo, foco e detalhes discretos.
- Verde/vermelho/azul operacional mantêm significado semântico; nenhum estado pode depender apenas de cor.
- Sem dependência paga, sem CDN, sem URL externa de logo, sem CSS/HTML/JS arbitrário em branding.
- `settings.companyName` continua sendo a fonte canônica do nome da empresa.
- `settings.branding` armazena apenas `slogan`, `preset`, `density` e `logoVariant`.
- `preset='gd'`; `logoVariant='gd'`; `density` aceita apenas `comfortable` ou `compact`.
- Slogan é normalizado como string simples, `trim()`, máximo de 80 caracteres; a UI usa `maxlength="80"` e renderização escapada.
- `appId` permanece `com.artisys.locadora` para preservar dados/upgrade.
- Electron mantém `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true` e não ganha IPC de branding.
- Nenhuma regra de locação, financeiro, autenticação, persistência ou sincronização pode mudar.
- TDD obrigatório em cada tarefa: RED observável antes da implementação e GREEN antes do commit.

## Review Focus

1. Snapshot legado sem `settings` ou `settings.branding` deve abrir com defaults GD sem apagar campos antigos — coberto na Task 1.
2. Branding malformado (`density`, `preset`, `logoVariant`, slogan não string/maior que 80) não pode quebrar UI — coberto na Task 1.
3. Empresa com `companyName` próprio não pode ser renomeada silenciosamente para GD ao restaurar aparência — coberto na Task 6.
4. PWA atualizado deve invalidar cache antigo e continuar offline após primeiro carregamento — coberto na Task 3.
5. Layout em 360 px e navegação por teclado não podem esconder ação essencial ou foco — coberto nas Tasks 7 e 8.

---

### Task 1: Domínio central de branding e compatibilidade de snapshot — Fase 12

**Files:**
- Create: `src/domain/branding.mjs`
- Modify: `src/domain/p1.mjs`
- Modify: `package.json`
- Test: `tests/branding-domain.test.mjs`

**Interfaces:**
- Produces: `DEFAULT_GD_BRANDING`, `BRANDING_LIMITS`, `normalizeBranding(value)`, `getEffectiveBranding(settings)`.
- `getEffectiveBranding(settings)` retorna `{ companyName, slogan, preset, density, logoVariant }`.

- [ ] **Step 1: Write the failing test**

Criar testes que afirmem: default GD; preservação de `settings.companyName`; fallback para enums inválidos; slogan limitado a 80 caracteres; snapshot sem `settings` ganha estrutura válida; campos `document`, `phone` e `address` existentes permanecem intactos.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branding-domain.test.mjs`
Expected: FAIL por `src/domain/branding.mjs` inexistente ou exports ausentes.

- [ ] **Step 3: Implement domain and snapshot normalization**

Adicionar em `src/domain/branding.mjs` os exports acima. Em `ensureP1Snapshot`, garantir `snapshot.settings` como objeto e `snapshot.settings.branding=normalizeBranding(snapshot.settings.branding)` sem remover campos existentes. Adicionar `node --check src/domain/branding.mjs` ao script `check`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branding-domain.test.mjs && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: centralizar branding GD no dominio"`

### Task 2: UI consome branding efetivo e densidade — Fase 12

**Files:**
- Modify: `src/ui/branding.mjs`
- Modify: `src/app.mjs`
- Test: `tests/branding-runtime.test.mjs`

**Interfaces:**
- Consumes: `getEffectiveBranding(settings)` da Task 1.
- Produces: `renderBrandLogo({ variant, className, alt })` com assets GD empacotados; mantém alias `renderGDLogo` se necessário para compatibilidade.

- [ ] **Step 1: Write the failing test**

Testar que `src/app.mjs` usa branding efetivo para nome/slogan, aplica `data-density` no shell e login e não usa `GD_BRAND.companyName` como fonte fixa do nome comercial.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branding-runtime.test.mjs`
Expected: FAIL porque o app ainda usa branding fixo.

- [ ] **Step 3: Implement runtime branding**

Obter `const brand=getEffectiveBranding(snapshot.settings)` durante renderização; usar `brand.companyName`, `brand.slogan` e `brand.density`. Manter assets GD locais para `logoVariant='gd'`; fallback para GD em qualquer valor inesperado.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branding-runtime.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: aplicar branding efetivo na interface"`

### Task 3: PWA GD Locações — Fase 9

**Files:**
- Modify: `manifest.webmanifest`
- Modify: `index.html`
- Modify: `sw.js`
- Test: `tests/branding-pwa.test.mjs`

**Interfaces:**
- Static distribution identity: `GD Locações`, short name `GD`, theme `#06111d`, icon `./assets/branding/gd-icon.svg`.

- [ ] **Step 1: Write the failing test**

Afirmar nome/short_name/theme/icon no manifesto; `<title>GD Locações</title>`, theme-color e favicon GD no HTML; cache do SW com nova versão e inclusão de `src/domain/branding.mjs` e da folha responsiva quando existir.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branding-pwa.test.mjs`
Expected: FAIL porque manifesto/título/cache ainda usam identidade genérica.

- [ ] **Step 3: Implement PWA metadata and cache**

Atualizar manifesto e HTML; renomear cache para `gd-locacoes-0.7.0-phases-9-15-1`; trocar referência principal de ícone para `gd-icon.svg`; preservar `display:'standalone'`, `start_url:'./'`, `scope:'./'` e estratégia offline atual.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branding-pwa.test.mjs && npm run build`
Expected: PASS e `dist/` gerado.

- [ ] **Step 5: Commit**

`git commit -m "feat: finalizar identidade GD no PWA"`

### Task 4: Desktop Electron GD — Fase 10

**Files:**
- Modify: `package.json`
- Modify: `electron/main.cjs`
- Test: `tests/branding-desktop.test.mjs`

**Interfaces:**
- Package: `productName='GD Locações'`, `artifactName='GD-Locacoes-Setup-${version}.${ext}'`.
- Window: `title:'GD Locações'`; segurança Electron preservada.

- [ ] **Step 1: Write the failing test**

Afirmar productName/artifactName, `appId` inalterado, título da BrowserWindow, e presença de `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branding-desktop.test.mjs`
Expected: FAIL em productName/título.

- [ ] **Step 3: Implement desktop branding**

Atualizar metadados do builder e `BrowserWindow`. Usar asset GD compatível já empacotado onde Electron aceitar sem introduzir conversão externa; se o alvo Windows exigir `.ico`, manter icon do pacote sem configuração inválida e registrar a limitação no PR em vez de quebrar build.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branding-desktop.test.mjs && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: aplicar identidade GD no desktop"`

### Task 5: Documentos PDF com cabeçalho de marca — Fase 11

**Files:**
- Modify: `src/domain/documents.mjs`
- Test: `tests/documents-branding.test.mjs`

**Interfaces:**
- Consumes: `getEffectiveBranding(settings)`.
- Extend: `buildSimplePdf({ title, lines, branding, companyDocument })` preservando chamadas existentes com defaults.

- [ ] **Step 1: Write the failing test**

Criar fixture mínima e afirmar que contrato, recibo, diária, vistoria e contrato emitido continuam iniciando com `%PDF-1.4`, contêm nome/slogan efetivos no stream ASCII e preservam conteúdo operacional já esperado. Afirmar que empresa customizada aparece no cabeçalho.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/documents-branding.test.mjs`
Expected: FAIL porque PDFs atuais não têm cabeçalho comum de branding.

- [ ] **Step 3: Implement branded PDF header**

Adicionar cabeçalho textual escuro e uma divisória vetorial discreta dourada no content stream; não incluir JPEG/logo raster e não adicionar biblioteca PDF. Todas as funções de documento devem fornecer `snapshot.settings` ao cabeçalho.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/documents-branding.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: adicionar identidade GD aos documentos"`

### Task 6: Configurações de aparência — Fase 13

**Files:**
- Modify: `src/ui/system.mjs`
- Modify: `styles-branding.css`
- Test: `tests/branding-settings.test.mjs`
- E2E: `qa/e2e/branding-settings.test.cjs`

**Interfaces:**
- Consumes: `DEFAULT_GD_BRANDING`, `normalizeBranding`, `getEffectiveBranding`.
- Admin-only form IDs: `appearance-form`, `appearance-reset`.

- [ ] **Step 1: Write the failing unit/contract test**

Afirmar presença de seção `Aparência`, slogan `maxlength="80"`, densidade somente comfortable/compact, identidade GD fixa, ausência de inputs de cor/URL/upload/CSS e reset protegido contra sobrescrever nome comercial silenciosamente.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branding-settings.test.mjs`
Expected: FAIL porque a seção não existe.

- [ ] **Step 3: Implement admin appearance form and preview**

Salvar via `save({...snapshot, settings:{...snapshot.settings, companyName, branding:normalizeBranding(...)}})`. `Restaurar padrão GD` restaura branding; para alterar `companyName` para `GD Locações`, pedir confirmação explícita via `window.confirm` e manter o nome atual se negado.

- [ ] **Step 4: Add E2E coverage**

Cobrir login admin, edição de slogan/densidade, reload/persistência e reset sem perda do nome customizado quando confirmação é negada.

- [ ] **Step 5: Run tests**

Run: `node --test tests/branding-settings.test.mjs && node --test --test-concurrency=1 qa/e2e/branding-settings.test.cjs`
Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat: adicionar configuracoes de aparencia GD"`

### Task 7: Responsividade operacional — Fase 14

**Files:**
- Create: `styles-responsive-accessibility.css`
- Modify: `index.html`
- Modify: `scripts/build-web.mjs`
- Modify: `package.json`
- Modify: `sw.js`
- E2E: `qa/e2e/responsive.test.cjs`
- Test: `tests/responsive-accessibility-contract.test.mjs`

**Interfaces:**
- CSS carregado por último.
- Densidade via `[data-density='compact']` e `[data-density='comfortable']`.

- [ ] **Step 1: Write failing contract and viewport tests**

Afirmar carregamento/empacotamento/cache da nova folha; em E2E validar 360, 768 e 1280 px: shell navegável, sem overflow horizontal do body, tabelas acessíveis via `.table-wrap`, modais dentro da viewport e controles principais com altura mínima de 40 px em touch.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/responsive-accessibility-contract.test.mjs && node --test qa/e2e/responsive.test.cjs`
Expected: FAIL por folha inexistente/regras ausentes.

- [ ] **Step 3: Implement responsive CSS**

Adicionar regras focadas em comportamento: shell mobile, nav com scroll quando necessário, topbar wrap/scroll, grids em uma coluna, `.table-wrap{overflow-x:auto}`, modal com `max-height:calc(100dvh - 24px); overflow:auto`, formulários em uma coluna abaixo do breakpoint adequado, largura máxima 100% para inputs/buttons/media.

- [ ] **Step 4: Run tests**

Run: `node --test tests/responsive-accessibility-contract.test.mjs && node --test qa/e2e/responsive.test.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: revisar responsividade do sistema GD"`

### Task 8: Acessibilidade e estados perceptíveis — Fase 15

**Files:**
- Modify: `styles-responsive-accessibility.css`
- Modify: `src/app.mjs`
- Modify: `src/ui/common.mjs`
- Modify selectively: `src/ui/p1.mjs`, `src/ui/system.mjs`, `src/ui/reservas.mjs`, `src/ui/cadastros.mjs`, `src/ui/financeiro.mjs`, `src/ui/commercial.mjs`, `src/ui/p2.mjs` only where controls lack accessible names/labels.
- Test: `tests/accessibility-contract.test.mjs`
- E2E: `qa/e2e/accessibility.test.cjs`

**Interfaces:**
- `toast(message)` creates live announcement (`role='status'`, `aria-live='polite'`).
- Modal keeps accessible close name and gets dialog semantics.

- [ ] **Step 1: Write failing accessibility tests**

Afirmar `:focus-visible`, `prefers-reduced-motion`, disabled state not based only on opacity/color, toast live region, modal `role="dialog"`/`aria-modal="true"`, login error with live announcement and keyboard navigation through login/nav/primary forms.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/accessibility-contract.test.mjs && node --test qa/e2e/accessibility.test.cjs`
Expected: FAIL nos contratos ainda ausentes.

- [ ] **Step 3: Implement accessibility fixes**

Adicionar semântica e CSS sem reordenar DOM nem alterar fluxos. Manter texto/ícone/borda para status importantes; não converter estados de negócio em dourado.

- [ ] **Step 4: Run tests**

Run: `node --test tests/accessibility-contract.test.mjs && node --test qa/e2e/accessibility.test.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: concluir acessibilidade da identidade GD"`

### Task 9: Release gate integrado das Fases 9–15

**Files:**
- Modify only if required by discovered gate: `.github/workflows/ci.yml`, `.github/workflows/windows-build.yml`, `qa/artisys-qa/locadora.config.json`.
- No business-code changes unless a failing test proves a regression introduced in Tasks 1–8.

**Interfaces:**
- Produces a branch release-candidate ready for PR.

- [ ] **Step 1: Run full verification**

Run: `npm run verify`
Expected: PASS.

- [ ] **Step 2: Run coverage and E2E**

Run: `npm run coverage && npm run e2e && npm run qa:release`
Expected: PASS.

- [ ] **Step 3: Run web build**

Run: `npm run build`
Expected: PASS e `dist/` contendo `styles-responsive-accessibility.css`, branding domain e assets GD.

- [ ] **Step 4: Push branch and validate CI**

Abrir/atualizar PR `feat/gd-branding-phases-9-15 -> main` como draft até os dois workflows concluírem.
Expected: `Locadora Verify` success e `Locadora Windows Build` success, incluindo criação/validação/instalação/teste do instalador.

- [ ] **Step 5: Final review**

Comparar `main...feat/gd-branding-phases-9-15` e confirmar: nenhuma mudança de regras de negócio; `appId` intacto; sem dependência nova; sem regressão para dourado em KPIs/texto; PWA/desktop/documentos/configurações/responsividade/acessibilidade cobertos.

- [ ] **Step 6: Commit documentation adjustments if needed**

`git commit -m "docs: registrar verificacao fases 9-15 GD"`
