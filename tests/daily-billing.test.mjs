import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptySnapshot, createRental } from '../src/domain/rental.mjs';
import { createBillingPlan } from '../src/domain/commercial.mjs';
import { getFinancialSummary, financialReceivables } from '../src/domain/commercial-finance.mjs';
import { markRentalSchedulePurpose } from '../src/domain/daily-billing.mjs';

function baseSnapshot() {
  const snapshot = createEmptySnapshot();
  snapshot.customers.push({ id:'CLI-1', name:'George', document:'1', phone:'1', active:true });
  snapshot.vehicles.push({ id:'VEI-1', model:'Onix', plate:'ABC1D23', year:'2025', mileage:0, category:'Compacto', color:'Prata', dailyRate:100, purchasePrice:80000, availability:'disponivel' });
  return snapshot;
}

function rentalDraft(overrides={}) {
  return {
    vehicleId:'VEI-1', customerId:'CLI-1', attendantId:'USR-001',
    pickupAt:'2026-10-01T10:00:00', returnAt:'2026-10-11T10:00:00',
    dailyRate:100, notes:'', ...overrides
  };
}

test('fase 0: agenda diária não duplica receita da locação', () => {
  let snapshot = createRental(baseSnapshot(), rentalDraft(), 'USR-001');
  const rental = snapshot.rentals[0];
  snapshot = createBillingPlan(snapshot, {
    rentalId:rental.id, frequency:'daily', firstDueAt:'2026-10-01', amount:100, occurrences:10,
    finePercent:0, interestMonthlyPercent:0
  }, 'USR-001');
  snapshot = markRentalSchedulePurpose(snapshot, snapshot.billingPlans[0].id);

  const summary = getFinancialSummary(snapshot);
  assert.equal(snapshot.billingInstallments.length, 10);
  assert.equal(summary.grossRevenue, 1000);
  assert.equal(summary.paidAmount, 0);
  assert.equal(summary.openAmount, 1000);
  assert.equal(financialReceivables(snapshot).length, 10, 'recebível pai deve ser substituído operacionalmente pelas 10 diárias');
});

test('fase 0: cobrança adicional continua somando receita', () => {
  let snapshot = createRental(baseSnapshot(), rentalDraft({ returnAt:'2026-10-03T10:00:00' }), 'USR-001');
  const rental = snapshot.rentals[0];
  snapshot = createBillingPlan(snapshot, {
    rentalId:rental.id, frequency:'weekly', firstDueAt:'2026-10-01', amount:50, occurrences:1,
    finePercent:0, interestMonthlyPercent:0
  }, 'USR-001');
  const summary = getFinancialSummary(snapshot);
  assert.equal(summary.grossRevenue, 250);
  assert.equal(summary.openAmount, 250);
});
