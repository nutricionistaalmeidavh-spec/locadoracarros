import { ensureCommercialSnapshot } from './commercial.mjs';
import { installmentTotals } from './billing.mjs';
import { appendAudit } from './p1.mjs';

const DAY=86_400_000;
function round(value){return Math.round((Number(value)+Number.EPSILON)*100)/100;}
function newId(prefix){if(typeof globalThis.crypto?.randomUUID==='function')return `${prefix}-${globalThis.crypto.randomUUID()}`;return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;}
function dayMs(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))throw new Error('Data inválida.');return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}
function dueDayMs(value){const m=String(value??'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)throw new Error('Vencimento inválido.');return Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]));}
function sum(rows,key){return round(rows.reduce((acc,row)=>acc+Number(row[key]||0),0));}

function enrichedRows(input,asOf){
  const snapshot=ensureCommercialSnapshot(input),today=dayMs(asOf);
  return snapshot.billingInstallments.filter(item=>item.status!=='cancelled').map(item=>{
    const rental=snapshot.rentals.find(row=>row.id===item.rentalId)??{},customer=snapshot.customers.find(row=>row.id===rental.customerId)??{},vehicle=snapshot.vehicles.find(row=>row.id===rental.vehicleId)??{},totals=installmentTotals(item,asOf),due=dueDayMs(item.dueAt),payments=snapshot.billingPayments.filter(row=>row.installmentId===item.id).sort((a,b)=>Date.parse(b.paidAt)-Date.parse(a.paidAt));
    return {...totals,installmentId:item.id,planId:item.planId,rentalId:item.rentalId,sequence:item.sequence,dueAt:item.dueAt,dueMs:due,customerId:customer.id??null,customerName:customer.name??'-',customerDocument:customer.document??'',vehicleId:vehicle.id??null,vehicleModel:vehicle.model??'-',vehiclePlate:vehicle.plate??'',lastPaymentAt:payments[0]?.paidAt??null,isOverdue:due<today&&totals.totalDue>0,isDueToday:due===today&&totals.totalDue>0,isDueNext7:due>today&&due<=today+7*DAY&&totals.totalDue>0};
  });
}

export function buildDelinquency(input,{asOf=new Date().toISOString(),customerId=null,vehicleId=null}={}){
  let all=enrichedRows(input,asOf);if(customerId)all=all.filter(row=>row.customerId===customerId);if(vehicleId)all=all.filter(row=>row.vehicleId===vehicleId);
  const rows=all.filter(row=>row.isOverdue).sort((a,b)=>b.daysLate-a.daysLate||b.totalDue-a.totalDue),customers=new Set(rows.map(row=>row.customerId).filter(Boolean));
  const summary={overdueTotal:sum(rows,'totalDue'),delinquentCustomers:customers.size,dueToday:sum(all.filter(row=>row.isDueToday),'totalDue'),dueNext7Days:sum(all.filter(row=>row.isDueNext7),'totalDue'),averageDaysLate:rows.length?Math.round(rows.reduce((acc,row)=>acc+row.daysLate,0)/rows.length):0};
  return {summary,rows,asOf};
}

export function buildAgingReport(input,{asOf=new Date().toISOString(),customerId=null,vehicleId=null}={}){
  const rows=buildDelinquency(input,{asOf,customerId,vehicleId}).rows,buckets=[{bucket:'1–7',min:1,max:7},{bucket:'8–15',min:8,max:15},{bucket:'16–30',min:16,max:30},{bucket:'31–60',min:31,max:60},{bucket:'60+',min:61,max:Infinity}];
  return buckets.map(def=>{const matches=rows.filter(row=>row.daysLate>=def.min&&row.daysLate<=def.max);return {bucket:def.bucket,count:matches.length,amount:sum(matches,'totalDue'),principal:sum(matches,'principalOutstanding'),charges:sum(matches,'chargesOutstanding')};});
}

export function addCollectionActivity(input,{customerId,rentalId=null,installmentId=null,channel='other',note='',promiseDate=null,nextActionAt=null}={},actorId){
  const snapshot=ensureCommercialSnapshot(input),customer=snapshot.customers.find(item=>item.id===customerId);if(!customer)throw new Error('Cliente não encontrado.');
  if(rentalId&&!snapshot.rentals.some(item=>item.id===rentalId&&item.customerId===customerId))throw new Error('Locação não pertence ao cliente.');
  if(installmentId&&!snapshot.billingInstallments.some(item=>item.id===installmentId&&(!rentalId||item.rentalId===rentalId)))throw new Error('Parcela inválida para a cobrança.');
  const allowed=['whatsapp','phone','email','in_person','other'];if(!allowed.includes(channel))throw new Error('Canal de cobrança inválido.');const text=String(note??'').trim();if(!text)throw new Error('Observação da cobrança é obrigatória.');
  const at=new Date().toISOString(),value={id:newId('REG'),customerId,rentalId,installmentId,channel,note:text,promiseDate:promiseDate||null,nextActionAt:nextActionAt||null,actorId,createdAt:at,updatedAt:at};snapshot.collectionActivities.unshift(value);appendAudit(snapshot,{actorId,action:'collection_activity.created',entityType:'collection_activity',entityId:value.id,details:{customerId,rentalId,installmentId,channel,promiseDate:value.promiseDate,nextActionAt:value.nextActionAt}});return snapshot;
}