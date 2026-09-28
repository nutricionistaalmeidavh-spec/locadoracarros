export const money = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const date = (v) => v ? new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '-';
export const esc = (v='') => String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

let modalSequence=0;
let modalReturnFocus=null;

export function toast(message) {
  const el = document.createElement('div');
  el.className='toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.textContent=message;document.body.appendChild(el);
  setTimeout(()=>el.remove(),2600);
}

export function modal(title,body,onReady){
  modalReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const overlay=document.createElement('div'),titleId=`modal-title-${++modalSequence}`;
  overlay.className='modal-overlay';
  overlay.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}"><div class="modal-head"><h2 id="${titleId}">${esc(title)}</h2><button data-close aria-label="Fechar">×</button></div>${body}</div>`;
  overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeModal();}});
  document.body.appendChild(overlay);
  overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  onReady?.();
  overlay.querySelector('[data-close]')?.focus();
}
export function closeModal(){
  const overlay=document.querySelector('.modal-overlay');if(!overlay)return;
  overlay.remove();
  if(modalReturnFocus?.isConnected)modalReturnFocus.focus();
  modalReturnFocus=null;
}
export function download(name,text){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
