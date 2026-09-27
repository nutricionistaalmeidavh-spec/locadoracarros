import { ensureCommercialSnapshot } from './commercial.mjs';

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
