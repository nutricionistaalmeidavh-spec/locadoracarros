import { createRental } from './rental.mjs';
import { createBillingPlan, ensureCommercialSnapshot, installmentBalance, recordInstallmentPayment } from './commercial.mjs';

const round = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export function billingPlanPurpose(plan) {
  return plan?.purpose === 'rental_schedule' ? 'rental_schedule' : 'additional';
}

export function markRentalSchedulePurpose(input, planId) {
  const snapshot = ensureCommercialSnapshot(input);
  const plan = snapshot.billingPlans.find((item) => item.id === planId);
  if (!plan) throw new Error('Plano de cobrança não encontrado.');
  plan.purpose = 'rental_schedule';
  plan.updatedAt = new Date().toISOString();
  const installmentIds = new Set(snapshot.billingInstallments.filter((item) => item.planId === plan.id).map((item) => item.id));
  for (const entry of snapshot.ledger ?? []) if (entry.kind === 'billing_receivable' && installmentIds.has(entry.installmentId)) entry.billingPurpose = 'rental_schedule';
  return snapshot;
}

export function activeRentalSchedulePlans(snapshot) {
  return (snapshot?.billingPlans ?? []).filter((plan) => plan.active !== false && billingPlanPurpose(plan) === 'rental_schedule');
}

function schedulePlanForRental(snapshot, rentalId) {
  return activeRentalSchedulePlans(snapshot).find((item) => item.rentalId === rentalId && item.frequency === 'daily') ?? null;
}

export function createRentalWithBilling(input, draft={}, actorId) {
  const billingMode = draft.billingMode === 'daily' ? 'daily' : 'total';
  let snapshot = ensureCommercialSnapshot(createRental(input, draft, actorId));
  const rental = snapshot.rentals[0];
  rental.billingMode = billingMode;
  rental.updatedAt = new Date().toISOString();
  if (billingMode !== 'daily') return snapshot;

  snapshot = createBillingPlan(snapshot, {
    rentalId:rental.id,
    purpose:'rental_schedule',
    frequency:'daily',
    firstDueAt:rental.pickupAt,
    amount:rental.dailyRate,
    occurrences:rental.days,
    finePercent:0,
    interestMonthlyPercent:0
  }, actorId);
  const plan = snapshot.billingPlans.find((item) => item.rentalId === rental.id && item.frequency === 'daily' && item.purpose === 'rental_schedule');
  if (!plan) throw new Error('Não foi possível criar a agenda diária da locação.');
  const persistedRental = snapshot.rentals.find((item) => item.id === rental.id);
  persistedRental.billingMode = 'daily';
  persistedRental.updatedAt = plan.updatedAt;
  return snapshot;
}

export function dailyBillingSummary(input, rentalId, asOf=new Date().toISOString()) {
  const snapshot = ensureCommercialSnapshot(input);
  const plan = schedulePlanForRental(snapshot, rentalId);
  if (!plan) return { rentalId, planId:null, totalCount:0, paidCount:0, pendingCount:0, partialCount:0, overdueCount:0, received:0, openAmount:0, rows:[] };
  const rows = snapshot.billingInstallments
    .filter((item) => item.planId === plan.id && item.status !== 'cancelled')
    .sort((a,b) => Number(a.sequence || 0) - Number(b.sequence || 0))
    .map((item) => {
      const balance = installmentBalance(item, asOf);
      const status = item.status === 'paid' ? 'paid' : item.status === 'partial' ? 'partial' : balance.daysLate > 0 ? 'overdue' : 'pending';
      return { installmentId:item.id, sequence:item.sequence, dueAt:item.dueAt, amount:Number(item.amount || 0), paidAmount:Number(item.paidAmount || 0), openAmount:round(Math.max(0, Number(item.amount || 0) - Number(item.paidAmount || 0))), totalDue:balance.totalDue, daysLate:balance.daysLate, status };
    });
  return {
    rentalId,
    planId:plan.id,
    totalCount:rows.length,
    paidCount:rows.filter((row) => row.status === 'paid').length,
    pendingCount:rows.filter((row) => row.status === 'pending' || row.status === 'overdue').length,
    partialCount:rows.filter((row) => row.status === 'partial').length,
    overdueCount:rows.filter((row) => row.status === 'overdue').length,
    received:round(rows.reduce((sum,row) => sum + row.paidAmount, 0)),
    openAmount:round(rows.reduce((sum,row) => sum + row.openAmount, 0)),
    rows
  };
}

export function nextDailyInstallment(input, rentalId) {
  const snapshot = ensureCommercialSnapshot(input);
  const plan = schedulePlanForRental(snapshot, rentalId);
  if (!plan) return null;
  return snapshot.billingInstallments
    .filter((item) => item.planId === plan.id && !['paid','cancelled'].includes(item.status))
    .sort((a,b) => Number(a.sequence || 0) - Number(b.sequence || 0))[0] ?? null;
}

export function recordNextDailyPayment(input, rentalId, payment={}, actorId) {
  const snapshot = ensureCommercialSnapshot(input);
  const installment = nextDailyInstallment(snapshot, rentalId);
  if (!installment) throw new Error('Não há diária pendente para esta locação.');
  return recordInstallmentPayment(snapshot, installment.id, payment, actorId);
}

export function recordDailyPaymentAmount(input, rentalId, payment={}, actorId) {
  let snapshot = ensureCommercialSnapshot(input);
  const plan = schedulePlanForRental(snapshot, rentalId);
  if (!plan) throw new Error('Esta locação não possui agenda diária ativa.');
  const value = round(payment.amount);
  if (!(value > 0)) throw new Error('Valor do pagamento deve ser maior que zero.');
  const paidAt = payment.paidAt ?? new Date().toISOString();
  const method = String(payment.method ?? 'PIX');
  const installments = snapshot.billingInstallments
    .filter((item) => item.planId === plan.id && !['paid','cancelled'].includes(item.status))
    .sort((a,b) => Number(a.sequence || 0) - Number(b.sequence || 0));
  const outstanding = round(installments.reduce((sum,item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.paidAmount || 0)), 0));
  if (value > outstanding + 0.001) throw new Error('Pagamento excede o saldo das diárias.');

  let remaining = value;
  for (const installment of installments) {
    if (remaining <= 0.001) break;
    const open = round(Math.max(0, Number(installment.amount || 0) - Number(installment.paidAmount || 0)));
    if (open <= 0) continue;
    const allocated = round(Math.min(open, remaining));
    snapshot = recordInstallmentPayment(snapshot, installment.id, { amount:allocated, method, paidAt }, actorId);
    remaining = round(remaining - allocated);
  }
  if (remaining > 0.001) throw new Error('Não foi possível distribuir todo o pagamento nas diárias.');
  return snapshot;
}
