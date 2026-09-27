import { getFinancialSummary, moveRental } from '../domain/rental.mjs';
import { createRentalWithBilling, dailyBillingSummary, nextDailyInstallment, recordNextDailyPayment } from '../domain/daily-billing.mjs';
import { can } from '../domain/auth.mjs';
import { closeModal, date, esc, modal, money, toast } from './common.mjs';

export function renderReservas(view, ctx) {
  const { snapshot, sessionUser, save } = ctx;
  const rows=[...snapshot.rentals].sort((a,b)=>new Date(a.pickupAt)-new Date(b.pickupAt));
  const summary=getFinancialSummary(snapshot);
  view.innerHTML=`<div class="heading"><div><small>OPERAÇÃO</small><h1>Reservas e locações</h1></div>${can(sessionUser,'rental.write')?'<button id="new-rental" class="primary">Nova reserva</button>':''}</div>
  <div class="cards"><article><small>Receita prevista</small><strong>${money(summary.grossRevenue)}</strong></article><article><small>Recebido</small><strong>${money(summary.paidAmount)}</strong></article><article><small>Em aberto</small><strong>${money(summary.openAmount)}</strong></article><article><small>Reservas</small><strong>${rows.length}</strong></article></div>
  <section class="panel"><div class="panel-title"><h2>Agenda</h2><span>Disponibilidade calculada por período, não por status global.</span></div><div class="agenda">${renderAgenda(rows,snapshot)}</div></section>
  <section class="panel"><div class="panel-title"><h2>Locações</h2></div><div class="table-wrap"><table><thead><tr><th>Locação</th><th>Cliente</th><th>Veículo</th><th>Retirada</th><th>Devolução</th><th>Status</th><th>Total</th><th>Ações</th></tr></thead><tbody>${rows.map(r=>rentalRow(r,snapshot,sessionUser)).join('')||'<tr><td colspan="8" class="empty">Nenhuma reserva cadastrada.</td></tr>'}</tbody></table></div></section>`;
  view.querySelector('#new-rental')?.addEventListener('click',()=>showRentalForm(ctx));
  view.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{try{save(moveRental(snapshot,b.dataset.id,b.dataset.status,sessionUser.id));toast('Status atualizado.');}catch(err){toast(err.message)}});
  view.querySelectorAll('[data-contract]').forEach(b=>b.onclick=()=>printContract(b.dataset.contract,snapshot));
  view.querySelectorAll('[data-daily-control]').forEach(b=>b.onclick=()=>showDailyControl(ctx,b.dataset.dailyControl));
}

function renderAgenda(rows,snapshot) {
  if(!rows.length) return '<div class="empty">A agenda ficará aqui assim que a primeira reserva for criada.</div>';
  return rows.map(r=>{const v=snapshot.vehicles.find(x=>x.id===r.vehicleId);const c=snapshot.customers.find(x=>x.id===r.customerId);return `<div class="agenda-item"><span class="dot status-${r.status}"></span><div><strong>${esc(v?.model||r.vehicleId)} · ${esc(c?.name||r.customerId)}</strong><small>${date(r.pickupAt)} → ${date(r.returnAt)}</small></div><b>${esc(r.status.replace('_',' '))}</b></div>`}).join('');
}

function rentalRow(r,snapshot,sessionUser) {
  const v=snapshot.vehicles.find(x=>x.id===r.vehicleId), c=snapshot.customers.find(x=>x.id===r.customerId);
  const next={reserva:'retirada',retirada:'em_uso',em_uso:'devolucao'}[r.status];
  const daily=r.billingMode==='daily'&&can(sessionUser,'billing.read')?`<button data-daily-control="${esc(r.id)}">Diárias</button>`:'';
  return `<tr><td>${esc(r.id)}</td><td>${esc(c?.name||'-')}</td><td>${esc(v?.model||'-')}<small>${esc(v?.plate||'')}</small></td><td>${date(r.pickupAt)}</td><td>${date(r.returnAt)}</td><td><span class="badge">${esc(r.status)}</span></td><td>${money(r.total)}</td><td class="actions">${next&&can(sessionUser,'rental.write')?`<button data-status="${next}" data-id="${r.id}">Avançar</button>`:''}${daily}<button data-contract="${r.id}">Contrato</button></td></tr>`;
}

function showDailyControl(ctx,rentalId){
  const {snapshot,sessionUser}=ctx;
  if(!can(sessionUser,'billing.read')){toast('Sem permissão para visualizar cobranças.');return;}
  const rental=snapshot.rentals.find(r=>r.id===rentalId);
  const summary=dailyBillingSummary(snapshot,rentalId,new Date().toISOString());
  const next=nextDailyInstallment(snapshot,rentalId),writable=can(sessionUser,'billing.write');
  const statusLabel={paid:'Pago',partial:'Parcial',overdue:'Atrasado',pending:'Pendente'};
  const nextBalance=next?Math.max(0,Number(next.amount||0)-Number(next.paidAmount||0)):0;
  modal('Controle de diárias',`<div class="cards"><article><small>Diárias</small><strong>${summary.totalCount}</strong></article><article><small>Pagas</small><strong>${summary.paidCount}</strong></article><article><small>Recebido</small><strong>${money(summary.received)}</strong></article><article><small>A receber</small><strong>${money(summary.openAmount)}</strong></article></div>${next?`<section class="panel"><div class="panel-title"><div><small>PRÓXIMA DIÁRIA</small><h2>Diária ${next.sequence} · ${date(next.dueAt)}</h2></div><strong>${money(nextBalance)}</strong></div>${writable?'<button id="receive-next-daily" class="primary">Receber diária</button>':''}</section>`:'<section class="panel"><div class="empty">Todas as diárias estão quitadas.</div></section>'}<section class="panel"><div class="panel-title"><h2>${esc(rental?.id||rentalId)}</h2><span>${summary.pendingCount} pendente(s)</span></div><div class="table-wrap"><table><thead><tr><th>Diária</th><th>Vencimento</th><th>Valor</th><th>Pago</th><th>Saldo</th><th>Situação</th></tr></thead><tbody>${summary.rows.map(row=>`<tr><td>${row.sequence}</td><td>${date(row.dueAt)}</td><td>${money(row.amount)}</td><td>${money(row.paidAmount)}</td><td>${money(row.openAmount)}</td><td><span class="badge">${statusLabel[row.status]||esc(row.status)}</span></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhuma diária gerada.</td></tr>'}</tbody></table></div></section><div class="modal-actions"><button type="button" data-close>Fechar</button></div>`,()=>{document.querySelector('#receive-next-daily')?.addEventListener('click',()=>{closeModal();showDailyPayment(ctx,rentalId);});});
}

function showDailyPayment(ctx,rentalId){
  const {snapshot,sessionUser,save}=ctx;
  if(!can(sessionUser,'billing.write')){toast('Sem permissão para registrar recebimentos.');return;}
  const item=nextDailyInstallment(snapshot,rentalId);
  if(!item){toast('Todas as diárias estão quitadas.');return;}
  const balance=Math.max(0,Number(item.amount||0)-Number(item.paidAmount||0));
  modal('Receber diária',`<form id="daily-payment-form" class="form-grid"><label>Diária<input value="${item.sequence} · ${esc(date(item.dueAt))}" disabled></label><label>Saldo<input value="${balance.toFixed(2)}" disabled></label><label>Valor<input name="amount" type="number" min="0.01" max="${balance}" step="0.01" value="${balance.toFixed(2)}" required></label><label>Forma<select name="method"><option>PIX</option><option>Dinheiro</option><option>Crédito</option><option>Débito</option><option>Boleto</option></select></label><div class="full modal-actions"><button type="button" data-close>Cancelar</button><button class="primary">Confirmar recebimento</button></div></form>`,()=>{const form=document.querySelector('#daily-payment-form');form.onsubmit=e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(form));try{save(recordNextDailyPayment(snapshot,rentalId,{amount:Number(fd.amount),method:fd.method},sessionUser.id));closeModal();toast('Diária atualizada.');}catch(err){toast(err.message)}};});
}

function showRentalForm(ctx){
  const {snapshot,sessionUser,save}=ctx;
  if(!snapshot.customers.length||!snapshot.vehicles.length){toast('Cadastre ao menos um cliente e um veículo.');return;}
  modal('Nova reserva',`<form id="rental-form" class="form-grid"><label>Cliente<select name="customerId">${snapshot.customers.filter(c=>c.active).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label><label>Veículo<select name="vehicleId">${snapshot.vehicles.filter(v=>v.availability!=='manutencao').map(v=>`<option value="${v.id}">${esc(v.model)} · ${esc(v.plate)}</option>`).join('')}</select></label><label>Retirada<input type="datetime-local" name="pickupAt" required></label><label>Devolução<input type="datetime-local" name="returnAt" required></label><label>Diária<input type="number" name="dailyRate" min="0.01" step="0.01" required></label><label>Recebimento<select name="billingMode"><option value="total">Receber valor total</option><option value="daily">Receber por diária</option></select></label><label>Prioridade<select name="priority"><option>Media</option><option>Alta</option><option>Baixa</option></select></label><label class="full">Observações<textarea name="notes"></textarea></label><div class="full modal-actions"><button type="button" data-close>Cancelar</button><button class="primary">Salvar reserva</button></div></form>`);
  const form=document.querySelector('#rental-form'), vehicleSelect=form.elements.vehicleId;
  const updateRate=()=>{const v=snapshot.vehicles.find(x=>x.id===vehicleSelect.value);form.elements.dailyRate.value=v?.dailyRate||''}; vehicleSelect.onchange=updateRate;updateRate();
  form.onsubmit=e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(form));try{save(createRentalWithBilling(snapshot,{...fd,attendantId:sessionUser.id,dailyRate:Number(fd.dailyRate)},sessionUser.id));closeModal();toast(fd.billingMode==='daily'?'Reserva e diárias criadas.':'Reserva criada.');}catch(err){toast(err.message)}};
}

function printContract(id,snapshot){
  const r=snapshot.rentals.find(x=>x.id===id),c=snapshot.customers.find(x=>x.id===r.customerId),v=snapshot.vehicles.find(x=>x.id===r.vehicleId),w=window.open('','contrato','width=800,height=900');
  if(!w)return;
  const text=`${snapshot.settings.companyName}\n${snapshot.settings.document}\n${snapshot.settings.phone}\n${snapshot.settings.address}\n\nCONTRATO DE LOCAÇÃO ${r.id}\nCliente: ${c?.name} - ${c?.document}\nVeículo: ${v?.model} - ${v?.plate}\nRetirada: ${date(r.pickupAt)}\nDevolução: ${date(r.returnAt)}\nValor: ${money(r.total)}\nStatus: ${r.status}\n\nObservações: ${r.notes||'-'}`;
  w.document.write(`<pre style="font:14px/1.6 Arial;padding:32px;white-space:pre-wrap">${esc(text)}</pre>`);w.document.close();w.print();
}
