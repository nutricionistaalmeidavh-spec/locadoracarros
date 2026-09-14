import { createBackupEnvelope, restoreBackupEnvelope } from '../domain/backup.mjs';
import { migrateLegacySnapshot } from '../domain/rental.mjs';
import { date, download, esc, toast } from './common.mjs';

export function renderAuditoria(view,{snapshot}){
  view.innerHTML=`<div class="heading"><div><small>HISTÓRICO</small><h1>Auditoria</h1></div></div><section class="panel"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>ID</th></tr></thead><tbody>${snapshot.audit.map(a=>`<tr><td>${date(a.at)}</td><td>${esc(snapshot.users.find(u=>u.id===a.actorId)?.name||a.actorId)}</td><td>${esc(a.action)}</td><td>${esc(a.entityType)}</td><td>${esc(a.entityId)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Nenhuma ação auditada.</td></tr>'}</tbody></table></div></section>`;
}

export function renderBackup(view,ctx){
  const {snapshot,repository,replaceSnapshot,save}=ctx;
  view.innerHTML=`<div class="heading"><div><small>SEGURANÇA DOS DADOS</small><h1>Backup e configurações</h1></div></div><div class="split"><section class="panel"><h2>Backup verificável</h2><p>O arquivo v2 inclui SHA-256 e é validado antes da restauração.</p><div class="stack"><button id="backup-create" class="primary">Gerar backup</button><label class="file-button">Restaurar backup<input id="backup-file" type="file" accept="application/json"></label><small>Também aceita snapshot legado 0.1.5 e faz a migração para v2.</small></div></section><section class="panel"><h2>Empresa</h2><form id="settings-form" class="form-grid"><label>Nome<input name="companyName" value="${esc(snapshot.settings.companyName)}"></label><label>CPF/CNPJ<input name="document" value="${esc(snapshot.settings.document)}"></label><label>Telefone<input name="phone" value="${esc(snapshot.settings.phone)}"></label><label>Endereço<input name="address" value="${esc(snapshot.settings.address)}"></label><div class="full"><button class="primary">Salvar configurações</button></div></form></section></div>`;
  view.querySelector('#backup-create').onclick=async()=>{const raw=await createBackupEnvelope(snapshot);download(`backup-locadora-${new Date().toISOString().slice(0,10)}.json`,raw);toast('Backup com integridade gerado.');};
  view.querySelector('#backup-file').onchange=async(e)=>{const file=e.target.files?.[0];if(!file)return;const raw=await file.text();try{let restored;try{restored=await restoreBackupEnvelope(raw);}catch{restored=migrateLegacySnapshot(raw);}replaceSnapshot(repository.save(restored));toast('Backup restaurado.');}catch(err){toast(`Falha ao restaurar: ${err.message}`)}};
  view.querySelector('#settings-form').onsubmit=e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(e.currentTarget));save({...snapshot,settings:{...snapshot.settings,...fd},updatedAt:new Date().toISOString()});toast('Configurações salvas.');};
}
