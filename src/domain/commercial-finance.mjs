import { getFinancialSummary as getRentalFinancialSummary } from './rental.mjs';

const round=value=>Math.round((Number(value||0)+Number.EPSILON)*100)/100;

export function getFinancialSummary(snapshot){
  const base=getRentalFinancialSummary(snapshot);
  const recurring=(snapshot?.ledger??[]).filter(entry=>entry.kind==='billing_receivable'&&entry.status!=='cancelled');
  const grossRecurring=round(recurring.reduce((sum,entry)=>sum+Math.max(Number(entry.amount||0),Number(entry.paidAmount||0)),0));
  const paidRecurring=round(recurring.reduce((sum,entry)=>sum+Number(entry.paidAmount||0),0));
  return {
    grossRevenue:round(base.grossRevenue+grossRecurring),
    paidAmount:round(base.paidAmount+paidRecurring),
    openAmount:round(base.openAmount+Math.max(0,grossRecurring-paidRecurring)),
    expensesAmount:base.expensesAmount,
    netCash:round(base.netCash+paidRecurring)
  };
}

export function financialReceivables(snapshot){
  return (snapshot?.ledger??[]).filter(entry=>['receivable','billing_receivable'].includes(entry.kind)&&entry.status!=='cancelled');
}
