import { date, esc, toast } from './common.mjs';

export function renderSync(view,ctx){
  const {syncClient,syncInfo,syncNow,replaceSnapshot}=ctx;
  const meta=syncClient.load();
  const conflict=syncClient.getConflict();
  const pairUrls=syncInfo?.pairingUrls??[];
  const isDesktop=Boolean(syncInfo?.available);
  view.innerHTML=`<div class="heading"><div><small>PC ↔ MOBILE</small><h1>Sincronização local</h1></div><span class="badge">${isDesktop?'PC servidor':'PWA / Mobile'}</span></div>
  <div class="sync-grid">
    <section class="panel"><h2>Configuração</h2><p class="mobile-note">A sincronização funciona pela mesma rede Wi-Fi/LAN. O PC mantém o ponto de encontro dos dados; o celular continua funcionando offline e sincroniza quando reencontra o PC.</p>
      <form id="sync-form" class="form-grid">
        <label>Nome deste dispositivo<input name="deviceName" value="${esc(meta.deviceName|| (isDesktop?'PC':'Celular'))}" placeholder="Ex.: Celular pátio"></label>
        <label>Servidor do PC<input name="serverUrl" value="${esc(meta.serverUrl||syncInfo?.localUrl||'')}" ${isDesktop?'readonly':''} placeholder="http://192.168.0.10:4174"></label>
        <label class="full">Token de pareamento<input name="token" value="${esc(meta.token||syncInfo?.token||'')}" ${isDesktop?'readonly':''} autocomplete="off"></label>
        <label class="check"><input name="enabled" type="checkbox" ${meta.enabled?'checked':''}> Sincronização habilitada</label>
        <label class="check"><input name="autoSync" type="checkbox" ${meta.autoSync?'checked':''}> Sincronizar automaticamente</label>
        <div class="full sync-actions"><button class="primary">Salvar</button><button type="button" class="secondary" id="sync-now">Sincronizar agora</button></div>
      </form>
      ${conflict?`<div class="sync-warning"><strong>Cópia local preservada após conflito</strong><p class="mobile-note">Uma versão mais recente veio do outro dispositivo. A versão local anterior foi guardada para recuperação manual.</p><button id="restore-conflict" class="secondary">Restaurar cópia local</button></div>`:''}
    </section>
    <section class="panel"><h2>Status</h2><div class="sync-status">
      <p><span>Estado</span><strong class="${meta.lastError?'sync-error':'sync-ok'}">${meta.enabled?(meta.lastError?'Falha / offline':'Ativo'):'Desativado'}</strong></p>
      <p><span>Revisão</span><strong>${meta.revision}</strong></p>
      <p><span>Última sincronização</span><strong>${meta.lastSyncAt?date(meta.lastSyncAt):'Nunca'}</strong></p>
      <p><span>Última direção</span><strong>${esc(meta.lastDirection||'-')}</strong></p>
      ${meta.lastError?`<p><span>Erro</span><strong class="sync-error">${esc(meta.lastError)}</strong></p>`:''}
      <p><span>Device ID</span><code>${esc(meta.deviceId)}</code></p>
    </div></section>
  </div>
  ${isDesktop?`<section class="panel"><h2>Abrir no celular</h2><p class="mobile-note">Com o celular na mesma rede do PC, abra um dos links abaixo. O token é aplicado automaticamente e depois removido da barra de endereço.</p><div class="pair-list">${pairUrls.length?pairUrls.map((url,i)=>`<div class="pair-link"><code>${esc(url)}</code><button data-copy="${esc(url)}">Copiar ${i+1}</button></div>`).join(''):'<div class="empty">Nenhum endereço LAN detectado. Verifique a conexão de rede do PC.</div>'}</div><p class="mobile-note">Depois, use “Adicionar à Tela de Início” no navegador para instalar a PWA.</p></section>`:''}`;

  const form=view.querySelector('#sync-form');
  form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form);syncClient.configure({deviceName:fd.get('deviceName'),serverUrl:fd.get('serverUrl'),token:fd.get('token'),enabled:form.elements.enabled.checked,autoSync:form.elements.autoSync.checked});toast('Configuração de sincronização salva.');renderSync(view,ctx);};
  view.querySelector('#sync-now').onclick=async()=>{toast('Sincronizando...');const result=await syncNow();toast(result?.ok?'Sincronização concluída.':(result?.error?.message||'Não foi possível sincronizar.'));};
  view.querySelector('#restore-conflict')?.addEventListener('click',()=>{const saved=syncClient.getConflict();if(!saved)return;replaceSnapshot(saved);syncClient.clearConflict();toast('Cópia local restaurada. Sincronize novamente quando decidir qual versão manter.');});
  view.querySelectorAll('[data-copy]').forEach(button=>button.onclick=async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);toast('Link copiado.');}catch{toast('Não foi possível copiar automaticamente.');}});
}
