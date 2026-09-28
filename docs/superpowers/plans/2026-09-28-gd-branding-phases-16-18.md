# GD Locações Fases 16–18 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar a integração visual GD Locações com regressão final, QA multiplataforma e release Windows verificável, sem alterar regras de negócio.

**Architecture:** O trabalho preserva a arquitetura atual e atua apenas sobre resíduos de branding, cobertura E2E e documentação/release. A regressão estática terá whitelist explícita para aliases técnicos legados; a QA reutilizará o Electron e a infraestrutura E2E existentes; o release continuará usando os gates já definidos em `package.json` e GitHub Actions.

**Tech Stack:** JavaScript ESM, Node.js test runner, Electron 39, Playwright via `qa/artisys-qa`, electron-builder/NSIS, SQLite local.

**Spec:** `docs/superpowers/specs/2026-09-28-gd-branding-phases-16-18-design.md`

## Global Constraints

- Dourado permanece cor de assinatura, não de leitura principal.
- Azul-marinho, branco e neutros sustentam conteúdo e hierarquia.
- Verde/vermelho continuam reservados para significado operacional.
- Não alterar regras de locação, financeiro, autenticação, persistência, sync ou RBAC.
- Não adicionar serviço ou dependência paga.
- Nome visível do produto: `GD Locações`.
- Instalador canônico: `GD-Locacoes-Setup-${version}.exe`.
- Aliases legados podem existir somente para compatibilidade técnica invisível ao usuário.
- A `main` não é alterada sem ordem explícita de merge.

## Review Focus

1. **Instalação nova** — `createEmptySnapshot()` não pode reintroduzir `Sistema Locadora` como nome comercial; o padrão deve nascer como `GD Locações`.
2. **Asset legado empacotado** — `assets/icon.svg` não pode continuar exibindo `LV`/laranja mesmo que o manifesto já use o novo asset.
3. **Alias técnico vazando para o usuário** — `Sistema Locadora` pode existir apenas no executável/alias necessário ao CI legado, nunca em UI, manifesto, README ou documento de usuário.
4. **Viewport estreita + densidade compacta** — todas as telas principais devem permanecer acessíveis a 360 px sem overflow impeditivo e sem perder foco/ações.
5. **Backup/restore/sync** — `settings.branding` deve sobreviver a envelope de backup, restore e merge de snapshots sem ser descartado.

---

### Task 1: Contrato final de resíduos visuais e defaults GD

**Files:**
- Create: `tests/branding-final-regression.test.mjs`
- Modify: `src/domain/rental.mjs`
- Modify: `assets/icon.svg`

**Interfaces:**
- Consumes: `createEmptySnapshot()` de `src/domain/rental.mjs` e os assets GD já existentes em `assets/branding/`.
- Produces: contrato estático que separa branding visível de aliases técnicos permitidos.

- [ ] **Step 1: Write the failing test**

Criar `tests/branding-final-regression.test.mjs` com estes contratos:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createEmptySnapshot } from '../src/domain/rental.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('fase 16: instalação nova nasce com identidade GD', () => {
  assert.equal(createEmptySnapshot().settings.companyName, 'GD Locações');
});

test('fase 16: asset legado empacotado não exibe LV nem laranja antigo', () => {
  const icon = read('assets/icon.svg');
  assert.doesNotMatch(icon, />LV</);
  assert.doesNotMatch(icon, /#f37a20/i);
  assert.match(icon, /GD Locações|>G<|>D</);
});

test('fase 16: superfícies visíveis não reintroduzem a marca antiga', () => {
  for (const path of ['index.html','manifest.webmanifest','src/app.mjs','src/ui/system.mjs','src/domain/documents.mjs']) {
    const source = read(path);
    assert.doesNotMatch(source, /ARTISYS|<span class="brandmark">LV<\/span>/i, path);
    assert.doesNotMatch(source, /Sistema Locadora/i, path);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branding-final-regression.test.mjs`

Expected: FAIL pelo menos em `createEmptySnapshot().settings.companyName === 'Sistema Locadora'` e no `assets/icon.svg` que ainda contém `LV`/`#f37a20`.

- [ ] **Step 3: Make the minimum branding fixes**

Em `src/domain/rental.mjs`, alterar somente o default de `settings.companyName` para `GD Locações`, preservando os demais campos e a estrutura do snapshot.

Em `assets/icon.svg`, substituir o conteúdo visual legado por um ícone GD empacotado coerente com `assets/branding/gd-icon.svg`; não introduzir URL externa nem dependência nova.

- [ ] **Step 4: Run the focused and neighboring tests**

Run:

```bash
node --test tests/branding-final-regression.test.mjs tests/branding-domain.test.mjs tests/branding-hierarchy.test.mjs tests/cloudflare-build.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/branding-final-regression.test.mjs src/domain/rental.mjs assets/icon.svg
git commit -m "fix: remover residuos visuais legados da GD"
```

---

### Task 2: Documentação pública e nomenclatura de release

**Files:**
- Create: `tests/branding-release-docs.test.mjs`
- Modify: `README.md`
- Modify: `docs/branding/README.md`

**Interfaces:**
- Consumes: nome canônico `GD Locações`, instalador `GD-Locacoes-Setup-${version}.exe`, arquitetura de `settings.branding` das Fases 9–15.
- Produces: documentação de usuário/release sem marca antiga e uma whitelist explícita dos resíduos puramente técnicos.

- [ ] **Step 1: Write the failing documentation contract**

Criar `tests/branding-release-docs.test.mjs` e exigir:

```js
test('fase 18: README apresenta GD e o instalador canônico', () => {
  const readme = read('README.md');
  assert.match(readme, /^# GD Locações/m);
  assert.match(readme, /release\/GD-Locacoes-Setup-0\.7\.0\.exe/);
  assert.doesNotMatch(readme, /Sistema standalone .* ArtiSys/i);
});

test('fase 18: documentação de branding registra regras finais e aliases técnicos', () => {
  const branding = read('docs/branding/README.md');
  assert.match(branding, /dourado.*assinatura/i);
  assert.match(branding, /settings\.branding/);
  assert.match(branding, /GD-Locacoes-Setup-\$\{version\}\.exe/);
  assert.match(branding, /alias.*técnic/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branding-release-docs.test.mjs`

Expected: FAIL porque `README.md` ainda começa com `Sistema Locadora`, apresenta o produto como ArtiSys e documenta o instalador antigo; `docs/branding/README.md` ainda é mínimo.

- [ ] **Step 3: Update user-facing documentation**

Em `README.md`:
- título `GD Locações`;
- descrição neutra do produto, sem apresentar ArtiSys como marca do sistema;
- saída de build `release/GD-Locacoes-Setup-0.7.0.exe`;
- preservar toda a documentação funcional válida.

Em `docs/branding/README.md`, documentar de forma curta:
- regra de dourado como assinatura;
- `src/domain/branding.mjs` + `settings.branding`;
- PWA/Desktop/PDFs cobertos;
- comandos `npm run verify`, `npm run coverage`, `npm run e2e`, `npm run qa:release`, `npm run dist`;
- aliases `Sistema-Locadora-Setup-*` / `Sistema Locadora.exe` como compatibilidade técnica invisível enquanto o workflow legado exigir.

- [ ] **Step 4: Verify documentation contracts**

Run:

```bash
node --test tests/branding-release-docs.test.mjs tests/windows-ci-build.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/branding-release-docs.test.mjs README.md docs/branding/README.md
git commit -m "docs: fechar identidade e release GD"
```

---

### Task 3: Persistência final de branding em backup/restore/sync

**Files:**
- Create: `tests/branding-persistence-release.test.mjs`
- Modify only if a real regression is found: `src/domain/backup.mjs`, `src/domain/sync.mjs`, `src/domain/p1.mjs`

**Interfaces:**
- Consumes: `createBackupEnvelope(snapshot)`, `restoreBackupEnvelope(raw)`, `prepareSnapshotRestore(backup,current,opts)`, `mergeSnapshots(server,client)`, `ensureP1Snapshot(snapshot)`.
- Produces: prova automatizada de que `settings.branding` não é perdido pelos caminhos de segurança de dados.

- [ ] **Step 1: Write the persistence tests**

Criar cenários com `settings.companyName='George Rent'` e `settings.branding={slogan:'Mobilidade do seu jeito',preset:'gd',density:'compact',logoVariant:'gd'}`.

Testes obrigatórios:

```js
test('fase 17: backup e restore preservam settings.branding', async () => { /* createBackupEnvelope -> restoreBackupEnvelope -> ensureP1Snapshot */ });
test('fase 17: restore point preserva settings.branding', () => { /* prepareSnapshotRestore */ });
test('fase 17: merge de snapshots preserva branding do snapshot mais novo', () => { /* mergeSnapshots com updatedAt distintos */ });
```

Asserções: `companyName`, `slogan`, `density`, `preset` e `logoVariant` mantêm os valores esperados.

- [ ] **Step 2: Run the tests**

Run: `node --test tests/branding-persistence-release.test.mjs`

Expected: PASS se a arquitetura das Fases 9–15 estiver correta. Se algum cenário falhar, tratar como regressão real e não relaxar a asserção.

- [ ] **Step 3: Fix only confirmed persistence regressions**

Se houver falha, alterar apenas o ponto que descarta `settings`/`settings.branding`; não criar um armazenamento separado, não alterar formato de backup e não modificar regras de merge de entidades sem necessidade.

- [ ] **Step 4: Run neighboring data-safety tests**

Run:

```bash
node --test tests/branding-persistence-release.test.mjs tests/*backup*.test.mjs tests/*sync*.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/branding-persistence-release.test.mjs src/domain/backup.mjs src/domain/sync.mjs src/domain/p1.mjs
git commit -m "test: fechar persistencia do branding GD"
```

Adicionar ao commit apenas os módulos de domínio que realmente tiverem sido modificados.

---

### Task 4: Matriz responsiva final em todas as superfícies principais

**Files:**
- Modify: `qa/e2e/responsive.test.cjs`
- Modify only if a regression is reproduced: `styles-responsive-accessibility.css`, CSS da tela afetada

**Interfaces:**
- Consumes: `launchLocadora()`, login administrativo existente e navegação `data-nav` de `src/app.mjs`.
- Produces: regressão E2E em 360/768/1280 px cobrindo todas as telas principais renderizáveis.

- [ ] **Step 1: Expand the E2E test before changing CSS**

Para cada largura `[360,768,1280]`, após login, percorrer os ids de navegação administrativos:

```js
[
  'dashboard','reservas','clientes','frota','vistorias','manutencao',
  'financeiro','cobrancas','inadimplencia','contratos','alertas',
  'documentos','sync','auditoria','backup'
]
```

Para cada tela, aguardar `[data-screen="<id>"]` e verificar:
- `document.documentElement.scrollWidth <= window.innerWidth + 1`;
- `#view` visível;
- navegação ainda acessível;
- em 360 px, nenhum modal aberto pelo teste ultrapassa a largura da viewport.

Executar a mesma passagem pelo menos uma vez após definir `data-density="compact"` via tela Aparência ou snapshot de teste.

- [ ] **Step 2: Run E2E to identify real layout failures**

Run: `node --test --test-concurrency=1 qa/e2e/responsive.test.cjs`

Expected: PASS ou FAIL apenas em telas que realmente tenham overflow/ação inacessível.

- [ ] **Step 3: Fix only reproduced layout defects**

Se houver falha, corrigir a menor regra possível em `styles-responsive-accessibility.css` ou no CSS específico da tela. Não reestruturar navegação, DOM ou regras de negócio por motivo visual.

- [ ] **Step 4: Re-run responsive and accessibility suites**

Run:

```bash
node --test --test-concurrency=1 qa/e2e/responsive.test.cjs qa/e2e/accessibility.test.cjs qa/e2e/branding-settings.test.cjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add qa/e2e/responsive.test.cjs styles-responsive-accessibility.css styles.css styles-p1.css styles-p2.css styles-branding.css styles-branding-balance.css
git commit -m "test: ampliar regressao responsiva final GD"
```

Adicionar ao commit apenas os CSS realmente modificados.

---

### Task 5: Smoke funcional final e acessibilidade operacional

**Files:**
- Create: `qa/e2e/release-smoke.test.cjs`
- Modify only if a regression is reproduced: UI module responsável pelo fluxo quebrado

**Interfaces:**
- Consumes: fixtures Electron existentes, snapshot SQLite de QA e seletores públicos já usados pela suíte.
- Produces: um smoke final que prova os fluxos essenciais sem substituir os testes de domínio existentes.

- [ ] **Step 1: Write the final smoke scenarios**

Cobrir, em uma sessão administrativa isolada:
- login e logout;
- criar/editar cliente;
- cadastrar/editar veículo;
- criar/editar reserva/locação;
- registrar ao menos um evento financeiro já suportado pela UI;
- abrir a tela de documentos/contratos com dados válidos;
- salvar Aparência e recarregar;
- abrir Backup e validar que as ações estão disponíveis;
- abrir PC ↔ Mobile e validar que a tela renderiza sem erro mesmo quando sync estiver desativado;
- abrir e fechar um modal por teclado com `Escape` e verificar retorno de foco.

Não duplicar regras de cálculo; o smoke verifica que os fluxos continuam operáveis na aplicação empacotável.

- [ ] **Step 2: Run the new smoke test**

Run: `node --test --test-concurrency=1 qa/e2e/release-smoke.test.cjs`

Expected: PASS ou falha objetiva no fluxo que precisa ser corrigido.

- [ ] **Step 3: Fix only reproduced functional regressions**

Qualquer alteração de produto exige teste que falhou primeiro. Se a falha for exclusivamente do teste/fixture, corrigir o teste sem alterar comportamento funcional.

- [ ] **Step 4: Run the complete E2E suite**

Run: `npm run e2e`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add qa/e2e/release-smoke.test.cjs src/ui src/app.mjs
git commit -m "test: fechar smoke funcional da GD"
```

Adicionar código de produto somente quando houver correção real.

---

### Task 6: Release gate final e PR de fechamento

**Files:**
- Modify only if evidence requires: arquivos de configuração/teste já cobertos pelas tarefas anteriores
- No new product feature files

**Interfaces:**
- Consumes: todos os contratos e E2E das Tasks 1–5.
- Produces: branch final com evidência de release e PR pronta para merge, ainda não integrada à `main`.

- [ ] **Step 1: Run static/domain gates**

Run: `npm run verify`

Expected: PASS.

- [ ] **Step 2: Run coverage**

Run: `npm run coverage`

Expected: PASS.

- [ ] **Step 3: Run Electron E2E**

Run: `npm run e2e`

Expected: PASS.

- [ ] **Step 4: Run ArtiSys QA release gate**

Run: `npm run qa:release`

Expected: PASS. O nome `ArtiSys QA` é infraestrutura técnica de QA, não branding visível do produto e não deve ser renomeado nesta entrega.

- [ ] **Step 5: Validate Windows distribution**

Run: `npm run dist` quando executável no ambiente; no GitHub Actions, confirmar `Locadora Windows Build` com:
- build do instalador;
- validação do instalador;
- instalação de QA;
- execução da aplicação empacotada;
- upload de artefato.

Expected: PASS e presença do instalador canônico `GD-Locacoes-Setup-0.7.0.exe`; alias técnico legado pode coexistir somente para o CI.

- [ ] **Step 6: Open/update the final PR**

Criar PR `feat/gd-branding-phases-16-18 -> main` com resumo das correções objetivas e links/evidências dos gates. Não fazer merge sem ordem explícita do usuário.

- [ ] **Step 7: Final verification against the spec**

Confirmar:
- nenhuma marca antiga visível nas superfícies de produto;
- regra do dourado continua respeitada;
- matriz 360/768/1280 e teclado passam;
- branding persiste em backup/restore/sync;
- Verify, coverage, E2E, QA release e Windows Build estão verdes;
- PR está pronta para merge, mas `main` permanece intocada.
