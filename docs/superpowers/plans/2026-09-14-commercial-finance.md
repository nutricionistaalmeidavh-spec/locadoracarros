# Commercial Finance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar editor de contratos, cobranças recorrentes e inadimplência integrados ao SQLite/snapshot/sync existentes.

**Architecture:** Novos domínios puros estendem o snapshot para v4 sem criar backend. O financeiro recorrente reutiliza o ledger atual sem duplicar receita; contratos emitidos guardam cópia imutável; inadimplência é derivada das parcelas e mantém histórico de cobrança.

**Tech Stack:** JavaScript ES Modules, Node test runner, Electron, PWA, SQLite/sql.js, HTML/CSS existente.

**Spec:** `docs/superpowers/specs/2026-09-14-commercial-finance-design.md`

## Global Constraints

- Persistência somente SQLite; não usar `localStorage`.
- Sem multi-tenant.
- Sem Asaas/gateway nesta entrega.
- Preservar snapshots anteriores e fluxo financeiro sem plano.
- Toda mutação crítica auditada.
- Novas coleções sincronizadas PC ↔ PWA.

---

### Task 1: Snapshot v4 e contratos

**Files:**
- Create: `src/domain/commercial.mjs`
- Test: `tests/contracts.test.mjs`
- Modify: `src/storage/repository.mjs`, `src/domain/documents.mjs`

**Interfaces:**
- `ensureCommercialSnapshot(snapshot)` normaliza as novas coleções.
- `createContractTemplate`, `updateContractTemplate`, `duplicateContractTemplate`, `archiveContractTemplate`, `setDefaultContractTemplate`.
- `contractVariables`, `renderContractTemplate`, `issueContract`, `issuedContractPdf`.

- [ ] Escrever testes RED para migração v3→v4, CRUD/versionamento, variáveis desconhecidas e emissão imutável.
- [ ] Confirmar RED.
- [ ] Implementar domínio mínimo e integração de PDF.
- [ ] Confirmar GREEN.

### Task 2: Cobranças recorrentes

**Files:**
- Create: `src/domain/billing.mjs`
- Test: `tests/billing.test.mjs`
- Modify: `src/domain/commercial.mjs`, `src/domain/rental.mjs`

**Interfaces:**
- `createBillingPlan(snapshot,input,actorId)`.
- `installmentTotals(installment,asOf)`.
- `registerBillingPayment(snapshot,installmentId,input,actorId)`.
- `cancelBillingPlan(snapshot,planId,actorId)`.

- [ ] Escrever testes RED para mensal 28/30/31, quinzenal/personalizado, rateio sem centavos perdidos, substituição do recebível original sem receita duplicada, parcial/total e multa/juros.
- [ ] Confirmar RED.
- [ ] Implementar domínio e ledger.
- [ ] Confirmar GREEN.

### Task 3: Inadimplência e régua de cobrança

**Files:**
- Create: `src/domain/delinquency.mjs`
- Test: `tests/delinquency.test.mjs`

**Interfaces:**
- `buildDelinquency(snapshot,{asOf})`.
- `buildAgingReport(snapshot,{asOf})`.
- `addCollectionActivity(snapshot,input,actorId)`.

- [ ] Escrever testes RED para atraso, aging, valores atualizados, próximos 7 dias e atividade/promessa.
- [ ] Confirmar RED.
- [ ] Implementar domínio.
- [ ] Confirmar GREEN.

### Task 4: Sync, RBAC e UI

**Files:**
- Create: `src/ui/contracts.mjs`, `src/ui/billing.mjs`, `styles-p3.css`
- Modify: `src/domain/sync.mjs`, `src/domain/auth.mjs`, `src/app.mjs`, `src/ui/financeiro.mjs`, `index.html`, `package.json`, `sw.js`
- Test: `tests/p3-integration.test.mjs`

**Interfaces:**
- Navegação `Contratos`, `Cobranças`, `Inadimplência`.
- Atendente recebe permissões `contracts.*`, `billing.*`, `delinquency.*`.
- Novas coleções entram no merge do sync.

- [ ] Escrever teste RED de RBAC/sync e normalização.
- [ ] Confirmar RED.
- [ ] Implementar telas responsivas e ações CRUD/pagamento/cobrança.
- [ ] Atualizar cache PWA, `check` e versão.
- [ ] Confirmar GREEN e sintaxe.

### Task 5: Documentação e merge

**Files:**
- Modify: `README.md`

- [ ] Documentar contratos, recorrência, inadimplência e persistência SQLite.
- [ ] Rodar suíte completa e `npm run check` quando ambiente de execução estiver disponível; no mínimo executar os novos testes localmente em Node e validar sintaxe dos arquivos tocados.
- [ ] Comparar branch com `main` novamente e absorver mudanças concorrentes.
- [ ] Avançar `main` somente em fast-forward/merge seguro após verificação.