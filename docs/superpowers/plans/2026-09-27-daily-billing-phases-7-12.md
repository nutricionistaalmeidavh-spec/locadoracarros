# Daily Billing Phases 7-12 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete phases 7-12 of daily rental billing: continuous rentals, controlled closure, daily delinquency, payment receipts, safe PC↔mobile concurrency, and release QA.

**Architecture:** Keep `billingPlans`/`billingInstallments` as the source of truth for daily charges and keep the parent rental receivable as an aggregate only. Continuous rentals grow idempotently by elapsed rental days, without a server cron. Sync gets a specialized merge/reconciliation path for nested installment payments so offline devices cannot double-count the same daily charge.

**Tech Stack:** JavaScript ES modules, Node test runner, Electron, SQLite/local repository, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-27-daily-billing-phases-0-4-design.md` plus the approved roadmap in this project conversation.

## Global Constraints

- Core remains local/offline/self-hosted and free; no paid service may become mandatory.
- Preserve the PR #2 rental/inspection state machine.
- Daily schedule payments are the accounting authority; never double-count the parent receivable.
- Every phase gets a focused automated flow test before the implementation is accepted.
- Final gate: unit/domain tests, coverage, Electron E2E, ArtiSys QA release, Linux verify and Windows packaged-app workflow.

## Review Focus

- Continuous rental before 24h elapsed must not generate a second daily charge.
- Repeated accrual at the same timestamp must be idempotent.
- Continuous closure must not bypass the completed return inspection requirement.
- PC/mobile concurrent partial payments that fit the daily amount must merge; concurrent overpayment must become an explicit conflict and must not inflate received cash.
- Backup/restore must preserve continuous schedule, installment payments, conflicts, totals and status.

---

### Task 1: Phase 7 — Continuous daily rental

**Files:** `src/domain/rental.mjs`, `src/domain/daily-billing.mjs`, `src/app.mjs`, `src/ui/reservas.mjs`, `tests/daily-billing-phases-7-12.test.mjs`

**Interfaces:**
- `createRentalWithBilling(input, draft, actorId)` accepts `periodMode:'continuous'` with no `returnAt` and requires daily billing.
- `ensureDailyInstallmentsUntil(input, rentalId, asOf, actorId)` grows a continuous schedule by elapsed rental days and updates rental/parent receivable totals.
- `ensureOpenDailyRentals(input, asOf, actorId)` accrues every open continuous daily rental idempotently.

- [x] Flow tests cover the initial charge, 23h59m boundary, new charge after 24h, and repeated idempotent accrual.
- [x] Domain behavior and local app/UI accrual implemented.
- [x] Focused and full test suites passed.

### Task 2: Phase 8 — Close a continuous rental

**Files:** `src/domain/rental.mjs`, `src/domain/daily-billing.mjs`, `src/ui/reservas.mjs`, `tests/daily-billing-phases-7-12.test.mjs`

**Interfaces:**
- `closeContinuousDailyRental(input, rentalId, {returnAt}, actorId)` accrues the exact final number of days, marks generation closed, then uses the existing rental state machine to finish the return.

- [x] Closure requires a completed return inspection.
- [x] Closure stops future generation, releases the vehicle through the existing state machine, and leaves unpaid debt open.
- [x] Focused and full test suites passed.

### Task 3: Phase 9 — Daily delinquency

**Files:** `src/domain/commercial-finance.mjs`, `src/ui/financeiro.mjs`, `tests/daily-billing-phases-7-12.test.mjs`

**Interfaces:**
- `dailyDelinquencySummary(snapshot, asOf)` returns overdue daily count/value and rows enriched by rental/customer/vehicle IDs and daily sequence/date.

- [x] Overdue daily charges are distinguished from due-today/future charges.
- [x] Daily overdue table implemented in Financeiro.
- [x] Focused and full test suites passed.

### Task 4: Phase 10 — Receipt/PDF per daily payment

**Files:** `src/domain/documents.mjs`, `src/ui/reservas.mjs`, `tests/daily-billing-phases-7-12.test.mjs`

**Interfaces:**
- `dailyPaymentReceiptPdf(input, installmentId, paymentId)` generates a PDF with customer, vehicle/plate, rental ID, daily date/sequence, amount received, method and timestamp.

- [x] PDF content test implemented and passing.
- [x] Per-payment receipt buttons implemented in daily control.

### Task 5: Phase 11 — PC↔mobile payment concurrency

**Files:** `src/domain/sync.mjs`, `src/domain/daily-billing.mjs`, `tests/daily-billing-phases-7-12.test.mjs`

**Interfaces:**
- `mergeSnapshots` merges nested installment payments by global payment ID, reconciles rental history/ledger, preserves legitimate partial payments, and records excess concurrent payments in `installment.paymentConflicts` instead of counting them.

- [x] Different-installment concurrent payments merge.
- [x] Same-installment 60+40 merge reaches exactly the daily value.
- [x] Same-installment 100+100 records an explicit `concurrent_overpayment` conflict without double receipt.
- [x] Rental history, installment ledger and parent receivable are reconciled after merge.

### Task 6: Phase 12 — Release QA

**Files:** `tests/daily-billing-release.test.mjs`, `qa/e2e/daily-billing.test.cjs`, `qa/artisys-qa/flows/locadora/daily-billing.json`, `qa/artisys-qa/locadora.config.json`, PR metadata.

- [x] Release scenarios cover 10×R$80 = R$800, R$30+R$50 partial-to-paid, 5×R$100 without double-counting, backup/restore, and payment concurrency.
- [x] Electron E2E covers multiple daily payment and continuous-rental creation.
- [x] ArtiSys QA contains a dedicated `daily-billing` flow.
- [x] Unit/domain tests, coverage, Electron E2E, ArtiSys QA release, Linux verify and Windows packaged-app workflow passed.

## Verified Result Before This Documentation-Only Commit

- Domain/unit tests: 80/80 passed.
- Vertical coverage: 9/9 areas covered.
- Electron E2E: 6/6 passed.
- ArtiSys QA release: 7/7 flows passed, including `daily-billing` 32/32 steps.
- Locadora Verify #70: passed.
- Locadora Windows Build #62: passed, including installer validation and packaged Windows application test.
