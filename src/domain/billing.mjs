import { ensureCommercialSnapshot } from './commercial.mjs';
import { appendAudit } from './p1.mjs';

const DAY=86_400_000;
function round(value){return Math.round((Number(value)+Number.EPSILON)*100)/100;}
function now(){return new Date().toISOString();}
function newId(prefix){if(typeof globalThis.crypto?.randomUUID==='function')return `${prefix}-${globalThis.crypto.randomUUID()}`;return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
function dateOnly(value){const m=String(value??'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)throw new Error('Data inválida.');return {y:Number(m[1]),m:Number(m[2]),d:Number(m[3])};}
function fmtDate(y,m,d){return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function daysInMonth(y,m){return new Date(Date.UTC(y,m,0)).getUTCDate();}
function addDays(value,days){const {y,m,d}=dateOnly(value),dt=new Date(Date.UTC(y,m-1,d+days));return fmtDate(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate());}
function addMonthsClamped(value,months){const {y,m,d}=dateOnly(value),zero=(m-1)+months,targetY=y+Math.floor(zero/12),targetM=((zero%12)+12)%12+1,targetD=Math.min(d,daysInMonth(targetY,targetM));return fmtDate(targetY,targetM,targetD);}
function dueMs(value){const {y,m,d}=dateOnly(value);return Date.UTC(y,m-1,d);}
function atMs(value){const t=Date.parse(value??'');if(Number.isFinite(t))return t;return dueMs(String(value));}
function splitAmount(amount,count){const cents=Math.round(Number(amount)*100),base=Math.floor(cents/count),extra=cents-base*count;return Array.from({length:count},(_,i)=>(base+(i<extra?1:0))/100);}
function cadenceDue(start,cadence,index,intervalDays){if(index===0)return start;if(cadence==='monthly')return addMonthsClamped(start,index);const step={daily:1,weekly:7,biweekly:14,custom:Number(intervalDays)}[cadence];if(!(step>0))throw new Error('Periodicidade inválida.');return addDays(start,step*index);}
function rentalReceived(rental){return round((rental.payments??[]).reduce((sum,p)=>sum+Number(p.amount||0),0));}

export function installmentTotals(installment,asOf=new Date().toISOString()){
  const principal=round(installment?.principal||0),paidPrincipal=round(installment?.paidPrincipal||0),paidCharges=round(installment?.paidCharges||0),principalOutstanding=round(Math.max(0,principal-paidPrincipal));
  const endMs=installment?.principalSettledAt?Math.min(atMs(asOf),atMs(installment.principalSettledAt)):atMs(asOf),lateMs=Math.max(0,endMs-dueMs(installment.dueAt)),daysLate=Math.floor(lateMs/DAY);
  const fine=daysLate>0?principal*Number(installment.finePercent||0)/100:0,interest=daysLate>0?principal*Number(installment.interestPercentMonthly||0)/100*(daysLate/30):0,chargesAccrued=round(fine+interest),chargesOutstanding=round(Math.max(0,chargesAccrued-paidCharges)),totalDue=round(principalOutstanding+chargesOutstanding);
  const status=installment.status==='cancelled'?'cancelled':totalDue<=0?'paid':daysLate>0?'overdue':(paidPrincipal>0||paidCharges>0?'partial':'open');
  return {principal,paidPrincipal,paidCharges,principalOutstanding,daysLate,chargesAccrued,chargesOutstanding,totalDue,status};
}

export function createBillingPlan(input,{rentalId,cadence='monthly',installmentCount=1,startDate,intervalDays=null,finePercent=0,interestPercentMonthly=0}={},actorId){
  const snapshot=ensureCommercialSnapshot(input),rental=snapshot.rentals.find(item=>item.id===rentalId);if(!rental)throw new Error('Locação não encontrada.');
  if(snapshot.billingPlans.some(item=>item.rentalId===rentalId&&item.status==='active'))throw new Error('A locação já possui cobrança recorrente ativa.');
  const count=Math.trunc(Number(installmentCount));if(!(count>=1&&count<=120))throw new Error('Quantidade de parcelas inválida.');
  if(!['daily','weekly','biweekly','monthly','custom'].includes(cadence))throw new Error('Periodicidade inválida.');if(cadence==='custom'&&!(Number(intervalDays)>0))throw new Error('Intervalo personalizado inválido.');
  const fine=Number(finePercent||0),interest=Number(interestPercentMonthly||0);if(fine<0||interest<0)throw new Error('Multa e juros não podem ser negativos.');
  const received=rentalReceived(rental),remaining=round(Number(rental.total||0)-received);if(!(remaining>0))throw new Error('Locação sem saldo para parcelar.');
  const d=dateOnly(startDate),start=fmtDate(d.y,d.m,d.d),at=now(),plan={id:newId('PLN'),rentalId,cadence,intervalDays:cadence==='custom'?Number(intervalDays):null,installmentCount:count,amount:remaining,finePercent:fine,interestPercentMonthly:interest,startDate:start,status:'active',createdAt:at,updatedAt:at};
  snapshot.billingPlans.unshift(plan);
  const original=snapshot.ledger.find(entry=>entry.kind==='receivable'&&entry.rentalId===rentalId&&!entry.billingInstallmentId&&!entry.billingFeePaymentId);
  if(original){if(received>0){original.amount=received;original.paidAmount=received;original.status='paid';original.paidAt=original.paidAt??at;original.description=`Locação ${rentalId} · recebido antes do parcelamento`;original.updatedAt=at;}else snapshot.ledger=snapshot.ledger.filter(entry=>entry.id!==original.id);}
  const amounts=splitAmount(remaining,count);
  for(let i=0;i<count;i++){
    const installment={id:newId('PAR'),planId:plan.id,rentalId,sequence:i+1,dueAt:cadenceDue(start,cadence,i,intervalDays),principal:amounts[i],paidPrincipal:0,paidCharges:0,finePercent:fine,interestPercentMonthly:interest,status:'open',principalSettledAt:null,createdAt:at,updatedAt:at};
    snapshot.billingInstallments.push(installment);
    snapshot.ledger.unshift({id:newId('FIN'),kind:'receivable',rentalId,vehicleId:rental.vehicleId,billingPlanId:plan.id,billingInstallmentId:installment.id,description:`Parcela ${i+1}/${count} · ${rentalId}`,amount:installment.principal,paidAmount:0,status:'open',dueAt:installment.dueAt,createdAt:at,updatedAt:at});
  }
  appendAudit(snapshot,{actorId,action:'billing_plan.created',entityType:'billing_plan',entityId:plan.id,details:{rentalId,cadence,installmentCount:count,amount:remaining}});return snapshot;
}

export function registerBillingPayment(input,installmentId,{amount,method='PIX',paidAt=new Date().toISOString()}={},actorId){
  const snapshot=ensureCommercialSnapshot(input),installment=snapshot.billingInstallments.find(item=>item.id===installmentId);if(!installment)throw new Error('Parcela não encontrada.');if(installment.status==='cancelled')throw new Error('Parcela cancelada.');
  const plan=snapshot.billingPlans.find(item=>item.id===installment.planId);if(!plan||plan.status!=='active')throw new Error('Plano de cobrança inativo.');
  const rental=snapshot.rentals.find(item=>item.id===installment.rentalId);if(!rental)throw new Error('Locação não encontrada.');
  const value=round(Number(amount));if(!(value>0))throw new Error('Valor do pagamento deve ser maior que zero.');
  const totals=installmentTotals(installment,paidAt);if(value>totals.totalDue+0.001)throw new Error('Pagamento excede o valor atualizado da parcela.');
  const principalApplied=round(Math.min(value,totals.principalOutstanding)),chargeApplied=round(value-principalApplied),at=new Date(paidAt).toISOString();
  installment.paidPrincipal=round(Number(installment.paidPrincipal||0)+principalApplied);installment.paidCharges=round(Number(installment.paidCharges||0)+chargeApplied);installment.updatedAt=at;
  if(installment.paidPrincipal>=installment.principal-0.001&&!installment.principalSettledAt)installment.principalSettledAt=at;
  const after=installmentTotals(installment,at);installment.status=after.status;
  const ledgerEntry=snapshot.ledger.find(entry=>entry.billingInstallmentId===installment.id&&entry.kind==='receivable'&&!entry.billingFeePaymentId);if(ledgerEntry){ledgerEntry.paidAmount=installment.paidPrincipal;ledgerEntry.status=installment.paidPrincipal>=installment.principal-0.001?'paid':installment.paidPrincipal>0?'partial':'open';ledgerEntry.paidAt=ledgerEntry.status==='paid'?at:undefined;ledgerEntry.updatedAt=at;}
  const payment={id:newId('COB'),planId:plan.id,installmentId:installment.id,rentalId:rental.id,amount:value,principalAmount:principalApplied,chargeAmount:chargeApplied,method:String(method||'PIX'),paidAt:at,createdAt:at,updatedAt:at};snapshot.billingPayments.unshift(payment);
  if(principalApplied>0)rental.payments=[...(rental.payments??[]),{id:newId('PAG'),amount:principalApplied,method:String(method||'PIX'),paidAt:at,billingInstallmentId:installment.id}];
  if(chargeApplied>0)snapshot.ledger.unshift({id:newId('FIN'),kind:'receivable',rentalId:rental.id,vehicleId:rental.vehicleId,billingPlanId:plan.id,billingInstallmentId:installment.id,billingFeePaymentId:payment.id,description:`Encargos parcela ${installment.sequence} · ${rental.id}`,amount:chargeApplied,paidAmount:chargeApplied,status:'paid',dueAt:installment.dueAt,createdAt:at,paidAt:at,updatedAt:at});
  const received=rentalReceived(rental);rental.paymentStatus=received>=Number(rental.total||0)-0.001?'pago':'aberto';rental.updatedAt=at;
  appendAudit(snapshot,{actorId,action:'billing_payment.received',entityType:'billing_installment',entityId:installment.id,details:{amount:value,principalAmount:principalApplied,chargeAmount:chargeApplied,method}});return snapshot;
}

export function cancelBillingPlan(input,planId,actorId){
  const snapshot=ensureCommercialSnapshot(input),plan=snapshot.billingPlans.find(item=>item.id===planId);if(!plan)throw new Error('Plano de cobrança não encontrado.');if(plan.status!=='active')return snapshot;
  if(snapshot.billingPayments.some(item=>item.planId===planId))throw new Error('Plano com pagamentos não pode ser cancelado automaticamente.');
  const ids=new Set(snapshot.billingInstallments.filter(item=>item.planId===planId).map(item=>item.id));snapshot.billingInstallments=snapshot.billingInstallments.filter(item=>item.planId!==planId);snapshot.ledger=snapshot.ledger.filter(entry=>!ids.has(entry.billingInstallmentId));
  const rental=snapshot.rentals.find(item=>item.id===plan.rentalId),remaining=round(Number(rental?.total||0)-rentalReceived(rental??{payments:[]})),at=now();if(rental&&remaining>0)snapshot.ledger.unshift({id:newId('FIN'),kind:'receivable',rentalId:rental.id,vehicleId:rental.vehicleId,description:`Locação ${rental.id}`,amount:remaining,paidAmount:0,status:'open',dueAt:rental.pickupAt,createdAt:at,updatedAt:at});
  plan.status='cancelled';plan.updatedAt=at;appendAudit(snapshot,{actorId,action:'billing_plan.cancelled',entityType:'billing_plan',entityId:plan.id,details:{rentalId:plan.rentalId}});return snapshot;
}