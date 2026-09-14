import { authenticate,can } from './domain/auth.mjs';
import { getFinancialSummary } from './domain/rental.mjs';
import { buildOperationalAlerts } from './domain/alerts.mjs';
import { createRepository } from './storage/repository.mjs';
import { createSyncClient } from './sync/client.mjs';
import { esc,money,toast } from './ui/common.mjs';
import { renderReservas } from './ui/reservas.mjs';
import { renderClientes,renderFrota } from './ui/cadastros.mjs';
import { renderFinanceiro } from './ui/financeiro.mjs';
import { renderAuditoria,renderBackup } from './ui/system.mjs';
import { renderDashboard,renderVistorias,renderManutencao,renderAlertas,renderDocumentos } from './ui/p1.mjs';
import { renderSync } from './ui/p2.mjs';

let repository=null,syncClient=null,snapshot=null,sessionUser=null,active='dashboard',syncInfo=null,syncBusy=false,syncTimer=null;
const app=document.querySelector('#app');
const syncMeta=()=>syncClient?.load()??{enabled:false,autoSync:false,revision:0,lastError:null};

function save(next){
  try{snapshot=repository.save(next);syncClient.markDirty(snapshot);render();scheduleAutoSync();return snapshot;}
  catch(error){toast(`Falha ao salvar no SQLite: ${error.message}`);throw error;}
}
function replaceSnapshot(next){snapshot=repository.save(next);render();return snapshot;}
function context(){return{snapshot,sessionUser,save,replaceSnapshot,repository,syncClient,syncInfo,syncNow};}
function scheduleAutoSync(){const meta=syncMeta();if(!meta.enabled||!meta.autoSync)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>{void syncNow({silent:true});},350);}

async function syncNow({silent=false}={}){
  if(syncBusy)return{ok:false,skipped:true,snapshot,meta:syncMeta(),offline:syncClient.offlineState()};
  syncBusy=true;
  try{
    await repository.flush();
    const result=await syncClient.sync(snapshot);
    if(result.ok&&['pull','merge'].includes(result.direction)&&result.snapshot){snapshot=repository.save(result.snapshot);await repository.flush();}
    if(!silent)render();
    return result;
  }finally{syncBusy=false;}
}

function render(){
  if(!snapshot)return;
  if(!sessionUser)return renderLogin();
  const summary=getFinancialSummary(snapshot),alerts=buildOperationalAlerts(snapshot),meta=syncMeta(),offline=syncClient.offlineState();
  const nav=[['dashboard','Dashboard'],['reservas','Reservas'],['clientes','Clientes'],['frota','Frota'],...(can(sessionUser,'inspection.read')||can(sessionUser,'inspection.write')?[['vistorias','Vistorias']]:[]),...(can(sessionUser,'maintenance.read')?[['manutencao','Manutenção']]:[]),...(can(sessionUser,'finance.read')?[['financeiro','Financeiro']]:[]),...(can(sessionUser,'alerts.read')?[['alertas',`Alertas${alerts.length?` (${alerts.length})`:''}`]]:[]),...(can(sessionUser,'documents.read')?[['documentos','Documentos']]:[]),...(can(sessionUser,'sync.read')?[['sync','PC ↔ Mobile']]:[]),...(sessionUser.role==='admin'?[['auditoria','Auditoria']]:[]),...(can(sessionUser,'backup.create')||sessionUser.role==='admin'?[['backup','Backup e Config.']]:[])];
  if(!nav.some(([id])=>id===active))active='dashboard';
  const syncLabel=offline.dirty?`Sync pendente (${offline.pending.length})`:(meta.enabled?(meta.lastError?'Sync offline':`Sync r${meta.revision}`):'Sync desativado');
  app.innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><span class="brandmark">LV</span><div><small>SISTEMA</small><strong>LOCADORA</strong></div></div><nav>${nav.map(([id,label])=>`<button data-nav="${id}" class="nav ${active===id?'active':''}">${label}</button>`).join('')}</nav><div class="session"><strong>${esc(sessionUser.name)}</strong><small>${esc(sessionUser.role)}</small><button id="logout">Sair</button></div></aside><main><header class="topbar"><span>${snapshot.rentals.filter(r=>r.status!=='devolucao').length} locações abertas</span><span>${snapshot.vehicles.length} veículos</span><span>${money(summary.openAmount)} em aberto</span><span>${alerts.length} alertas</span><span>${syncLabel}</span><span>${repository.kind==='sqlite-desktop'?'SQLite PC':'SQLite PWA'}</span></header><section id="view" class="content"></section></main></div>`;
  app.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{active=b.dataset.nav;render();});
  app.querySelector('#logout').onclick=()=>{sessionUser=null;active='dashboard';render();};
  const views={dashboard:renderDashboard,reservas:renderReservas,clientes:renderClientes,frota:renderFrota,vistorias:renderVistorias,manutencao:renderManutencao,financeiro:renderFinanceiro,alertas:renderAlertas,documentos:renderDocumentos,sync:renderSync,auditoria:renderAuditoria,backup:renderBackup};
  (views[active]??renderDashboard)(app.querySelector('#view'),context());
}

function renderLogin(){
  app.innerHTML=`<div class="login-wrap"><form id="login" class="login-card"><div class="brand big"><span class="brandmark">LV</span><div><small>ARTISYS</small><strong>Sistema Locadora</strong></div></div><h1>Acesso</h1><label>Usuário<input name="username" autocomplete="username" value="admin" required></label><label>Senha<input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Entrar</button><p class="hint">Acesso inicial: admin / 1234. Altere as credenciais na implantação.</p><p id="login-error" class="error"></p></form></div>`;
  app.querySelector('#login').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),user=await authenticate(snapshot.users,fd.get('username'),fd.get('password'));if(!user){app.querySelector('#login-error').textContent='Usuário ou senha inválidos.';return;}sessionUser=user;render();};
}

async function configureSync(){
  const pair=new URLSearchParams(location.search).get('pair');
  if(window.locadoraDesktop?.getSyncInfo){
    try{syncInfo=await window.locadoraDesktop.getSyncInfo();if(syncInfo?.available){const meta=syncMeta();syncClient.configure({serverUrl:syncInfo.localUrl,token:syncInfo.token,deviceName:meta.deviceName||'PC principal',enabled:true,autoSync:meta.autoSync});await syncClient.flush();await syncNow({silent:true});}}catch{}
  }else if(pair&&['http:','https:'].includes(location.protocol)){
    const meta=syncMeta();syncClient.configure({serverUrl:location.origin,token:pair,deviceName:meta.deviceName||'Celular',enabled:true,autoSync:true});await syncClient.flush();history.replaceState({},document.title,location.pathname+location.hash);await syncNow({silent:true});
  }
  window.addEventListener('online',()=>{const meta=syncMeta();if(meta.enabled)void syncNow({silent:false});});
  setInterval(()=>{const meta=syncMeta();if(meta.enabled&&meta.autoSync&&navigator.onLine!==false)void syncNow({silent:true});},15000);
}

async function bootstrap(){
  app.innerHTML='<div class="login-wrap"><div class="login-card"><strong>Inicializando SQLite local…</strong><p class="hint">Os dados permanecem somente neste dispositivo.</p></div></div>';
  try{
    repository=await createRepository();snapshot=repository.load();
    syncClient=createSyncClient({store:repository.kv});await syncClient.init();
    if('serviceWorker' in navigator&&globalThis.isSecureContext){try{await navigator.serviceWorker.register('./sw.js');}catch{}}
    await configureSync();render();
  }catch(error){app.innerHTML=`<div class="login-wrap"><div class="login-card"><h1>Falha ao iniciar</h1><p class="error">${esc(error.message)}</p><p class="hint">A PWA precisa de HTTPS e suporte a armazenamento local SQLite/OPFS.</p></div></div>`;}
}
void bootstrap();
