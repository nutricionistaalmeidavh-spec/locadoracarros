import { authenticate, can } from './domain/auth.mjs';
import { getFinancialSummary } from './domain/rental.mjs';
import { createRepository } from './storage/repository.mjs';
import { esc, money } from './ui/common.mjs';
import { renderReservas } from './ui/reservas.mjs';
import { renderClientes, renderFrota } from './ui/cadastros.mjs';
import { renderFinanceiro } from './ui/financeiro.mjs';
import { renderAuditoria, renderBackup } from './ui/system.mjs';

const repository=createRepository();
let snapshot=repository.load(),sessionUser=null,active='reservas';
const app=document.querySelector('#app');

function save(next){snapshot=repository.save(next);render();}
function replaceSnapshot(next){snapshot=next;render();}
function context(){return{snapshot,sessionUser,save,replaceSnapshot,repository};}

function render(){
  if(!sessionUser)return renderLogin();
  const summary=getFinancialSummary(snapshot);
  const nav=[['reservas','Reservas'],['clientes','Clientes'],['frota','Frota'],...(can(sessionUser,'finance.read')?[['financeiro','Financeiro']]:[]),['auditoria','Auditoria'],['backup','Backup e Config.']];
  app.innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><span class="brandmark">LV</span><div><small>SISTEMA</small><strong>LOCADORA</strong></div></div><nav>${nav.map(([id,label])=>`<button data-nav="${id}" class="nav ${active===id?'active':''}">${label}</button>`).join('')}</nav><div class="session"><strong>${esc(sessionUser.name)}</strong><small>${esc(sessionUser.role)}</small><button id="logout">Sair</button></div></aside><main><header class="topbar"><span>${snapshot.rentals.filter(r=>r.status!=='devolucao').length} locações abertas</span><span>${snapshot.vehicles.length} veículos</span><span>${money(summary.openAmount)} em aberto</span><span>Dados locais v2</span></header><section id="view" class="content"></section></main></div>`;
  app.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{active=b.dataset.nav;render();});
  app.querySelector('#logout').onclick=()=>{sessionUser=null;active='reservas';render();};
  const views={reservas:renderReservas,clientes:renderClientes,frota:renderFrota,financeiro:renderFinanceiro,auditoria:renderAuditoria,backup:renderBackup};
  (views[active]??renderReservas)(app.querySelector('#view'),context());
}

function renderLogin(){
  app.innerHTML=`<div class="login-wrap"><form id="login" class="login-card"><div class="brand big"><span class="brandmark">LV</span><div><small>ARTISYS</small><strong>Sistema Locadora</strong></div></div><h1>Acesso</h1><label>Usuário<input name="username" autocomplete="username" value="admin" required></label><label>Senha<input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Entrar</button><p class="hint">Acesso inicial: admin / 1234. Altere os usuários após a implantação.</p><p id="login-error" class="error"></p></form></div>`;
  app.querySelector('#login').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),user=await authenticate(snapshot.users,fd.get('username'),fd.get('password'));if(!user){app.querySelector('#login-error').textContent='Usuário ou senha inválidos.';return;}sessionUser=user;render();};
}
render();
