import { createRental } from './rental.mjs';
import { createBillingPlan, ensureCommercialSnapshot } from './commercial.mjs';

export function billingPlanPurpose(plan) {
  return plan?.purpose === 'rental_schedule' ? 'rental_schedule' : 'additional';
}

export function markRentalSchedulePurpose(input, planId) {
  const snapshot = ensureCommercialSnapshot(input);
  const plan = snapshot.billingPlans.find((item) => item.id === planId);
  if (!plan) throw new Error('Plano de cobrança não encontrado.');
  plan.purpose = 'rental_schedule';
  plan.updatedAt = new Date().toISOString();
  return snapshot;
}

export function activeRentalSchedulePlans(snapshot) {
  return (snapshot?.billingPlans ?? []).filter((plan) => plan.active !== false && billingPlanPurpose(plan) === 'rental_schedule');
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
    frequency:'daily',
    firstDueAt:rental.pickupAt,
    amount:rental.dailyRate,
    occurrences:rental.days,
    finePercent:0,
    interestMonthlyPercent:0
  }, actorId);
  const plan = snapshot.billingPlans.find((item) => item.rentalId === rental.id && item.frequency === 'daily');
  if (!plan) throw new Error('Não foi possível criar a agenda diária da locação.');
  plan.purpose = 'rental_schedule';
  plan.updatedAt = new Date().toISOString();
  const persistedRental = snapshot.rentals.find((item) => item.id === rental.id);
  persistedRental.billingMode = 'daily';
  persistedRental.updatedAt = plan.updatedAt;
  return snapshot;
}
