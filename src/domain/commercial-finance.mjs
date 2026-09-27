import { getFinancialSummary as getRentalFinancialSummary } from './rental.mjs';
import { activeRentalSchedulePlans } from './daily-billing.mjs';

const round=value=>Math.round((Number(value||0)+Number.EPSILON)*100)/100;

function rentalScheduleIds(snapshot){return new Set(activeRentalSchedulePlans(snapshot).map(plan=>plan.rentalId));}

export function getFinancialSummary(snapshot){
  const base=getRentalFinancialSummary(snapshot);
  const scheduleIds=rentalScheduleIds(snapshot);
  const parent=(snapshot?.ledger??[]).filter(entry=>entry.kind==='receivable'&&scheduleIds.has(entry.rentalId));
  const recurring=(snapshot?.ledger??[]).filter(entry=>entry.kind==='billing_receivable'&&entry.status!=='cancelled');
  const parentGross=round(parent.reduce((sum,entry)=>sum+Number(entry.amount||0),0));
  const parentPaid=round(parent.reduce((sum,entry)=>sum+Number(entry.paidAmount||0),0));
  const grossRecurring=round(recurring.reduce((sum,entry)=>sum+Math.max(Number(entry.amount||0),Number(entry.paidAmount||0)),0));
  const paidRecurring=round(recurring.reduce((sum,entry)=>sum+Number(entry.paidAmount||0),0));
  const grossRevenue=round(base.grossRevenue-parentGross+grossRecurring);
  const paidAmount=round(base.paidAmount-parentPaid+paidRecurring);
  return {
    grossRevenue,
    paidAmount,
    openAmount:round(grossRevenue-paidAmount),
    expensesAmount:base.expensesAmount,
    netCash:round(paidAmount-base.expensesAmount)
  };
}

export function financialReceivables(snapshot){
  const scheduleIds=rentalScheduleIds(snapshot);
  return (snapshot?.ledger??[]).filter(entry=>{
    if(entry.status==='cancelled'||!['receivable','billing_receivable'].includes(entry.kind))return false;
    if(entry.kind==='receivable'&&scheduleIds.has(entry.rentalId))return false;
    return true;
  });
}
